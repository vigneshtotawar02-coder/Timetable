import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Faculty } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Users, Mail, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFaculty, updateUser, deleteUser } from "@/lib/api";

export default function FacultyManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", department: "" });

  const { data: faculty = [], isLoading } = useQuery({
    queryKey: ["faculty"],
    queryFn: fetchFaculty,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Faculty updated successfully!" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update faculty", 
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Faculty deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete faculty", 
        description: error.response?.data?.message || "Cannot delete faculty with assigned courses",
        variant: "destructive" 
      });
    },
  });

  const filtered = faculty.filter((f: any) =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.department?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (f: any) => {
    setEditItem(f);
    setForm({ name: f.name, email: f.email, department: f.department });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email || !form.department) {
      toast({ title: "Error", description: "Fill required fields.", variant: "destructive" });
      return;
    }
    
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this faculty member?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AppLayout requiredRole="admin" title="Faculty">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faculty</h1>
          <p className="text-muted-foreground text-sm">{faculty.length} faculty members registered</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Faculty Member</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1"><Label>Full Name *</Label><Input placeholder="Dr. John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email *</Label><Input type="email" placeholder="john@edu.ac.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Department *</Label><Input placeholder="Computer Science" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button 
                  className="flex-1 gradient-teal text-white" 
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
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

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search faculty..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No faculty found</p>
          </div>
        ) : filtered.map((f: any) => (
          <div key={f.id} className="bg-card rounded-xl border shadow-card p-5 hover:shadow-elevated transition-all animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl gradient-hero flex items-center justify-center text-white font-bold text-lg">
                {f.name?.charAt(0) || "?"}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary" onClick={() => openEdit(f)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-destructive" onClick={() => handleDelete(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <h3 className="font-semibold text-foreground">{f.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">Faculty</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Mail className="h-3 w-3" />{f.email}
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{f.department}</Badge>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
