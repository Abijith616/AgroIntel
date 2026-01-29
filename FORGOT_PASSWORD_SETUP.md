# Forgot Password Setup - AgroIntel

## Overview
This document describes the complete OTP-based forgot password system implemented for AgroIntel using Gmail SMTP.

## Features
✅ **Email-based OTP verification**
✅ **6-digit OTP codes**
✅ **10-minute OTP expiration**
✅ **Beautiful HTML email templates**
✅ **Multi-step frontend flow with progress indicators**
✅ **Secure password reset**
✅ **OTP invalidation after use**

---

## Backend Implementation

### 1. Database Schema (Prisma)

The `PasswordReset` model tracks OTP tokens:

```prisma
model PasswordReset {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  otp       String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM="AgroIntel <noreply@agrointel.com>"

# JWT Secret
JWT_SECRET=supersecretkey
```

### 3. API Endpoints

#### Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP has been sent to your email"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "OTP verified successfully",
  "resetId": 1
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

### 4. Email Service

The email service (`src/services/email.service.ts`) sends beautifully formatted HTML emails with:
- Professional branding
- Gradient backgrounds
- Clear OTP display
- Security warnings
- Responsive design

### 5. Security Features

- **OTP Expiration**: OTPs expire after 10 minutes
- **One-time Use**: OTPs are marked as used after successful password reset
- **Invalidation**: Previous unused OTPs are invalidated when a new one is requested
- **No User Enumeration**: Error messages don't reveal if an email exists
- **Password Hashing**: New passwords are hashed with bcrypt

---

## Frontend Implementation

### 1. Routes

The forgot password flow is accessible at:
```
http://localhost:5173/forgot-password
```

### 2. Multi-Step Flow

The frontend implements a beautiful 4-step process:

#### Step 1: Email Input
- User enters their email address
- Backend sends OTP to the email

#### Step 2: OTP Verification
- User enters the 6-digit OTP received via email
- Large, centered input field for easy entry
- Option to resend OTP
- Back button to change email

#### Step 3: New Password
- User enters new password
- Confirmation field to prevent typos
- Password strength validation (minimum 6 characters)

#### Step 4: Success
- Confirmation screen with success animation
- Button to navigate to login page

### 3. UI Features

- **Progress Indicators**: Visual step indicators show current progress
- **Smooth Animations**: Fade-in and slide-in effects for messages
- **Error Handling**: Clear error messages with icons
- **Success Feedback**: Green success messages with checkmarks
- **Responsive Design**: Works on all screen sizes
- **Glassmorphism**: Modern backdrop blur effects
- **Gradient Backgrounds**: Beautiful decorative elements

---

## Testing the Flow

### Using the Web Interface

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Navigate to the forgot password page:**
   ```
   http://localhost:5173/forgot-password
   ```

3. **Complete the flow:**
   - Enter your email address
   - Check your email for the OTP
   - Enter the 6-digit OTP
   - Set a new password
   - Login with your new password

### Using the Test Script

Run the automated test:
```bash
./test-forgot-password.sh
```

### Manual API Testing with curl

```bash
# Step 1: Request OTP
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Step 2: Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# Step 3: Reset Password
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","newPassword":"newPassword123"}'
```

---

## Gmail SMTP Setup

### Important Notes

1. **App Password Required**: The `EMAIL_PASSWORD` is a Gmail App Password, not your regular Gmail password.

2. **How to Generate Gmail App Password:**
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification (if not already enabled)
   - Go to "App passwords"
   - Generate a new app password for "Mail"
   - Use this 16-character password in your `.env` file

3. **Security Best Practices:**
   - Never commit `.env` file to version control
   - Use environment variables in production
   - Rotate app passwords regularly
   - Monitor email sending activity

---

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── password-reset.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   └── password-reset.service.ts
│   └── routes/
│       └── auth.routes.ts
├── prisma/
│   └── schema.prisma
└── .env

frontend/
├── src/
│   ├── ForgotPassword.tsx
│   ├── Login.tsx
│   └── App.tsx
```

---

## Troubleshooting

### Email Not Sending

1. **Check Gmail App Password:**
   - Ensure you're using an App Password, not your regular password
   - Verify 2-Step Verification is enabled

2. **Check Environment Variables:**
   ```bash
   # In backend directory
   cat .env | grep EMAIL
   ```

3. **Check Backend Logs:**
   - Look for error messages in the terminal running the backend
   - Check for "OTP email sent successfully" message

### OTP Not Working

1. **Check OTP Expiration:**
   - OTPs expire after 10 minutes
   - Request a new OTP if expired

2. **Check Database:**
   ```bash
   # In backend directory
   npx prisma studio
   ```
   - Navigate to PasswordReset table
   - Verify OTP exists and is not expired

### Frontend Issues

1. **Check API URL:**
   - Ensure backend is running on `http://localhost:3000`
   - Check browser console for CORS errors

2. **Clear Browser Cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## Production Deployment

### Environment Variables

Set these in your production environment:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="AgroIntel <noreply@agrointel.com>"
JWT_SECRET=your-secure-random-secret
```

### Security Considerations

1. **Use HTTPS** for all production traffic
2. **Rate Limiting**: Implement rate limiting on OTP requests
3. **Email Verification**: Consider requiring email verification on signup
4. **Monitoring**: Set up alerts for failed OTP attempts
5. **Logging**: Log all password reset attempts for security auditing

---

## Future Enhancements

- [ ] SMS OTP as alternative to email
- [ ] Rate limiting on OTP requests
- [ ] Email verification on signup
- [ ] Password strength meter
- [ ] Remember me functionality
- [ ] Account lockout after multiple failed attempts
- [ ] Email templates for other notifications
- [ ] Multi-language support for emails

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review backend logs for error messages
- Verify all environment variables are set correctly
- Ensure both frontend and backend servers are running

---

**Last Updated:** January 28, 2026
**Version:** 1.0.0
