import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

setGlobalOptions({ maxInstances: 10, region: "europe-west1" });

admin.initializeApp();

const ADMIN_UID = "TwCRSVcvY6UlVV2AERlwdCOxBa33";

export const deleteUser = onCall(async (request) => {
  // Solo el admin puede llamar esta función
  if (request.auth?.uid !== ADMIN_UID) {
    throw new HttpsError("permission-denied", "Solo el administrador puede borrar usuarios");
  }

  const { uid } = request.data as { uid: string };

  if (!uid) {
    throw new HttpsError("invalid-argument", "Falta el uid del usuario");
  }

  if (uid === ADMIN_UID) {
    throw new HttpsError("invalid-argument", "No puedes borrarte a ti mismo");
  }

  // Borrar de Firebase Auth
  await admin.auth().deleteUser(uid);

  return { success: true };
});
