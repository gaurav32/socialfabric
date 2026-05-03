import * as WebBrowser from "expo-web-browser";

/**
 * This route exists so Expo Router can resolve deep links to
 * auth/google-callback. The actual token is handled entirely by
 * openAuthSessionAsync in AuthContext — this screen just tells
 * expo-web-browser to close the in-app browser session.
 */
WebBrowser.maybeCompleteAuthSession();

export default function GoogleCallbackScreen() {
  return null;
}
