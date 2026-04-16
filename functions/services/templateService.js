/**
 * Servicio para manejo de plantillas de correo.
 * @param {string} name Nombre de la plantilla.
 * @param {object} data Datos para la plantilla.
 * @return {string} Contenido renderizado.
 */
const getTemplate = (name, data) => {
  console.log(`📄 Obteniendo plantilla: ${name}`);
  // Implementación futura
  return `Template ${name} content`;
};

module.exports = {
  getTemplate,
};
