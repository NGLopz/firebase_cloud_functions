const { beforeUserCreated } = require("firebase-functions/v2/identity");
const { getDb } = require("../config/mongo");

/**
 * TRIGGER: Usuario nuevo (crea perfil básico)
 * Se dispara con TODOS los providers (email, Google, Apple, etc.)
 */
exports.createUserProfile = beforeUserCreated(
  async (event) => {
    const user = event.data;
    console.log("🔥 NUEVO USUARIO DETECTADO (beforeUserCreated)");
    console.log("👉 UID:", user.uid);
    console.log("👉 EMAIL:", user.email);

    try {
      const db = await getDb();

      // Procesar el nombre de forma robusta
      const fullName = (user.displayName || "").trim();
      const nameParts = fullName.split(/\s+/);
      const name = nameParts[0] || "";
      const lastname = nameParts.slice(1).join(" ") || "";

      // Perfil básico (campos custom se agregan en completeProfile)
      await db.collection("users_beta").updateOne(
        { uid: user.uid },
        {
          $setOnInsert: {
            uid: user.uid,
            email: user.email || "",
            name: name,
            lastname: lastname,
            phone: user.phoneNumber || "",
            provider: (user.providerData && user.providerData.length > 0) ?
              user.providerData[0].providerId : "password",
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );

      console.log("✅ Perfil básico creado en Mongo");
    } catch (error) {
      console.error("❌ Error en createUserProfile:", error);
    }
  });
