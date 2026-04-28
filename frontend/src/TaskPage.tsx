import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, ClipboardList, Trash2, Calendar, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Task {
    id: string;
    title: string;
    subtitle: string;
    timestamp: number;
    completed: boolean;
}

export default function TaskPage() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        const storedTasks = localStorage.getItem('agrointel_tasks');
        if (storedTasks) {
            try {
                setTasks(JSON.parse(storedTasks));
            } catch (e) {
                console.error("Failed to parse tasks", e);
            }
        }
    }, [navigate]);

    const toggleTaskComplete = (taskId: string) => {
        const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        setTasks(newTasks);
        localStorage.setItem('agrointel_tasks', JSON.stringify(newTasks));
    };

    const deleteTask = (taskId: string) => {
        const newTasks = tasks.filter(t => t.id !== taskId);
        setTasks(newTasks);
        localStorage.setItem('agrointel_tasks', JSON.stringify(newTasks));
    };

    const clearCompleted = () => {
        if (!confirm('Are you sure you want to delete all completed tasks?')) return;
        const newTasks = tasks.filter(t => !t.completed);
        setTasks(newTasks);
        localStorage.setItem('agrointel_tasks', JSON.stringify(newTasks));
    };

    return (
        <div className="min-h-screen bg-muted/30 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b px-8 py-6 flex items-center gap-4 sticky top-0 z-50">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-indigo-500" />
                        Task Panel
                    </h1>
                    <p className="text-sm text-muted-foreground">Manage your saved market opportunities and daily actions.</p>
                </div>
                {tasks.some(t => t.completed) && (
                    <Button variant="outline" className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50" onClick={clearCompleted}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Completed
                    </Button>
                )}
            </header>

            <main className="p-6 md:p-10 max-w-[1400px] mx-auto">
                <div className="space-y-8">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground bg-white rounded-3xl border border-dashed shadow-sm animate-in zoom-in-95 duration-500">
                            <ClipboardList className="h-20 w-20 mb-6 opacity-20 text-indigo-500" />
                            <h2 className="text-2xl font-bold text-foreground mb-2">No tasks saved yet</h2>
                            <p className="text-base max-w-md mx-auto mb-8">
                                You can save weather-driven market opportunities here to keep track of them.
                            </p>
                            <Button size="lg" onClick={() => navigate('/weather')}>
                                Discover Opportunities
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {tasks.sort((a, b) => b.timestamp - a.timestamp).map((task, index) => (
                                <div 
                                    key={task.id} 
                                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                                >
                                    <Card className={`overflow-hidden h-full flex flex-col transition-all duration-300 ${task.completed ? 'opacity-60 bg-muted/50 border-muted' : 'hover:shadow-md border-indigo-100 bg-white'}`}>
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <CardTitle className={`text-xl leading-tight ${task.completed ? 'line-through text-muted-foreground' : 'text-indigo-950'}`}>
                                                    {task.title}
                                                </CardTitle>
                                                <Badge variant="outline" className={task.completed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}>
                                                    {task.completed ? 'Done' : 'Pending'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col">
                                            <div className="space-y-3 mb-6 flex-1">
                                                <div className="flex items-start gap-2 text-muted-foreground">
                                                    <Target className="h-5 w-5 shrink-0 mt-0.5 text-slate-400" />
                                                    <p className={`text-base font-medium ${task.completed ? 'text-muted-foreground/70' : 'text-slate-700'}`}>
                                                        {task.subtitle}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                                                    <Calendar className="h-4 w-4 shrink-0" />
                                                    <span>Saved on {new Date(task.timestamp).toLocaleDateString()} at {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pt-4 border-t mt-auto">
                                                <Button 
                                                    variant={task.completed ? "outline" : "default"} 
                                                    className={`flex-1 gap-2 text-base ${task.completed ? '' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                                    onClick={() => toggleTaskComplete(task.id)}
                                                >
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    {task.completed ? 'Mark as Pending' : 'Mark as Done'}
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="shrink-0 h-10 w-10 text-muted-foreground hover:text-red-600 hover:bg-red-50 border-muted"
                                                    onClick={() => deleteTask(task.id)}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
