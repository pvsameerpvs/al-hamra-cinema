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
