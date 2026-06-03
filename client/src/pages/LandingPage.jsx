import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, UserCheck, ArrowRight } from "lucide-react";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="login-bg min-h-screen flex items-center justify-center p-4 relative">
      <div className="relative z-10 max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-primary-600">
              AdmitTrack
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            SRKREC EAPCET Smart Admission Tracking System
          </p>
          <p className="text-gray-500 dark:text-gray-500">
            Choose your role to continue
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* HOD Card */}
          <div
            onClick={() => navigate("/login/hod")}
            className="group cursor-pointer glass-card p-8 rounded-lg hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
                <UserCheck className="w-7 h-7" />
              </div>
              <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1.5 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              HOD Portal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Head of Department / Administrator Access
            </p>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                Upload and sync student data (Excel/CSV)
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                View real-time department admission statistics
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                Access comprehensive verification audit logs
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                Manage and filter all registered student profiles
              </li>
            </ul>
            <button className="mt-8 w-full glass-button py-3 rounded-lg font-semibold text-center transition-colors">
              Continue as HOD
            </button>
          </div>

          {/* Volunteer Card */}
          <div
            onClick={() => navigate("/login/volunteer")}
            className="group cursor-pointer glass-card p-8 rounded-lg hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-lg bg-accent-600 flex items-center justify-center text-white shadow-sm">
                <Users className="w-7 h-7" />
              </div>
              <ArrowRight className="w-5 h-5 text-accent-600 group-hover:translate-x-1.5 transition-transform" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Volunteer Portal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Admission Desk / Verification Coordinator Access
            </p>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                Search and select student profiles instantly
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                Update student verification steps in real-time
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                Track incomplete student checklist status
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                Monitor admission center progress daily
              </li>
            </ul>
            <button className="mt-8 w-full bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-lg py-3 text-center transition-colors">
              Continue as Volunteer
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            SRKREC EAPCET Smart Admission Tracking System
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            © 2026 SRKREC All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
