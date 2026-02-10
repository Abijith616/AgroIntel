import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink, Leaf } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface Scheme {
    id: number;
    name: string;
    description: string;
    type: string;
    link: string;
    applicableCrops: string;
    benefits: string;
}

export default function Schemes() {
    const navigate = useNavigate();
    const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
    const [matchingSchemes, setMatchingSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [allRes, matchRes] = await Promise.all([
                    fetch('http://localhost:3000/api/schemes', { headers }),
                    fetch('http://localhost:3000/api/schemes/match', { headers })
                ]);

                if (allRes.ok) setAllSchemes(await allRes.json());
                if (matchRes.ok) setMatchingSchemes(await matchRes.json());

            } catch (error) {
                console.error("Failed to fetch schemes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchemes();
    }, []);

    const SchemeCard = ({ scheme }: { scheme: Scheme }) => (
        <Card className="mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <Badge variant={scheme.type === 'Central' ? 'default' : 'secondary'} className="mb-2">
                            {scheme.type} Government
                        </Badge>
                        <CardTitle className="text-xl text-primary">{scheme.name}</CardTitle>
                    </div>
                    {/* Placeholder for save/bookmark feature 
                    <Button variant="ghost" size="icon">
                        <Bookmark className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    */}
                </div>
                <CardDescription className="mt-2 text-base">
                    {scheme.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted/30 p-3 rounded-md">
                        <h4 className="font-semibold text-sm mb-1 text-foreground">Benefits</h4>
                        <p className="text-sm text-muted-foreground">{scheme.benefits}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-md">
                        <h4 className="font-semibold text-sm mb-1 text-foreground">Applicable Crops</h4>
                        <p className="text-sm text-muted-foreground">{scheme.applicableCrops}</p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button asChild variant="outline" className="gap-2">
                        <a href={scheme.link} target="_blank" rel="noopener noreferrer">
                            Visit Official Website <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-muted/30 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')} className="pl-0 hover:bg-transparent text-muted-foreground">
                        <ArrowLeft className="h-5 w-5 mr-1" /> Back to Dashboard
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Government Schemes</h1>
                        <p className="text-muted-foreground mt-1">Find financial aid and support matching your cultivation.</p>
                    </div>
                    {/* Placeholder for search
                    <div className="w-full md:w-72">
                         <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Search schemes..." />
                    </div>
                    */}
                </div>

                {loading ? (
                    <div className="text-center py-12">Loading schemes...</div>
                ) : (
                    <Tabs defaultValue="recommended" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                            <TabsTrigger value="recommended">Recommended for You</TabsTrigger>
                            <TabsTrigger value="all">All Schemes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="recommended" className="mt-6 space-y-4">
                            {matchingSchemes.length > 0 ? (
                                matchingSchemes.map(scheme => (
                                    <SchemeCard key={scheme.id} scheme={scheme} />
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                                    <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <h3 className="text-lg font-medium">No Specific Recommendations</h3>
                                    <p className="text-muted-foreground">Add more crops to your profile to get personalized scheme recommendations.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="all" className="mt-6 space-y-4">
                            {allSchemes.map(scheme => (
                                <SchemeCard key={scheme.id} scheme={scheme} />
                            ))}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
