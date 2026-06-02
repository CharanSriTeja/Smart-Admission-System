/**
 * @fileoverview Database seeder.
 * Creates default users (HOD + Volunteer for CSE & ECE) and 30 sample
 * students across five departments with realistic Indian data.
 *
 * Run:  node utils/seed.js
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import AuditLog from '../models/AuditLog.js';

// ── Seed Users ───────────────────────────────────────────────────────────────
const seedUsers = [
  {
    name: 'Dr. Kumar',
    email: 'hod@college.edu',
    password: 'hod123',
    role: 'HOD',
    department: 'CSE',
  },
  {
    name: 'Ravi',
    email: 'volunteer@college.edu',
    password: 'vol123',
    role: 'Volunteer',
    department: 'CSE',
  },
  {
    name: 'Dr. Sharma',
    email: 'hod.aiml@college.edu',
    password: 'hod123',
    role: 'HOD',
    department: 'AIML',
  },
  {
    name: 'Priya',
    email: 'volunteer.aiml@college.edu',
    password: 'vol123',
    role: 'Volunteer',
    department: 'AIML',
  },
  {
    name: 'Dr. Rao',
    email: 'hod.cic@college.edu',
    password: 'hod123',
    role: 'HOD',
    department: 'CIC',
  },
  {
    name: 'Siddharth',
    email: 'volunteer.cic@college.edu',
    password: 'vol123',
    role: 'Volunteer',
    department: 'CIC',
  },
];

// ── Realistic Indian names ───────────────────────────────────────────────────
const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aditya', 'Ananya', 'Arjun',
  'Bhavya', 'Charan', 'Deepika', 'Divya', 'Ganesh',
  'Harsha', 'Ishaan', 'Jaya', 'Karthik', 'Lakshmi',
  'Manish', 'Neha', 'Om', 'Pooja', 'Rahul',
  'Sai', 'Tanvi', 'Uday', 'Vaishnavi', 'Vikram',
  'Yamini', 'Zara', 'Rohit', 'Sneha', 'Tarun',
  'Meghana', 'Naveen', 'Kavya', 'Pranav', 'Ritika',
];

const LAST_NAMES = [
  'Reddy', 'Sharma', 'Patel', 'Kumar', 'Singh',
  'Rao', 'Gupta', 'Verma', 'Naidu', 'Chowdary',
  'Das', 'Joshi', 'Iyer', 'Mishra', 'Nair',
  'Pillai', 'Prasad', 'Raju', 'Srinivas', 'Tiwari',
];

const DEPARTMENTS = ['CSE', 'AIML', 'CIC'];
const CATEGORIES = ['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'SC', 'ST'];
const GENDERS = ['Male', 'Female', 'Other'];
const REGIONS = ['AU', 'SVU', 'OU'];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Pick a random element from an array.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generate a random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate a hall ticket number in the format 24-XXX-XXX-XXXXX.
 * @param {number} index - Used to ensure uniqueness.
 * @returns {string}
 */
const genHallTicket = (index) => {
  const a = String(randInt(100, 999));
  const b = String(randInt(100, 999));
  const c = String(10000 + index).slice(-5);
  return `24-${a}-${b}-${c}`;
};

/**
 * Generate a 10-digit Indian mobile number.
 * @returns {string}
 */
const genPhone = () => {
  const prefixes = ['9', '8', '7', '6'];
  return pick(prefixes) + String(randInt(100000000, 999999999));
};

// ── Main ─────────────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    console.log('🌱 Connecting to MongoDB…');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ── Seed Users ────────────────────────────────────────────────
    let usersCreated = 0;
    const userDocs = [];

    for (const u of seedUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const doc = await User.create(u);
        userDocs.push(doc);
        usersCreated++;
        console.log(`  👤 Created user: ${doc.name} (${doc.role}) — ${doc.email}`);
      } else {
        userDocs.push(exists);
        console.log(`  ⏭️  User already exists: ${u.email}`);
      }
    }

    // Grab an HOD user ID for the uploadedBy field
    const uploadUser = userDocs.find((u) => u.role === 'HOD') || userDocs[0];

    // ── Seed Students ─────────────────────────────────────────────
    const existingCount = await Student.countDocuments();

    if (existingCount >= 30) {
      console.log(`  ⏭️  ${existingCount} students already exist — skipping student seed.`);
    } else {
      const students = [];
      const usedNames = new Set();

      for (let i = 0; i < 30; i++) {
        let fullName;
        do {
          fullName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
        } while (usedNames.has(fullName));
        usedNames.add(fullName);

        const selfReported = Math.random() > 0.35;
        const documentsSubmitted = selfReported ? Math.random() > 0.3 : Math.random() > 0.7;
        const formFilled = documentsSubmitted ? Math.random() > 0.35 : false;

        students.push({
          hallTicketNumber: genHallTicket(i),
          name: fullName,
          rank: randInt(100, 50000),
          department: pick(DEPARTMENTS),
          studentPhone: genPhone(),
          parentPhone: genPhone(),
          email: `${fullName.toLowerCase().replace(/\s+/g, '.')}@student.edu`,
          category: pick(CATEGORIES),
          gender: pick(GENDERS),
          region: pick(REGIONS),
          selfReported,
          documentsSubmitted,
          formFilled,
          remarks: '',
          uploadedBy: uploadUser._id,
          isActive: true,
        });
      }

      const inserted = await Student.insertMany(students);
      console.log(`  📚 Created ${inserted.length} sample students`);

      // Create audit logs for the seeded students
      const auditEntries = inserted.map((doc) => ({
        studentId: doc._id,
        updatedBy: uploadUser._id,
        role: uploadUser.role,
        action: 'STUDENT_CREATED',
        newValue: { hallTicketNumber: doc.hallTicketNumber, name: doc.name },
      }));
      await AuditLog.insertMany(auditEntries);
      console.log(`  📝 Created ${auditEntries.length} audit log entries`);
    }

    // ── Summary ───────────────────────────────────────────────────
    const totalUsers = await User.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalLogs = await AuditLog.countDocuments();

    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────────');
    console.log(`  Users created this run : ${usersCreated}`);
    console.log(`  Total users            : ${totalUsers}`);
    console.log(`  Total students         : ${totalStudents}`);
    console.log(`  Total audit logs       : ${totalLogs}`);
    console.log('─────────────────────────────────\n');

    console.log('📋 Login credentials:');
    console.log('  HOD CSE      → hod@college.edu       / hod123');
    console.log('  Volunteer CSE→ volunteer@college.edu  / vol123');
    console.log('  HOD AIML     → hod.aiml@college.edu  / hod123');
    console.log('  Volunteer AIML→ volunteer.aiml@college.edu / vol123');
    console.log('  HOD CIC      → hod.cic@college.edu   / hod123');
    console.log('  Volunteer CIC→ volunteer.cic@college.edu / vol123');
  } catch (error) {
    console.error('💥 Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seed();
