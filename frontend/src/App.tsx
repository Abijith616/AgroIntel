import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./Landing";
import Register from "./Register";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import Dashboard from "./Dashboard";
import AddCrop from "./AddCrop";
import EditCrop from "./EditCrop";
import Schemes from "./Schemes";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/add-crop" element={<AddCrop />} />
                <Route path="/edit-crop/:id" element={<EditCrop />} />
                <Route path="/schemes" element={<Schemes />} />
            </Routes>
        </Router>
    );
}

export default App;
