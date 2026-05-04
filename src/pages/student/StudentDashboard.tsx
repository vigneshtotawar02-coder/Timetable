import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import TimetableGridView from "@/components/ui/TimetableGridView";
import StatCard from "@/components/ui/StatCard";
import { CalendarDays, Download, BookOpen, Clock, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchDepartmentTimetable, fetchBatches, fetchLabCourses } from "@/lib/api";
import { TimetableGrid } from "@/types";
import { useNavigate } from "react-router-dom";
import { createTimeSlotLabel, getSemesterLabel } from "@/lib/utils";

export default function StudentDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [dept, setDept] = useState(user?.department || "Computer Science");
  const [sem, setSem] = useState(String(user?.semester || 3));
  const [semDialog, setSemDialog] = useState(false);
  const [newSem, setNewSem] = useState(String(user?.semester || 3));
  const [saving, setSaving] = useState(false);

  const timetableQuery = useQuery({
    queryKey: ["student-timetable", dept, sem, user?.batch_id],
    queryFn: async () => {
      const raw = await fetchDepartmentTimetable(dept, Number(sem));
      const grid: TimetableGrid = {};
      const batchId = user?.batch_id;

      raw.forEach((row: any) => {
        const day = row.time_slot_details?.day || row.day;
        const start = row.time_slot_details?.start_time;
        const end = row.time_slot_details?.end_time;
        if (!day || !start || !end) return;

        const slotLabel = createTimeSlotLabel(start, end);
        if (!grid[day]) grid[day] = {};

        const rawCourseName = row.course?.course_name || String(row.course_id);
        const rawRoomName = row.room?.room_name || "TBA";
        const isLab = !!(row.batchAssignments?.length) || /lab|practical|workshop/i.test(rawCourseName) || /lab/i.test(rawRoomName);

        // For lab slots with batch assignments, filter to this student's batch if known
        let batchName: string | undefined;
        let effectiveRoom = rawRoomName;
        let effectiveCourseName = rawCourseName;
        
        if (row.batchAssignments && row.batchAssignments.length > 0) {
          const myBatch = batchId
            ? row.batchAssignments.find((ba: any) => ba.batchId === batchId || ba.batch_id === batchId)
            : row.batchAssignments[0];
          if (myBatch) {
            batchName = myBatch.batchName;
            effectiveRoom = myBatch.room || rawRoomName;
            effectiveCourseName = myBatch.courseName || rawCourseName;
          } else {
            batchName = "Unassigned";
          }
        }

        grid[day][slotLabel] = {
          courseCode: effectiveCourseName,
          courseName: effectiveCourseName,
          facultyName: row.faculty?.name,
          room: effectiveRoom,
          type: isLab ? "lab" : "lecture",
          batchName,
          batchAssignments: row.batchAssignments,
        };
      });
      return grid;
    },
  });

  // Fetch batches for the student's dept/semester
  const batchesQuery = useQuery({
    queryKey: ["batches", dept, sem],
    queryFn: () => fetchBatches(dept, Number(sem)),
  });

  // Fetch lab courses for the student's dept/semester
  const labCoursesQuery = useQuery({
    queryKey: ["lab-courses", dept, sem],
    queryFn: () => fetchLabCourses(dept, Number(sem)),
  });

  const handleDownload = () => {
    toast({ title: "Downloading PDF...", description: "Your timetable is being prepared." });
  };

  const handleSaveSemester = async () => {
    setSaving(true);
    try {
      await updateUser({ semester: Number(newSem) });
      setSem(newSem);
      setSemDialog(false);
      toast({ title: "Semester updated successfully!" });
    } catch {
      toast({ title: "Failed to update semester", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout requiredRole="student" title="Student Dashboard">
      {/* Header */}
      <div className="gradient-hero rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Hi, {user?.name?.split(" ")[0]} 👋</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-white/70 text-sm">{user?.department} · {getSemesterLabel(user?.semester ?? 0)} · Spring 2025</p>
            </div>
          </div>
          <Button onClick={handleDownload} className="bg-teal hover:bg-teal-light text-white border-0">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Semester update dialog */}
      <Dialog open={semDialog} onOpenChange={setSemDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Update Semester</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <Select value={newSem} onValueChange={setNewSem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8].map((s) => (
                  <SelectItem key={s} value={String(s)}>{getSemesterLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSemDialog(false)}>Cancel</Button>
              <Button className="flex-1 gradient-teal text-white" onClick={handleSaveSemester} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Enrolled Courses" value={5} icon={<BookOpen className="h-5 w-5 text-primary-foreground" />} iconBg="gradient-card" />
        <StatCard title="Classes Today" value={3} subtitle="2 lectures · 1 lab" icon={<CalendarDays className="h-5 w-5 text-white" />} iconBg="gradient-teal" />
        <StatCard title="Free Periods" value={5} subtitle="This week" icon={<Clock className="h-5 w-5 text-white" />} iconBg="bg-warning" />
        <StatCard title="Total Credits" value={18} icon={<BookOpen className="h-5 w-5 text-white" />} iconBg="bg-success" />
      </div>

      {/* Filter */}
      <div className="bg-card rounded-xl border shadow-card p-4 mb-6 flex flex-wrap items-center gap-4">
        <h3 className="font-semibold text-foreground">View Timetable</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Dept:</label>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {user?.department && <SelectItem value={user.department}>{user.department}</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Semester:</label>
          <Select value={sem} onValueChange={setSem}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {user?.semester && <SelectItem value={String(user.semester)}>{getSemesterLabel(user.semester)}</SelectItem>}
            </SelectContent>
          </Select>
          <button
            onClick={() => { setNewSem(String(user?.semester || 1)); setSemDialog(true); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Update semester"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-1" /> Download
        </Button>
      </div>

      {/* Timetable */}
      <div className="bg-card rounded-xl border shadow-card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Class Schedule</h3>
            <p className="text-xs text-muted-foreground">{dept} · {getSemesterLabel(Number(sem))}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/student/timetable")}
          >
            View Full Schedule
          </Button>
        </div>
        {timetableQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading timetable...</p>
        ) : timetableQuery.isError ? (
          <p className="text-sm text-destructive">Failed to load timetable.</p>
        ) : (
          <TimetableGridView 
            data={timetableQuery.data || {}} 
            batches={batchesQuery.data || []}
            labCourses={labCoursesQuery.data || []}
          />
        )}
      </div>
    </AppLayout>
  );
}
