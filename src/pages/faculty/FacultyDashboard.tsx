import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/ui/StatCard";
import TimetableGridView from "@/components/ui/TimetableGridView";
import { BookOpen, Clock, CalendarDays, BarChart3, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchFacultyTimetable, fetchCourses } from "@/lib/api";
import { TimetableGrid } from "@/types";
import { createTimeSlotLabel } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FacultyDashboard() {
  const { user } = useAuth();

  // Fetch faculty's timetable
  const timetableQuery = useQuery({
    queryKey: ["faculty-timetable", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const raw = await fetchFacultyTimetable(user!.id);
      
      console.log("Faculty dashboard timetable data:", raw);
      
      const grid: TimetableGrid = {};
      const dayCount: Record<string, number> = {};
      const dayHours: Record<string, number> = {};
      let totalHours = 0;
      
      raw.forEach((row: any) => {
        // Handle both nested and flat structures
        const day = row.time_slots?.day || row.time_slot_details?.day || row.day;
        const start = row.time_slots?.start_time || row.time_slot_details?.start_time;
        const end = row.time_slots?.end_time || row.time_slot_details?.end_time;
        
        if (!day || !start || !end) return;
        
        const slotLabel = createTimeSlotLabel(start, end);
        
        if (!grid[day]) grid[day] = {};
        
        const courseName = row.courses?.course_name || row.course?.course_name || String(row.course_id);
        const roomName = row.rooms?.room_name || row.room?.room_name || "TBA";
        
        grid[day][slotLabel] = {
          courseCode: courseName,
          courseName: courseName,
          facultyName: user?.name || "",
          room: roomName,
          type: "lecture",
        };
        
        // Count classes per day
        dayCount[day] = (dayCount[day] || 0) + 1;
        
        // Calculate hours per day (assuming each slot is 1 hour)
        // Parse time to calculate actual duration
        const startTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        dayHours[day] = (dayHours[day] || 0) + durationHours;
        totalHours += durationHours;
      });
      
      console.log("Dashboard grid:", grid);
      console.log("Total hours:", totalHours);
      
      return { grid, dayCount, dayHours, totalClasses: raw.length, totalHours };
    },
  });

  // Fetch faculty's courses
  const coursesQuery = useQuery({
    queryKey: ["faculty-courses", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const allCourses = await fetchCourses();
      return allCourses.filter((course: any) => course.faculty_id === user?.id);
    },
  });

  // Calculate workload chart data
  const workloadData = timetableQuery.data?.dayHours
    ? Object.entries(timetableQuery.data.dayHours).map(([day, hours]) => ({
        day: day.slice(0, 3), // Mon, Tue, etc.
        hours: Number(hours.toFixed(1)),
      }))
    : [];

  const totalWeeklyHours = timetableQuery.data?.totalHours || 0;
  const totalWeeklyClasses = timetableQuery.data?.totalClasses || 0;
  const assignedCourses = coursesQuery.data?.length || 0;

  return (
    <AppLayout requiredRole="faculty" title="Faculty Dashboard">
      {/* Header */}
      <div className="gradient-hero rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-white/70 text-sm mt-1">{user?.department} · Academic Year 2024-25</p>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">Faculty</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Assigned Courses" 
          value={assignedCourses} 
          icon={<BookOpen className="h-5 w-5 text-primary-foreground" />} 
          iconBg="gradient-card" 
        />
        <StatCard 
          title="Weekly Hours" 
          value={`${totalWeeklyHours.toFixed(1)}h`} 
          subtitle="Teaching load" 
          icon={<Clock className="h-5 w-5 text-white" />} 
          iconBg="gradient-teal" 
        />
        <StatCard 
          title="Weekly Classes" 
          value={totalWeeklyClasses} 
          subtitle="Total lectures"
          icon={<CalendarDays className="h-5 w-5 text-white" />} 
          iconBg="bg-warning" 
        />
        <StatCard 
          title="Active Days" 
          value={Object.keys(timetableQuery.data?.dayCount || {}).length} 
          subtitle="Teaching days"
          icon={<BarChart3 className="h-5 w-5 text-white" />} 
          iconBg="bg-success" 
        />
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {coursesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading courses...</p>
            ) : coursesQuery.data && coursesQuery.data.length > 0 ? (
              <div className="space-y-3">
                {coursesQuery.data.map((course: any) => (
                  <div key={course.id} className="p-3 rounded-lg bg-muted/50 border hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                        {course.course_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{course.weekly_hours}h/week</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{course.course_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sem {course.semester} · {course.department}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No courses assigned yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workload Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Workload Summary</CardTitle>
            <p className="text-xs text-muted-foreground">Your weekly teaching hours breakdown</p>
          </CardHeader>
          <CardContent>
            {timetableQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading workload data...</p>
            ) : workloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={workloadData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,28%,92%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ fontSize: "12px", borderRadius: "8px" }} 
                    formatter={(v) => [`${v} hours`, "Teaching Time"]} 
                  />
                  <Bar dataKey="hours" fill="hsl(178,68%,38%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No workload data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Teaching Schedule</h3>
              <p className="text-sm text-muted-foreground">
                Below is your weekly timetable showing only the courses and time slots allocated to you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Timetable (This Week)</CardTitle>
        </CardHeader>
        <CardContent>
          {timetableQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading timetable...</p>
          ) : timetableQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load timetable.</p>
          ) : timetableQuery.data?.grid && Object.keys(timetableQuery.data.grid).length > 0 ? (
            <TimetableGridView data={timetableQuery.data.grid} />
          ) : (
            <div className="text-center py-12">
              <CalendarDays className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-medium text-muted-foreground mb-2">No Classes Scheduled</p>
              <p className="text-sm text-muted-foreground">
                You don't have any classes scheduled for this week.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
