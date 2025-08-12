const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        
        await transporter.sendMail({
            from: `"${name}" <${email}>`,
            to: process.env.EMAIL_USERNAME, 
            subject: `[BETA-TECH] ${subject}`,
            text: message
        });

        
        await transporter.sendMail({
            from: `"BETA TECH LABS" <${process.env.EMAIL_USERNAME}>`,
            to: email, 
            subject: `Thanks for contacting BETA TECH LABS`,
            text: `Hi ${name},\n\nThanks for reaching out to BETA TECH LABS. We’ll get back to you shortly.\n\nBest regards,\nBETA TECH LABS`
        });

        res.status(200).json({ message: 'Message and confirmation sent successfully!' });
    } catch (error) {
        console.error('Email sending failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
