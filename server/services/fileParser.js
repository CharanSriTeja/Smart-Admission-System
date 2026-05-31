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
import pdfParse from 'pdf-parse';

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
 * Best-effort parser for tabular data inside a PDF.
 * Many PDFs do not contain machine-readable tables, so this is heuristic.
 * @param {string} filePath - Absolute path to the .pdf file.
 * @returns {Promise<Object[]>} Array of student objects (may be empty).
 */
const parsePdf = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  const text = pdfData.text;

  if (!text || !text.trim()) return [];

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  // Attempt 1 — header row followed by data rows (tab / multi-space delimited)
  const headerLine = lines[0];
  const headers = headerLine.split(/\t+|\s{2,}/).map((h) => h.trim()).filter(Boolean);

  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/\t+|\s{2,}/).map((c) => c.trim()).filter(Boolean);
    if (cols.length < headers.length * 0.5) continue; // probably not a data row

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || '';
    });

    const student = normalizeRow(row);
    if (student) results.push(student);
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
