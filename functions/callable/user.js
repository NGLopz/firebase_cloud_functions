const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getDb } = require("../config/mongo");

/**
 * CALLABLE: Completar perfil con campos custom
 * La app llama esta función después del registro para enviar
 * nombre, apellido, teléfono y otros campos que Firebase Auth no maneja.
 */
exports.completeProfile = onCall(async (request) => {
  // Verificar que el usuario esté autenticado
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión primero.");
  }

  const { uid, token } = request.auth;
  const { name, lastname, phone } = request.data;

  console.log("🔥 COMPLETAR PERFIL (callable)");
  console.log("👉 UID:", uid);
  console.log("👉 NOMBRE:", name);

  try {
    const db = await getDb();

    const result = await db.collection("users_beta").updateOne(
      { uid: uid },
      {
        $set: {
          email: token.email || "",
          name: name || "",
          lastname: lastname || "",
          phone: phone || "",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          uid: uid,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    console.log("✅ Perfil completado en Mongo:", result);

    return { success: true, uid: uid };
  } catch (error) {
    console.error("❌ Error en completeProfile:", error);
    throw new HttpsError("internal", "Error al completar perfil.");
  }
});
