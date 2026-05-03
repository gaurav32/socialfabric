import { Router, type IRouter } from "express";
import { google } from "googleapis";

const router: IRouter = Router();

function getOAuthClient(redirectUri: string) {
  const clientId = process.env["EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    throw new Error("Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getCallbackUrl(req: Parameters<typeof router.get>[1] extends (req: infer R, ...args: unknown[]) => unknown ? R : never): string {
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  return `${proto}://${host}/api/auth/google/callback`;
}

/**
 * GET /api/auth/google/start?app_redirect_uri=<app-scheme://path>
 *
 * Kicks off the OAuth flow. The app passes its own deep-link URI so the
 * server can bounce back after it gets the token.
 */
router.get("/auth/google/start", (req, res) => {
  try {
    const appRedirectUri = req.query["app_redirect_uri"];
    if (!appRedirectUri || typeof appRedirectUri !== "string") {
      res.status(400).json({ error: "Missing app_redirect_uri query param" });
      return;
    }

    const callbackUrl = getCallbackUrl(req as never);
    const oauth2Client = getOAuthClient(callbackUrl);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state: encodeURIComponent(appRedirectUri),
      include_granted_scopes: true,
    });

    res.redirect(authUrl);
  } catch (err) {
    req.log.error({ err }, "Failed to start Google OAuth");
    res.status(500).json({ error: "OAuth configuration error" });
  }
});

/**
 * GET /api/auth/google/callback
 *
 * Google redirects here after the user consents. We exchange the code for
 * tokens, pull out the id_token, and deep-link back into the app with it.
 */
router.get("/auth/google/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query as Record<string, string | undefined>;

    const appRedirectUri = state ? decodeURIComponent(state) : null;

    if (error) {
      const dest = appRedirectUri
        ? `${appRedirectUri}?error=${encodeURIComponent(error)}`
        : `/api/auth/google/error?reason=${encodeURIComponent(error)}`;
      res.redirect(dest);
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Missing code from Google" });
      return;
    }

    const callbackUrl = getCallbackUrl(req as never);
    const oauth2Client = getOAuthClient(callbackUrl);
    const { tokens } = await oauth2Client.getToken(code);

    const idToken = tokens.id_token;
    if (!idToken) {
      throw new Error("No id_token in Google token response");
    }

    if (appRedirectUri) {
      const separator = appRedirectUri.includes("?") ? "&" : "?";
      res.redirect(`${appRedirectUri}${separator}id_token=${encodeURIComponent(idToken)}`);
    } else {
      res.status(200).send("Sign-in complete. You can close this window.");
    }
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback error");
    const state = req.query["state"] as string | undefined;
    const appRedirectUri = state ? decodeURIComponent(state) : null;
    const msg = err instanceof Error ? err.message : "OAuth failed";
    if (appRedirectUri) {
      res.redirect(`${appRedirectUri}?error=${encodeURIComponent(msg)}`);
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

export default router;
