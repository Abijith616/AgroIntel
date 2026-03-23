import { useState, useEffect } from "react";
import { CloudSun, Wind, Droplets, WifiOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface WeatherWidgetProps {
    lat: number;
    lon: number;
    cropName: string;
}

export function WeatherWidget({ lat, lon, cropName }: WeatherWidgetProps) {
    const [weather, setWeather] = useState<any>(null);
    const [error, setError] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3000/api/weather/local?lat=${lat}&lon=${lon}&crop=${cropName}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.metadata?.dataSource === 'real') {
                        setWeather(data.weather.current);
                        setError(false);
                    } else {
                        setError(true);
                    }
                } else {
                    setError(true);
                }
            } catch (error) {
                console.error("Failed to fetch widget weather", error);
                setError(true);
            }
        };
        fetchWeather();
    }, [lat, lon, cropName]);

    if (error) return (
        <Card
            className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate(`/weather?lat=${lat}&lon=${lon}&crop=${cropName}`)}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-orange-900 group-hover:text-orange-700 transition-colors">Weather Unavailable</CardTitle>
                <WifiOff className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
                <div className="text-sm text-orange-800">Unable to fetch weather data</div>
                <p className="text-sm text-muted-foreground mt-2 group-hover:text-orange-700 transition-colors">Click to retry &rarr;</p>
            </CardContent>
        </Card>
    );

    if (!weather) return (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-sm animate-pulse">
            <CardHeader><CardTitle className="text-base">Loading Weather...</CardTitle></CardHeader>
            <CardContent className="h-24"></CardContent>
        </Card>
    );

    return (
        <Card
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate(`/weather?lat=${lat}&lon=${lon}&crop=${cropName}`)}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium text-green-900 group-hover:text-green-700 transition-colors">Weather Alert</CardTitle>
                <CloudSun className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-green-800">{weather.temperature_2m.toFixed(1)}°C</div>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                    <Wind className="h-4 w-4 mr-1" /> ? km/h
                    <Droplets className="h-4 w-4 ml-2 mr-1" /> {weather.relative_humidity_2m}%
                </p>
                <p className="text-sm text-muted-foreground mt-2 group-hover:text-green-700 transition-colors">Click for full analysis &rarr;</p>
            </CardContent>
        </Card>
    );
}
