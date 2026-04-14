import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-white/10 text-white border border-white/20",
    primary: "bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    success: "bg-green-500/20 text-green-400 border border-green-500/30",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
