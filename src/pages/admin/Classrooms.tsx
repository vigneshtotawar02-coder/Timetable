import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Classroom } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Building2, Users, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRooms, createRoom, updateRoom, deleteRoom } from "@/lib/api";

export default function Classrooms() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", capacity: "60" });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
  });

  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({ title: "Room created successfully!" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create room", 
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateRoom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({ title: "Room updated successfully!" });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update room", 
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({ title: "Room deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete room", 
        description: error.response?.data?.message || "Cannot delete room that is in use",
        variant: "destructive" 
      });
    },
  });

  const filtered = (rooms || []).filter((r: any) =>
    r.room_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { 
    setEditItem(null); 
    setForm({ name: "", capacity: "60" }); 
    setDialogOpen(true); 
  };

  const openEdit = (r: any) => { 
    setEditItem(r); 
    setForm({ name: r.room_name, capacity: String(r.capacity) }); 
    setDialogOpen(true); 
  };

  const handleSave = () => {
    if (!form.name) { 
      toast({ title: "Error", description: "Room name is required.", variant: "destructive" }); 
      return; 
    }

    const payload = {
      room_name: form.name,
      capacity: parseInt(form.capacity),
    };

    if (editItem) {
      updateMutation.mutate({ id: String(editItem.id), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AppLayout requiredRole="admin" title="Classrooms">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classrooms</h1>
          <p className="text-muted-foreground text-sm">{(rooms || []).length} rooms available</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gradient-teal text-white shadow-teal"><Plus className="h-4 w-4 mr-2" /> Add Room</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? "Edit Classroom" : "Add Classroom"}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1"><Label>Room Name *</Label><Input placeholder="CS-101" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Capacity *</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
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

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((room: any) => (
            <div key={room.id} className="bg-card rounded-xl border shadow-card p-5 hover:shadow-elevated transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-muted rounded-xl"><Building2 className="h-5 w-5 text-muted-foreground" /></div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(room)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-destructive" onClick={() => handleDelete(String(room.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground">{room.room_name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
                <Users className="h-4 w-4" /> {room.capacity} seats
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
