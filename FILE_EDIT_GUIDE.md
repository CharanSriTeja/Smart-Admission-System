# 📊 MongoDB Connection Architecture - File Structure

## 🎯 Key Files & Their Roles

### **1. Only File That Needs Manual Editing**

```
server/
├── .env ⭐ EDIT THIS FILE ONLY
│   ├── PORT=5000
│   ├── MONGODB_URI=mongodb://localhost:27017/smart-admission
│   │   └─ Change ONLY if using MongoDB Atlas
│   ├── JWT_SECRET=...
│   ├── JWT_EXPIRY=24h
│   └── NODE_ENV=development
```

**Location:** `c:\Users\ramlo\Desktop\smart-admission-system\server\.env`

**Changes needed:**

- For Local MongoDB: ✅ No changes (already configured)
- For MongoDB Atlas: Change MONGODB_URI to your cloud connection string

---

### **2. Files That Auto-Read Configuration**

```
server/
├── config/
│   ├── db.js ✅ READS FROM .env
│   │   └─ Automatically connects to MongoDB
│   │     using MONGODB_URI from .env
│   │
│   └── env.js ✅ LOADS .env FILE
│       └─ Reads all environment variables
│         and exports to entire app
```

**No changes needed!** These files automatically use your .env configuration.

---

### **3. Database Models (Schemas)**

```
server/
├── models/
│   ├── User.js ✅ SCHEMA READY
│   │   ├── name
│   │   ├── email (unique)
│   │   ├── password (hashed)
│   │   ├── role (HOD/Volunteer)
│   │   └── department
│   │
│   ├── Student.js ✅ SCHEMA READY
│   │   ├── hallTicketNumber
│   │   ├── name
│   │   ├── rank
│   │   ├── department
│   │   ├── selfReported
│   │   ├── documentsSubmitted
│   │   ├── formFilled
│   │   └── completionPercentage
│   │
│   └── AuditLog.js ✅ SCHEMA READY
│       ├── studentId
│       ├── updatedBy
│       ├── action
│       └── timestamp
```

**No changes needed!** Schemas are ready for MongoDB.

---

## 🔄 Connection Flow

```
┌─────────────────────────────────────────────────────────┐
│ server/.env (CONFIGURATION FILE)                        │
│ MONGODB_URI=mongodb://localhost:27017/smart-admission   │
│ JWT_SECRET=dev-secret-key-change...                     │
│ NODE_ENV=development                                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ server/config/env.js (READS .env)                       │
│                                                         │
│ import dotenv from 'dotenv';                            │
│ dotenv.config(); ← Loads .env file                      │
│                                                         │
│ export default {                                        │
│   MONGODB_URI: process.env.MONGODB_URI                  │
│ };                                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ server/config/db.js (ESTABLISHES CONNECTION)            │
│                                                         │
│ import config from './env.js';                          │
│                                                         │
│ await mongoose.connect(config.MONGODB_URI)             │
│   ↓                                                     │
│   Connects to MongoDB!                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ server/models/ (DATABASE SCHEMAS)                       │
│                                                         │
│ - User.js (uses Mongoose schema)                        │
│ - Student.js (uses Mongoose schema)                     │
│ - AuditLog.js (uses Mongoose schema)                    │
│                                                         │
│ ✅ Ready to save/retrieve data from MongoDB            │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 How to Edit .env File

### **Step 1: Open File**

Right-click on file in VS Code explorer:

```
server/.env
```

### **Step 2: View Current Content**

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-admission
JWT_SECRET=dev-secret-key-change-in-production-abc123xyz
JWT_EXPIRY=24h
NODE_ENV=development
```

### **Step 3: Make Changes (If Using MongoDB Atlas)**

Find this line:

```
MONGODB_URI=mongodb://localhost:27017/smart-admission
```

Replace with:

```
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smart-admission?retryWrites=true&w=majority
```

### **Step 4: Save File**

`Ctrl + S` in VS Code

### **Step 5: Restart Backend Server**

```bash
# In server terminal, stop the current process (Ctrl + C)
# Then restart:
npm run dev
```

---

## ✅ File Edit Summary

