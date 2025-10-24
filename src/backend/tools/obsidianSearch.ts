import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { findClosestFile, findMatchingFolder } from "src/utils/searching";
import { getApp } from 'src/plugin';
import { parseDateRange } from 'src/utils/parseRangeDate';

// Tool to search notes and folders
export const search = tool(async (input) => {
  // Declare input
  let { name, isNote } = input;

  if (isNote) {
    // Search for the note
    const matchedFile = findClosestFile(name);
    if (!matchedFile) {
      const errorMsg = `Could not find any note with the exact name or similar to "${name}".`;
      return { success: false, error: errorMsg };
    }

    // Return the note path
    return {
      success: true,
      type: "note",
      name: matchedFile.name,
      path: matchedFile.path
    };
  } else {
    // Search for the directory
    const matchedFolder = findMatchingFolder(name);
    if (!matchedFolder) {
      const errorMsg = `Could not find any directory with the name or similar to "${name}".`;
      return { success: false, error: errorMsg };
    }
        
    // Return the directory path
    return {
      success: true,
      type: "folder",
      name: matchedFolder.name,
      path: matchedFolder.path
    };
  }
}, {
  // Tool schema and metadata
  name: 'vault_search',
  description: 'Searches for notes and folders in Obsidian.',
  schema: z.object({
    name: z.string().describe('The exact or partial name to search for.'),
    isNote: z.boolean().default(true).describe('Whether is a file (True) or a folder (False)'),
  })
});


// Tool to search notes based on their date or tags
export const noteFiltering = tool(async (input) => {
  const app = getApp();
  const { field, dateRange, limit, sortOrder } = input;

  // Parse dateRange
  if (typeof dateRange !== "string" && typeof dateRange !== "object") {
    return { success: false, error: `Invalid 'dateRange' type, expected string or object, got ${typeof dateRange}.` };
  }
  const validDateRange = parseDateRange(dateRange);
  if (!validDateRange) return { success: false, error: `Invalid date range: "${dateRange}".` };
  // By now validDateRange is guaranteed to be a {start: number, end: number} object

  // Get notes based on the date range and field  
  const notes = app.vault.getMarkdownFiles().filter(file => {
    const fileTime = field === "creation" ? file.stat.ctime : file.stat.mtime;
    return fileTime >= validDateRange.start && fileTime <= validDateRange.end;
  });

  // Sort notes
  notes.sort((a, b) => {
    const timeA = field === "creation" ? a.stat.ctime : a.stat.mtime;
    const timeB = field === "creation" ? b.stat.ctime : b.stat.mtime;
    return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
  });

  // Limit notes
  const limitedNotes = notes.slice(0, limit);

  // Gather note paths
  const notePaths = limitedNotes.map(note => (note.path ));

  return { 
    success: true, 
    notes: notePaths, 
    meta: {
      field, 
      dateRange, 
      msRange: validDateRange, 
      limit, 
      sortOrder 
    },
  };
}, {
  // Tool schema and metadata
  name: 'filer_notes',
  description: `
Return a list of note paths that fall inside a date range.
dateRange formats supported:
  1) Relative strings: "<int><unit>" where unit is: s (seconds), m (minutes), h (hours), d (days), w (weeks).
     Examples: "1h", "48m", "2w", "3d".

  2) Explicit range object: { "start": <ms|ISO|YYYY-MM-DD>, "end": <ms|ISO|YYYY-MM-DD> }.
     - If start/end are "YYYY-MM-DD" the day bounds are used (start=00:00, end=23:59:59.999 local).
     - start/end can also be unix ms (number) or full ISO datetime string.
  `,
  schema: z.object({
    field: z.enum(['creation', 'modification']).optional().default('modification').describe('The field to filter notes by, either creation or modification date.'),
    
    // Can be a date range (start,end) or a string like "yesterday" or "2h"
    dateRange: z.any().describe(`
    Date range to filter notes.
    Supported formats:
      1) Relative strings: "1h", "48m", "2w", "3d", "1d", etc.
      2) Explicit objects: { "start": <ms|ISO|YYYY-MM-DD>, "end": <ms|ISO|YYYY-MM-DD> }.
    If YYYY-MM-DD is provided, day bounds are applied (start=00:00, end=23:59:59.999 local time).
    `),
    
    limit: z.number().int().min(1).max(500).optional().default(500).describe("Maximum number of notes to return."),

    sortOrder: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort by date ascending or descending.'),
  })
})