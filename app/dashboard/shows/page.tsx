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

import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatTime12Hour } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

let cachedShows: Show[] | null = null;
const ratingOptions: MovieRating[] = ["PG", "PG 13", "PG 15", "PG 18", "G"];
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export default function ManageShowsPage() {
  const router = useRouter();
  const [shows, setShows] = useState<Show[]>(cachedShows || []);
  const [loading, setLoading] = useState(!cachedShows);
  const [roleChecking, setRoleChecking] = useState(true);

  // Create / Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [addTimeModalOpen, setAddTimeModalOpen] = useState(false);
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
  const [deletingMovieTitle, setDeletingMovieTitle] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteMovieTarget, setDeleteMovieTarget] = useState<{ title: string; ids: string[] } | null>(null);
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

  const upsertShowLocally = (nextShow: Show) => {
    setShows((currentShows) => {
      const existingIndex = currentShows.findIndex((show) => show.id === nextShow.id);
      const nextShows =
        existingIndex === -1
          ? [...currentShows, nextShow]
          : currentShows.map((show) => (show.id === nextShow.id ? nextShow : show));
      cachedShows = nextShows;
      return nextShows;
    });
  };

  useEffect(() => {
    if (!roleChecking) fetchShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleChecking]);

  const resetForm = () => {
    setEditingId(null);
    setIsCreating(false);
    setAddTimeModalOpen(false);
    setMovieTitle("");
    setShowTime("");
    const todayIso = new Date().toISOString().split("T")[0];
    setStartDate(todayIso);
    setEndDate(todayIso);
    setRating("PG 13");
    setIsActive(true);
  };

  const startEdit = (show: Show) => {
    setAddTimeModalOpen(false);
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
    setAddTimeModalOpen(true);
    setIsCreating(false);
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
  };

  const startCreateShow = () => {
    resetForm();
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getShowTimeInputValue = () => {
    if (!showTime) return "";
    const match = showTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return showTime;
    const [, h, m, ampm] = match;
    let hours = parseInt(h, 10);
    if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${m}`;
  };

  const handleShowTimeInputChange = (value: string) => {
    if (!value) {
      setShowTime("");
      return;
    }
    if (!value.includes(":")) {
      setShowTime(value);
      return;
    }
    const [h, m] = value.split(":");
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    setShowTime(`${hours.toString().padStart(2, "0")}:${m} ${ampm}`);
  };

  const handleCreateOrUpdate = async () => {
    const trimmedTitle = movieTitle.trim();
    const trimmedTime = showTime.trim();
    const trimmedRating = rating.trim().replace(/\s+/g, " ").toUpperCase();
    if (!trimmedTitle || !trimmedTime) {
      toast({ title: "Validation Error", description: "Movie title and show time are required.", variant: "destructive" });
      return;
    }
    if (!trimmedRating) {
      toast({ title: "Validation Error", description: "Movie rating is required.", variant: "destructive" });
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
      const payload = { movieTitle: trimmedTitle, showTime: trimmedTime, isActive, startDate, endDate, rating: trimmedRating };
      if (isCreating || addTimeModalOpen) {
        const res = await fetch("/api/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create show");
        const data = await res.json();
        if (data?.show) {
          const createdShow = data.show as Show;
          upsertShowLocally(createdShow);
          setViewFilter(getBestFilterForShow(createdShow));
        }
        toast({ title: "Success", description: addTimeModalOpen ? "Show time added successfully!" : "Show created successfully!" });
      } else if (editingId) {
        const currentShow = shows.find((show) => show.id === editingId);
        const res = await fetch(`/api/shows/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update show");
        if (currentShow) {
          const updatedShow: Show = { ...currentShow, ...payload, id: editingId };
          upsertShowLocally(updatedShow);
          setViewFilter(getBestFilterForShow(updatedShow));
        }
        toast({ title: "Success", description: "Show updated successfully!" });
      }
      resetForm();
      await fetchShows();
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
      setShows((currentShows) => {
        const nextShows = currentShows.filter((show) => show.id !== id);
        cachedShows = nextShows;
        return nextShows;
      });
      toast({ title: "Success", description: "Show deleted." });
      await fetchShows();
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

  const handleDeleteMovie = (movieTitle: string, ids: string[]) => {
    setDeleteMovieTarget({ title: movieTitle, ids });
  };

  const todayIso = new Date().toISOString().split("T")[0];
  const getBestFilterForShow = (show: Pick<Show, "isActive" | "startDate" | "endDate">): "running" | "archived" | "all" => {
    if (!show.isActive || show.endDate < todayIso) return "archived";
    if (show.startDate <= todayIso && show.endDate >= todayIso) return "running";
    return "all";
  };
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
  const movieDisplayOrder = new Map<string, number>();
  filteredShows.forEach((show, index) => {
    movieDisplayOrder.set(show.movieTitle, index);
  });
  const groupedFilteredShows = Object.entries(
    filteredShows.reduce((acc, show) => {
      const key = show.movieTitle;
      if (!acc[key]) acc[key] = [];
      acc[key].push(show);
      return acc;
    }, {} as Record<string, Show[]>)
  ).sort(([movieA], [movieB]) => (movieDisplayOrder.get(movieB) ?? 0) - (movieDisplayOrder.get(movieA) ?? 0));
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

  const performDeleteMovie = async (movieTitle: string, ids: string[]): Promise<boolean> => {
    setDeletingMovieTitle(movieTitle);
    try {
      const responses = await Promise.all(
        ids.map((id) => fetch(`/api/shows/${id}`, { method: "DELETE" }))
      );
      if (responses.some((res) => !res.ok)) throw new Error("Failed to delete one or more shows");

      setShows((currentShows) => {
        const idSet = new Set(ids);
        const nextShows = currentShows.filter((show) => !idSet.has(show.id));
        cachedShows = nextShows;
        return nextShows;
      });

      toast({
        title: "Movie deleted",
        description: `${movieTitle} and all its showtimes were removed.`,
      });
      await fetchShows();
      return true;
    } catch (err) {
      toast({
        title: "Movie delete failed",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
      return false;
    } finally {
      setDeletingMovieTitle(null);
    }
  };

  // Show a blank loading screen while verifying role
  if (roleChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 relative via-[#f8fafc] to-indigo-50/30">
        <div className="theme-loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 relative via-[#f8fafc] to-indigo-50/30 font-sans selection:bg-indigo-100">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-50/60 to-transparent pointer-events-none" />
      <DashboardTopbar />
      <Sidebar />
      <div className="lg:pl-64 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200/80 text-slate-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md rounded-2xl text-sm font-semibold transition-all w-fit shadow-sm mb-10"
        >
          <MoveLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50 transform rotate-3 hover:rotate-0 transition-transform duration-300 ring-4 ring-white">
              <PlaySquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-950 to-indigo-700 tracking-tight">Manage Shows</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Curate screening slots and associate them with your latest blockbusters.
              </p>
            </div>
          </div>

          {!isCreating && !editingId && !addTimeModalOpen && (
            <button
              onClick={startCreateShow}
              className="group flex gap-2 items-center px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold shadow-xl shadow-indigo-200/80 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
              Start New Show
            </button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px,1fr] xl:grid-cols-[300px,1fr] items-start">
          <aside className="space-y-8">
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 ring-1 ring-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Status Filter</p>
                  <p className="text-lg font-extrabold text-slate-800 mt-0.5">Schedule</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50/80 flex items-center justify-center text-indigo-500 shadow-inner">
                  <CalendarDays className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2.5">
                {statusOptions.map(({ value, label, description, Icon }) => {
                  const active = viewFilter === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setViewFilter(value)}
                      className={`group w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-300 text-left relative overflow-hidden ${
                        active
                          ? "border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-transparent shadow-sm"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50/80"
                      }`}
                    >
                      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white border border-slate-200 text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-200"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`text-sm font-bold leading-tight ${active ? "text-indigo-900" : "text-slate-700 group-hover:text-slate-900"}`}>{label}</p>
                          <p className="text-xs font-medium text-slate-400 mt-0.5">{description}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${active ? "bg-white text-indigo-600 shadow-sm" : "bg-slate-100 text-slate-500"}`}>{statusCounts[value]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {viewFilter === "archived" && (
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
            )}
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
              <div className="bg-white/95 backdrop-blur-xl border border-white/60 ring-1 ring-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transform transition-all duration-500 animate-in slide-in-from-top-4 fade-in">
                <h3 className="text-xl font-extrabold text-slate-800 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600">
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
                      className="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50 hover:bg-white transition-all duration-300 h-12 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Show Time *
                    </label>
                    <Input
                      type="time"
                      value={getShowTimeInputValue()}
                      onChange={(e) => handleShowTimeInputChange(e.target.value)}
                      className="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50 hover:bg-white transition-all duration-300 h-12 shadow-sm"
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
                      className="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50 hover:bg-white transition-all duration-300 h-12 shadow-sm"
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
                      className="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50 hover:bg-white transition-all duration-300 h-12 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      Rating *
                    </label>
                    <datalist id="ratingOptions">
                      {ratingOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                    <Input
                      list="ratingOptions"
                      placeholder="e.g. PG, PG 13, PG 15"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50 hover:bg-white transition-all duration-300 h-12 shadow-sm font-semibold"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-8 p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm">
                  <input
                    type="checkbox"
                    id="activeToggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm transition-colors"
                  />
                  <label htmlFor="activeToggle" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                    Active <span className="text-slate-400 font-medium ml-1.5">— Show appears in the public booking list</span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleCreateOrUpdate}
                    disabled={actionLoading}
                    className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-200/50 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    <Check className="w-5 h-5" />
                    Save Show
                  </button>
                  <button onClick={resetForm} disabled={actionLoading} className="rounded-2xl px-6 py-3.5 h-auto border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold shadow-sm transition-all text-sm">
                    Cancel
                  </button>
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

            <div className="bg-white/95 backdrop-blur-2xl border border-white/80 ring-1 ring-slate-100 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-widest">{filterLabelMap[viewFilter]}</h3>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Reference date: <strong className="text-indigo-600">{formatDateShort(todayIso, true)}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
                    <Film className="w-3.5 h-3.5 text-indigo-500" />
                    {filteredShows.length} show{filteredShows.length !== 1 && "s"}
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="theme-loader mb-8" />
                  <p className="text-slate-500 font-bold tracking-tight">Loading shows...</p>
                </div>
              ) : filteredShows.length > 0 ? (
                <div className="p-6 space-y-6">
                  {groupedFilteredShows.map(([movieGroupTitle, movieShows]) => {
                    const anchorShow = movieShows[0];
                    const groupArchived = movieShows.every(isArchivedShow);
                    const movieAnyActive = movieShows.some((show) => show.isActive);
                    const bulkActionLoading = bulkMovieActionId === movieGroupTitle;
                    const bulkDeleteLoading = deletingMovieTitle === movieGroupTitle;
                    return (
                      <div key={movieGroupTitle} className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white group">
                        <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 px-5 lg:px-6 py-5 flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100/50 shadow-inner">
                              <Film className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-xl leading-tight tracking-tight">{movieGroupTitle}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 mt-1.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                  {formatDateRange(anchorShow.startDate, anchorShow.endDate)}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white shadow-sm text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                  <Shield className="w-3 h-3 text-emerald-500" />
                                  {anchorShow.rating}
                                </span>
                                {groupArchived && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 shadow-sm">
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
                                disabled={bulkActionLoading || bulkDeleteLoading}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                                  movieAnyActive
                                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                } ${bulkActionLoading || bulkDeleteLoading ? "opacity-60" : ""}`}
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
                              <button
                                onClick={() => handleDeleteMovie(movieGroupTitle, movieShows.map((show) => show.id))}
                                disabled={bulkActionLoading || bulkDeleteLoading}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all ${
                                  bulkActionLoading || bulkDeleteLoading ? "opacity-60" : ""
                                }`}
                                title="Delete entire movie"
                              >
                                {bulkDeleteLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                Delete Movie
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
                              <div key={show.id} className={`px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${rowMuted ? "opacity-75" : ""} hover:bg-slate-50/70 transition-colors`}>
                                <div className="flex flex-wrap items-center gap-3.5">
                                  <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl text-slate-700 font-extrabold border border-slate-200 shadow-sm">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    {formatTime12Hour(show.showTime)}
                                  </div>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 shadow-sm cursor-default">
                                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                                    {show.rating}
                                  </span>
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm ${statusMeta.classes}`}>
                                    {statusMeta.label}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-100">
                                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
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
                <div className="p-20 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100">
                    <PlaySquare className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-700 font-extrabold text-xl mb-2 tracking-tight">Empty Schedule</p>
                  <p className="text-slate-400 text-sm mb-8 max-w-sm">{emptyCopy[viewFilter]}</p>
                  {viewFilter !== "running" && (
                    <button
                      onClick={() => setViewFilter("running")}
                      className="group inline-flex items-center gap-2.5 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 hover:text-slate-900 transition-all"
                    >
                      <MoveLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform duration-300" />
                      View Running Shows
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={addTimeModalOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl rounded-3xl border border-white/60 bg-white/95 p-0 shadow-[0_12px_40px_rgb(0,0,0,0.12)] backdrop-blur-xl">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-600">
                Add New Show Time
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Create another showtime for <span className="font-semibold text-slate-700">{movieTitle || "this movie"}</span> without changing the current new-show flow.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-slate-400" />
                  Movie Title
                </label>
                <Input
                  value={movieTitle}
                  disabled
                  className="rounded-2xl border-slate-200 bg-slate-100 text-slate-500 h-12 shadow-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Show Time *
                </label>
                <Input
                  type="time"
                  value={getShowTimeInputValue()}
                  onChange={(e) => handleShowTimeInputChange(e.target.value)}
                  className="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50 hover:bg-white transition-all duration-300 h-12 shadow-sm"
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
                  className="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50 hover:bg-white transition-all duration-300 h-12 shadow-sm"
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
                  className="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50 hover:bg-white transition-all duration-300 h-12 shadow-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Rating *
                </label>
                <datalist id="ratingOptionsModal">
                  {ratingOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
                <Input
                  list="ratingOptionsModal"
                  placeholder="e.g. PG, PG 13, PG 15"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200 bg-slate-50 hover:bg-white transition-all duration-300 h-12 shadow-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8 p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm">
              <input
                type="checkbox"
                id="activeToggleModal"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm transition-colors"
              />
              <label htmlFor="activeToggleModal" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                Active <span className="text-slate-400 font-medium ml-1.5">— Show appears in the public booking list</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateOrUpdate}
                disabled={actionLoading}
                className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-200/50 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                <Check className="w-5 h-5" />
                Save Show Time
              </button>
              <button
                onClick={resetForm}
                disabled={actionLoading}
                className="rounded-2xl px-6 py-3.5 h-auto border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold shadow-sm transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
      <ConfirmDialog
        open={deleteMovieTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteMovieTarget(null);
        }}
        title="Delete movie?"
        description={
          deleteMovieTarget
            ? `Delete ${deleteMovieTarget.title} and all its showtimes? This cannot be undone.`
            : "Delete this movie and all its showtimes? This cannot be undone."
        }
        confirmText="Yes, delete movie"
        cancelText="No"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!deleteMovieTarget) return false;
          const ok = await performDeleteMovie(deleteMovieTarget.title, deleteMovieTarget.ids);
          return ok;
        }}
      />
    </div>
  );
}
