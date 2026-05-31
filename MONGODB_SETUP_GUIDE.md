# MongoDB Connection Guide - Step by Step

## 🎯 Overview

Your project currently runs in **offline mode** (no database). Follow these steps to connect to MongoDB.

---

## **OPTION 1: Local MongoDB (Easiest for Development)**

### **Step 1: Download & Install MongoDB**

1. Go to: https://www.mongodb.com/try/download/community
2. Select your OS (Windows) and download the installer
3. Run the installer (`mongodb-windows-x86_64-*.msi`)
4. Choose "Install MongoDB as a Service" (recommended)
5. Keep default installation path: `C:\Program Files\MongoDB\Server\7.0`
6. Complete the installation

✅ **Verify Installation:**

```bash
mongod --version
```

---

### **Step 2: Start MongoDB Service**

#### **Option A: Start as Service (Automatic)**

MongoDB should auto-start after installation. To verify:

1. Open Services (`Win + R` → type `services.msc`)
2. Look for "MongoDB Server"
3. Status should be "Running"

#### **Option B: Start Manually**

Open a **new terminal** and run:

```bash
mongod
```

You should see:

```
[initandlisten] Waiting for connections on port 27017
```

✅ **Keep this terminal open while working!**

---

### **Step 3: Update Environment Variables**

Open your `.env` file:

```
c:\Users\ramlo\Desktop\smart-admission-system\server\.env
```

**Current content:**

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-admission
JWT_SECRET=dev-secret-key-change-in-production-abc123xyz
JWT_EXPIRY=24h
NODE_ENV=development
```

✅ **This is already configured for local MongoDB!** No changes needed.

---

### **Step 4: Restart Your Backend Server**

In your server terminal:

```bash
cd c:\Users\ramlo\Desktop\smart-admission-system\server
npm run dev
```

You should see:

```
✅ MongoDB connected successfully
📦 MongoDB host: localhost
🔌 Socket.IO initialised
🚀 Server running on port 5000
```

✅ **Connection successful!**

---

## **OPTION 2: MongoDB Atlas (Cloud Database)**

### **Step 1: Create MongoDB Atlas Account**

1. Go to: https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with:
   - Email
   - Password
   - Full Name
4. Accept Terms and Create Account
5. Check your email and verify

---

### **Step 2: Create a Cluster**

1. Click "Create a Deployment"
2. Choose **"Free"** (M0 cluster)
3. Cloud Provider: AWS (or your preference)
4. Region: Choose closest to your location
5. Click "Create Deployment"
6. Wait 5-10 minutes for cluster to deploy

---

### **Step 3: Create Database User**

1. In Atlas dashboard, click "Database Access"
2. Click "Add New Database User"
3. Enter:
   - **Username**: `admin`
   - **Password**: Create strong password (e.g., `Mongo@2026Secure`)
   - **Built-in Role**: `Atlas Admin`
4. Click "Add User"

✅ **Save your username & password!**

---

### **Step 4: Whitelist IP Address**

1. Click "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development only)
   - Or enter your specific IP
4. Click "Confirm"

⚠️ **For production, use specific IP only!**

---

### **Step 5: Get Connection String**

1. Go to "Clusters" → "Connect"
2. Choose "Drivers"
3. Copy the connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

✅ **Replace `<password>` with your actual password!**

---

### **Step 6: Update .env File**

Edit your `.env` file:

```
c:\Users\ramlo\Desktop\smart-admission-system\server\.env
```

**Replace this line:**

```
MONGODB_URI=mongodb://localhost:27017/smart-admission
```

**With this:**

```
MONGODB_URI=mongodb+srv://admin:Mongo@2026Secure@cluster0.xxxxx.mongodb.net/smart-admission?retryWrites=true&w=majority
```

⚠️ **Replace:**

- `admin` with your username
- `Mongo@2026Secure` with your password
- `cluster0.xxxxx` with your actual cluster URL

---

### **Step 7: Restart Backend Server**

```bash
cd c:\Users\ramlo\Desktop\smart-admission-system\server
npm run dev
```

You should see:

```
✅ MongoDB connected successfully
📦 MongoDB host: cluster0.xxxxx.mongodb.net
🔌 Socket.IO initialised
🚀 Server running on port 5000
```

✅ **Cloud connection successful!**

---

## **Step 8: Verify Database Connection**

### **Test in Your App:**

1. Open frontend: http://localhost:3000
2. Navigate to landing page
3. Try to login (or upload students if HOD)
4. Check if data persists

### **Test with MongoDB Compass (Optional):**

1. Download: https://www.mongodb.com/products/compass
2. Connect using your connection string
3. Should see `smart-admission` database

---

## 📁 **Files to Modify**

### **File 1: `.env` (SERVER CONFIG)**

📍 Location: `server/.env`

```env
# ✅ Already correct for local MongoDB:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-admission
JWT_SECRET=dev-secret-key-change-in-production-abc123xyz
JWT_EXPIRY=24h
NODE_ENV=development

