const { beforeUserCreated } = require("firebase-functions/v2/identity");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { MongoClient } = require("mongodb");

// =======================
// 🔥 MONGO
// =======================
const uri = process.env.MONGO_URI || "mongodb://admin:admin@localhost:27017/";
const dbName = process.env.MONGO_DB_NAME || "club_movil_beta";
let client;

async function connect() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log(`✅ MongoDB conectado. Entorno: ${process.env.ENVIRONMENT || "default"}`);
  }
  return client;
}

// =======================
// 🔥 TRIGGER: Usuario nuevo (crea perfil básico)
// Se dispara con TODOS los providers (email, Google, Apple, etc.)
// =======================
exports.createUserProfile = beforeUserCreated(async (event) => {
  const user = event.data;
  console.log("USUARIO ENTIDAD COMPLETA", user);
  console.log("🔥 NUEVO USUARIO DETECTADO (beforeUserCreated)");
  console.log("👉 UID:", user.uid);
  console.log("👉 NAME:", user.displayName);
  console.log("👉 PHONE:", user.phoneNumber);
  console.log("👉 EMAIL:", user.email);
  console.log("👉 firebase:", user.firebase);

  try {
    const mongoClient = await connect();
    const db = mongoClient.db(dbName);

    // Crear perfil básico (los campos custom se agregan después via completeProfile)
    await db.collection("users_beta").updateOne(
      { uid: user.uid },
      {
        $setOnInsert: {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          phone: user.phoneNumber || '',
          provider: user.providerData[0].providerId || '',
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log("✅ Perfil básico creado en Mongo");
  } catch (error) {
    console.error("❌ Error:", error);
  }
});

// =======================
// 🔥 CALLABLE: Completar perfil con campos custom
// La app llama esta función después del registro para enviar
// nombre, apellido, teléfono y otros campos que Firebase Auth no maneja.
// =======================
exports.completeProfile = onCall(async (request) => {
  // Verificar que el usuario esté autenticado
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión primero.");
  }

  const { uid, token } = request.auth;
  const { nombre, apellido, telefono } = request.data;

  console.log("🔥 COMPLETAR PERFIL (callable)");
  console.log("👉 UID:", uid);
  console.log("👉 EMAIL:", token.email);
  console.log("👉 NOMBRE:", nombre);
  console.log("👉 APELLIDO:", apellido);
  console.log("👉 TELÉFONO:", telefono);
  console.log("👉 PROVIDER:", token.firebase?.sign_in_provider);

  try {
    const mongoClient = await connect();
    const db = mongoClient.db(dbName);

    const result = await db.collection("users_beta").updateOne(
      { uid: uid },
      {
        $set: {
          email: token.email || null,
          nombre: nombre || null,
          apellido: apellido || null,
          telefono: telefono || null,
          displayName: token.name || `${nombre} ${apellido}`.trim() || null,
          photoURL: token.picture || null,
          provider: token.firebase?.sign_in_provider || null,
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          uid: uid,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log("✅ Perfil completado en Mongo:", result);

    return { success: true, uid: uid };
  } catch (error) {
    console.error("❌ Error:", error);
    throw new HttpsError("internal", "Error al completar perfil.");
  }
});