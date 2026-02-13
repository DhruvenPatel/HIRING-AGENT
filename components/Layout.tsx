
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfe] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-10 py-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl shadow-slate-200 ring-1 ring-white/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              HIREGUARD <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-1.5">Enterprise Neural Evaluation</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Node Active</span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};
