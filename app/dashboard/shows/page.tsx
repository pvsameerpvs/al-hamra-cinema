"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoveLeft,
  Plus,
  Check,
  X,
  Pencil,
  Trash2,
  Loader2,
  PlaySquare,
  Film,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Show } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatTime12Hour } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DashboardTopbar } from "@/components/DashboardTopbar";

let cachedShows: Show[] | null = null;

export default function ManageShowsPage() {
  const router = useRouter();
  const [shows, setShows] = useState<Show[]>(cachedShows || []);
  const [loading, setLoading] = useState(!cachedShows);
  const [roleChecking, setRoleChecking] = useState(true);

  // Create / Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [movieTitle, setMovieTitle] = useState("");
  const [showTime, setShowTime] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { toast } = useToast();

  // ── Role guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "admin") {
          router.replace("/dashboard");
        } else {
          setRoleChecking(false);
        }
      })
      .catch(() => router.replace("/dashboard"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShows = async () => {
    if (!cachedShows) setLoading(true);
    try {
      const res = await fetch("/api/shows", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load shows");
      const data: Show[] = await res.json();
      cachedShows = data;
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
    if (!roleChecking) fetchShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleChecking]);

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

  const startAddTimeToMovie = (show: Show) => {
    setIsCreating(true);
    setEditingId(null);
    setMovieTitle(show.movieTitle);
    setShowTime("");
    setIsActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const performDeleteShow = async (id: string): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/shows/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete show");
      toast({ title: "Success", description: "Show deleted." });
      fetchShows();
      return true;
    } catch (err) {
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  // Show a blank loading screen while verifying role
  if (roleChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f8fc]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      <DashboardTopbar />
      <Sidebar />
      <div className="lg:pl-64 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-sm font-medium transition-colors w-fit shadow-sm mb-8"
        >
          <MoveLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shadow-sm">
              <PlaySquare className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Manage Shows</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Add screening times and associate them with movies.
              </p>
            </div>
          </div>

          {!isCreating && !editingId && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              New Show
            </button>
          )}
        </div>

        {/* Create / Edit Form */}
        {(isCreating || editingId) && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-5">
              {isCreating ? "✨ Create New Show" : "✏️ Edit Show"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-slate-400" />
                  Movie Title *
                </label>
                <datalist id="existingMovies">
                  {Array.from(new Set(shows.map(s => s.movieTitle))).map(title => (
                    <option key={title} value={title} />
                  ))}
                </datalist>
                <Input
                  list="existingMovies"
                  placeholder="e.g. Dune: Part Two"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50/50 hover:bg-white transition-colors h-11"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Show Time *
                </label>
                <Input
                  type="time"
                  value={(() => {
                    if (!showTime) return "";
                    const match = showTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (!match) return showTime;
                    const [, h, m, ampm] = match;
                    let hours = parseInt(h, 10);
                    if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
                    if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
                    return `${hours.toString().padStart(2, "0")}:${m}`;
                  })()}
                  onChange={(e) => {
                    const time24 = e.target.value;
                    if (!time24) { setShowTime(""); return; }
                    if (!time24.includes(":")) { setShowTime(time24); return; }
                    const [h, m] = time24.split(":");
                    let hours = parseInt(h, 10);
                    const ampm = hours >= 12 ? "PM" : "AM";
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    setShowTime(`${hours.toString().padStart(2, "0")}:${m} ${ampm}`);
                  }}
                  className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50/50 hover:bg-white transition-colors h-11"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl">
              <input
                type="checkbox"
                id="activeToggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-300"
              />
              <label htmlFor="activeToggle" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Active — Show appears in the public booking list
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateOrUpdate}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-colors disabled:opacity-60"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Check className="w-4 h-4" />
                Save
              </button>
              <Button variant="outline" onClick={resetForm} disabled={actionLoading} className="rounded-xl px-6 py-2.5 h-auto border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold shadow-sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Shows Table */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-sm">
              All Shows
              {!loading && (
                <span className="ml-2 text-xs text-slate-400 font-normal">({shows.length} total)</span>
              )}
            </h3>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" />
              <p className="text-slate-400 text-sm">Loading shows…</p>
            </div>
          ) : shows.length > 0 ? (
            <div className="p-6 space-y-6">
              {Object.entries(
                shows.reduce((acc, show) => {
                  const key = show.movieTitle;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(show);
                  return acc;
                }, {} as Record<string, Show[]>)
              ).map(([movieGroupTitle, movieShows]) => (
                <div key={movieGroupTitle} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Film className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{movieGroupTitle}</h4>
                        <span className="text-slate-500 text-xs font-medium">{movieShows.length} show{movieShows.length !== 1 && "s"} configured</span>
                      </div>
                    </div>
                    <button
                      onClick={() => startAddTimeToMovie(movieShows[0])}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4 text-emerald-500" />
                      Add New Time
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {/* Sort shows by time string simply */}
                    {movieShows.sort((a,b) => a.showTime.localeCompare(b.showTime)).map(show => (
                      <div key={show.id} className="px-5 py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold border border-slate-200">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {formatTime12Hour(show.showTime)}
                          </div>
                          {show.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <Check className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
                              <X className="w-3.5 h-3.5" /> Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(show)}
                            title="Edit this show"
                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all shadow-sm text-slate-500"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(show.id)}
                            title="Delete this show"
                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-all shadow-sm text-slate-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <PlaySquare className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-1">No shows yet</p>
              <p className="text-slate-400 text-sm mb-5">Create your first screening time to get started.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
              >
                <Plus className="w-4 h-4" />
                Create First Show
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title="Delete show?"
        description="Are you sure you want to delete this show? This cannot be undone."
        confirmText="Yes, delete"
        cancelText="No"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!deleteTargetId) return false;
          const ok = await performDeleteShow(deleteTargetId);
          return ok;
        }}
      />
    </div>
  );
}
