const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter if SMTP settings are provided
let transporter = null;
const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Send an email (sends real email if SMTP is configured, otherwise logs to terminal for simulation)
 * 
 * @param {Object} options Email sending details
 * @param {string} options.to Recipient email address
 * @param {string} options.subject Email subject
 * @param {string} options.text Text body
 * @param {string} options.html HTML body (optional)
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const from = process.env.SMTP_FROM || 'noreply@election-system.com';
  
  if (isSmtpConfigured && transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html || text
      });
      console.log(`[Email Sent] Success to: ${to} (Subject: "${subject}")`);
      return true;
    } catch (error) {
      console.error(`[Email Error] Failed sending to ${to}:`, error.message);
      return false;
    }
  } else {
    // Simulated fallback log
    console.log('\n=================== SIMULATED EMAIL ===================');
    console.log(`FROM:    ${from}`);
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('-------------------------------------------------------');
    console.log(text);
    if (html) {
      console.log('-------------------- HTML PREVIEW ---------------------');
      console.log(html);
    }
    console.log('=======================================================\n');
    return true;
  }
};

module.exports = {
  sendEmail
};
