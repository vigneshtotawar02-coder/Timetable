import AppLayout from "@/components/layout/AppLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  fetchFacultyWorkloadAnalytics,
  fetchRoomUtilizationAnalytics,
  fetchDepartmentOverviewAnalytics,
} from "@/lib/api";

const WEEKLY_TREND = [
  { week: "W1", generated: 8, conflicts: 2 },
  { week: "W2", generated: 12, conflicts: 1 },
  { week: "W3", generated: 15, conflicts: 0 },
  { week: "W4", generated: 10, conflicts: 1 },
  { week: "W5", generated: 18, conflicts: 0 },
];

export default function Analytics() {
  const workloadQuery = useQuery({
    queryKey: ["analytics", "faculty-workload"],
    queryFn: fetchFacultyWorkloadAnalytics,
  });

  const roomUtilQuery = useQuery({
    queryKey: ["analytics", "room-utilization"],
    queryFn: fetchRoomUtilizationAnalytics,
  });

  const overviewQuery = useQuery({
    queryKey: ["analytics", "department-overview"],
    queryFn: fetchDepartmentOverviewAnalytics,
  });

  const workloadChart =
    workloadQuery.data?.workload.map((w: any) => ({
      name: w.faculty_name,
      hours: w.total_hours,
    })) ?? [];

  const avgWorkload =
    workloadChart.length > 0
      ? (
          workloadChart.reduce((a, b) => a + b.hours, 0) / workloadChart.length
        ).toFixed(1)
      : "0.0";

  const roomUtilChart =
    roomUtilQuery.data?.utilization.map((u: any) => ({
      name: u.room_name,
      value: parseFloat(u.utilization_percentage),
      fill: "hsl(213, 62%, 30%)",
    })) ?? [];

  return (
    <AppLayout requiredRole="admin" title="Analytics">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics & Insights</h1>
        <p className="text-muted-foreground text-sm">System performance and resource utilization overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Avg. Faculty Workload", value: `${avgWorkload}h`, sub: "Hours per week" },
          { label: "Room Utilization", value: "62%", sub: "Average across rooms" },
          { label: "Conflict Rate", value: "0.8%", sub: "Per generated timetable" },
          { label: "Schedules Generated", value: "47", sub: "This semester" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border shadow-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs font-semibold text-foreground mt-1">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Faculty Workload Bar */}
        <div className="bg-card rounded-xl border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-1">Faculty Workload Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Weekly teaching hours per faculty member</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={workloadChart} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,28%,92%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 12]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(" ").slice(-1)[0]} width={60} />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} formatter={(v) => [`${v} hrs`, "Workload"]} />
              <Bar dataKey="hours" fill="hsl(213,62%,22%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Room Utilization Pie */}
        <div className="bg-card rounded-xl border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-1">Room Utilization</h3>
          <p className="text-xs text-muted-foreground mb-4">Percentage of time each room is occupied</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={roomUtilChart} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                {roomUtilChart.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, "Utilization"]} contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Trend */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-1">Generation Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Timetables generated vs. conflicts over weeks</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={WEEKLY_TREND}>
              <defs>
                <linearGradient id="gradGen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(178,68%,38%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(178,68%,38%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,28%,92%)" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="generated" stroke="hsl(178,68%,38%)" fill="url(#gradGen)" strokeWidth={2} name="Generated" />
              <Line type="monotone" dataKey="conflicts" stroke="hsl(0,84%,60%)" strokeWidth={2} dot={{ r: 3 }} name="Conflicts" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Course Dept Breakdown */}
        <div className="bg-card rounded-xl border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Courses by Dept.</h3>
          <div className="space-y-3">
            {["Computer Science", "Electronics", "Mechanical"].map((dept) => {
              const count = MOCK_COURSES.filter((c) => c.department === dept).length;
              const pct = Math.round((count / MOCK_COURSES.length) * 100);
              return (
                <div key={dept}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{dept}</span>
                    <span className="text-muted-foreground">{count} courses</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full gradient-teal rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">Faculty Satisfaction</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: "87%" }} />
              </div>
              <span className="text-sm font-bold text-success">87%</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
