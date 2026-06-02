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
      await login(adminEmail, adminPassword);
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
      <div className="login-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
        {/* Floating background gradient circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/15 blur-[120px]" />

        <div className="relative z-10 w-full max-w-md animate-scale-in">
          <div className="bg-slate-900/60 backdrop-blur-2xl border border-indigo-500/20 rounded-3xl shadow-2xl p-8 sm:p-10">
            {/* Shield Icon & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/20 mb-4">
                <Shield className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Admin <span className="text-indigo-400">Control Panel</span>
              </h1>
              <p className="text-sm text-slate-400">System Administrator Access</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@college.edu"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3.5 pl-12 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Secret Key / Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3.5 pl-12 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl px-6 py-3.5 shadow-lg shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 mt-8 disabled:opacity-75"
              >
                {isLoggingIn ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Authorize & Enter'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            Authorized access only. Action will be audited.
          </p>
        </div>
      </div>
    );
  }

  // ── Render Dashboard Screen ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-mesh text-slate-100 flex flex-col">
      {/* Premium Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 dark:border-primary-400/10 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              AdmitTrack <span className="text-primary-400">Admin</span>
            </h1>
            <span className="text-xs text-slate-400">Control & User Management</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-200">{user?.name || 'Administrator'}</p>
            <p className="text-xs text-primary-400 font-medium">System Admin</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-950/30 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-900/50 rounded-xl transition-all duration-300 text-sm font-medium"
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
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Volunteers</p>
              <h3 className="text-2xl font-bold text-white mt-1">{volunteerCount}</h3>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered HODs</p>
              <h3 className="text-2xl font-bold text-white mt-1">{hodCount}</h3>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Status</p>
              <h3 className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Online
              </h3>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <section className="grid lg:grid-cols-5 gap-8">
          {/* Create User Card (Left 2 columns) */}
          <div className="lg:col-span-2 glass-card p-5 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5.5 h-5.5 text-primary-400" />
                Add User Account
              </h2>
              <p className="text-sm text-slate-400 mt-1">Assign department or tracking credentials.</p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Account Role Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('Volunteer')}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                      role === 'Volunteer'
                        ? 'bg-primary-500/10 border-primary-500 text-primary-300 shadow-sm'
                        : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Volunteer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('HOD')}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                      role === 'HOD'
                        ? 'bg-primary-500/10 border-primary-500 text-primary-300 shadow-sm'
                        : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    HOD
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex justify-between items-center">
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
          <div className="lg:col-span-3 glass-card p-5 sm:p-8 space-y-6 flex flex-col h-full">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-primary-400" />
                Active Department Accounts
              </h2>
              <p className="text-sm text-slate-400 mt-1">Review, audit, or revoke system credentials.</p>
            </div>

            {/* List Table */}
            <div className="flex-1 min-h-[300px]">
              {isLoadingUsers ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 gap-3">
                  <Loader className="w-8 h-8 animate-spin text-indigo-400" />
                  <span>Loading account registry...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="h-full min-h-[300px] border border-dashed border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-3 p-8">
                  <div className="w-12 h-12 rounded-full bg-slate-850 flex items-center justify-center text-slate-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">No accounts registered yet.</span>
                  <span className="text-xs text-slate-600 text-center max-w-[250px]">Use the creation form on the left to add HODs or volunteers.</span>
                </div>
              ) : (
                <>
                  {/* Mobile View Cards */}
                  <div className="block sm:hidden space-y-4">
                    {users.map((u) => (
                      <div key={u._id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/40 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="font-semibold text-white truncate">{u.name}</div>
                            <div className="text-xs text-slate-400 truncate" title={u.email}>{u.email}</div>
                          </div>
                          <button
                            onClick={() => confirmDelete(u)}
                            disabled={deletingId === u._id}
                            className="p-2 bg-slate-900 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-800 rounded-xl transition-all duration-200 flex-shrink-0"
                          >
                            {deletingId === u._id ? (
                              <Loader className="w-4 h-4 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-850/50">
                          <div className="flex gap-2">
                            {u.role?.toLowerCase() === 'hod' ? (
                              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                                HOD
                              </span>
                            ) : (
                              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                Volunteer
                              </span>
                            )}
                            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {u.department}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
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
                        <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Account Info</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Dept</th>
                          <th className="py-3 px-4">Created On</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{u.name}</div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              {u.role?.toLowerCase() === 'hod' ? (
                                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                                  HOD
                                </span>
                              ) : (
                                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  Volunteer
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {u.department}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400">
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
                                className="p-2 bg-slate-900 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-850 hover:border-red-950/50 rounded-xl transition-all duration-200"
                                title="Revoke user access"
                              >
                                {deletingId === u._id ? (
                                  <Loader className="w-4 h-4 animate-spin text-red-400" />
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
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => {
              setShowConfirmModal(false);
              setUserToDelete(null);
            }}
          />
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md glass-card border border-red-500/20 p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-in">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Revoke Account Access</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Are you sure you want to revoke access for <span className="font-semibold text-white">{userToDelete.name}</span> ({userToDelete.email})?
                </p>
                <p className="text-xs text-red-400 mt-1">
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
                className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-semibold text-sm transition-all duration-200"
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
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-650 to-red-550 hover:from-red-600 hover:to-red-500 text-white font-semibold text-sm shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-300"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
