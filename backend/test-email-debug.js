require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
    console.log('Testing SMTP connection...');
    console.log('User:', process.env.EMAIL_USER);
    // console.log('Pass:', process.env.EMAIL_PASSWORD); // Don't log password

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ Connection verification successful!');

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_USER, // Send to self to be safe
            subject: "Test Email",
            text: "If you see this, SMTP is working.",
        });
        console.log("✅ Message sent:", info.messageId);

    } catch (error) {
        console.error('❌ Error details:', error);
    }
}

main();
