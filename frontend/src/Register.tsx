import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Leaf, TrendingUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Register() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({ email: "", confirmPassword: "" });

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const updatedFormData = { ...formData, [id]: value };
        setFormData(updatedFormData);

        const newErrors = { ...validationErrors };

        if (id === 'email') {
            if (value && !validateEmail(value)) {
                newErrors.email = "Invalid email format";
            } else {
                newErrors.email = "";
            }
        }

        if (id === 'password' || id === 'confirmPassword') {
            if (updatedFormData.confirmPassword && updatedFormData.password !== updatedFormData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            } else {
                newErrors.confirmPassword = "";
            }
        }

        setValidationErrors(newErrors);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...submitData } = formData;
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Show success animation instead of direct redirect
            setIsSuccess(true);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 lg:p-8 bg-muted/40">
            {/* Background decorative elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 right-1/2 translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-[100%] blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-secondary/30 rounded-full blur-3xl opacity-50" />
            </div>

            <Card className="w-full max-w-5xl shadow-2xl border-primary/10 bg-card/80 backdrop-blur-sm overflow-hidden flex flex-col lg:flex-row">

                {/* Left Side - Visual */}
                <div className="lg:w-1/2 bg-secondary/50 p-8 lg:p-12 text-secondary-foreground relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                    <div className="absolute inset-0 bg-primary/10" />
                    <div className="absolute top-0 right-0 h-64 w-64 bg-primary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10">
                        <Link to="/" className="flex items-center gap-2 mb-8 w-fit group">
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform duration-300">
                                <Leaf className="h-4 w-4" />
                                <TrendingUp className="absolute h-2 w-2 right-0.5 bottom-0.5 opacity-80" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-foreground">Agro<span className="text-primary">Intel</span></span>
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground leading-tight">Join the Agricultural Revolution</h1>
                            <ul className="space-y-3 mt-6">
                                {[
                                    "Real-time crop analytics",
                                    "Market price predictions",
                                    "Expert farming community"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    <motion.div
                        className="relative z-10 mt-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="bg-background/60 backdrop-blur-md p-5 rounded-xl border border-primary/10 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">JD</div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">John Doe</p>
                                    <p className="text-xs text-muted-foreground">Wheat Farmer, Punjab</p>
                                </div>
                            </div>
                            <p className="text-sm text-foreground/80 italic">"AgroIntel helped me time my harvest perfectly. I increased my profits by 20% in just one season."</p>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side - Form or Success Message */}
                <div className="lg:w-1/2 p-8 lg:p-12 bg-background flex flex-col justify-center min-h-[500px]">
                    <div className="max-w-md mx-auto w-full space-y-8">
                        {isSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center space-y-6"
                            >
                                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                                    <motion.div
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                    >
                                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                                    </motion.div>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Account Created!</h2>
                                    <p className="text-muted-foreground">
                                        Your account has been successfully registered. Please log in to continue to your dashboard.
                                    </p>
                                </div>
                                <Button size="lg" className="w-full" onClick={() => navigate('/login')}>
                                    Go to Login
                                </Button>
                            </motion.div>
                        ) : (
                            <>
                                <div className="text-center lg:text-left space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h2>
                                    <p className="text-sm text-muted-foreground">Enter your details below to get registered.</p>
                                </div>

                                {error && (
                                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input
                                            id="username"
                                            placeholder="johndoe"
                                            required
                                            className="bg-muted/30"
                                            value={formData.username}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            required
                                            className={`bg-muted/30 ${validationErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                        {validationErrors.email && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            className="bg-muted/30"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            required
                                            className={`bg-muted/30 ${validationErrors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                        {validationErrors.confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <Button type="submit" className="w-full font-semibold shadow-md" size="lg" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating account...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </Button>
                                </form>

                                <div className="text-center text-sm text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link to="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                                        Log in
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
