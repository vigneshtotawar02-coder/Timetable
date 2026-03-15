import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Calendar, GraduationCap, User, ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "admin", label: "Admin", icon: <ShieldCheck className="h-5 w-5" />, desc: "Full system access" },
  { value: "faculty", label: "Faculty", icon: <User className="h-5 w-5" />, desc: "View & manage courses" },
  { value: "student", label: "Student", icon: <GraduationCap className="h-5 w-5" />, desc: "View timetables" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (r: UserRole) => {
    setRole(r);
    setEmail(`${r}@gmail.com`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(email, password, role);
      toast({ title: "Welcome back!", description: `Logged in as ${role}` });
      navigate(role === "admin" ? "/admin" : role === "faculty" ? "/faculty" : "/student");
    } catch {
      toast({ title: "Login failed", description: "Invalid credentials.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] gradient-hero flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-teal border-2 border-teal" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full bg-teal-light border-2 border-teal-light" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="p-2 bg-teal rounded-xl">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TimeTableAI</h1>
              <p className="text-xs text-white/60">Smart Scheduling System</p>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Intelligent Timetable<br />Generation System
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              AI-powered scheduling that optimizes faculty workload, room utilization, and student experience.
            </p>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "98%", label: "Conflict-Free" },
            { value: "3x", label: "Faster Scheduling" },
            { value: "500+", label: "Courses Managed" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-teal">{s.value}</p>
              <p className="text-xs text-white/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary rounded-xl">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">TimeTableAI</h1>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-1">Sign In</h2>
          <p className="text-muted-foreground mb-8">Choose your role and enter your credentials</p>

          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRoleChange(r.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center",
                  role === r.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-card text-muted-foreground hover:border-accent/50 hover:bg-accent/5"
                )}
              >
                {r.icon}
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="text-xs leading-tight">{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@edu.ac.in"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 gradient-teal text-white shadow-teal" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</> : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Don't have an account?{" "}
            <a href="/register" className="text-accent font-semibold hover:underline">Register here</a>
          </p>

          <div className="mt-8 p-4 bg-muted rounded-xl">
            <p className="text-xs text-muted-foreground text-center font-medium mb-2">Demo Credentials</p>
            <p className="text-xs text-muted-foreground text-center">Email: <span className="text-foreground font-mono">{role}@edu.ac.in</span> · Password: <span className="text-foreground font-mono">password</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
