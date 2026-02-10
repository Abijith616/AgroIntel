import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sprout } from 'lucide-react';
import { COUNTRIES, INDIAN_STATES_AND_DISTRICTS } from './lib/locationData';

export default function EditCrop() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        landVolume: '',
        landUnit: 'Acres',
        phase: 'Initial Stage',
        country: '',
        state: '',
        district: '',
        place: ''
    });

    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [showIndianFields, setShowIndianFields] = useState(false);

    // Fetch crop data
    useEffect(() => {
        const fetchCrop = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3000/api/crops`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const crops = await response.json();
                    const crop = crops.find((c: any) => c.id === parseInt(id || '0'));

                    if (crop) {
                        setFormData({
                            name: crop.name,
                            landVolume: crop.landVolume.toString(),
                            landUnit: crop.landUnit,
                            phase: crop.phase,
                            country: crop.country,
                            state: crop.state || '',
                            district: crop.district || '',
                            place: crop.place
                        });

                        // Trigger logic for states/districts dependent on country/state
                        if (crop.country === 'India') {
                            setShowIndianFields(true);
                        }
                    } else {
                        alert('Crop not found');
                        navigate('/dashboard');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch crop details", error);
            } finally {
                setInitialLoading(false);
            }
        };

        if (id) {
            fetchCrop();
        }
    }, [id, navigate]);

    // Effect to handle country selection
    useEffect(() => {
        if (formData.country === 'India') {
            setShowIndianFields(true);
            setStates(Object.keys(INDIAN_STATES_AND_DISTRICTS).sort());
        } else {
            setShowIndianFields(false);
            setStates([]);
            setDistricts([]);
        }
    }, [formData.country]);

    // Effect to handle state selection
    useEffect(() => {
        if (formData.country === 'India' && formData.state) {
            const districtList = INDIAN_STATES_AND_DISTRICTS[formData.state] || [];
            setDistricts(districtList.sort());
        } else {
            setDistricts([]);
        }
    }, [formData.state, formData.country]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/crops/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                navigate('/dashboard');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to update crop');
            }
        } catch (error) {
            console.error('Error updating crop:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "flex h-12 md:h-14 w-full rounded-md border border-input bg-background px-4 py-3 text-base md:text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    if (initialLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-muted/30 p-4 md:p-8 flex items-center justify-center">
            <Card className="w-full max-w-4xl shadow-xl">
                <CardHeader className="space-y-4 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="p-0 h-auto hover:bg-transparent text-base text-muted-foreground">
                            <ArrowLeft className="h-5 w-5 mr-1" /> Back
                        </Button>
                    </div>
                    <CardTitle className="text-3xl md:text-4xl flex items-center gap-3">
                        <Sprout className="h-8 w-8 md:h-10 md:w-10 text-green-600" />
                        Edit Crop Details
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Update the details of your cultivation.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="name" className="text-lg font-medium">Crop Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Wheat (HD-2967)"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="h-12 md:h-14 text-lg"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="phase" className="text-lg font-medium">Current Phase</Label>
                                <select
                                    id="phase"
                                    name="phase"
                                    className={inputClasses}
                                    value={formData.phase}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Initial Stage">Initial Stage</option>
                                    <option value="Intermediate Stage">Intermediate Stage</option>
                                    <option value="Harvest Stage">Harvest Stage</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="landVolume" className="text-lg font-medium">Land Volume</Label>
                                <Input
                                    id="landVolume"
                                    name="landVolume"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.landVolume}
                                    onChange={handleChange}
                                    required
                                    className="h-12 md:h-14 text-lg"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="landUnit" className="text-lg font-medium">Unit</Label>
                                <select
                                    id="landUnit"
                                    name="landUnit"
                                    className={inputClasses}
                                    value={formData.landUnit}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Acres">Acres</option>
                                    <option value="Hectares">Hectares</option>
                                    <option value="Cent">Cent</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t pt-8">
                            <h3 className="text-xl md:text-2xl font-semibold mb-6">Location Details</h3>
                            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="country" className="text-lg font-medium">Country</Label>
                                    <select
                                        id="country"
                                        name="country"
                                        className={inputClasses}
                                        value={formData.country}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Country</option>
                                        {COUNTRIES.map(country => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                    </select>
                                </div>

                                {showIndianFields && (
                                    <>
                                        <div className="space-y-3">
                                            <Label htmlFor="state" className="text-lg font-medium">State</Label>
                                            <select
                                                id="state"
                                                name="state"
                                                className={inputClasses}
                                                value={formData.state}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Select State</option>
                                                {states.map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="district" className="text-lg font-medium">District</Label>
                                            <select
                                                id="district"
                                                name="district"
                                                className={inputClasses}
                                                value={formData.district}
                                                onChange={handleChange}
                                                required
                                                disabled={!formData.state}
                                            >
                                                <option value="">Select District</option>
                                                {districts.map(district => (
                                                    <option key={district} value={district}>{district}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div className="space-y-3">
                                    <Label htmlFor="place" className="text-lg font-medium">Place (Specific Location)</Label>
                                    <Input
                                        id="place"
                                        name="place"
                                        placeholder="e.g. Village Name"
                                        value={formData.place}
                                        onChange={handleChange}
                                        required
                                        className="h-12 md:h-14 text-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-14 text-xl font-semibold mt-4" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Crop'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
