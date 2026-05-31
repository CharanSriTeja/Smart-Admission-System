# ⚡ MongoDB Connection - Quick Reference

## 🎯 Only 1 File Needs to be Changed!

### **File to Edit: `.env` (Server Configuration)**

📍 **Path:** `c:\Users\ramlo\Desktop\smart-admission-system\server\.env`

---

## **Before (Current - Offline Mode)**

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-admission
JWT_SECRET=dev-secret-key-change-in-production-abc123xyz
JWT_EXPIRY=24h
NODE_ENV=development
```

---

## **After (Choose One)**

### **Option A: Local MongoDB**

✅ **No changes needed!** Already configured correctly.

Keep as is:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-admission
JWT_SECRET=dev-secret-key-change-in-production-abc123xyz
JWT_EXPIRY=24h
NODE_ENV=development
```

**Then do this:**

1. Open terminal
2. Run: `mongod`
3. Wait for "Waiting for connections on port 27017"
4. Restart backend server: `npm run dev`

---

### **Option B: MongoDB Atlas (Cloud)**

Change this line:

```
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smart-admission?retryWrites=true&w=majority
```

Replace:

- `admin` = your MongoDB Atlas username
- `YOUR_PASSWORD` = your MongoDB Atlas password
- `cluster0.xxxxx` = your actual cluster URL from Atlas

**Full example:**

```
MONGODB_URI=mongodb+srv://admin:SecurePass123@cluster0.abcde.mongodb.net/smart-admission?retryWrites=true&w=majority
```

**Then do this:**

1. Save `.env` file
2. Restart backend server: `npm run dev`
3. Should see: "✅ MongoDB connected successfully"

---

## 📋 Complete Step-by-Step

### **IF USING LOCAL MONGODB:**

**Step 1: Install MongoDB**

- Download: https://www.mongodb.com/try/download/community
- Run installer
- Choose "Install as Service"

**Step 2: Start MongoDB**

```bash
mongod
# OR check Services and start "MongoDB Server"
```

**Step 3: Restart Backend**

```bash
cd c:\Users\ramlo\Desktop\smart-admission-system\server
npm run dev
```

**Expected Output:**

```
✅ MongoDB connected successfully
📦 MongoDB host: localhost
🔌 Socket.IO initialised
🚀 Server running on port 5000
```

✅ **Done! Your database is connected.**

---

### **IF USING MONGODB ATLAS (Cloud):**

**Step 1: Create Atlas Account**

- Go to: https://www.mongodb.com/cloud/atlas
- Sign up → Create free tier cluster

**Step 2: Create Database User**

- In Atlas Dashboard → Database Access → Add User
- Username: `admin`
- Password: Create strong password

**Step 3: Get Connection String**

- Clusters → Connect → Drivers
- Copy the connection string

**Step 4: Update .env File**

- Edit: `server/.env`
- Replace MONGODB_URI with your connection string

```
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smart-admission
```

**Step 5: Restart Backend**

```bash
cd c:\Users\ramlo\Desktop\smart-admission-system\server
npm run dev
```

**Expected Output:**

```
✅ MongoDB connected successfully
📦 MongoDB host: cluster0.xxxxx.mongodb.net
🔌 Socket.IO initialised
🚀 Server running on port 5000
```

✅ **Done! Your cloud database is connected.**

---

## 🔍 Verify Connection

### **Check Backend Console**

```
✅ MongoDB connected successfully
```

If you see this message, you're connected!

### **Check in MongoDB Compass (Optional)**

1. Download: https://www.mongodb.com/products/compass
2. Connect with your connection string
3. Should see `smart-admission` database

---

## ⚠️ Common Issues & Fixes

| Issue                   | Solution                          |
| ----------------------- | --------------------------------- |
| `connect ECONNREFUSED`  | Start mongod: `mongod`            |
| `authentication failed` | Check username/password in .env   |
| `connection timeout`    | Check internet (if using Atlas)   |
| Data not saving         | Restart backend after .env change |

---

## 📂 Other Files (NO CHANGES NEEDED)

These files are already configured correctly:

```
✅ server/config/db.js         → Handles MongoDB connection
✅ server/config/env.js        → Reads from .env file
✅ server/models/Student.js    → Database schema ready
✅ server/models/User.js       → Database schema ready
✅ server/models/AuditLog.js   → Database schema ready
```

---

## 🚀 Your Complete Setup

```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start Backend
cd c:\Users\ramlo\Desktop\smart-admission-system\server
npm run dev

# Terminal 3: Start Frontend
cd c:\Users\ramlo\Desktop\smart-admission-system\client
npm run dev

# Open browser
http://localhost:3000
```

---

## 📝 Final Checklist

- [ ] MongoDB installed (local) OR Atlas account created
- [ ] `.env` file has correct MONGODB_URI
- [ ] Backend console shows "✅ MongoDB connected successfully"
- [ ] Frontend loads: http://localhost:3000
- [ ] Can login and data persists

**You're all set!** 🎉
