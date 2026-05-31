import React from 'react';

function SkeletonLoader({ variant = 'text', count = 1, className = '' }) {
  const variants = {
    text: 'h-4 rounded-lg',
    'text-lg': 'h-6 rounded-lg',
    card: 'h-40 rounded-2xl',
    'table-row': 'h-14 rounded-xl',
    circle: 'w-12 h-12 rounded-full',
    'stat-card': 'h-32 rounded-2xl',
    avatar: 'w-10 h-10 rounded-xl',
  };

  const baseClass = variants[variant] || variants.text;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`skeleton-shimmer bg-gray-200/60 dark:bg-gray-800/40 ${baseClass} ${className}`}
          style={{
            width: variant === 'text' ? `${Math.random() * 40 + 60}%` : undefined,
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonLoader variant="circle" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text-lg" className="w-1/3" />
          <SkeletonLoader variant="text" className="w-1/2" />
        </div>
      </div>
      <SkeletonLoader variant="text" count={3} />
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLoader key={i} variant="text" className="flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLoader key={i} variant="table-row" />
      ))}
    </div>
  );
}

export { SkeletonCard, SkeletonTable };
export default SkeletonLoader;
