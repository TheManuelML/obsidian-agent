// ms constants 
const MS = { 
  "s": 1_000, 
  "m": 60_000,
  "h": 3_600_000, 
  "d": 86_400_000, 
  "w": 7 * 86_400_000 
};

// Main function to parse date ranges
export function parseDateRange(
  dateRange: string | { start: string | number, end: string | number },
  now = new Date(),
) {
  if (!dateRange) return undefined;

  // Preset strings like "5d", "12h", "30m"
  if (typeof dateRange === "string") {
    const date = dateRange.toLowerCase().trim();

    // <Int><Unit> pattern
    const match = date.match(/^(\d+)\s*(s|m|h|d|w)$/);
  
    if (match) {
      const number = Number(match[1]);
      const unit = match[2];

      const unit_ms = unit === "s" ? MS.s :
        unit === "m" ? MS.m :
        unit === "h" ? MS.h :
        unit === "d" ? MS.d :
        unit === "w" ? MS.w : 0;
      const ms = number * unit_ms;
      
      return { start: now.getTime() - ms, end: now.getTime() };
    }
  } 
  
  // {start,end} Object
  if (typeof dateRange === "object") {
    const start = parseDate(dateRange.start);
    const end = parseDate(dateRange.end);

    if (start === undefined || end === undefined) return undefined; // invalid date
    
    const startMs = typeof start === "number" ? start : start.start;
    const endMs = typeof end === "number" ? end : end.end;

    if (typeof startMs === "number" && typeof endMs === "number") {
      if (startMs > endMs) return undefined; // Start cannot be after end
      return { start: startMs, end: endMs };
    }

    return undefined; // invalid date
  }

  return undefined; // invalid date
}

// Helper function to parse a date input
function parseDate(date: any) {
  if (date === null || date === undefined) return undefined;
  
  if (typeof date === "number") return date; // miliseconds
  
  if (typeof date === "string") {
    if (/^\d+$/.test(date)) return Number(date); // miliseconds as string
  
    // If the date is in YYYY-MM-DD format, return the start and end of that day in ms
    // 2025-10-22 -> {
    //   start: 1761097200000, // 2025-10-22T00:00:00.000
    //   end:   1761183599999  // 2025-10-22T23:59:59.999
    // }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const start = new Date(date + 'T00:00:00');
      return { start: start.getTime(), end: start.getTime() + MS.d - 1 };
    }

    // Date formats recognized by JS Date
    const d = new Date(date);
    if (!isNaN(d.getTime())) return d.getTime(); // valid date
  }

  return undefined;
}