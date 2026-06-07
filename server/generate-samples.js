import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// Data to populate in the templates
const sampleData = [
  {
    hallTicketNumber: '9876543210',
    name: 'Aarav Sharma',
    rank: 1250,
    department: 'CSE',
    studentPhone: '9999999901',
    parentPhone: '8888888801',
    email: 'aarav.sharma@example.com',
    category: 'OC',
    gender: 'Male',
    region: 'AU'
  },
  {
    hallTicketNumber: '9876543211',
    name: 'Kavya Reddy',
    rank: 2340,
    department: 'ECE',
    studentPhone: '9999999902',
    parentPhone: '8888888802',
    email: 'kavya.reddy@example.com',
    category: 'BC-B',
    gender: 'Female',
    region: 'AU'
  },
  {
    hallTicketNumber: '9876543212',
    name: 'Sai Kiran',
    rank: 4510,
    department: 'INF',
    studentPhone: '9999999903',
    parentPhone: '8888888803',
    email: 'sai.kiran@example.com',
    category: 'BC-D',
    gender: 'Male',
    region: 'SVU'
  },
  {
    hallTicketNumber: '9876543213',
    name: 'Ananya Verma',
    rank: 820,
    department: 'CSE',
    studentPhone: '9999999904',
    parentPhone: '8888888804',
    email: 'ananya.v@example.com',
    category: 'OC',
    gender: 'Female',
    region: 'OU'
  },
  {
    hallTicketNumber: '9876543214',
    name: 'Rahul Naik',
    rank: 15320,
    department: 'MEC',
    studentPhone: '9999999905',
    parentPhone: '8888888805',
    email: 'rahul.naik@example.com',
    category: 'ST',
    gender: 'Male',
    region: 'AU'
  }
];

// Ensure public directory exists
const publicDir = path.resolve('../client/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate XLSX
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleData);
XLSX.utils.book_append_sheet(wb, ws, 'Students');
XLSX.writeFile(wb, path.join(publicDir, 'sample-students.xlsx'));
console.log('Generated sample-students.xlsx');

// 2. Generate CSV
const csvHeaders = Object.keys(sampleData[0]).join(',');
const csvRows = sampleData.map(row => 
  Object.values(row).map(val => typeof val === 'string' && val.includes(',') ? `"${val}"` : val).join(',')
);
const csvContent = [csvHeaders, ...csvRows].join('\n');
fs.writeFileSync(path.join(publicDir, 'sample-students.csv'), csvContent);
console.log('Generated sample-students.csv');

// 3. Generate PDF
async function generatePDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([950, 500]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Header text (multiple lines on top of the PDF as requested)
  page.drawText('SRKR Engineering College', { x: 40, y: 450, size: 16, font: boldFont, color: rgb(0.1, 0.2, 0.5) });
  page.drawText('Student Admission List — Academic Year 2026', { x: 40, y: 430, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('Generated on: ' + new Date().toLocaleDateString(), { x: 40, y: 415, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
  
  // Draw divider line under title block
  page.drawLine({
    start: { x: 40, y: 400 },
    end: { x: 910, y: 400 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7)
  });

  // Table Headers (not first line!)
  const headers = ['HT No', 'Name', 'Rank', 'Branch', 'Student Phone', 'Parent Phone', 'Email', 'Category', 'Gender', 'Region'];
  let currentY = 375;
  
  // Align at specific horizontal coordinate tabs to simulate columns
  const tabStops = [40, 120, 230, 280, 340, 430, 520, 690, 760, 820];
  
  headers.forEach((header, idx) => {
    page.drawText(header, { x: tabStops[idx], y: currentY, size: 10, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  });
  
  // Draw divider line under headers
  currentY -= 8;
  page.drawLine({
    start: { x: 40, y: currentY },
    end: { x: 910, y: currentY },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7)
  });
  currentY -= 20;

  // Draw rows
  sampleData.forEach((student) => {
    const rowValues = [
      student.hallTicketNumber || '',
      student.name || '',
      String(student.rank || ''),
      student.department || '',
      student.studentPhone || '',
      student.parentPhone || '',
      student.email || '',
      student.category || '',
      student.gender || '',
      student.region || ''
    ];
    
    rowValues.forEach((val, idx) => {
      page.drawText(val, { x: tabStops[idx], y: currentY, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    });
    
    currentY -= 20;
  });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(publicDir, 'sample-students.pdf'), pdfBytes);
  console.log('Generated sample-students.pdf');
}

generatePDF().catch(console.error);
