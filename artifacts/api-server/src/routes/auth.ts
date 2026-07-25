import { Router, type IRouter } from "express";
import { google } from "googleapis";

const router: IRouter = Router();

// The mobile app's real identity (artifacts/mobile/app.json `android.package`).
// Not secret, so a working default is baked in; override via env if a second
// app flavor/package ever ships. iOS needs no equivalent: it resolves custom
// URL schemes purely by the scheme string itself, with no package/bundle-id
// argument in the redirect URL, so `finalUrl` alone is sufficient there.
const ANDROID_PACKAGE_NAME = process.env["ANDROID_PACKAGE_NAME"] ?? "com.socialfabric.mobile";
const ANDROID_PACKAGE_FALLBACK_URL =
  process.env["ANDROID_PACKAGE_FALLBACK_URL"] ??
  `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;

function getOAuthClient() {
  const clientId = process.env["GOOGLE_OAUTH_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];
  const callbackUrl = process.env["GOOGLE_OAUTH_CALLBACK_URL"];

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET");
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
 * tokens, pull out the id_token, and hand it back to whatever initiated the
 * flow — a plain HTTP(S) redirect for web, or a deep link back into the
 * native app for Android/iOS.
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
    req.log.info({ appRedirectUri }, "Received appRedirectUri");
    if (appRedirectUri) {
      const separator = appRedirectUri.includes("?") ? "&" : "?";
      const finalUrl = `${appRedirectUri}${separator}id_token=${encodeURIComponent(idToken)}`;
      req.log.info({ finalUrl }, "Redirecting back to app");

      const scheme = new URL(finalUrl).protocol.replace(":", "");
      const isWebRedirect = scheme === "http" || scheme === "https";

      if (isWebRedirect) {
        // Web (or any http(s) universal link): there's no native app to
        // bounce into, so a plain redirect is all that's needed.
        res.redirect(finalUrl);
        return;
      }

      // Native app via a custom URL scheme (e.g. "mobile://..." from
      // artifacts/mobile/app.json `expo.scheme`).
      //
      // Android: Chrome requires a user gesture to navigate JS to a custom
      // scheme, but will follow an intent:// URL without one — so we try
      // that first, addressed to the app's real package name. This is
      // gated to actual Android user agents since intent:// isn't a scheme
      // iOS/desktop browsers understand.
      //
      // iOS: no such mechanism exists or is needed — Safari (and
      // ASWebAuthenticationSession, which openAuthSessionAsync uses under
      // the hood on iOS) resolves a custom scheme purely by the scheme
      // string and follows `finalUrl` directly.
      const userAgent = req.headers["user-agent"] ?? "";
      const isAndroid = /Android/i.test(userAgent);

      let intentUrl: string | null = null;
      if (isAndroid) {
        const parsed = new URL(finalUrl);
        const host = parsed.host;
        const pathAndQuery = parsed.pathname + parsed.search;
        const fallback = encodeURIComponent(ANDROID_PACKAGE_FALLBACK_URL);
        intentUrl =
          `intent://${host}${pathAndQuery}` +
          `#Intent;scheme=${scheme};package=${ANDROID_PACKAGE_NAME};` +
          `S.browser_fallback_url=${fallback};end`;
      }
      req.log.info({ intentUrl, finalUrl }, "Deep-linking back to native app");
      res.send(`<!DOCTYPE html>
<html>
<head>
<title>Returning to app…</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;
       align-items:center;justify-content:center;min-height:100vh;margin:0;
       background:#F0F2FF;color:#1a1a2e}
  h2{color:#5B4FE8;margin-bottom:8px}
  p{color:#666;margin:4px 0}
  .btn{margin-top:20px;padding:14px 28px;background:#5B4FE8;color:#fff;
       border:none;border-radius:12px;font-size:16px;cursor:pointer;
       text-decoration:none;display:inline-block}
</style>
</head>
<body>
<h2>✓ Signed in with Google</h2>
<p>Opening Social Fabric…</p>
<a class="btn" href="${finalUrl}">Open App</a>
<script>
  // Android: try the intent:// URL first, opens the app with no gesture.
  ${intentUrl ? `try { window.location.replace(${JSON.stringify(intentUrl)}); } catch(e){}` : ""}
  // iOS, and Android if the intent:// attempt above didn't fire.
  setTimeout(function(){
    try { window.location.replace(${JSON.stringify(finalUrl)}); } catch(e){}
  }, 800);
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
  } finally {
    req.log.info({ url: req.originalUrl }, "auth/google/callback finished");
  }
});

/**
 * GET /api/auth/google/done?id_token=<token>
 *
 * Landing page after the OAuth round-trip.  openAuthSessionAsync on Android
 * detects that Chrome has navigated to this HTTPS URL (which matches the
 * redirectUrl passed to it) and returns { type: "success", url } — the
 * Chrome Custom Tab closes and the app extracts the token from the URL.
 * This page is only briefly visible (if at all).
 */
router.get("/auth/google/done", (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><title>Returning to app…</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: system-ui, sans-serif; display:flex; flex-direction:column;
         align-items:center; justify-content:center; min-height:100vh; margin:0;
         background:#F0F2FF; color:#1a1a2e; }
  h2 { color:#5B4FE8; }
</style>
</head>
<body><h2>✓ Signed in</h2><p>Returning to Social Fabric…</p></body>
</html>`);
});

export default router;
