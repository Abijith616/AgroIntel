import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { sendOTPEmail } from './email.service';

// Generate a 6-digit OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const requestPasswordReset = async (email: string) => {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        // Don't reveal if user exists or not for security
        throw new Error('If this email exists, an OTP has been sent');
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Invalidate any existing unused OTPs for this user
    await prisma.passwordReset.updateMany({
        where: {
            userId: user.id,
            used: false,
        },
        data: {
            used: true,
        },
    });

    // Create new password reset record
    await prisma.passwordReset.create({
        data: {
            userId: user.id,
            otp,
            expiresAt,
        },
    });

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.username);

    return {
        message: 'OTP has been sent to your email',
    };
};

export const verifyOTP = async (email: string, otp: string) => {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error('Invalid OTP or email');
    }

    // Find valid OTP
    const passwordReset = await prisma.passwordReset.findFirst({
        where: {
            userId: user.id,
            otp,
            used: false,
            expiresAt: {
                gt: new Date(), // OTP not expired
            },
        },
    });

    if (!passwordReset) {
        throw new Error('Invalid or expired OTP');
    }

    return {
        message: 'OTP verified successfully',
        resetId: passwordReset.id,
    };
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error('Invalid request');
    }

    // Find valid OTP
    const passwordReset = await prisma.passwordReset.findFirst({
        where: {
            userId: user.id,
            otp,
            used: false,
            expiresAt: {
                gt: new Date(),
            },
        },
    });

    if (!passwordReset) {
        throw new Error('Invalid or expired OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
    });

    // Mark OTP as used
    await prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
    });

    return {
        message: 'Password reset successfully',
    };
};
