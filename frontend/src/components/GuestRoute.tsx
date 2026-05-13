import { Navigate } from "react-router-dom";

export default function GuestRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    // If user is already logged in, redirect them to the dashboard
    if (token && user) {
        return <Navigate to="/dashboard" replace />;
    }

    // Otherwise, allow them to see the login/register pages
    return <>{children}</>;
}
