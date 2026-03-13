import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar, Loader2, ArrowLeft } from "lucide-react";
import { DEPARTMENTS } from "@/lib/mockData";
import { UserRole } from "@/types";
import { registerApi } from "@/lib/api";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as UserRole,
    department: "",
    semester: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.department) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department,
      };
      
      // Add semester for students
      if (form.role === "student" && form.semester) {
        payload.semester = parseInt(form.semester);
      }
      
      await registerApi(payload);
      toast({ 
        title: "Registration Successful!", 
        description: "You can now log in with your credentials." 
      });
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({ 
        title: "Registration Failed", 
        description: error.response?.data?.message || "An error occurred during registration.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary rounded-xl">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">TimeTableAI</h1>
            <p className="text-xs text-muted-foreground">Smart Scheduling System</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-card p-8">
          <button onClick={() => navigate("/login")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </button>
          <h2 className="text-2xl font-bold text-foreground mb-1">Create Account</h2>
          <p className="text-muted-foreground text-sm mb-6">Register for access to the timetable system</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="Dr. John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" placeholder="john@edu.ac.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <Input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Select dept." /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.role === "student" && (
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
                    <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full h-11 gradient-teal text-white shadow-teal mt-2" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Account...</> : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
