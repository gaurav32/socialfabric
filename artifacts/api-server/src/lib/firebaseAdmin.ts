import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | null = null;

function getFirebaseAdminApp(): App {
  if (app) return app;

  const serviceAccountKey = process.env["EXPO_FIREBASE_SERVICE_ACCOUNT_KEY"];
  if (!serviceAccountKey) {
    throw new Error("Missing EXPO_FIREBASE_SERVICE_ACCOUNT_KEY");
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}
