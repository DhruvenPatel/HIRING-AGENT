
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ChatInterface } from './components/ChatInterface';
import { ReportDashboard } from './components/ReportDashboard';
import { DropZone } from './components/DropZone';
import { InterviewStatus, AppState, Message } from './types';
import * as gemini from './services/geminiService';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const INITIAL_STATE: AppState = {
  status: InterviewStatus.IDLE,
  resumeText: '',
  jobDescription: '',
  history: []
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const liveSessionRef = useRef<any>(null);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startLiveSession = async () => {
    if (!state.candidateProfile || !state.jobProfile) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const outputAudioContext = audioContextRef.current;
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let transcriptionAccumulator = '';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            sessionPromise.then(session => {
              session.sendRealtimeInput({ text: `Hello ${state.candidateProfile?.name}. I have reviewed your profile for the ${state.jobProfile?.role} position. Let's begin the interview. Please start by introducing yourself and highlighting your relevant experience.` });
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              transcriptionAccumulator += text;
              setCurrentTranscription(transcriptionAccumulator);
            }
            if (message.serverContent?.turnComplete) {
              const text = transcriptionAccumulator;
              if (text) {
                setState(prev => ({ ...prev, history: [...prev.history, { role: 'interviewer', content: text, timestamp: Date.now() }] }));
                transcriptionAccumulator = '';
                setCurrentTranscription('');
              }
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setIsLiveActive(false);
            stream.getTracks().forEach(t => t.stop());
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `SYSTEM MISSION: You are HireGuard, an elite autonomous technical interviewer.
            BACKEND: Powered by LangGraph Multi-Agent Architecture.
            ROLE: Lead Technical Evaluator
            CANDIDATE: ${state.candidateProfile?.name}
            EXPERIENCE: ${state.candidateProfile?.experience}
            SUMMARY: ${state.candidateProfile?.summary}
            BENCHMARK ROLE: ${state.jobProfile?.role}
            CORE REQUIREMENTS: ${state.jobProfile?.requirements.join(', ')}
            
            INTERVIEW PROTOCOL (STRICT TURN-TAKING):
            1. You are the sole driver of this conversation.
            2. ASK ONE QUESTION AT A TIME. 
            3. WAIT PATIENTLY: After asking a question, you MUST stop speaking and wait for the candidate to complete their entire response.
            4. Do not interrupt. If the candidate is speaking, listen until they are finished.
            5. Transition logically based on their previous answer. If they mention a specific technology, dive deeper into it.
            6. Keep your own vocal contributions concise, professional, and insightful.
            7. Your goal is to assess technical depth, problem-solving ability, and communication clarity.`
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      alert("Microphone access is mandatory for this voice-first interview.");
    }
  };

  const toggleLive = () => {
    if (isLiveActive) {
      if (liveSessionRef.current) {
        liveSessionRef.current.close();
        liveSessionRef.current = null;
      }
      setIsLiveActive(false);
    } else {
      startLiveSession();
    }
  };

  const startAnalysis = async () => {
    if (!state.resumeText || !state.jobDescription) return;
    setLoading(true);
    try {
      // In a production scenario, this calls the FastAPI /session/initialize endpoint
      const { candidate, job } = await gemini.fastScan(state.resumeText, state.jobDescription);
      setState(prev => ({ 
        ...prev, 
        candidateProfile: candidate, 
        jobProfile: job, 
        status: InterviewStatus.CONDUCTING,
        history: [{ role: 'system', content: `Session Initialized for ${candidate.name} via Python LangGraph Backend.`, timestamp: Date.now() }]
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    setState(prev => ({ ...prev, status: InterviewStatus.EVALUATING }));
    setLoading(true);
    try {
      const report = await gemini.generateFinalReport(state.history, state.candidateProfile!, state.jobProfile!);
      setState(prev => ({ ...prev, evaluation: report, status: InterviewStatus.COMPLETED }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 overflow-auto bg-[#fcfdfe]">
        <div className="max-w-7xl mx-auto px-10 py-16 h-full">
          {state.status === InterviewStatus.IDLE && (
            <div className="space-y-16 animate-in fade-in slide-in-from-top-6 duration-1000">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.25em]">Python LangGraph Backend v3</span>
                </div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
                  Initialize <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent italic">Assessment</span>
                </h2>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
                  Import the candidate's professional profile and target role requirements to begin the neural assessment protocol driven by FastAPI and LangGraph.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                <div className="h-[600px]">
                  <DropZone 
                    label="Candidate Intelligence" 
                    subtitle="Neural Profile Source"
                    value={state.resumeText} 
                    onChange={(val) => setState(prev => ({ ...prev, resumeText: val }))} 
                    placeholder="Load resume to extract history..." 
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} 
                    showTextarea={false}
                  />
                </div>
                <div className="h-[600px]">
                  <DropZone 
                    label="Role Definition" 
                    subtitle="System Benchmark"
                    value={state.jobDescription} 
                    onChange={(val) => setState(prev => ({ ...prev, jobDescription: val }))} 
                    placeholder="Calibrating system expectations for technical depth and seniority..." 
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} 
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 pt-10">
                <button 
                  onClick={startAnalysis} 
                  disabled={!state.resumeText || !state.jobDescription || loading} 
                  className="group relative h-20 px-24 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.4em] rounded-[24px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-20 disabled:scale-95 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-5">
                    {loading ? "Optimizing Neural Pathways..." : "Establish Neural Connection"}
                    {!loading && <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                </button>
              </div>
            </div>
          )}

          {state.status === InterviewStatus.CONDUCTING && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-[calc(100vh-220px)]">
              <div className="lg:col-span-3 flex flex-col gap-8">
                <div className="bg-slate-900 p-10 rounded-[32px] shadow-2xl text-white border border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                  <div className="flex items-center gap-4 mb-10">
                    <div className={`w-3 h-3 rounded-full ${isLiveActive ? 'bg-indigo-400 animate-pulse shadow-[0_0_15px_rgba(129,140,248,1)]' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Connection Status</span>
                  </div>
                  <div className="space-y-8 relative z-10">
                    <div>
                      <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-3">Target Subject</p>
                      <p className="text-2xl font-black tracking-tight">{state.candidateProfile?.name}</p>
                    </div>
                    <div className="pt-8 border-t border-slate-800/60">
                      <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-3">Neural Benchmark</p>
                      <p className="text-sm font-bold text-slate-300 leading-relaxed uppercase tracking-tight">{state.jobProfile?.role}</p>
                    </div>
                  </div>
                  <div className="mt-10 p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-2">Backend Log</p>
                    <p className="text-[10px] text-slate-400 font-mono italic">LangGraph.State.history synchronized</p>
                  </div>
                </div>
                {!isLiveActive && (
                  <button onClick={startLiveSession} className="w-full py-6 bg-indigo-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all transform hover:-translate-y-1 active:translate-y-0">
                    Initialize Audio Link
                  </button>
                )}
                <button onClick={finishInterview} className="mt-auto px-6 py-6 bg-white text-slate-300 border border-slate-200 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all duration-300">Abort Session</button>
              </div>
              <div className="lg:col-span-9">
                <ChatInterface 
                  messages={state.history} 
                  onSendMessage={() => {}} 
                  isInterviewerThinking={loading} 
                  isAudioEnabled={true} 
                  toggleAudio={() => {}} 
                  isLiveActive={isLiveActive}
                  onLiveToggle={toggleLive}
                  currentTranscription={currentTranscription}
                />
              </div>
            </div>
          )}

          {state.status === InterviewStatus.EVALUATING && (
            <div className="flex flex-col items-center justify-center h-full space-y-10 animate-pulse">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-[2px] border-purple-200 border-b-transparent rounded-full animate-spin [animation-duration:2s]"></div>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-[0.5em]">Synthesizing Verdict</h2>
                <p className="text-slate-400 text-[10px] mt-6 uppercase tracking-[0.4em] font-bold">Python Agents are merging multi-dimensional feedback loops...</p>
              </div>
            </div>
          )}

          {state.status === InterviewStatus.COMPLETED && state.evaluation && (
            <div className="animate-in slide-in-from-bottom-12 duration-[1.2s] ease-out">
              <div className="flex items-center justify-between mb-16">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full mb-4">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Analysis Finalized</span>
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Assessment Portfolio</h2>
                </div>
                <button onClick={() => setState(INITIAL_STATE)} className="px-12 h-16 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[24px] shadow-2xl shadow-slate-200 hover:bg-slate-950 hover:shadow-slate-300 transition-all">Reset Protocol</button>
              </div>
              <ReportDashboard evaluation={state.evaluation} candidate={state.candidateProfile!} job={state.jobProfile!} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