# 🔄 Change MONGODB_URI only if using MongoDB Atlas (cloud)
# MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster.mongodb.net/smart-admission
```

---

### **File 2: `server/config/db.js` (DATABASE CONNECTION)**

📍 Location: `server/config/db.js`

✅ **NO CHANGES NEEDED** - Already handles both local and cloud MongoDB!

Current code:

```javascript
const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });

    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`📦 MongoDB host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("💥 Failed to connect to MongoDB:", error.message);
    console.warn(
      "⚠️  Running in offline mode - MongoDB will be required for data persistence",
    );
    return null; // Allow app to continue without database
  }
};
```

---

### **File 3: `server/config/env.js` (ENVIRONMENT VARIABLES)**

📍 Location: `server/config/env.js`

✅ **NO CHANGES NEEDED** - Already reads from `.env` file!

Current code:

```javascript
import dotenv from "dotenv";

dotenv.config();

export default {
  PORT: process.env.PORT || 5000,
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/smart-admission",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
  JWT_EXPIRY: process.env.JWT_EXPIRY || "24h",
  NODE_ENV: process.env.NODE_ENV || "development",
};
```

---

### **File 4: `server/models/Student.js` (STUDENT SCHEMA)**

📍 Location: `server/models/Student.js`

✅ **NO CHANGES NEEDED** - Schema is ready for MongoDB!

---

### **File 5: `server/models/User.js` (USER SCHEMA)**

📍 Location: `server/models/User.js`

✅ **NO CHANGES NEEDED** - Schema is ready for MongoDB!

---

### **File 6: `server/models/AuditLog.js` (AUDIT SCHEMA)**

📍 Location: `server/models/AuditLog.js`

✅ **NO CHANGES NEEDED** - Schema is ready for MongoDB!

---

## 🚀 **Quick Start - Complete Steps**

### **For Local MongoDB:**

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd c:\Users\ramlo\Desktop\smart-admission-system\server
npm run dev

# Terminal 3: Start Frontend
cd c:\Users\ramlo\Desktop\smart-admission-system\client
npm run dev
```

Then open: http://localhost:3000

---

### **For MongoDB Atlas (Cloud):**

1. Create MongoDB Atlas account and cluster
2. Create database user
3. Whitelist your IP
4. Get connection string
5. Edit `.env` file with connection string:
   ```
   MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster.mongodb.net/smart-admission
   ```
6. Restart backend:
   ```bash
   npm run dev
   ```
7. Open: http://localhost:3000

---

## ✅ **Verification Checklist**

- [ ] MongoDB installed and running (local) OR MongoDB Atlas cluster created
- [ ] `.env` file has correct `MONGODB_URI`
- [ ] Backend server shows "✅ MongoDB connected successfully"
- [ ] No errors in server console
- [ ] Frontend loads without errors
- [ ] Can login to application
- [ ] Data persists after page refresh

---

## 🔍 **Troubleshooting**

### **Error: "connect ECONNREFUSED"**

```
Solution: Make sure mongod is running in a separate terminal
$ mongod
```

### **Error: "authentication failed"**

```
Solution: Check username and password in .env file
- Make sure password doesn't have special characters that need escaping
- Example: If password is "P@ss!", use "P%40ss%21" in connection string
```

### **Error: "connection timeout"**

```
Solution: Check your internet connection (if using MongoDB Atlas)
Or ensure MongoDB service is running (if local)
```

### **Data not persisting**

```
Solution: Verify MongoDB connection with:
mongo
use smart-admission
show collections
```

---

## 📝 **Summary**

| Step | Action                                  | File(s) to Edit      |
| ---- | --------------------------------------- | -------------------- |
| 1    | Install MongoDB or create Atlas account | None                 |
| 2    | Start MongoDB service                   | None                 |
| 3    | Update connection string in .env        | `server/.env`        |
| 4    | Restart backend server                  | None                 |
| 5    | Verify connection                       | Check console output |

---

## 📞 **Need Help?**

- MongoDB Docs: https://docs.mongodb.com/manual/
- Mongoose Docs: https://mongoosejs.com/
- Atlas Docs: https://docs.atlas.mongodb.com/

**Your project is ready for MongoDB! Choose local or cloud and follow the steps above.** ✨
