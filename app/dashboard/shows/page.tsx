"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoveLeft,
  Plus,
  Check,
  Pencil,
  Trash2,
  Loader2,
  PlaySquare,
  Film,
  Clock,
  CalendarDays,
  Archive,
  Shield,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { MovieRating, Show } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatTime12Hour } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DashboardTopbar } from "@/components/DashboardTopbar";

let cachedShows: Show[] | null = null;
const ratingOptions: MovieRating[] = ["PG 13", "PG 18"];
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

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
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [rating, setRating] = useState<MovieRating>("PG 13");
  const [isActive, setIsActive] = useState(true);
  const [viewFilter, setViewFilter] = useState<"running" | "archived" | "all">("running");

  const [actionLoading, setActionLoading] = useState(false);
  const [togglingShowId, setTogglingShowId] = useState<string | null>(null);
  const [bulkMovieActionId, setBulkMovieActionId] = useState<string | null>(null);
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
    const todayIso = new Date().toISOString().split("T")[0];
    setStartDate(todayIso);
    setEndDate(todayIso);
    setRating("PG 13");
    setIsActive(true);
  };

  const startEdit = (show: Show) => {
    setIsCreating(false);
    setEditingId(show.id);
    setMovieTitle(show.movieTitle);
    setShowTime(show.showTime);
    setStartDate(show.startDate);
    setEndDate(show.endDate);
    setRating(show.rating);
    setIsActive(show.isActive);
  };

  const startAddTimeToMovie = (show: Show) => {
    setIsCreating(true);
    setEditingId(null);
    setMovieTitle(show.movieTitle);
    setShowTime("");
    const todayIso = new Date().toISOString().split("T")[0];
    const baseStart = show.endDate < todayIso ? todayIso : show.startDate;
    const baseEnd = show.endDate < todayIso ? todayIso : show.endDate;
    setStartDate(baseStart);
    setEndDate(baseEnd);
    setRating(show.rating);
    setIsActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOrUpdate = async () => {
    const trimmedTitle = movieTitle.trim();
    const trimmedTime = showTime.trim();
    if (!trimmedTitle || !trimmedTime) {
      toast({ title: "Validation Error", description: "Movie title and show time are required.", variant: "destructive" });
      return;
    }
    if (!startDate || !isoDatePattern.test(startDate)) {
      toast({ title: "Validation Error", description: "Please select a valid start date.", variant: "destructive" });
      return;
    }
    if (!endDate || !isoDatePattern.test(endDate)) {
      toast({ title: "Validation Error", description: "Please select a valid end date.", variant: "destructive" });
      return;
    }
    if (endDate < startDate) {
      toast({ title: "Validation Error", description: "End date cannot be before the start date.", variant: "destructive" });
      return;
    }

    setActionLoading(true);
    try {
      const payload = { movieTitle: trimmedTitle, showTime: trimmedTime, isActive, startDate, endDate, rating };
      if (isCreating) {
        const res = await fetch("/api/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create show");
        toast({ title: "Success", description: "Show created successfully!" });
      } else if (editingId) {
        const res = await fetch(`/api/shows/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

  const todayIso = new Date().toISOString().split("T")[0];
  const isCurrentlyRunning = (show: Show) => show.isActive && show.startDate <= todayIso && show.endDate >= todayIso;
  const isArchivedShow = (show: Show) => !show.isActive || show.endDate < todayIso;
  const runningShows = shows.filter(isCurrentlyRunning);
  const archivedShows = shows.filter(isArchivedShow);
  const comingSoonShows = shows.filter(
    (show) => show.isActive && show.startDate > todayIso
  );
  const filteredShows = shows.filter((show) => {
    if (viewFilter === "running") return isCurrentlyRunning(show);
    if (viewFilter === "archived") return isArchivedShow(show);
    return true;
  });
  const statusCounts = {
    running: runningShows.length,
    archived: archivedShows.length,
    all: shows.length,
  };
  const archivedMovieSummary = Object.values(
    archivedShows.reduce((acc, show) => {
      const existing = acc[show.movieTitle];
      if (!existing || existing.endedOn < show.endDate) {
        acc[show.movieTitle] = { title: show.movieTitle, endedOn: show.endDate, rating: show.rating };
      }
      return acc;
    }, {} as Record<string, { title: string; endedOn: string; rating: MovieRating }>)
  ).sort((a, b) => b.endedOn.localeCompare(a.endedOn));
  const comingSoonMovies = Object.values(
    comingSoonShows.reduce((acc, show) => {
      const current = acc[show.movieTitle];
      if (!current) {
        acc[show.movieTitle] = {
          title: show.movieTitle,
          firstShow: show.startDate,
          rating: show.rating,
          count: 1,
        };
      } else {
        current.firstShow = current.firstShow < show.startDate ? current.firstShow : show.startDate;
        current.count += 1;
      }
      return acc;
    }, {} as Record<string, { title: string; firstShow: string; rating: MovieRating; count: number }>)
  ).sort((a, b) => a.firstShow.localeCompare(b.firstShow));
  const archivedShowDetails = archivedShows
    .slice()
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
  const filterLabelMap: Record<typeof viewFilter, string> = {
    running: "Running Today",
    archived: "Archived Shows",
    all: "All Shows",
  };
  const emptyCopy: Record<typeof viewFilter, string> = {
    running: "No movies are running today. Extend a title or adjust its dates.",
    archived: "No movies have ended yet.",
    all: "No shows configured yet. Create your first schedule above.",
  };
  const statusOptions: { value: "running" | "archived" | "all"; label: string; description: string; Icon: LucideIcon }[] = [
    { value: "running", label: "Running Today", description: "Active + bookable", Icon: PlaySquare },
    { value: "archived", label: "Archive", description: "Past runs", Icon: Archive },
    { value: "all", label: "All Shows", description: "Entire schedule", Icon: Film },
  ];
  const formatDateShort = (iso: string, includeYear = false) => {
    if (!isoDatePattern.test(iso)) return iso;
    try {
      return new Date(`${iso}T00:00:00`).toLocaleDateString(
        "en-US",
        includeYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" }
      );
    } catch {
      return iso;
    }
  };
  const formatDateRange = (start: string, end: string) => `${formatDateShort(start)} – ${formatDateShort(end)}`;

  const toggleShowArchive = async (show: Show) => {
    setTogglingShowId(show.id);
    try {
      const res = await fetch(`/api/shows/${show.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !show.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast({
        title: show.isActive ? "Show archived" : "Show restored",
        description: show.isActive
          ? "This show will no longer be available for booking."
          : "Show is active again for booking.",
      });
      await fetchShows();
    } catch (err) {
      toast({
        title: "Status change failed",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setTogglingShowId(null);
    }
  };

  const toggleMovieArchive = async (movieShows: Show[], shouldArchive: boolean) => {
    const movieTitle = movieShows[0]?.movieTitle || "";
    setBulkMovieActionId(movieTitle);
    try {
      await Promise.all(
        movieShows.map((show) =>
          fetch(`/api/shows/${show.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !shouldArchive }),
          })
        )
      );
      toast({
        title: shouldArchive ? "Movie archived" : "Movie restored",
        description: shouldArchive
          ? "All shows have been hidden from booking."
          : "All shows were restored. Adjust dates if needed.",
      });
      await fetchShows();
    } catch (err) {
      toast({
        title: "Movie update failed",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setBulkMovieActionId(null);
    }
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

        <div className="grid gap-6 lg:grid-cols-[260px,1fr] items-start">
          <aside className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">Status Filter</p>
                  <p className="text-base font-bold text-slate-800 mt-1">Today&rsquo;s schedule</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <CalendarDays className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                {statusOptions.map(({ value, label, description, Icon }) => {
                  const active = viewFilter === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setViewFilter(value)}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition-colors text-left ${
                        active
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">{label}</p>
                          <p className="text-xs text-slate-400">{description}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{statusCounts[value]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.3em]">Ended Movies</p>
                  <p className="text-base font-bold text-slate-800 mt-1">Auto-archive</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Archive className="w-4 h-4" />
                </div>
              </div>
              {archivedMovieSummary.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {archivedMovieSummary.map((movie) => (
                    <div key={`${movie.title}-${movie.endedOn}`} className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{movie.title}</p>
                        <p className="text-xs text-slate-400">Ended {formatDateShort(movie.endedOn, true)}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border border-slate-200 bg-white text-slate-600">
                        <Shield className="w-3 h-3 text-slate-400" />
                        {movie.rating}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No movies have ended yet.</p>
              )}
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.3em]">Coming Soon</p>
                  <p className="text-base font-bold text-slate-800 mt-1">Future movies</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              {comingSoonMovies.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {comingSoonMovies.map((movie) => (
                    <div key={`${movie.title}-${movie.firstShow}`} className="p-3 rounded-xl border border-amber-100 bg-amber-50/40">
                      <p className="text-sm font-semibold text-slate-700">{movie.title}</p>
                      <p className="text-xs text-slate-500">Starts {formatDateShort(movie.firstShow, true)} • {movie.count} show{movie.count !== 1 && "s"}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 rounded-full text-[11px] font-semibold border border-slate-200 bg-white text-slate-600">
                        <Shield className="w-3 h-3 text-slate-400" />
                        {movie.rating}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No upcoming movies scheduled.</p>
              )}
            </div>
          </aside>

          <div className="space-y-6">
            {(isCreating || editingId) && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50/50 hover:bg-white transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      End Date *
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50/50 hover:bg-white transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      Rating *
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(e.target.value as MovieRating)}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:border-indigo-500 focus:ring-indigo-200 text-sm font-medium text-slate-700"
                    >
                      {ratingOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
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

            {viewFilter === "archived" && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.4em]">Movie Archive</p>
                      <p className="text-base font-bold text-slate-800 mt-1">Titles removed from booking</p>
                    </div>
                    <Archive className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {archivedMovieSummary.length > 0 ? (
                      archivedMovieSummary.map((movie) => (
                        <div key={`main-archived-${movie.title}-${movie.endedOn}`} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                          <p className="font-semibold text-slate-700 text-sm">{movie.title}</p>
                          <p className="text-xs text-slate-500">Ended {formatDateShort(movie.endedOn, true)}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 rounded-full text-[11px] font-semibold border border-slate-200 bg-white text-slate-600">
                            <Shield className="w-3 h-3 text-slate-400" />
                            {movie.rating}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No titles in archive.</p>
                    )}
                  </div>
                </div>
                <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.4em]">Show Archive</p>
                      <p className="text-base font-bold text-slate-800 mt-1">Past screening slots</p>
                    </div>
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {archivedShowDetails.length > 0 ? (
                      archivedShowDetails.map((show) => (
                        <div key={`archived-show-${show.id}`} className="p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                          <p className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                            {formatTime12Hour(show.showTime)}
                            <span className="text-[11px] uppercase tracking-wide text-slate-400">{show.movieTitle}</span>
                          </p>
                          <p className="text-xs text-slate-400">Ran until {formatDateShort(show.endDate, true)}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 rounded-full text-[11px] font-semibold border border-slate-200 bg-white text-slate-600">
                            <Shield className="w-3 h-3 text-slate-400" />
                            {show.rating}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No archived showtimes yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">{filterLabelMap[viewFilter]}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Reference date: <strong className="text-slate-600">{formatDateShort(todayIso, true)}</strong>
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                  <Film className="w-4 h-4" />
                  {filteredShows.length} show{filteredShows.length !== 1 && "s"}
                </span>
              </div>

              {loading ? (
                <div className="p-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" />
                  <p className="text-slate-400 text-sm">Loading shows…</p>
                </div>
              ) : filteredShows.length > 0 ? (
                <div className="p-6 space-y-6">
                  {Object.entries(
                    filteredShows.reduce((acc, show) => {
                      const key = show.movieTitle;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(show);
                      return acc;
                    }, {} as Record<string, Show[]>)
                  ).map(([movieGroupTitle, movieShows]) => {
                    const anchorShow = movieShows[0];
                    const groupArchived = movieShows.every(isArchivedShow);
                    const movieAnyActive = movieShows.some((show) => show.isActive);
                    const bulkActionLoading = bulkMovieActionId === movieGroupTitle;
                    return (
                      <div key={movieGroupTitle} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <Film className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-lg leading-tight">{movieGroupTitle}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  {formatDateRange(anchorShow.startDate, anchorShow.endDate)}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-white text-[10px] font-semibold uppercase tracking-wide">
                                  <Shield className="w-3 h-3 text-slate-400" />
                                  {anchorShow.rating}
                                </span>
                                {groupArchived && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-200/70 text-slate-600 border border-slate-300">
                                    Archived
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                              <button
                                onClick={() => startAddTimeToMovie(movieShows[0])}
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-all"
                              >
                                <Plus className="w-4 h-4 text-emerald-500" />
                                {groupArchived ? "Revive & Add Time" : "Add New Time"}
                              </button>
                              <button
                                onClick={() => toggleMovieArchive(movieShows, movieAnyActive)}
                                disabled={bulkActionLoading}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                                  movieAnyActive
                                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                } ${bulkActionLoading ? "opacity-60" : ""}`}
                                title={movieAnyActive ? "Archive entire movie" : "Restore entire movie"}
                              >
                                {bulkActionLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : movieAnyActive ? (
                                  <Archive className="w-4 h-4" />
                                ) : (
                                  <Undo2 className="w-4 h-4" />
                                )}
                                {movieAnyActive ? "Archive Movie" : "Restore Movie"}
                              </button>
                            </div>
                            {groupArchived && (
                              <p className="text-[11px] text-slate-400 text-right">
                                Last run ended—new times default to today.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {movieShows.sort((a,b) => a.showTime.localeCompare(b.showTime)).map(show => {
                            const timedOut = show.endDate < todayIso;
                            const manualArchived = !show.isActive;
                            const archived = timedOut || manualArchived;
                            const upcoming = show.startDate > todayIso;
                            const running = isCurrentlyRunning(show);
                            let statusMeta = { label: "Scheduled", classes: "bg-indigo-50 text-indigo-600 border-indigo-100" };
                            if (manualArchived) statusMeta = { label: "Manual Archive", classes: "bg-slate-200 text-slate-600 border-slate-300" };
                            else if (timedOut) statusMeta = { label: "Auto Archive", classes: "bg-slate-100 text-slate-500 border-slate-200" };
                            else if (running) statusMeta = { label: "Running", classes: "bg-emerald-50 text-emerald-600 border-emerald-100" };
                            else if (upcoming) statusMeta = { label: "Upcoming", classes: "bg-amber-50 text-amber-600 border-amber-100" };
                            const rowMuted = archived;
                            return (
                              <div key={show.id} className={`px-5 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${rowMuted ? "opacity-75" : ""} hover:bg-slate-50/50 transition-colors`}>
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold border border-slate-200">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    {formatTime12Hour(show.showTime)}
                                  </div>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border border-slate-200 bg-white text-slate-600">
                                    <Shield className="w-3 h-3 text-slate-400" />
                                    {show.rating}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusMeta.classes}`}>
                                    {statusMeta.label}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  {formatDateRange(show.startDate, show.endDate)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleShowArchive(show)}
                                    disabled={togglingShowId === show.id}
                                    title={show.isActive ? "Archive show" : "Restore show"}
                                    className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm text-slate-500 disabled:opacity-60"
                                  >
                                    {togglingShowId === show.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : show.isActive ? (
                                      <Archive className="w-4 h-4" />
                                    ) : (
                                      <Undo2 className="w-4 h-4" />
                                    )}
                                  </button>
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
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <PlaySquare className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium mb-1">Nothing to show</p>
                  <p className="text-slate-400 text-sm mb-5">{emptyCopy[viewFilter]}</p>
                  {viewFilter !== "running" && (
                    <button
                      onClick={() => setViewFilter("running")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                    >
                      <MoveLeft className="w-4 h-4" />
                      Back to Running
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
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
