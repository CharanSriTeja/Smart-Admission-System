import React from 'react';

function LoadingSpinner({ fullPage = false, message = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-primary-200 dark:border-primary-900 animate-spin`}
          style={{ borderTopColor: '#6366f1', borderRightColor: '#818cf8' }}
        ></div>
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-transparent animate-spin`}
          style={{
            borderTopColor: 'rgba(99, 102, 241, 0.3)',
            animationDirection: 'reverse',
            animationDuration: '1.5s',
          }}
        ></div>
      </div>
      {message && (
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}

export default LoadingSpinner;
