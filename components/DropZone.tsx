
import React, { useRef } from 'react';

interface DropZoneProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  subtitle?: string;
  showTextarea?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  icon, 
  subtitle,
  showTextarea = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') onChange(text);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/80 rounded-3xl overflow-hidden transition-all duration-500 group/dz shadow-sm hover:shadow-xl hover:shadow-slate-200/50">
      <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm transition-transform group-hover/dz:scale-110">
            {icon}
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{label}</h3>
            {subtitle && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex gap-4">
          {value && (
            <button onClick={() => onChange('')} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-red-500 transition-colors">
              Reset
            </button>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md,.pdf" />
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center">
        {showTextarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full p-10 bg-transparent outline-none text-sm font-medium text-slate-600 resize-none leading-relaxed placeholder-slate-300 scrollbar-hide focus:bg-indigo-50/5 transition-colors"
          />
        ) : (
          <div className="p-10 text-center space-y-6">
            {!value ? (
              <div className="opacity-40 group-hover/dz:opacity-60 transition-opacity">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Awaiting Document</p>
                <p className="text-[10px] text-slate-300 italic">Use the import button to load candidate data</p>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Profile Ingested</h4>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 mb-4">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                  Ready for Assessment
                </div>
                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed font-bold uppercase tracking-tighter">System has successfully mapped the candidate's professional trajectory.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
