import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./Landing";
import Register from "./Register";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import Dashboard from "./Dashboard";
import AddCrop from "./AddCrop";
import EditCrop from "./EditCrop";
import Schemes from "./Schemes";
import WeatherPage from "./WeatherPage";
import MarketPrices from "./MarketPrices";
import MarketAIReport from "./MarketAIReport";
import ExportOpportunities from "./ExportOpportunities";
import MonthlyReport from "./MonthlyReport";
import PlantHealth from "./PlantHealth";
import PlantHealthList from "./PlantHealthList";
import MarketOpportunities from "./MarketOpportunities";
import YieldForecast from "./YieldForecast";
import MarketIntelligence from "./MarketIntelligence";
import TaskPage from "./TaskPage";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/add-crop" element={<ProtectedRoute><AddCrop /></ProtectedRoute>} />
                <Route path="/edit-crop/:id" element={<ProtectedRoute><EditCrop /></ProtectedRoute>} />
                <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
                <Route path="/weather" element={<ProtectedRoute><WeatherPage /></ProtectedRoute>} />
                <Route path="/market" element={<ProtectedRoute><MarketPrices /></ProtectedRoute>} />
                <Route path="/market-report" element={<ProtectedRoute><MarketAIReport /></ProtectedRoute>} />
                <Route path="/export-opportunities" element={<ProtectedRoute><ExportOpportunities /></ProtectedRoute>} />
                <Route path="/monthly-report" element={<ProtectedRoute><MonthlyReport /></ProtectedRoute>} />
                <Route path="/plant-health" element={<ProtectedRoute><PlantHealthList /></ProtectedRoute>} />
                <Route path="/plant-health/:cropId" element={<ProtectedRoute><PlantHealth /></ProtectedRoute>} />
                <Route path="/market-opportunities" element={<ProtectedRoute><MarketOpportunities /></ProtectedRoute>} />
                <Route path="/yield-forecast" element={<ProtectedRoute><YieldForecast /></ProtectedRoute>} />
                <Route path="/market-intelligence" element={<ProtectedRoute><MarketIntelligence /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><TaskPage /></ProtectedRoute>} />
            </Routes>
        </Router>
    );
}

export default App;

