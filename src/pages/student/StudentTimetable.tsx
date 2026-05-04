import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import TimetableGridView from "@/components/ui/TimetableGridView";
import { Download, Calendar, BookOpen, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchDepartmentTimetable, fetchBatches, fetchLabCourses } from "@/lib/api";
import { TimetableGrid } from "@/types";
import { toast } from "@/hooks/use-toast";
import { createTimeSlotLabel, getSemesterLabel } from "@/lib/utils";

export default function StudentTimetable() {
  const { user } = useAuth();
  const department = user?.department || "Computer Science";
  const semester = user?.semester || 3;
  const batchId = user?.batch_id;

  const timetableQuery = useQuery({
    queryKey: ["student-timetable", department, semester, batchId],
    queryFn: async () => {
      const raw = await fetchDepartmentTimetable(department, Number(semester));
      
      const grid: TimetableGrid = {};
      const courses = new Set<string>();
      const faculty = new Set<string>();
      const rooms = new Set<string>();
      
      raw.forEach((row: any) => {
        const day = row.time_slot_details?.day || row.day;
        const start = row.time_slot_details?.start_time;
        const end = row.time_slot_details?.end_time;
        
        if (!day || !start || !end) return;
        
        const slotLabel = createTimeSlotLabel(start, end);
        if (!grid[day]) grid[day] = {};
        
        const courseName = row.course?.course_name || String(row.course_id);
        const roomName = row.room?.room_name || "TBA";
        const isLab = !!(row.batchAssignments?.length) || /lab|practical|workshop/i.test(courseName) || /lab/i.test(roomName);

        // For lab slots with batch assignments, filter to this student's batch
        let batchName: string | undefined;
        let effectiveRoom = roomName;
        let effectiveCourseName = courseName;
        if (row.batchAssignments && row.batchAssignments.length > 0) {
          const myBatch = batchId
            ? row.batchAssignments.find((ba: any) => ba.batchId === batchId || ba.batch_id === batchId)
            : row.batchAssignments[0];
          if (myBatch) {
            batchName = myBatch.batchName;
            effectiveRoom = myBatch.room || roomName;
            effectiveCourseName = myBatch.courseName || courseName;
          } else {
            batchName = "Unassigned";
          }
        }

        grid[day][slotLabel] = {
          courseCode: effectiveCourseName,
          courseName: effectiveCourseName,
          facultyName: row.faculty?.name || "TBA",
          room: effectiveRoom,
          type: isLab ? "lab" : "lecture",
          batchName,
        };
        
        if (row.course?.course_name) courses.add(row.course.course_name);
        if (row.faculty?.name) faculty.add(row.faculty.name);
        if (effectiveRoom && effectiveRoom !== "TBA") rooms.add(effectiveRoom);
      });
      
      return {
        grid,
        stats: {
          totalClasses: raw.length,
          uniqueCourses: courses.size,
          uniqueFaculty: faculty.size,
          uniqueRooms: rooms.size,
        }
      };
    },
  });

  // Fetch batches for the student's dept/semester
  const batchesQuery = useQuery({
    queryKey: ["batches", department, semester],
    queryFn: () => fetchBatches(department, Number(semester)),
  });

  // Fetch lab courses for the student's dept/semester
  const labCoursesQuery = useQuery({
    queryKey: ["lab-courses", department, semester],
    queryFn: () => fetchLabCourses(department, Number(semester)),
  });

  const handleDownloadPDF = () => {
    toast({
      title: "Download Started",
      description: "Your timetable PDF is being prepared for download.",
    });
    // TODO: Implement actual PDF generation
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout requiredRole="student" title="My Timetable">
      {/* Header */}
      <div className="gradient-hero rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              My Class Schedule
            </h1>
            <p className="text-white/80 text-sm mt-2">
              {department} · {getSemesterLabel(Number(semester))} · Academic Year 2024-25
              {batchId && <Badge className="ml-2 bg-white/20 text-white border-white/30 text-xs">Batch assigned</Badge>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handlePrint} 
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Print
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              className="bg-white hover:bg-white/90 text-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {timetableQuery.data?.stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Classes
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timetableQuery.data.stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground mt-1">Per week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-teal" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timetableQuery.data.stats.uniqueCourses}</div>
              <p className="text-xs text-muted-foreground mt-1">Enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Faculty
                </CardTitle>
                <Users className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timetableQuery.data.stats.uniqueFaculty}</div>
              <p className="text-xs text-muted-foreground mt-1">Instructors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Classrooms
                </CardTitle>
                <MapPin className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timetableQuery.data.stats.uniqueRooms}</div>
              <p className="text-xs text-muted-foreground mt-1">Locations</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timetable */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Your complete class timetable for {department}, {getSemesterLabel(Number(semester))}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {timetableQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading your timetable...</p>
              </div>
            </div>
          ) : timetableQuery.isError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-destructive font-medium mb-2">Failed to load timetable</p>
                <p className="text-sm text-muted-foreground mb-4">
                  There was an error fetching your schedule. Please try again.
                </p>
                <Button onClick={() => timetableQuery.refetch()} variant="outline">
                  Retry
                </Button>
              </div>
            </div>
          ) : !timetableQuery.data?.grid || Object.keys(timetableQuery.data.grid).length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-medium text-muted-foreground mb-2">No Timetable Available</p>
                <p className="text-sm text-muted-foreground">
                  The timetable for {department}, {getSemesterLabel(Number(semester))} hasn't been generated yet.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please contact your administrator.
                </p>
              </div>
            </div>
          ) : (
            <TimetableGridView
              data={timetableQuery.data.grid}
              batches={batchesQuery.data || []}
              labCourses={labCoursesQuery.data || []}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/10 border border-primary/30"></div>
              <span className="text-muted-foreground">Lecture</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-accent/10 border border-accent/30"></div>
              <span className="text-muted-foreground">Lab</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning/10 border border-warning/30"></div>
              <span className="text-muted-foreground">Seminar</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
