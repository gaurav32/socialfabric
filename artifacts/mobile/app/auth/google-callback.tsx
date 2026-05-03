import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";

/**
 * This screen exists solely so that deep links to
 * mobile://auth/google-callback?id_token=... can be resolved by Expo Router.
 * The actual token handling happens in AuthContext's Linking listener.
 * expo-web-browser needs maybeCompleteAuthSession to close the in-app browser.
 */
WebBrowser.maybeCompleteAuthSession();

export default function GoogleCallbackScreen() {
  useEffect(() => {
    // Give the Linking listener in AuthContext a moment to process
    // then close the in-app browser if it's still open
    WebBrowser.dismissAuthSession();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5B4FE8" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F2FF",
  },
});
