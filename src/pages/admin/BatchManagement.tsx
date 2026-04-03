import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBatches, createBatch, updateBatch, deleteBatch } from "@/lib/api";
import { DEPARTMENTS, SEMESTERS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Users, Plus, Pencil, Trash2, Check, X } from "lucide-react";

export default function BatchManagement() {
  const [dept, setDept] = useState("Computer Science");
  const [sem, setSem] = useState("1");
  const [newBatchName, setNewBatchName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const qKey = ["batches", dept, sem];

  const batchesQuery = useQuery({
    queryKey: qKey,
    queryFn: () => fetchBatches(dept, Number(sem)),
  });

  const createMutation = useMutation({
    mutationFn: () => createBatch({ name: newBatchName.trim(), department: dept, semester: Number(sem) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setNewBatchName("");
      toast({ title: "Batch created" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to create batch", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateBatch(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setEditingId(null);
      toast({ title: "Batch renamed" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to rename batch", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setDeleteId(null);
      toast({ title: "Batch deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete batch", variant: "destructive" });
    },
  });

  const nameError = (name: string) => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length > 20) return "Max 20 characters";
    return null;
  };

  const batches = batchesQuery.data || [];

  return (
    <AppLayout requiredRole="admin" title="Batch Management">
      {/* Header */}
      <div className="gradient-hero rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-white" />
          <div>
            <h1 className="text-2xl font-bold text-white">Batch Management</h1>
            <p className="text-white/80 text-sm mt-1">
              Define student batches for practical lab rotation scheduling
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Semester</label>
              <Select value={sem} onValueChange={setSem}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Batch */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Add Batch</CardTitle>
          <CardDescription>e.g. B1, B2, B3 — max 20 characters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Batch name (e.g. B1)"
                value={newBatchName}
                onChange={e => setNewBatchName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !nameError(newBatchName) && createMutation.mutate()}
                maxLength={20}
              />
              {newBatchName && nameError(newBatchName) && (
                <p className="text-xs text-destructive mt-1">{nameError(newBatchName)}</p>
              )}
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!!nameError(newBatchName) || createMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batch List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Batches — {dept}, Semester {sem}
            </CardTitle>
            <Badge variant="outline">{batches.length} batch{batches.length !== 1 ? "es" : ""}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {batchesQuery.isLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : batches.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No batches defined yet.</p>
              <p className="text-muted-foreground text-xs mt-1">Add batches above to enable practical lab rotation.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {batches.map((batch: any) => (
                <div key={batch.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                  {editingId === batch.id ? (
                    <>
                      <Input
                        className="flex-1 h-8 text-sm"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        maxLength={20}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter" && !nameError(editingName))
                            updateMutation.mutate({ id: batch.id, name: editingName });
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8 text-success"
                        disabled={!!nameError(editingName) || updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: batch.id, name: editingName })}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-semibold text-sm">{batch.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setEditingId(batch.id); setEditingName(batch.name); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(batch.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete batch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the batch and all its practical lab assignments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
