import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const sendOTPEmail = async (email: string, otp: string, username: string) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'AgroIntel - Password Reset OTP',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .greeting {
                        font-size: 18px;
                        color: #333;
                        margin-bottom: 20px;
                    }
                    .message {
                        color: #666;
                        line-height: 1.6;
                        margin-bottom: 30px;
                    }
                    .otp-container {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .otp-code {
                        font-size: 36px;
                        font-weight: bold;
                        color: white;
                        letter-spacing: 8px;
                        margin: 10px 0;
                    }
                    .otp-label {
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        color: #856404;
                    }
                    .footer {
                        background-color: #f8f9fa;
                        padding: 20px 30px;
                        text-align: center;
                        color: #6c757d;
                        font-size: 14px;
                    }
                    .footer a {
                        color: #667eea;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🌾 AgroIntel</h1>
                    </div>
                    <div class="content">
                        <div class="greeting">Hello ${username},</div>
                        <div class="message">
                            We received a request to reset your password. Use the OTP code below to complete the password reset process.
                        </div>
                        <div class="otp-container">
                            <div class="otp-label">Your OTP Code</div>
                            <div class="otp-code">${otp}</div>
                        </div>
                        <div class="message">
                            This OTP will expire in <strong>10 minutes</strong>. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                        </div>
                        <div class="warning">
                            <strong>⚠️ Security Tip:</strong> Never share this OTP with anyone. AgroIntel will never ask for your OTP via phone or email.
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2026 AgroIntel. All rights reserved.</p>
                        <p>Need help? <a href="mailto:support@agrointel.com">Contact Support</a></p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Hello ${username},\n\nYour OTP for password reset is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nAgroIntel Team`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};
