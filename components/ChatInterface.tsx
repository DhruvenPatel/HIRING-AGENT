
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isInterviewerThinking: boolean;
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  isLiveActive: boolean;
  onLiveToggle: () => void;
  currentTranscription?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isInterviewerThinking,
  isLiveActive,
  onLiveToggle,
  currentTranscription
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscription]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/80 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
      {/* Header with Connection Status */}
      <div className="bg-slate-900 px-10 py-8 flex items-center justify-between text-white border-b border-slate-800">
        <div className="flex items-center gap-8">
          <div className="relative group cursor-pointer" onClick={onLiveToggle}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-700 ${
              isLiveActive ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.5)]' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                isLiveActive ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 scale-110' : 'bg-slate-700 grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" />
                </svg>
              </div>
            </div>
            {isLiveActive && (
              <div className="absolute -inset-2 border border-indigo-400/20 rounded-full animate-ping pointer-events-none"></div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full tracking-[0.2em] transition-colors ${isLiveActive ? 'bg-indigo-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                {isLiveActive ? 'NEURAL LINK ACTIVE' : 'SYSTEM STANDBY'}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight leading-none uppercase italic">Voice Interface v2.5</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Autonomous Multimodal Session</p>
          </div>
        </div>
        
        <button 
          onClick={onLiveToggle}
          className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl ${
            isLiveActive 
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
          }`}
        >
          {isLiveActive ? 'Terminate Link' : 'Establish Link'}
        </button>
      </div>
      
      {/* Transcript Feed (ReadOnly during Voice Interview) */}
      <div className="flex-1 overflow-y-auto p-12 space-y-10 bg-slate-50/20 scrollbar-hide">
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%] group">
              <div className={`flex items-center gap-3 mb-2.5 ${msg.role === 'candidate' ? 'flex-row-reverse text-right' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${msg.role === 'candidate' ? 'bg-slate-300' : 'bg-indigo-500'}`}></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {msg.role === 'candidate' ? 'Subject Transcript' : 'HireGuard Query'}
                </span>
              </div>
              <div className={`px-8 py-6 rounded-3xl text-[15px] leading-relaxed border transition-all duration-300 ${
                msg.role === 'candidate' 
                  ? 'bg-white text-slate-700 border-slate-200/80 rounded-tr-none shadow-sm' 
                  : 'bg-slate-900 text-slate-100 border-slate-800 rounded-tl-none shadow-2xl'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        
        {currentTranscription && (
          <div className="flex justify-start opacity-70">
            <div className="px-8 py-6 rounded-3xl bg-indigo-50/50 border border-indigo-100/50 text-indigo-700 text-sm italic font-medium">
              <span className="flex items-center gap-2">
                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></span>
                Processing Input: {currentTranscription}...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dynamic Voice Visualizer Block */}
      <div className="p-10 bg-white border-t border-slate-100 min-h-[160px] flex flex-col items-center justify-center">
        {!isLiveActive ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" /></svg>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Ready for Vocal Interaction</p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center py-4">
            <div className="w-full flex justify-center gap-1.5 h-16 items-center mb-8 px-12">
              {[...Array(40)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    currentTranscription ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'
                  }`} 
                  style={{ 
                    height: `${15 + Math.random() * (currentTranscription ? 85 : 15)}%`,
                    opacity: 0.2 + Math.random() * 0.8
                  }}
                ></div>
              ))}
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-6 py-2 rounded-full border border-slate-100">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                {currentTranscription ? 'Candidate Speaking' : 'Waiting for Candidate Response'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
