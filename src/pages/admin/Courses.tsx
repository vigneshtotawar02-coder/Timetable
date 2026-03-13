import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCourses, createCourse, updateCourse, deleteCourse, fetchFaculty } from "@/lib/api";
import { DEPARTMENTS } from "@/lib/mockData";

export default function Courses() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    department: "", 
    semester: "1", 
    facultyId: "", 
    hoursPerWeek: "3" 
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const apiCourses = await fetchCourses();
      return apiCourses.map((c: any) => ({
        id: String(c.id),
        code: c.course_name,
        name: c.course_name,
        department: c.department,
        semester: c.semester,
        credits: 3,
        facultyId: c.faculty_id || "",
        facultyName: c.faculty?.name || "",
        hoursPerWeek: c.weekly_hours || 3,
      }));
    },
  });

  const { data: faculty = [] } = useQuery({
    queryKey: ["faculty"],
    queryFn: fetchFaculty,
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course created successfully!" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create course", 
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course updated successfully!" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update course", 
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete course", 
        description: error.response?.data?.message || "Cannot delete course that is part of a timetable",
        variant: "destructive" 
      });
    },
  });

  const filtered = courses.filter((c: Course) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.department?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditCourse(null);
    setForm({ name: "", department: "", semester: "1", facultyId: "unassigned", hoursPerWeek: "3" });
    setDialogOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditCourse(c);
    setForm({ 
      name: c.name, 
      department: c.department, 
      semester: String(c.semester), 
      facultyId: c.facultyId || "unassigned", 
      hoursPerWeek: String(c.hoursPerWeek) 
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.department) {
      toast({ title: "Error", description: "Please fill required fields.", variant: "destructive" });
      return;
    }

    const payload = {
      course_name: form.name,
      department: form.department,
      semester: parseInt(form.semester),
      faculty_id: form.facultyId && form.facultyId !== "unassigned" ? form.facultyId : null,
      weekly_hours: parseInt(form.hoursPerWeek),
    };

    if (editCourse) {
      updateMutation.mutate({ id: editCourse.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AppLayout requiredRole="admin" title="Courses">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground text-sm">{courses.length} courses across all departments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gradient-teal text-white shadow-teal">
              <Plus className="h-4 w-4 mr-2" /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Course Name *</Label>
                <Input placeholder="Data Structures & Algorithms" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Department *</Label>
                  <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                    <SelectTrigger><SelectValue placeholder="Select dept." /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Semester *</Label>
                  <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map((s) => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Faculty</Label>
                  <Select value={form.facultyId} onValueChange={(v) => setForm({ ...form, facultyId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select faculty (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {faculty.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} ({f.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Hours/Week *</Label>
                  <Input type="number" min="1" max="10" value={form.hoursPerWeek} onChange={(e) => setForm({ ...form, hoursPerWeek: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button 
                  className="flex-1 gradient-teal text-white" 
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold text-muted-foreground">Name</th>
                <th className="text-left p-4 font-semibold text-muted-foreground hidden md:table-cell">Department</th>
                <th className="text-left p-4 font-semibold text-muted-foreground hidden sm:table-cell">Sem</th>
                <th className="text-left p-4 font-semibold text-muted-foreground hidden lg:table-cell">Faculty</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Hrs/Week</th>
                <th className="text-right p-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-12 text-muted-foreground"><BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No courses found</p></td></tr>
              ) : filtered.map((course: Course, i: number) => (
                <tr key={course.id} className={`border-b last:border-b-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="p-4 font-medium text-foreground">{course.name}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">
                    <Badge variant="secondary">{course.department}</Badge>
                  </td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">Sem {course.semester}</td>
                  <td className="p-4 text-muted-foreground hidden lg:table-cell">{course.facultyName || "—"}</td>
                  <td className="p-4"><span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded font-semibold">{course.hoursPerWeek} hrs</span></td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary" onClick={() => openEdit(course)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-destructive" onClick={() => handleDelete(course.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
