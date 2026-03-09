import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime12Hour(timeString: string | null | undefined): string {
  if (!timeString) return "";
  
  // Handle Google Sheets raw numeric fractional time (e.g., "0.4166666667")
  if (!isNaN(Number(timeString)) && timeString.includes(".")) {
    const fraction = Number(timeString);
    const totalMinutes = Math.round(fraction * 24 * 60);
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const displayHourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
    const displayMinuteStr = minute < 10 ? `0${minute}` : `${minute}`;
    
    return `${displayHourStr}:${displayMinuteStr} ${ampm}`;
  }

  // Return as-is if it already contains AM/PM
  if (timeString.toLowerCase().includes("am") || timeString.toLowerCase().includes("pm")) {
    return timeString;
  }
  
  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;

  const hour = parseInt(parts[0], 10);
  const minute = parts[1].substring(0, 2); // Safely get the first two chars in case of seconds
  if (isNaN(hour)) return timeString;

  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const displayHourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;

  return `${displayHourStr}:${minute} ${ampm}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function parseTimeTo24Hour(timeString: string | null | undefined): { hour: number; minute: number } | null {
  if (!timeString) return null;
  const raw = String(timeString).trim();
  if (!raw) return null;

  // Google Sheets fractional time (e.g., "0.4166666667")
  if (!raw.includes(":") && !raw.toLowerCase().includes("am") && !raw.toLowerCase().includes("pm")) {
    const n = Number(raw);
    if (!isNaN(n) && n >= 0 && n < 1) {
      const totalMinutes = Math.round(n * 24 * 60);
      const hour = Math.floor(totalMinutes / 60) % 24;
      const minute = totalMinutes % 60;
      return { hour, minute };
    }
  }

  // 12-hour format (e.g., "06:30 PM")
  if (raw.toLowerCase().includes("am") || raw.toLowerCase().includes("pm")) {
    const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (!m) return null;
    let hour = parseInt(m[1], 10);
    const minute = parseInt(m[2] || "0", 10);
    if (isNaN(hour) || isNaN(minute)) return null;
    const ampm = m[3].toLowerCase();
    hour = hour % 12;
    if (ampm === "pm") hour += 12;
    return { hour, minute };
  }

  // 24-hour format (e.g., "18:30" or "18:30:00")
  const parts = raw.split(":");
  if (parts.length < 2) return null;
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1].substring(0, 2), 10);
  if (isNaN(hour) || isNaN(minute)) return null;
  return { hour, minute };
}

export function isShowStartInPastDubai(showDateIso: string, showTime: string, nowMs: number = Date.now()): boolean {
  // showDateIso: YYYY-MM-DD
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDatePattern.test(showDateIso)) return false;
  const t = parseTimeTo24Hour(showTime);
  if (!t) return false;

  // Dubai is UTC+04:00 (no DST)
  const showStartMs = Date.parse(`${showDateIso}T${pad2(t.hour)}:${pad2(t.minute)}:00+04:00`);
  if (isNaN(showStartMs)) return false;
  return nowMs >= showStartMs;
}
