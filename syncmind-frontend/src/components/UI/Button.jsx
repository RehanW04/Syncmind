import React from 'react';

export default function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  const base = "flex items-center justify-center gap-2 px-5 py-3 rounded-[14px] font-semibold transition-all w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed tracking-tight";
  const variants = {
    primary: "bg-gradient-to-br from-[#007AFF] to-[#5856D6] hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/25 text-white hover:-translate-y-0.5",
    secondary: "bg-white/50 hover:bg-white/70 text-[#1d1d1f] border border-white/50 backdrop-blur-xl hover:-translate-y-0.5 hover:shadow-md",
    danger: "bg-gradient-to-br from-[#FF3B30] to-[#FF2D55] hover:brightness-110 text-white hover:shadow-lg hover:shadow-red-500/25"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}