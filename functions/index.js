/**
 * Cloud Functions for Firebase
 * Punto de entrada principal (Agregador)
 */

// Triggers
const {createUserProfile} = require("./triggers/auth");

// Callables
const {completeProfile} = require("./callable/user");

// Exportaciones
// Mantener los nombres originales para compatibilidad con la app Flutter
exports.createUserProfile = createUserProfile;
exports.completeProfile = completeProfile;
