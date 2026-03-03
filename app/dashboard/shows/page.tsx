"use client";

import { useEffect, useState } from "react";
import { MoveLeft, Plus, Check, X, Pencil, Trash2, Loader2, PlaySquare } from "lucide-react";
import Link from "next/link";
import { Show } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ManageShowsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [movieTitle, setMovieTitle] = useState("");
  const [showTime, setShowTime] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchShows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shows", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load shows");
      const data: Show[] = await res.json();
      setShows(data);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setIsCreating(false);
    setMovieTitle("");
    setShowTime("");
    setIsActive(true);
  };

  const startEdit = (show: Show) => {
    setIsCreating(false);
    setEditingId(show.id);
    setMovieTitle(show.movieTitle);
    setShowTime(show.showTime);
    setIsActive(show.isActive);
  };

  const handleCreateOrUpdate = async () => {
    if (!movieTitle.trim() || !showTime.trim()) {
      toast({ title: "Validation Error", description: "Movie title and show time are required.", variant: "destructive" });
      return;
    }

    setActionLoading(true);
    try {
      if (isCreating) {
        const res = await fetch("/api/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieTitle, showTime, isActive }),
        });
        if (!res.ok) throw new Error("Failed to create show");
        toast({ title: "Success", description: "Show created successfully!" });
      } else if (editingId) {
        const res = await fetch(`/api/shows/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieTitle, showTime, isActive }),
        });
        if (!res.ok) throw new Error("Failed to update show");
        toast({ title: "Success", description: "Show updated successfully!" });
      }
      resetForm();
      fetchShows();
    } catch (err) {
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this show?")) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/shows/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete show");
      toast({ title: "Success", description: "Show deleted." });
      fetchShows();
    } catch (err) {
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <MoveLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <PlaySquare className="w-8 h-8 text-primary" />
              Manage Shows
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Add new screening times and associate them with movies for the day.
            </p>
          </div>
          
          {!isCreating && !editingId && (
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Show
            </Button>
          )}
        </div>

        {(isCreating || editingId) && (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-8 shadow-sm">
            <h3 className="text-xl font-bold mb-4">{isCreating ? "Create New Show" : "Edit Show"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Movie Title *</label>
                <Input placeholder="e.g. Dune: Part Two" value={movieTitle} onChange={(e) => setMovieTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Show Time *</label>
                <Input 
                  type="time" 
                  value={(() => {
                    if (!showTime) return "";
                    const match = showTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (!match) return showTime;
                    let [, h, m, ampm] = match;
                    let hours = parseInt(h, 10);
                    if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
                    if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
                    return `${hours.toString().padStart(2, '0')}:${m}`;
                  })()} 
                  onChange={(e) => {
                    const time24 = e.target.value;
                    if (!time24) {
                      setShowTime("");
                      return;
                    }
                    if (!time24.includes(":")) {
                      setShowTime(time24);
                      return;
                    }
                    const [h, m] = time24.split(":");
                    let hours = parseInt(h, 10);
                    const ampm = hours >= 12 ? "PM" : "AM";
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    setShowTime(`${hours.toString().padStart(2, '0')}:${m} ${ampm}`);
                  }} 
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="activeToggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="activeToggle" className="text-sm font-medium cursor-pointer select-none">
                Active (Shows up in booking list)
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleCreateOrUpdate} disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Details
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={actionLoading}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading shows...</p>
            </div>
          ) : shows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Movie Title</th>
                    <th className="px-6 py-4 font-medium">Show Time</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shows.map((show) => (
                    <tr key={show.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{show.movieTitle}</td>
                      <td className="px-6 py-4">{show.showTime}</td>
                      <td className="px-6 py-4 text-center">
                        {show.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                            <X className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(show)} className="h-8 px-2">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(show.id)} className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No shows have been added yet.</p>
              <Button onClick={() => setIsCreating(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Create First Show
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
