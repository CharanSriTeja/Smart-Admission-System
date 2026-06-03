import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader,
  UserPlus,
  Trash2,
  Users,
  UserCheck,
  Building2,
  Activity,
  LogOut,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const DEPARTMENTS = ['CSE', 'AIML', 'CIC'];

function AdminDashboard() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Authentication states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // User creation states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Volunteer');
  const [dept, setDept] = useState('CSE');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // User list states
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Clear Database state
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [isClearingDb, setIsClearingDb] = useState(false);
  const [clearScope, setClearScope] = useState('all');
  const [clearDate, setClearDate] = useState('');
  const [clearStartTime, setClearStartTime] = useState('');
  const [clearEndTime, setClearEndTime] = useState('');

  // Redirect if logged in but not as admin (e.g. HOD or Volunteer)
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'admin') {
      if (user.role === 'hod') {
        navigate('/hod/dashboard');
      } else {
        navigate('/volunteer/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Apply Admin violet theme when mounting page
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-admin');
    return () => {
      const token = localStorage.getItem('token');
      if (!token) {
        root.classList.remove('theme-admin');
      }
    };
  }, []);

  // Fetch users if logged in as admin
  const fetchUsers = async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    setIsLoadingUsers(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      addToast('error', 'Failed to retrieve registered users.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAuthenticated, user]);

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      addToast('error', 'Please fill in all fields.');
      return;
    }
    setIsLoggingIn(true);
    try {
      await login(adminEmail, adminPassword, 'Admin');
      addToast('success', 'Admin session started successfully.');
    } catch (error) {
      const msg = error.response?.data?.message || 'Authentication failed.';
      addToast('error', msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle User Creation
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      addToast('error', 'Email, password, and role are required.');
      return;
    }
    setIsCreatingUser(true);
    try {
      const response = await api.post('/admin/users', {
        email,
        password,
        name,
        role,
        department: dept
      });
      addToast('success', response.data.message || 'Account created successfully.');
      setEmail('');
      setPassword('');
      setName('');
      setRole('Volunteer');
      setDept('CSE');
      fetchUsers(); // Refresh list
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create user account.';
      addToast('error', msg);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      addToast('success', 'Account access revoked.');
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to revoke account access.';
      addToast('error', msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Trigger delete confirmation dialog
  const confirmDelete = (u) => {
    setUserToDelete(u);
    setShowConfirmModal(true);
  };

  // Handle Clearing Database
  const handleClearDatabase = async () => {
    if (!isCheckboxChecked || !confirmPassword) return;
    if (clearScope === 'date' && !clearDate) {
      addToast('error', 'Please select a date.');
      return;
    }
    if (clearScope === 'time') {
      if (!clearStartTime || !clearEndTime) {
        addToast('error', 'Please select both start and end date/time.');
        return;
      }
      if (new Date(clearStartTime) >= new Date(clearEndTime)) {
        addToast('error', 'Start time must be before end time.');
        return;
      }
    }
    setIsClearingDb(true);
    try {
      const payload = { 
        password: confirmPassword,
        scope: clearScope
      };
      if (clearScope === 'date') {
        payload.date = clearDate;
      } else if (clearScope === 'time') {
        payload.startTime = clearStartTime;
        payload.endTime = clearEndTime;
      }

      const response = await api.delete('/admin/students/clear', {
        data: payload
      });
      addToast('success', response.data.message || 'Database cleared successfully.');
      setShowClearModal(false);
      setConfirmPassword('');
      setIsCheckboxChecked(false);
      setClearScope('all');
      setClearDate('');
      setClearStartTime('');
      setClearEndTime('');
    } catch (error) {
      const msg = error.response?.data?.message || 'Verification failed. Database not cleared.';
      addToast('error', msg);
    } finally {
      setIsClearingDb(false);
    }
  };

  // Helper: Generate a strong random password
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    addToast('success', 'Secure password generated.');
  };

  // Stats selectors
  const volunteerCount = users.filter(u => u.role?.toLowerCase() === 'volunteer').length;
  const hodCount = users.filter(u => u.role?.toLowerCase() === 'hod').length;

  // ── Render Login Screen ────────────────────────────────────────────────────
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="login-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black font-mono">
        {/* Subtle background red glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-950/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-md animate-scale-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-none p-8 sm:p-10">
            {/* Shield Icon & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-red-600 mb-4 border border-red-500/20">
                <Shield className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
                ADMIN <span className="text-red-500">CONSOLE</span>
              </h1>
              <p className="text-xs text-zinc-500">root@admintrack:~# auth_required</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-650" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="[EMAIL_ADDRESS]"
                    className="w-full bg-black border border-zinc-800 rounded-none px-4 py-3.5 pl-12 text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Secret Key / Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-650" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-zinc-800 rounded-none px-4 py-3.5 pl-12 pr-12 text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-red-650 hover:bg-red-600 text-white font-bold rounded-none px-6 py-3.5 border border-red-500/30 transition-all duration-300 flex items-center justify-center gap-2 mt-8 disabled:opacity-75"
              >
                {isLoggingIn ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'ACCESS CONSOLE'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-zinc-600 mt-6">
            Authorized session only. System activity is logged under /var/log/auth.
          </p>
        </div>
      </div>
    );
  }

  // ── Render Dashboard Screen ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-mesh text-white flex flex-col font-mono">
      {/* Code style Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-black px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-red-650 flex items-center justify-center border border-red-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              ADMIN@ADMITTRACK:<span className="text-red-500">~$</span>
            </h1>
            <span className="text-xs text-zinc-500">Control & User Management</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-zinc-200">{user?.name || 'Administrator'}</p>
            <p className="text-xs text-red-500 font-medium">System Admin</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-950 hover:bg-red-950/30 text-zinc-300 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 rounded-none transition-all duration-300 text-sm font-medium"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-8 animate-fade-in">
        {/* Stats Grid */}
        <section className="grid sm:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex items-center gap-5 border border-zinc-800 rounded-none bg-zinc-950">
            <div className="w-12 h-12 rounded-none bg-red-500/5 text-red-500 border border-red-900/20 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Registered Volunteers</p>
              <h3 className="text-2xl font-bold text-white mt-1">{volunteerCount}</h3>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5 border border-zinc-800 rounded-none bg-zinc-950">
            <div className="w-12 h-12 rounded-none bg-red-500/5 text-red-500 border border-red-900/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Registered HODs</p>
              <h3 className="text-2xl font-bold text-white mt-1">{hodCount}</h3>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5 border border-zinc-800 rounded-none bg-zinc-950">
            <div className="w-12 h-12 rounded-none bg-emerald-500/5 text-emerald-500 border border-emerald-900/20 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">System Status</p>
              <h3 className="text-lg font-bold text-emerald-500 mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Online
              </h3>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <section className="grid lg:grid-cols-5 gap-8">
          {/* Create User Card (Left 2 columns) */}
          <div className="lg:col-span-2 glass-card p-5 sm:p-8 space-y-6 border border-zinc-800 rounded-none bg-zinc-950">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5.5 h-5.5 text-red-500" />
                Add User Account
              </h2>
              <p className="text-sm text-zinc-500 mt-1">Assign department or tracking credentials.</p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Account Role Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('Volunteer')}
                    className={`py-2.5 rounded-none border text-sm font-semibold transition-all duration-300 ${role === 'Volunteer'
                      ? 'bg-red-500/10 border-red-500 text-red-400 shadow-sm'
                      : 'bg-transparent border-zinc-800 text-zinc-450 hover:border-zinc-700'
                      }`}
                  >
                    Volunteer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('HOD')}
                    className={`py-2.5 rounded-none border text-sm font-semibold transition-all duration-300 ${role === 'HOD'
                      ? 'bg-red-500/10 border-red-500 text-red-400 shadow-sm'
                      : 'bg-transparent border-zinc-800 text-zinc-450 hover:border-zinc-700'
                      }`}
                  >
                    HOD
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'HOD' ? 'e.g. Dr. Kumar' : 'e.g. Ramesh Babu'}
                  className="w-full glass-input"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'HOD' ? 'hod@college.edu' : 'volunteer@college.edu'}
                  required
                  className="w-full glass-input"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider flex justify-between items-center">
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Auto-Generate
                  </button>
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter or generate password"
                  required
                  className="w-full glass-input"
                />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Department
                </label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full glass-input"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d} Department</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isCreatingUser}
                className="w-full glass-button flex items-center justify-center gap-2 mt-6"
              >
                {isCreatingUser ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Add Account
                  </>
                )}
              </button>
            </form>
          </div>

          {/* User Registry (Right 3 columns) */}
          <div className="lg:col-span-3 glass-card p-5 sm:p-8 space-y-6 flex flex-col h-full border border-zinc-800 rounded-none bg-zinc-950">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-red-500" />
                Active Department Accounts
              </h2>
              <p className="text-sm text-zinc-500 mt-1">Review, audit, or revoke system credentials.</p>
            </div>

            {/* List Table */}
            <div className="flex-1 min-h-[300px]">
              {isLoadingUsers ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-zinc-500 gap-3">
                  <Loader className="w-8 h-8 animate-spin text-red-500" />
                  <span>Loading account registry...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="h-full min-h-[300px] border border-dashed border-zinc-800 rounded-none flex flex-col items-center justify-center text-zinc-500 gap-3 p-8">
                  <div className="w-12 h-12 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-650">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">No accounts registered yet.</span>
                  <span className="text-xs text-zinc-600 text-center max-w-[250px]">Use the creation form on the left to add HODs or volunteers.</span>
                </div>
              ) : (
                <>
                  {/* Mobile View Cards */}
                  <div className="block sm:hidden space-y-4">
                    {users.map((u) => (
                      <div key={u._id} className="p-4 rounded-none border border-zinc-800 bg-zinc-950/40 space-y-3">
                        <div className="flex justify-between items-start">
                           <div className="min-w-0 flex-1 pr-2">
                            <div className="font-semibold text-white truncate">{u.name}</div>
                            <div className="text-xs text-zinc-450 truncate" title={u.email}>{u.email}</div>
                          </div>
                          <button
                            onClick={() => confirmDelete(u)}
                            disabled={deletingId === u._id}
                            className="p-2 bg-black hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-none transition-all duration-200 flex-shrink-0"
                          >
                            {deletingId === u._id ? (
                              <Loader className="w-4 h-4 animate-spin text-red-405" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/50">
                          <div className="flex gap-2">
                            {u.role?.toLowerCase() === 'hod' ? (
                              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-none bg-red-500/10 text-red-300 border border-red-500/20">
                                HOD
                              </span>
                            ) : (
                              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-none bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Volunteer
                              </span>
                            )}
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-none bg-zinc-900 border border-zinc-800 text-zinc-300">
                              {u.department}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tablet/Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Account Info</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Dept</th>
                          <th className="py-3 px-4">Created On</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id} className="border-b border-zinc-850 hover:bg-zinc-900 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{u.name}</div>
                              <div className="text-xs text-zinc-450">{u.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              {u.role?.toLowerCase() === 'hod' ? (
                                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-none bg-red-500/10 text-red-300 border border-red-500/20">
                                  HOD
                                </span>
                              ) : (
                                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-none bg-zinc-800 text-zinc-300 border border-zinc-700">
                                  Volunteer
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-none bg-zinc-900 border border-zinc-800 text-zinc-300">
                                {u.department}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-zinc-500">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => confirmDelete(u)}
                                disabled={deletingId === u._id}
                                className="p-2 bg-black hover:bg-red-950/20 text-zinc-500 hover:text-red-450 border border-zinc-800 hover:border-red-950/50 rounded-none transition-all duration-200"
                                title="Revoke user access"
                              >
                                {deletingId === u._id ? (
                                  <Loader className="w-4 h-4 animate-spin text-red-500" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
                )}
            </div>
          </div>
        </section>

        {/* System Administration / Reset Database Card */}
        <section className="glass-card p-6 sm:p-8 border border-red-500/40 rounded-none bg-zinc-950/40 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5.5 h-5.5 text-red-500" />
              Reset Admission Database
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Clear all student admission records and system audit logs to prepare the system for the next counseling cycle.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowClearModal(true)}
              className="px-6 py-3 rounded-none bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 text-sm font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <Trash2 className="w-4.5 h-4.5" />
              Clear Student Database
            </button>
          </div>
        </section>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowConfirmModal(false);
              setUserToDelete(null);
            }}
          />
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md glass-card border border-red-500/40 p-6 sm:p-8 space-y-6 rounded-none bg-zinc-950 shadow-2xl animate-scale-in">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-none bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Revoke Account Access</h3>
                <p className="text-sm text-zinc-400 mt-2">
                  Are you sure you want to revoke access for <span className="font-semibold text-white">{userToDelete.name}</span> ({userToDelete.email})?
                </p>
                <p className="text-xs text-red-405 mt-1">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setUserToDelete(null);
                }}
                className="flex-1 py-3 rounded-none border border-zinc-800 hover:bg-zinc-900 text-zinc-350 font-semibold text-sm transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteUser(userToDelete._id);
                  setShowConfirmModal(false);
                  setUserToDelete(null);
                }}
                className="flex-1 py-3 rounded-none bg-red-650 hover:bg-red-600 text-white font-semibold text-sm border border-red-500/30 hover:border-red-500/50 transition-all duration-300"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Database Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              if (!isClearingDb) {
                setShowClearModal(false);
                setConfirmPassword('');
                setIsCheckboxChecked(false);
                setClearScope('all');
                setClearDate('');
                setClearStartTime('');
                setClearEndTime('');
              }
            }}
          />
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md glass-card border border-red-500/40 p-6 sm:p-8 space-y-6 rounded-none bg-zinc-950 shadow-2xl animate-scale-in">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-none bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset System Database</h3>
                <p className="text-sm text-zinc-400 mt-2">
                  This action will <span className="text-red-400 font-semibold">permanently delete all student records</span> and their corresponding audit trail history from the system.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* Reset Scope Selector */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider">
                  Reset Scope
                </label>
                <select
                  value={clearScope}
                  onChange={(e) => setClearScope(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all duration-300 text-sm"
                  disabled={isClearingDb}
                >
                  <option value="all">All Student Records (Global Reset)</option>
                  <option value="date">Date-Based Deletion</option>
                  <option value="time">Time-Based Deletion (Custom Range)</option>
                </select>
              </div>

              {/* Conditionally Render Date Picker */}
              {clearScope === 'date' && (
                <div className="space-y-1.5 text-left animate-slide-down">
                  <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={clearDate}
                    onChange={(e) => setClearDate(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all duration-300 text-sm"
                    disabled={isClearingDb}
                    required
                  />
                </div>
              )}

              {/* Conditionally Render Time Range Picker */}
              {clearScope === 'time' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left animate-slide-down">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={clearStartTime}
                      onChange={(e) => setClearStartTime(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all duration-300 text-sm"
                      disabled={isClearingDb}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={clearEndTime}
                      onChange={(e) => setClearEndTime(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-none px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all duration-300 text-sm"
                      disabled={isClearingDb}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Checkbox confirmation */}
              <label className="flex items-start gap-3 cursor-pointer group text-left">
                <input
                  type="checkbox"
                  checked={isCheckboxChecked}
                  onChange={(e) => setIsCheckboxChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded-none border-zinc-800 text-red-600 focus:ring-red-550 bg-black"
                  disabled={isClearingDb}
                />
                <span className="text-xs text-zinc-450 group-hover:text-zinc-350 transition-colors">
                  I understand that this action is irreversible and all active admission data will be lost forever.
                </span>
              </label>

              {/* Password Re-entry */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-450 uppercase tracking-wider text-left">
                  Re-enter Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-650" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter your admin password"
                    className="w-full bg-black border border-zinc-800 rounded-none px-4 py-3 pl-12 text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all duration-300 text-sm"
                    disabled={isClearingDb}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setConfirmPassword('');
                  setIsCheckboxChecked(false);
                  setClearScope('all');
                  setClearDate('');
                  setClearStartTime('');
                  setClearEndTime('');
                }}
                disabled={isClearingDb}
                className="flex-1 py-3 rounded-none border border-zinc-800 hover:bg-zinc-900 text-zinc-350 font-semibold text-sm transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearDatabase}
                disabled={!isCheckboxChecked || !confirmPassword || isClearingDb}
                className="flex-1 py-3 rounded-none bg-red-650 hover:bg-red-600 text-white font-semibold text-sm border border-red-500/30 hover:border-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearingDb ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader className="w-4 h-4 animate-spin" />
                    Clearing...
                  </span>
                ) : (
                  'Yes, Reset System'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
