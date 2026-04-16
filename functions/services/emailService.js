/**
 * Servicio para manejo de correos electrónicos.
 * @param {string} to Destinatario.
 * @param {string} subject Asunto.
 * @param {string} body Cuerpo del mensaje.
 * @return {Promise<boolean>} Éxito del envío.
 */
const sendEmail = async (to, subject, body) => {
  console.log(`📧 Enviando email a ${to}: ${subject}`);
  // Implementación futura con Nodemailer, SendGrid, etc.
  return true;
};

module.exports = {
  sendEmail,
};
