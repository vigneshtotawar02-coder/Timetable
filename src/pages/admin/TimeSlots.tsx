import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Clock, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimeSlots() {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ day: "Monday", startTime: "09:00", endTime: "10:00" });

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["time-slots"],
    queryFn: fetchTimeSlots,
  });

  const createMutation = useMutation({
    mutationFn: createTimeSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-slots"] });
      toast({ title: "Time slot created successfully!" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create time slot", 
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateTimeSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-slots"] });
      toast({ title: "Time slot updated successfully!" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update time slot", 
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimeSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-slots"] });
      toast({ title: "Time slot deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete time slot", 
        description: error.response?.data?.message || "Cannot delete time slot that is in use",
        variant: "destructive" 
      });
    },
  });

  const openAdd = () => { 
    setEditItem(null); 
    setForm({ day: "Monday", startTime: "09:00", endTime: "10:00" }); 
    setDialogOpen(true); 
  };

  const openEdit = (s: any) => { 
    setEditItem(s); 
    setForm({ 
      day: s.day, 
      startTime: s.start_time.slice(0, 5), 
      endTime: s.end_time.slice(0, 5) 
    }); 
    setDialogOpen(true); 
  };

  const handleSave = () => {
    if (!form.startTime || !form.endTime) { 
      toast({ title: "Error", description: "Fill times.", variant: "destructive" }); 
      return; 
    }

    const payload = {
      day: form.day,
      start_time: form.startTime + ":00",
      end_time: form.endTime + ":00",
    };

    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this time slot?")) {
      deleteMutation.mutate(id);
    }
  };

  // Group slots by day
  const slotsByDay = (slots || []).reduce((acc: any, slot: any) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {});

  return (
    <AppLayout requiredRole="admin" title="Time Slots">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Slots</h1>
          <p className="text-muted-foreground text-sm">{(slots || []).length} time slots configured</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gradient-teal text-white shadow-teal"><Plus className="h-4 w-4 mr-2" /> Add Slot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? "Edit Time Slot" : "Add Time Slot"}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Day *</Label>
                <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Start Time *</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
                <div className="space-y-1"><Label>End Time *</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {DAYS.map((day) => (
            <div key={day}>
              <h2 className="text-lg font-semibold text-foreground mb-3">{day}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(slotsByDay[day] || []).map((slot: any) => (
                  <div key={slot.id} className="bg-card rounded-xl border shadow-card p-5 hover:shadow-elevated transition-all animate-fade-in">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center text-white">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(slot)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-destructive" onClick={() => handleDelete(slot.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </div>
                    <p className="text-xs text-muted-foreground">Duration: 60 min</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
