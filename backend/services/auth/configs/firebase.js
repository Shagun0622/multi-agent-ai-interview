
import { initializeApp, cert } from "firebase-admin/app";
import { readFileSync } from "node:fs";

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  "../serviceAccountKey.json";

const serviceAccount = JSON.parse(
  readFileSync(serviceAccountPath, "utf8")
);

export const app = initializeApp({
  credential: cert(serviceAccount),
});
