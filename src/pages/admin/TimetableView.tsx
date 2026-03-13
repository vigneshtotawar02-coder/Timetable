import { useState, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { DEPARTMENTS, SEMESTERS } from "@/lib/mockData";
import TimetableGridView from "@/components/ui/TimetableGridView";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw, Zap, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { generateDepartmentTimetable, fetchDepartmentTimetable } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TimetableGrid } from "@/types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createTimeSlotLabel } from "@/lib/utils";

export default function TimetableView() {
  const [dept, setDept] = useState("Computer Science");
  const [sem, setSem] = useState("1");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const timetableRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const timetableQuery = useQuery({
    queryKey: ["timetable", dept, sem],
    queryFn: async () => {
      const data = await fetchDepartmentTimetable(dept, Number(sem));
      console.log("Timetable data received:", data);
      console.log("Sample entry:", data[0]);
      
      // Transform API rows into TimetableGridView shape
      const grid: TimetableGrid = {};
      data.forEach((row: any) => {
        console.log("Processing row:", row);
        const day = row.time_slot_details?.day || row.day;
        const start = row.time_slot_details?.start_time;
        const end = row.time_slot_details?.end_time;
        console.log(`Day: ${day}, Start: ${start}, End: ${end}`);
        
        if (!day || !start || !end) {
          console.log("Skipping row - missing day/time info");
          return;
        }
        
        const slotLabel = createTimeSlotLabel(start, end);
        
        if (!grid[day]) grid[day] = {};
        grid[day][slotLabel] = {
          courseCode: row.course?.course_name || String(row.course_id),
          courseName: row.course?.course_name || "",
          facultyName: row.faculty?.name,
          room: row.room?.room_name,
          type: "lecture",
        };
      });
      console.log("Final grid:", grid);
      return grid;
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => generateDepartmentTimetable(dept, Number(sem)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["timetable", dept, sem] });
      toast({ title: "Timetable Generated!", description: `${dept} - Semester ${sem} schedule is ready.` });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Could not generate timetable. Please check constraints and data.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    await generateMutation.mutateAsync();
    setGenerating(false);
  };

  const handleDownloadPDF = async () => {
    if (!timetableRef.current) return;
    
    setDownloading(true);
    try {
      const element = timetableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Timetable_${dept}_Sem${sem}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({ title: "PDF Downloaded!", description: "Timetable has been saved successfully." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ 
        title: "Download Failed", 
        description: "Could not generate PDF. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppLayout requiredRole="admin" title="Timetable">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timetable View</h1>
          <p className="text-muted-foreground text-sm">View and generate class schedules</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadPDF}
            disabled={downloading || !timetableQuery.data || Object.keys(timetableQuery.data).length === 0}
          >
            {downloading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Downloading...</>
            ) : (
              <><Download className="h-4 w-4 mr-1" /> Export PDF</>
            )}
          </Button>
          <Button className="gradient-teal text-white shadow-teal" onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Zap className="h-4 w-4 mr-2" /> Re-Generate</>}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border shadow-card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Department:</label>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Semester:</label>
          <Select value={sem} onValueChange={setSem}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{SEMESTERS.map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          {[{ label: "Lecture", color: "bg-primary/10 text-primary border-primary/20" }, { label: "Lab", color: "bg-accent/10 text-accent border-accent/20" }, { label: "Seminar", color: "bg-warning/10 text-warning border-warning/20" }].map((l) => (
            <span key={l.label} className={`text-xs px-2 py-1 rounded border font-medium ${l.color}`}>{l.label}</span>
          ))}
        </div>
      </div>

      {/* Timetable */}
      {generating || timetableQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-full gradient-teal flex items-center justify-center mb-4 animate-pulse">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {generating ? "AI is generating your timetable..." : "Loading timetable..."}
          </p>
          <p className="text-sm mt-1">Optimizing for conflicts, faculty availability, and room capacity</p>
        </div>
      ) : timetableQuery.isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-semibold text-foreground">Failed to load timetable</p>
          <p className="text-sm mt-1">Please try again after verifying backend is running.</p>
        </div>
      ) : timetableQuery.data ? (
        <div className="animate-fade-in" ref={timetableRef}>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-primary/10 text-primary border-primary/20">{dept}</Badge>
            <Badge variant="outline">Semester {sem}</Badge>
          </div>
          <TimetableGridView data={timetableQuery.data} />
        </div>
      ) : null}
    </AppLayout>
  );
}
