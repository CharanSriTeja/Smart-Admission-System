/**
 * @fileoverview File-parsing service.
 * Accepts an uploaded file path and MIME type, delegates to the correct
 * parser (xlsx · csv · pdf), and returns an array of normalised student
 * objects ready for database insertion.
 */

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import csvParser from 'csv-parser';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// ── Column-name aliases ──────────────────────────────────────────────────────
// Maps every known column alias (lowercased) → canonical field name.
const COLUMN_MAP = {
  // hallTicketNumber
  'hallticketno': 'hallTicketNumber',
  'hallticketnumber': 'hallTicketNumber',
  'hall_ticket_no': 'hallTicketNumber',
  'hall_ticket_number': 'hallTicketNumber',
  'hall ticket': 'hallTicketNumber',
  'hall ticket no': 'hallTicketNumber',
  'hall ticket number': 'hallTicketNumber',
  'htno': 'hallTicketNumber',
  'ht no': 'hallTicketNumber',
  'ht_no': 'hallTicketNumber',
  'hallticket': 'hallTicketNumber',

  // name
  'name': 'name',
  'student name': 'name',
  'studentname': 'name',
  'student_name': 'name',
  'full name': 'name',
  'fullname': 'name',

  // rank
  'rank': 'rank',
  'eamcet rank': 'rank',
  'eamcetrank': 'rank',
  'eamcet_rank': 'rank',
  'merit rank': 'rank',

  // department
  'department': 'department',
  'dept': 'department',
  'branch': 'department',

  // studentPhone
  'studentphone': 'studentPhone',
  'student phone': 'studentPhone',
  'student_phone': 'studentPhone',
  'student mobile': 'studentPhone',
  'phone': 'studentPhone',
  'mobile': 'studentPhone',
  'contact': 'studentPhone',

  // parentPhone
  'parentphone': 'parentPhone',
  'parent phone': 'parentPhone',
  'parent_phone': 'parentPhone',
  'parent mobile': 'parentPhone',
  'guardian phone': 'parentPhone',
  'guardian mobile': 'parentPhone',

  // email
  'email': 'email',
  'email id': 'email',
  'emailid': 'email',
  'email_id': 'email',
  'student email': 'email',

  // category
  'category': 'category',
  'caste': 'category',
  'reservation': 'category',

  // gender
  'gender': 'gender',
  'sex': 'gender',

  // region
  'region': 'region',
  'university': 'region',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a raw header string to its canonical field name.
 * @param {string} raw - Column header as found in the source file.
 * @returns {string|null} Canonical field name or null if unrecognised.
 */
const mapColumn = (raw) => {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  // Direct lookup
  if (COLUMN_MAP[key]) return COLUMN_MAP[key];
  // Retry after collapsing all spaces
  const collapsed = key.replace(/\s+/g, '');
  if (COLUMN_MAP[collapsed]) return COLUMN_MAP[collapsed];
  return null;
};

/**
 * Normalise a raw parsed row (whose keys are original column names) into
 * a student-shaped object.
 * @param {Object} row - Key/value pairs from the parsed file.
 * @returns {Object|null} Normalised student object, or null if mandatory fields are missing.
 */
const normalizeRow = (row) => {
  const student = {};

  for (const [rawKey, value] of Object.entries(row)) {
    const field = mapColumn(rawKey);
    if (field) {
      student[field] = typeof value === 'string' ? value.trim() : value;
    }
  }

  // rank should be numeric
  if (student.rank !== undefined) {
    student.rank = Number(student.rank);
    if (Number.isNaN(student.rank)) delete student.rank;
  }

  // Normalise gender casing
  if (student.gender) {
    const g = student.gender.charAt(0).toUpperCase() + student.gender.slice(1).toLowerCase();
    if (['Male', 'Female', 'Other'].includes(g)) {
      student.gender = g;
    } else {
      delete student.gender;
    }
  }

  // Mandatory fields check
  if (!student.hallTicketNumber || !student.name || student.rank === undefined || !student.department) {
    return null;
  }

  return student;
};

// ── Parsers ──────────────────────────────────────────────────────────────────

/**
 * Parse an XLSX file and return normalised student rows.
 * @param {string} filePath - Absolute path to the .xlsx file.
 * @returns {Object[]} Array of student objects.
 */
const parseXlsx = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: '',
  });

  return rawRows
    .map(normalizeRow)
    .filter(Boolean);
};

/**
 * Parse a CSV file and return normalised student rows.
 * @param {string} filePath - Absolute path to the .csv file.
 * @returns {Promise<Object[]>} Array of student objects.
 */
const parseCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const student = normalizeRow(row);
        if (student) results.push(student);
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

/**
 * Robust parser for tabular data inside a PDF using pdfjs-dist.
 * Groups text fragments into rows and columns based on their visual coordinate offsets,
 * then identifies the header row (containing at least 3 mandatory fields) to parse data rows.
 * @param {string} filePath - Absolute path to the .pdf file.
 * @returns {Promise<Object[]>} Array of student objects (may be empty).
 */
const parsePdf = async (filePath) => {
  const dataBuffer = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data: dataBuffer, useSystemFonts: true });
  const pdfDocument = await loadingTask.promise;
  
  const rawLines = [];
  
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items;
    
    // Group text items by their vertical coordinate y (transform[5])
    const lineMap = new Map();
    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;
      
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      
      let foundKey = null;
      for (const key of lineMap.keys()) {
        if (Math.abs(key - y) < 4) { // tolerance of 4 points for the same row
          foundKey = key;
          break;
        }
      }
      
      if (foundKey !== null) {
        lineMap.get(foundKey).push({ x, text: item.str });
      } else {
        lineMap.set(y, [{ x, text: item.str }]);
      }
    }
    
    // Sort lines from top to bottom
    const sortedYKeys = Array.from(lineMap.keys()).sort((a, b) => b - a);
    
    for (const yKey of sortedYKeys) {
      // Sort items in the line from left to right
      const lineItems = lineMap.get(yKey).sort((a, b) => a.x - b.x);
      
      // Reconstruct columns by detecting horizontal gaps
      const columns = [];
      let currentCol = null;
      
      for (const item of lineItems) {
        const text = item.text;
        const x = item.x;
        
        if (currentCol === null) {
          currentCol = { x, text };
        } else {
          // Estimate character width (approx 6 points per char)
          const approxCharWidth = 6;
          const expectedEnd = currentCol.x + (currentCol.text.length * approxCharWidth);
          // If spacing is less than 15 points, merge into the same column text
          if (x - expectedEnd < 15) {
            currentCol.text += " " + text;
          } else {
            columns.push(currentCol.text.trim());
            currentCol = { x, text };
          }
        }
      }
      if (currentCol !== null) {
        columns.push(currentCol.text.trim());
      }
      
      if (columns.length > 0) {
        rawLines.push(columns);
      }
    }
  }
  
  if (rawLines.length < 2) return [];
  
  // Find the header row by checking for mapped mandatory fields
  let headerIndex = -1;
  let headers = [];
  
  for (let i = 0; i < rawLines.length; i++) {
    const row = rawLines[i];
    const mappedCols = row.map(c => mapColumn(c)).filter(Boolean);
    const mandatoryCount = ['hallTicketNumber', 'name', 'rank', 'department'].filter(f => mappedCols.includes(f)).length;
    
    if (mandatoryCount >= 3) {
      headerIndex = i;
      headers = row;
      break;
    }
  }
  
  // Fallback to first row if no header matches
  if (headerIndex === -1) {
    headerIndex = 0;
    headers = rawLines[0];
  }
  
  const results = [];
  
  // Parse rows following the header row
  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const cols = rawLines[i];
    const rowObj = {};
    
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] || '';
    });
    
    const student = normalizeRow(rowObj);
    if (student) {
      results.push(student);
    }
  }
  
  return results;
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse an uploaded file and return normalised student records.
 *
 * @param {string} filePath - Absolute path to the uploaded file.
 * @param {string} mimetype - MIME type reported by multer (or original name extension).
 * @returns {Promise<Object[]>} Array of normalised student objects.
 * @throws {Error} If the file type is unsupported or parsing fails.
 */
export const parseFile = async (filePath, mimetype) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeLC = (mimetype || '').toLowerCase();

  try {
    // XLSX
    if (
      ext === '.xlsx' ||
      ext === '.xls' ||
      mimeLC.includes('spreadsheet') ||
      mimeLC.includes('excel')
    ) {
      return parseXlsx(filePath);
    }

    // CSV
    if (ext === '.csv' || mimeLC.includes('csv') || mimeLC.includes('comma')) {
      return await parseCsv(filePath);
    }

    // PDF
    if (ext === '.pdf' || mimeLC.includes('pdf')) {
      return await parsePdf(filePath);
    }

    throw new Error(`Unsupported file type: ${ext || mimetype}`);
  } catch (error) {
    // Clean up uploaded file on failure
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
};
