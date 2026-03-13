import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/ui/StatCard";
import { BookOpen, Users, Building2, CalendarDays, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCourses, fetchRooms, fetchFacultyWorkloadAnalytics } from "@/lib/api";

const RECENT_ACTIVITIES = [
  { text: "New faculty Dr. Kapoor added", time: "2 min ago", type: "success" },
  { text: "CS Dept timetable generated", time: "1 hour ago", type: "info" },
  { text: "Room LH-201 capacity updated", time: "3 hours ago", type: "warning" },
  { text: "EC Semester 5 timetable conflict resolved", time: "Yesterday", type: "success" },
];

export default function AdminDashboard() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const coursesQuery = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });
  const roomsQuery = useQuery({ queryKey: ["rooms"], queryFn: fetchRooms });
  const workloadQuery = useQuery({
    queryKey: ["analytics", "faculty-workload"],
    queryFn: async () => {
      const data = await fetchFacultyWorkloadAnalytics();
      const chart: { name: string; hours: number }[] = data.workload.map((w: any) => ({
        name: w.faculty_name,
        hours: w.total_hours,
      }));
      return chart;
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));
    setGenerating(false);
    setGenerated(true);
    toast({ title: "Timetable Generated! 🎉", description: "Conflict-free schedule created for all departments." });
    setTimeout(() => setGenerated(false), 4000);
  };

  return (
    <AppLayout requiredRole="admin" title="Admin Dashboard">
      {/* Welcome */}
      <div className="gradient-hero rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10">
          <CalendarDays className="w-full h-full" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, Admin 👋</h1>
            <p className="text-white/70 text-sm mt-1">Spring Semester 2025 · AI scheduling ready</p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-teal hover:bg-teal-light text-white shadow-teal border-0 h-11 px-6"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : generated ? (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Generated!</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Generate Timetable</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Courses" value={coursesQuery.data?.length ?? 0} subtitle="+2 this semester" icon={<BookOpen className="h-5 w-5 text-primary-foreground" />} iconBg="gradient-card" trend={{ value: 12, label: "from last sem" }} />
        <StatCard title="Faculty Members" value={workloadQuery.data?.length ?? 0} subtitle="Across all depts." icon={<Users className="h-5 w-5 text-white" />} iconBg="gradient-teal" trend={{ value: 5, label: "from last sem" }} />
        <StatCard title="Classrooms" value={roomsQuery.data?.length ?? 0} subtitle="Available rooms" icon={<Building2 className="h-5 w-5 text-white" />} iconBg="bg-warning" />
        <StatCard title="Timetables" value="12" subtitle="Departments active" icon={<CalendarDays className="h-5 w-5 text-white" />} iconBg="bg-success" trend={{ value: 8, label: "efficiency gain" }} />
      </div>

      {/* Charts + Activity */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Workload Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-1">Faculty Workload (hrs/week)</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution across all faculty members</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workloadQuery.data ?? []} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 28%, 92%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(" ")[1]} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(214,28%,88%)", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value) => [`${value} hrs`, "Workload"]}
              />
              <Bar dataKey="hours" fill="hsl(178,68%,38%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {RECENT_ACTIVITIES.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === "success" ? "bg-success" : a.type === "warning" ? "bg-warning" : "bg-info"}`} />
                <div>
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Manage Courses", href: "/admin/courses", icon: <BookOpen className="h-5 w-5" /> },
          { label: "Manage Faculty", href: "/admin/faculty", icon: <Users className="h-5 w-5" /> },
          { label: "View Timetable", href: "/admin/timetable", icon: <CalendarDays className="h-5 w-5" /> },
        ].map((q) => (
          <Link key={q.href} to={q.href} className="bg-card border rounded-xl p-4 flex flex-col items-center gap-2 text-center shadow-card hover:shadow-elevated hover:border-accent/50 transition-all group">
            <div className="p-2 bg-muted rounded-lg group-hover:bg-accent/10 transition-colors text-muted-foreground group-hover:text-accent">
              {q.icon}
            </div>
            <span className="text-sm font-medium text-foreground">{q.label}</span>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
