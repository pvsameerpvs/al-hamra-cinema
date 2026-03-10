"use client";

import { useEffect, useRef, useState, Suspense, Fragment } from "react";
import { createPortal } from "react-dom";
import { Sidebar } from "@/components/Sidebar";
import { MoveLeft, Loader2, FileText, Printer, Filter, PlaySquare, Clock, Download } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { formatTime12Hour } from "@/lib/utils";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import type { DailyReportComputation } from "@/lib/dailyReport";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default function DailyReportPage() {
  return (
    <Suspense fallback={<div className="p-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <DailyReportContent />
    </Suspense>
  );
}

function DailyReportContent() {
  const { toast } = useToast();
  
  const [reportData, setReportData] = useState<DailyReportComputation | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMovie, setSelectedMovie] = useState<string>("all");
  const [selectedShowTime, setSelectedShowTime] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [distributorName, setDistributorName] = useState<string>("");
  const [printActive, setPrintActive] = useState(false);
  const printPortalRef = useRef<HTMLElement | null>(null);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        selectedDate,
        selectedMovie,
        selectedShowTime,
      });
      const res = await fetch(`/api/reports/daily?${queryParams.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load data");
      const data: DailyReportComputation = await res.json();
      setReportData(data);
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
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedMovie, selectedShowTime]);

  useEffect(() => {
    setSelectedShowTime("all");
  }, [selectedMovie]);

  const movieOptions = reportData?.movieOptions || [];
  const showTimeOptions = reportData?.showTimeOptions || [];
  const showTimeReports = reportData?.showTimeReports || [];
  const grandTotalLifetimeTickets = reportData?.grandTotalLifetimeTickets || 0;
  const grandTotalSelectedMovieTickets = reportData?.grandTotalSelectedMovieTickets || 0;
  const grandTotalTodayTickets = reportData?.grandTotalTodayTickets || 0;
  const grandTotalGross = reportData?.grandTotalGross || 0;

  const sanitizeFilenamePart = (s: string) => {
    return String(s || "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handlePrint = () => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (printActive) return;

    const prevTitle = document.title;
    const datePart = selectedDate ? formatDateDots(selectedDate) : "";
    const moviePart = selectedMovie === "all" ? "ALL MOVIES" : selectedMovie;
    const nextTitle = sanitizeFilenamePart([datePart, moviePart].filter(Boolean).join(" - ")) || "Daily Report";

    let created = false;
    let portalEl = document.getElementById("daily-report-portal-root") as HTMLElement | null;
    if (!portalEl) {
      created = true;
      portalEl = document.createElement("div");
      portalEl.id = "daily-report-portal-root";
      document.body.appendChild(portalEl);
    }
    printPortalRef.current = portalEl;

    document.body.dataset.print = "daily-report";
    document.title = nextTitle;
    setPrintActive(true);

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;

      delete document.body.dataset.print;
      document.title = prevTitle;
      setPrintActive(false);

      const el = printPortalRef.current;
      if (created && el && el.parentNode) el.parentNode.removeChild(el);
      if (created) printPortalRef.current = null;
    };

    window.addEventListener("afterprint", restore, { once: true });
    window.setTimeout(restore, 30_000);
    window.setTimeout(() => window.print(), 80);
  };

  const formatDateDots = (iso: string) => {
    const m = String(iso || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    const year = m[1];
    const month = String(Number(m[2]));
    const day = String(Number(m[3]));
    return `${day}.${month}.${year}`;
  };

  const formatTimeDots = (raw: string) => {
    const t = formatTime12Hour(raw);
    const noLead = t.startsWith("0") ? t.slice(1) : t;
    return noLead.replace(":", ".").toUpperCase();
  };

  const splitDhsFils = (n: number) => {
    const fixed = round2(n);
    const dhs = Math.floor(fixed);
    const fils = Math.round((fixed - dhs) * 100).toString().padStart(2, "0");
    return { dhs, fils };
  };

  const handleDownloadJson = () => {
    const payload = {
      cinema_info: {
        name: "AL HAMRA CINEMA",
        date: selectedDate ? formatDateDots(selectedDate) : "",
        movie_name: selectedMovie !== "all" ? selectedMovie : "",
        show_time: selectedShowTime !== "all" ? formatTimeDots(selectedShowTime) : "ALL SHOW TIMES",
      },
      collection_data: showTimeReports.map((report) => ({
        show_time: formatTimeDots(report.showTime),
        entries: report.rows.map((row) => ({
          class: row.classCode,
          life_time_ticket_sold: row.lifetimeTicketsSold,
          selected_movie_all_ticket_sold: row.selectedMovieTicketsSold,
          new_today_ticket_sold: row.todayTicketsSold,
          price_of_the_ticket: row.ticketPrice,
          gross_collection: row.grossCollection,
        })),
      })),
      summary: {
        grand_total_life_time_ticket_sold: grandTotalLifetimeTickets,
        grand_total_selected_movie_ticket_sold: grandTotalSelectedMovieTickets,
        grand_total_today_ticket_sold: grandTotalTodayTickets,
        grand_total_gross: grandTotalGross,
        municipal_tax_10_percent: municipalTax,
        net_amount: netAmount,
        distributor_share_50_percent_on_net_amount: distributorShare,
        distributor_name: distributorName,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileDate = selectedDate || new Date().toISOString().split("T")[0];
    a.download = `daily_report_${fileDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "Daily report JSON downloaded." });
  };

  const getMovieDisplayName = () => {
    if (!selectedMovie || selectedMovie === "all") return "ALL MOVIES";
    return selectedMovie.toUpperCase();
  };

  const getShowTimeDisplayName = () => {
    if (!selectedShowTime || selectedShowTime === "all") return "ALL SHOW TIMES";
    return formatTime12Hour(selectedShowTime).toUpperCase();
  };

  const municipalTax = reportData?.municipalTax || 0;
  const netAmount = reportData?.netAmount || 0;
  const distributorShare = reportData?.distributorShare || 0;
  const municipalTaxDhsFils = splitDhsFils(municipalTax);

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans print:bg-white print:min-h-0">
      <div className="print:hidden">
        <DashboardTopbar />
        <Sidebar />
      </div>

      <div className="lg:pl-64 max-w-7xl mx-auto px-4 sm:px-6 py-8 print:pl-0 print:py-0 print:px-0 print:max-w-none">
        
        {/* Controls (Hidden in Print) */}
        <div className="print:hidden mb-8 space-y-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors w-fit shadow-sm"
          >
            <MoveLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Daily Report</h1>
                <p className="text-sm text-slate-400">Generate and print daily collection reports.</p>
              </div>
            </div>

              <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <Filter className="w-4 h-4 text-slate-400" />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none w-32"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <PlaySquare className="w-4 h-4 text-slate-400" />
                <select 
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none w-40"
                >
                  <option value="all">All Movies</option>
                  {movieOptions.map((title) => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedShowTime}
                  onChange={(e) => setSelectedShowTime(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none w-40"
                >
                  <option value="all">All Show Times</option>
                  {showTimeOptions.map((t) => (
                    <option key={t} value={t}>{formatTime12Hour(t)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <span className="text-xs font-semibold text-slate-400">Distributor</span>
                <input
                  type="text"
                  value={distributorName}
                  onChange={(e) => setDistributorName(e.target.value)}
                  placeholder="Name"
                  className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 outline-none w-44 placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-indigo-600 border border-indigo-700 text-white hover:bg-indigo-700 rounded-xl px-4 py-2 shadow-md text-sm font-semibold transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print / Download PDF
              </button>

              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-4 py-2 shadow-sm text-sm font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* PRINTABLE REPORT AREA */}
        {(() => {
          const reportNode = (
            <div className="bg-white p-8 sm:p-12 print:p-0 border border-slate-200 shadow-sm print:border-none print:shadow-none min-h-[1056px] max-w-[816px] mx-auto text-black print:w-full print:max-w-none">
              {loading ? (
                <div className="h-64 flex items-center justify-center print:hidden">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
              ) : (
                <div className="space-y-4">
              {/* Header */}
              <div className="border border-black p-4 text-center">
                <h1 className="text-3xl font-bold text-red-600 uppercase tracking-wider print:text-red-600 print:!text-red-600 [-webkit-print-color-adjust:exact]">AL HAMRA CINEMA</h1>
                <p className="text-sm font-semibold mt-1">Tel : 06-5650953 , Email : alhamracinema21@gmail.com</p>
              </div>

              {/* Sub-header */}
              <div className="border border-black p-2 flex flex-col gap-1 font-bold text-sm uppercase">
                <div className="flex justify-between">
                  <div>MOVIE NAME: <span className="underline ml-2">{getMovieDisplayName()}</span></div>
                  <div>DATE: <span className="underline ml-2">{selectedDate ? formatDateDots(selectedDate) : ""}</span></div>
                </div>
                <div>SHOW TIME: <span className="underline ml-2">{getShowTimeDisplayName()}</span></div>
              </div>

              {/* Main Table */}
              <table className="w-full border-collapse border border-black text-xs text-center font-medium">
                <thead>
                  <tr className="border-b border-black print:break-inside-avoid">
                    <td className="border-r border-black p-2 w-1/6">CLASS</td>
                    <td className="border-r border-black p-2 w-1/6">LIFE TIME TICKET SOLD</td>
                    <td className="border-r border-black p-2 w-1/6">THE SELECTED MOVIE ALL TICKET SOLD</td>
                    <td className="border-r border-black p-2 w-1/6">NEW (TODAY) TICKET SOLD</td>
                    <td className="border-r border-black p-2 w-1/6">PRICE OF THE TICKET</td>
                    <td className="p-2 w-1/6 font-bold">GROSS COLLECTION</td>
                  </tr>
                </thead>
                <tbody>
                  {showTimeReports.map((report) => (
                    <Fragment key={report.showTime}>
                      <tr className="bg-slate-100 print:bg-gray-100 [-webkit-print-color-adjust:exact] break-inside-avoid">
                        <td colSpan={6} className="border-b border-black p-1 font-bold text-[10px] tracking-widest text-slate-700 print:text-black uppercase">
                          SHOW TIME AT {formatTime12Hour(report.showTime)}
                        </td>
                      </tr>
                      {report.rows.map((row) => (
                        <tr key={`${report.showTime}-${row.classCode}`} className="border-b border-black break-inside-avoid">
                          <td className="border-r border-black p-1.5">{row.classCode}</td>
                          <td className="border-r border-black p-1.5">{row.lifetimeTicketsSold}</td>
                          <td className="border-r border-black p-1.5">{row.selectedMovieTicketsSold}</td>
                          <td className="border-r border-black p-1.5 font-bold">{row.todayTicketsSold}</td>
                          <td className="border-r border-black p-1.5">{row.ticketPrice}</td>
                          <td className="p-1.5 font-bold">{row.grossCollection}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}

                  {/* Grand Total Row */}
                  <tr>
                    <td className="border-r border-black p-2 font-bold uppercase">
                      Grand Total
                    </td>
                    <td className="border-r border-black p-2 font-bold">{grandTotalLifetimeTickets}</td>
                    <td className="border-r border-black p-2 font-bold">{grandTotalSelectedMovieTickets}</td>
                    <td className="border-r border-black p-2 font-bold">{grandTotalTodayTickets}</td>
                    <td className="border-r border-black p-2 font-bold">-</td>
                    <td className="p-2 font-bold text-lg">{grandTotalGross}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border border-black p-2 text-right font-bold text-sm">
                MUNICIPAL TAXES @10% ON GROSS PROFIT
              </div>

              {/* Bottom Summary Section */}
              <div className="mt-8 flex flex-col items-end text-xs font-bold gap-4 break-inside-avoid">
                <table className="border-collapse border border-black w-64 text-right">
                  <thead>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1 w-20"></td>
                      <td className="border-r border-black p-1 text-center font-bold">DHS</td>
                      <td className="p-1 text-center font-bold">FILS</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1 pr-2">DEDUCTION</td>
                      <td className="border-r border-black p-1 text-center">0</td>
                      <td className="p-1 text-center">0</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1 pr-2">MUNICIPAL TAXES 10% ON GROSS PROFIT</td>
                      <td className="border-r border-black p-1 text-center">{municipalTaxDhsFils.dhs}</td>
                      <td className="p-1 text-center">{municipalTaxDhsFils.fils}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1 pr-2">TOTAL DEDUCTION</td>
                      <td className="border-r border-black p-1 text-center">{municipalTaxDhsFils.dhs}</td>
                      <td className="p-1 text-center">{municipalTaxDhsFils.fils}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="w-64 flex justify-between pr-2 mb-4">
                  <span>NET AMOUNT :</span>
                  <span className="border-b border-black w-24 text-center">{netAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="mt-6 flex flex-col gap-4 text-xs font-bold uppercase w-1/2">
                <div className="flex justify-between items-end">
                  <span>DISTRIBUTOR&apos;S NAME :</span>
                  <input
                    type="text"
                    value={distributorName}
                    onChange={(e) => setDistributorName(e.target.value)}
                    placeholder=""
                    spellCheck={false}
                    className="border-b border-black flex-1 ml-2 min-h-[16px] text-center bg-transparent outline-none"
                  />
                </div>
                <div className="flex justify-between items-end">
                  <span>DISTRIBUTOR&apos;S SHARE @ 50% ON NET AMOUNT DHS:</span>
                  <span className="border-b border-black w-32 ml-2 text-center">{distributorShare.toFixed(2)}</span>
                </div>
              </div>

                </div>
              )}
            </div>
          );

          return (
            <>
              <div id="daily-report-root">{reportNode}</div>
              {printActive && printPortalRef.current
                ? createPortal(<div id="daily-report-print-root">{reportNode}</div>, printPortalRef.current)
                : null}
            </>
          );
        })()}
      </div>
      
      {/* Global Print Styles to make it look perfect when downloading PDF */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:w-full { width: 100% !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:min-h-0 { min-height: 0 !important; }
          .print\\:pl-0 { padding-left: 0 !important; }
          
          /* Force colors for print */
          *{-webkit-print-color-adjust: exact; print-color-adjust: exact;}
          
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
        }
      `}} />
    </div>
  );
}
