# 🔐 Forgot Password - Quick Start Guide

## 🚀 Quick Access

**Frontend**: http://localhost:5173/forgot-password  
**Backend API**: http://localhost:3000/api/auth

---

## 📱 User Flow

![Forgot Password Flow](/.gemini/antigravity/brain/7b1f66a4-e804-49cd-a4ad-f3bda10c5461/forgot_password_flow_1769579932177.png)

### Step 1: Enter Email
Provide your registered email address to initiate the reset process.

### Step 2: Receive OTP
Check your inbox for a unique one-time password sent by AgroIntel.

### Step 3: Verify Code
Enter the received OTP to securely validate your identity.

### Step 4: New Password
Create and confirm a new, strong password for your account.

---

## 🔑 API Endpoints

### Request OTP
```bash
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
```

### Verify OTP
```bash
POST /api/auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
```

### Reset Password
```bash
POST /api/auth/reset-password
Body: { 
  "email": "user@example.com", 
  "otp": "123456", 
  "newPassword": "newSecurePassword" 
}
```

---

## ⚙️ Configuration

### Email Settings (.env)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM="AgroIntel <noreply@agrointel.com>"
```

---

## 🧪 Testing

### Quick Test
```bash
./test-forgot-password.sh
```

### Manual Test
1. Visit http://localhost:5173/forgot-password
2. Enter your email
3. Check email for OTP
4. Complete the flow

---

## 📋 Features

✅ 6-digit OTP generation  
✅ 10-minute expiration  
✅ Beautiful HTML emails  
✅ Multi-step UI flow  
✅ Progress indicators  
✅ Smooth animations  
✅ Error handling  
✅ Security warnings  
✅ One-time use enforcement  
✅ Automatic OTP invalidation  

---

## 📚 Documentation

- **Full Setup Guide**: `FORGOT_PASSWORD_SETUP.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Test Script**: `test-forgot-password.sh`

---

## 🎯 Status

✅ **Backend**: Fully implemented and tested  
✅ **Frontend**: Beautiful multi-step UI  
✅ **Email**: Gmail SMTP configured  
✅ **Database**: Migration applied  
✅ **Documentation**: Complete  

**Ready for production use!** 🚀

---

## 💡 Quick Tips

- OTPs expire in 10 minutes
- Each OTP can only be used once
- Requesting a new OTP invalidates previous ones
- Minimum password length: 6 characters
- Check spam folder if email not received

---

**Last Updated**: January 28, 2026  
**Version**: 1.0.0
