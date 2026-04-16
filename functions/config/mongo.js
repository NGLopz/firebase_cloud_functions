const {MongoClient} = require("mongodb");

const uri = process.env.MONGO_URI || "mongodb://admin:admin@localhost:27017/";
const dbName = process.env.MONGO_DB_NAME || "club_movil_beta";

let client;
let db;

/**
 * Conecta a MongoDB y devuelve la instancia de la base de datos.
 * Utiliza un patrón singleton para mantener una única conexión.
 */
async function getDb() {
  if (!db) {
    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
      console.log("✅ MongoDB conectado. Entorno: " +
        (process.env.ENVIRONMENT || "default"));
    }
    db = client.db(dbName);
  }
  return db;
}

module.exports = {getDb};
