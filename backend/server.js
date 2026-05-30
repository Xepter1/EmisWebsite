const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Konfiguration über Umgebungsvariablen (für Docker Compose)
const PORT = process.env.PORT || 3000;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const TARGET_EMAIL = process.env.TARGET_EMAIL || 'emilixga@icloud.com';

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true' || parseInt(SMTP_PORT, 10) === 465, // true for port 465, false for 587 or other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    },
    tls: {
        // Prevent SSL handshake errors on standard hosting setups
        rejectUnauthorized: false
    }
});

app.post('/send-email', (req, res) => {
    const { name, email, subject, message } = req.body;

    const mailOptions = {
        from: `"${name}" <${SMTP_USER}>`, // Absender ist dein SMTP-Account
        replyTo: email, // Damit du direkt auf die Mail antworten kannst
        to: TARGET_EMAIL,
        subject: `Kontaktformular: ${subject}`,
        text: `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).send('Fehler beim Senden der E-Mail');
        }
        console.log('E-Mail gesendet: ' + info.response);
        res.status(200).send('E-Mail erfolgreich gesendet');
    });
});

app.listen(PORT, () => {
    console.log(`Mail-Server läuft auf Port ${PORT}`);
});
