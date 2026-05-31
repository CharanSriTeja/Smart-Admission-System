import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, GraduationCap } from 'lucide-react';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="text-center max-w-lg animate-scale-in">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[160px] sm:text-[200px] font-black gradient-text leading-none select-none opacity-20">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-float">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-200 w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/login')}
            className="glass-button flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>

        {/* Decorative dots */}
        <div className="flex items-center justify-center gap-2 mt-12">
          <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
