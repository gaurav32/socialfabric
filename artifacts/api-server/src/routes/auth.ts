import { Router, type IRouter } from "express";
import { google } from "googleapis";

const router: IRouter = Router();

function getOAuthClient() {
  const clientId = process.env["EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];
  const callbackUrl = process.env["GOOGLE_OAUTH_CALLBACK_URL"];

  if (!clientId || !clientSecret) {
    throw new Error("Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET");
  }
  if (!callbackUrl) {
    throw new Error("Missing GOOGLE_OAUTH_CALLBACK_URL");
  }

  return { client: new google.auth.OAuth2(clientId, clientSecret, callbackUrl), callbackUrl };
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

    const { client: oauth2Client } = getOAuthClient();

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

    const { client: oauth2Client } = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    const idToken = tokens.id_token;
    if (!idToken) {
      throw new Error("No id_token in Google token response");
    }

    if (appRedirectUri) {
      const separator = appRedirectUri.includes("?") ? "&" : "?";
      const finalUrl = `${appRedirectUri}${separator}id_token=${encodeURIComponent(idToken)}`;
      req.log.info({ finalUrl }, "Redirecting back to app");
      // For custom schemes (exp://, mobile://) the redirect may not work in all browsers.
      // Return an HTML page that tries window.location first, then shows the token for manual use.
      res.send(`<!DOCTYPE html>
<html>
<head><title>Signing in…</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: system-ui, sans-serif; display:flex; flex-direction:column;
         align-items:center; justify-content:center; min-height:100vh; margin:0;
         background:#F0F2FF; color:#1a1a2e; }
  h2 { color:#5B4FE8; margin-bottom:8px; }
  p  { color:#666; margin:4px 0; }
  .btn { margin-top:20px; padding:14px 28px; background:#5B4FE8; color:#fff;
         border:none; border-radius:12px; font-size:16px; cursor:pointer;
         text-decoration:none; display:inline-block; }
</style>
</head>
<body>
<h2>✓ Signed in with Google</h2>
<p>Returning to Social Fabric…</p>
<a class="btn" href="${finalUrl}">Open App</a>
<script>
  // Try to redirect automatically
  setTimeout(function() { window.location.href = ${JSON.stringify(finalUrl)}; }, 300);
</script>
</body>
</html>`);
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