| File Path                   | Edit?                        | What to Change            |
| --------------------------- | ---------------------------- | ------------------------- |
| `server/.env`               | ✅ YES (only if using Atlas) | MONGODB_URI line          |
| `server/config/env.js`      | ❌ NO                        | Auto-reads .env           |
| `server/config/db.js`       | ❌ NO                        | Auto-connects to MongoDB  |
| `server/models/User.js`     | ❌ NO                        | Schemas are ready         |
| `server/models/Student.js`  | ❌ NO                        | Schemas are ready         |
| `server/models/AuditLog.js` | ❌ NO                        | Schemas are ready         |
| `server/server.js`          | ❌ NO                        | Already imports db config |
| All client files            | ❌ NO                        | No changes needed         |

---

## 🚀 Command Sequence

### **Local MongoDB Setup:**

```bash
# Terminal 1: Start MongoDB
mongod
# Output: [initandlisten] Waiting for connections on port 27017

# Terminal 2: Start Backend Server
cd c:\Users\ramlo\Desktop\smart-admission-system\server
npm run dev
# Output: ✅ MongoDB connected successfully

# Terminal 3: Start Frontend
cd c:\Users\ramlo\Desktop\smart-admission-system\client
npm run dev
# Output: ➜ Local: http://localhost:3000/
```

### **MongoDB Atlas (Cloud) Setup:**

```bash
# Step 1: Update .env file with Atlas connection string
# File: server/.env
# MONGODB_URI=mongodb+srv://admin:password@cluster.mongodb.net/smart-admission

# Terminal 1: Start Backend Server
cd c:\Users\ramlo\Desktop\smart-admission-system\server
npm run dev
# Output: ✅ MongoDB connected successfully

# Terminal 2: Start Frontend
cd c:\Users\ramlo\Desktop\smart-admission-system\client
npm run dev
# Output: ➜ Local: http://localhost:3000/
```

---

## 🔍 Verify Connection Success

### **Sign 1: Backend Console Output**

```
🔌 Socket.IO initialised
✅ MongoDB connected successfully
📦 MongoDB host: localhost
🚀 Server running on port 5000
═══════════════════════════════════════════════════════
  🎓 Smart Admission Tracking & Verification System
  🚀 Server running on port 5000
  🌍 Environment: development
  📡 API base: http://localhost:5000/api
═══════════════════════════════════════════════════════
```

### **Sign 2: Test Data Persistence**

1. Login to app
2. Upload students or update status
3. Refresh page
4. Data should still be there ✅

### **Sign 3: MongoDB Compass (Optional)**

1. Download: https://www.mongodb.com/products/compass
2. Connect to your MongoDB
3. You should see:
   ```
   smart-admission (database)
   ├── users (collection)
   ├── students (collection)
   └── auditlogs (collection)
   ```

---

## 🆘 Troubleshooting by Error Message

### **Error 1: "ECONNREFUSED"**

```
❌ Failed to connect to MongoDB: connect ECONNREFUSED
```

**Fix:**

- If local: Start mongod: `mongod`
- If Atlas: Check internet connection

**File to check:** `server/.env` → MONGODB_URI value

---

### **Error 2: "Authentication Failed"**

```
❌ Failed to connect to MongoDB: authentication failed
```

**Fix:**

- Check username and password in MONGODB_URI
- Special characters in password need URL encoding

**File to check:** `server/.env` → MONGODB_URI

---

### **Error 3: "Collection doesn't exist"**

```
⚠️ MongoDB disconnected
```

**Fix:**

- Normal on first run, MongoDB creates collections automatically
- Just restart server

**No file changes needed**

---

## 📋 Pre-Connection Checklist

- [ ] MongoDB installed (local) OR Atlas account created
- [ ] Cluster running (local: mongod / Atlas: online)
- [ ] Database user created (if using Atlas)
- [ ] IP whitelisted (if using Atlas)
- [ ] Connection string ready
- [ ] `.env` file updated with connection string
- [ ] Backend server restarted
- [ ] Frontend loads without errors

---

## 🎯 Summary

**ONE file needs editing:** `server/.env`

**Change only the MONGODB_URI line:**

```
# For Local (no change needed):
MONGODB_URI=mongodb://localhost:27017/smart-admission

# For Atlas (change to your string):
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/smart-admission
```

**Then restart backend:** `npm run dev`

**Everything else works automatically!** ✨
