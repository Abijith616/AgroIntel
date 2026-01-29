import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, TrendingUp, Loader2, AlertCircle, CheckCircle2, Mail, Lock, ArrowLeft } from "lucide-react";

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setSuccess(data.message);
            setStep('otp');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid OTP');
            }

            setSuccess(data.message);
            setStep('password');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setSuccess(data.message);
            setStep('success');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepIndicator = () => {
        const steps = [
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'otp', label: 'Verify OTP', icon: CheckCircle2 },
            { id: 'password', label: 'New Password', icon: Lock },
        ];

        const currentStepIndex = steps.findIndex(s => s.id === step);

        return (
            <div className="flex items-center justify-center gap-2 mb-6">
                {steps.map((s, index) => {
                    const Icon = s.icon;
                    const isActive = s.id === step;
                    const isCompleted = index < currentStepIndex;

                    return (
                        <div key={s.id} className="flex items-center">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                    : isCompleted
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                <Icon className="h-4 w-4" />
                                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${isCompleted ? 'bg-primary' : 'bg-muted'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-muted/40">
            {/* Background decorative elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-[100%] blur-3xl opacity-50" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/30 rounded-full blur-3xl opacity-50" />
            </div>

            <Card className="w-full max-w-md shadow-xl border-primary/10 bg-card/80 backdrop-blur-sm">
                <CardHeader className="space-y-4 flex flex-col items-center text-center pb-2">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform duration-300">
                            <Leaf className="h-5 w-5" />
                            <TrendingUp className="absolute h-3 w-3 right-1 bottom-1 opacity-80" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-foreground">Agro<span className="text-primary">Intel</span></span>
                    </Link>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            {step === 'success' ? 'Password Reset!' : 'Reset Password'}
                        </CardTitle>
                        <CardDescription>
                            {step === 'email' && 'Enter your email to receive an OTP'}
                            {step === 'otp' && 'Enter the 6-digit code sent to your email'}
                            {step === 'password' && 'Create a new password for your account'}
                            {step === 'success' && 'Your password has been successfully reset'}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="pt-4">
                    {step !== 'success' && renderStepIndicator()}

                    {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && step !== 'success' && (
                        <div className="bg-green-500/15 text-green-600 dark:text-green-400 text-sm p-3 rounded-md flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Step 1: Email Input */}
                    {step === 'email' && (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    className="bg-background/50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full font-semibold shadow-md" size="lg" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send OTP
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">OTP Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                    className="bg-background/50 text-center text-2xl tracking-widest font-mono"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                    Check your email for the 6-digit code
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStep('email')}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button type="submit" className="flex-1 font-semibold shadow-md" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify OTP'
                                    )}
                                </Button>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-sm"
                                onClick={() => {
                                    setStep('email');
                                    setOtp('');
                                }}
                            >
                                Didn't receive code? Resend OTP
                            </Button>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 'password' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    required
                                    className="bg-background/50"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    className="bg-background/50"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your password"
                                />
                            </div>

                            <Button type="submit" className="w-full font-semibold shadow-md" size="lg" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Reset Password
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <div className="space-y-6 text-center py-4">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-green-500/20 p-6 animate-in zoom-in duration-500">
                                    <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">Password Reset Successful!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your password has been successfully reset. You can now log in with your new password.
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate('/login')}
                                className="w-full font-semibold shadow-md"
                                size="lg"
                            >
                                Go to Login
                            </Button>
                        </div>
                    )}
                </CardContent>

                {step !== 'success' && (
                    <CardFooter className="flex justify-center border-t p-6 bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                            Remember your password?{" "}
                            <Link to="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                                Back to Login
                            </Link>
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
