import AppLayout from "@/components/layout/AppLayout";
import TimetableGridView from "@/components/ui/TimetableGridView";
import { Button } from "@/components/ui/button";
import { Download, Calendar, BookOpen, Clock, MapPin, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchFacultyTimetable } from "@/lib/api";
import { TimetableGrid } from "@/types";
import { createTimeSlotLabel } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FacultyTimetable() {
  const { user } = useAuth();

  const timetableQuery = useQuery({
    queryKey: ["faculty-timetable", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      console.log("=== FACULTY TIMETABLE DEBUG ===");
      console.log("Faculty User ID:", user?.id);
      console.log("Faculty Name:", user?.name);
      console.log("Faculty Email:", user?.email);
      console.log("Faculty Department:", user?.department);
      console.log("API URL:", `/api/timetable/faculty/${user?.id}`);
      
      try {
        const raw = await fetchFacultyTimetable(user!.id);
        
        console.log("API Response - Raw data:", raw);
        console.log("Number of entries:", raw.length);
        
        if (raw.length === 0) {
          console.error("❌ NO DATA RETURNED");
          console.log("Please check:");
          console.log("1. Does this faculty_id exist in timetable table?");
          console.log("   SELECT * FROM timetable WHERE faculty_id =", user?.id);
          console.log("2. Does this faculty have courses assigned?");
          console.log("   SELECT * FROM courses WHERE faculty_id =", user?.id);
          console.log("3. Check backend logs for errors");
        } else {
          console.log("✅ Data received:", raw.length, "entries");
          console.log("Sample entry:", raw[0]);
        }
        
        // Transform data and collect statistics
        const grid: TimetableGrid = {};
        const courses = new Set<string>();
        const rooms = new Set<string>();
        const timeSlots = new Set<string>();
        
        raw.forEach((row: any, index: number) => {
          console.log(`Processing entry ${index + 1}:`, row);
          
          // Handle both nested and flat structures
          const day = row.time_slots?.day || row.time_slot_details?.day || row.day;
          const start = row.time_slots?.start_time || row.time_slot_details?.start_time;
          const end = row.time_slots?.end_time || row.time_slot_details?.end_time;
          
          console.log(`  Day: ${day}, Start: ${start}, End: ${end}`);
          
          if (!day || !start || !end) {
            console.warn(`  ⚠️ Skipping entry ${index + 1} - missing day/time info`);
            return;
          }
          
          const slotLabel = createTimeSlotLabel(start, end);
          console.log(`  Slot label: ${slotLabel}`);
          
          if (!grid[day]) grid[day] = {};
          
          const courseName = row.courses?.course_name || row.course?.course_name || String(row.course_id);
          const roomName = row.rooms?.room_name || row.room?.room_name || "TBA";
          
          console.log(`  Course: ${courseName}, Room: ${roomName}`);
          
          grid[day][slotLabel] = {
            courseCode: courseName,
            courseName: courseName,
            facultyName: user?.name || "",
            room: roomName,
            type: "lecture",
          };
          
          // Collect stats
          if (courseName) courses.add(courseName);
          if (roomName && roomName !== "TBA") rooms.add(roomName);
          timeSlots.add(slotLabel);
        });
        
        console.log("=== TRANSFORMATION COMPLETE ===");
        console.log("Final grid:", grid);
        console.log("Grid days:", Object.keys(grid));
        console.log("Stats:", { 
          totalClasses: raw.length,
          courses: courses.size, 
          rooms: rooms.size, 
          timeSlots: timeSlots.size 
        });
        
        return {
          grid,
          stats: {
            totalClasses: raw.length,
            uniqueCourses: courses.size,
            uniqueRooms: rooms.size,
            uniqueTimeSlots: timeSlots.size,
          },
          rawData: raw,
        };
      } catch (error) {
        console.error("❌ ERROR fetching faculty timetable:", error);
        throw error;
      }
    },
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
    <AppLayout requiredRole="faculty" title="My Timetable">
      {/* Header */}
      <div className="gradient-hero rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              My Teaching Schedule
            </h1>
            <p className="text-white/80 text-sm mt-2">
              {user?.department} · Academic Year 2024-25
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
              <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Time Slots
                </CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timetableQuery.data.stats.uniqueTimeSlots}</div>
              <p className="text-xs text-muted-foreground mt-1">Different times</p>
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

      {/* Info Banner */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Allocated Classes</h3>
              <p className="text-sm text-muted-foreground">
                This timetable shows only the courses and time slots allocated to you. 
                It displays when and where you need to teach your assigned courses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Teaching Schedule</CardTitle>
              <CardDescription>
                Your allocated courses and time slots
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/5">
              {user?.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {timetableQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading your schedule...</p>
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
                <p className="font-medium text-muted-foreground mb-2">No Classes Allocated</p>
                <p className="text-sm text-muted-foreground">
                  You don't have any classes allocated yet.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please contact your administrator.
                </p>
              </div>
            </div>
          ) : (
            <TimetableGridView data={timetableQuery.data.grid} />
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
