/**
 * Utilidades de renderizado y formateo.
 * @param {Date|string|number} date Fecha a formatear.
 * @return {string} Fecha formateada.
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

module.exports = {
  formatDate,
};
