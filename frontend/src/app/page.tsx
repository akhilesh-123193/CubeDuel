"use client";

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Cube3D from '@/components/Cube3D';
import AlgorithmDashboard from '@/components/AlgorithmDashboard';
import { Loader2, Shuffle, CheckCircle, RefreshCcw, Box, Cpu, ChevronRight, Play, Pause, FastForward, SkipForward, Hash, History, Terminal, Info, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const COPY = {
  heroThesis: "Two algorithms solve the same cube — one brute-forces its way through millions of possible states, the other uses 70 years of group theory to skip almost all of them. Scramble the cube and watch them race."
};

export default function Home() {
  const [cubeState, setCubeState] = useState('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
  const [cubeKey, setCubeKey] = useState(0);
  const [scrambleSequence, setScrambleSequence] = useState<string[]>([]);
  const [movesQueue, setMovesQueue] = useState<string[]>([]);
  const [completedMoveIndex, setCompletedMoveIndex] = useState(-1);
  const [difficulty, setDifficulty] = useState<number>(6); // Default to Easy
  const [customScrambleInput, setCustomScrambleInput] = useState('');
  
  const [initialMoves, setInitialMoves] = useState<string[]>([]);
  const [playbackDirection, setPlaybackDirection] = useState(1);
  
  const [scrambledState, setScrambledState] = useState('');
  const [isScrambling, setIsScrambling] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  
  const [optimalResult, setOptimalResult] = useState<any>(null);
  const [customResult, setCustomResult] = useState<any>(null);
  const [customTelemetry, setCustomTelemetry] = useState<any>(null);
  
  // Playback controls
  const [speed, setSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [stepCounter, setStepCounter] = useState(0);
  
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const completedMoveIndexRef = useRef(-1);
  
  const actionLock = useRef(false);

  const handleScramble = async () => {
    if (actionLock.current) return;
    actionLock.current = true;
    setIsScrambling(true);
    setOptimalResult(null);
    setCustomResult(null);
    setCustomTelemetry(null);
    setCompletedMoveIndex(-1); // Reset highlight
    completedMoveIndexRef.current = -1;
    setMovesQueue([]); // Clear solutions
    setInitialMoves([]);
    setPlaybackDirection(1);
    setIsPaused(false);
    setSpeed(1);
    
    // Clear the cube state back to solved first for a fresh scramble
    let requestState = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
    setCubeState(requestState);
    setCubeKey(prev => prev + 1); // Force 3D cube visualizer to reset internally
    
    try {
      const res = await axios.post(`${API_URL}/scramble`, { state: requestState, length: difficulty });
      setCubeState(res.data.state);
      setScrambledState(res.data.state);
      setScrambleSequence(res.data.scramble);
      setMovesQueue(res.data.scramble);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScrambling(false);
      actionLock.current = false;
    }
  };

  const handleCustomScramble = async () => {
    if (actionLock.current || !customScrambleInput.trim()) return;
    
    const parsedMoves = customScrambleInput.trim().toUpperCase().split(/\s+/);
    const validMoves = new Set(['U', 'D', 'L', 'R', 'F', 'B', "U'", "D'", "L'", "R'", "F'", "B'", 'U2', 'D2', 'L2', 'R2', 'F2', 'B2']);
    
    // Validate
    for (let m of parsedMoves) {
      if (!validMoves.has(m)) {
        alert(`Invalid move detected: ${m}. Please use standard WCA notation (e.g. R U R' F2).`);
        return;
      }
    }
    
    actionLock.current = true;
    setIsScrambling(true);
    setOptimalResult(null);
    setCustomResult(null);
    setCustomTelemetry(null);
    setCompletedMoveIndex(-1);
    completedMoveIndexRef.current = -1;
    setMovesQueue([]);
    setInitialMoves([]);
    setPlaybackDirection(1);
    setIsPaused(false);
    setSpeed(1);
    
    let requestState = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
    setCubeState(requestState);
    setCubeKey(prev => prev + 1);
    
    try {
      const res = await axios.post(`${API_URL}/scramble`, { state: requestState, moves: parsedMoves });
      setCubeState(res.data.state);
      setScrambledState(res.data.state);
      setScrambleSequence(res.data.scramble);
      setMovesQueue(res.data.scramble);
      setCustomScrambleInput(''); // Clear input on success
    } catch (e) {
      console.error(e);
    } finally {
      setIsScrambling(false);
      actionLock.current = false;
    }
  };

  const handleSolve = async () => {
    if (actionLock.current) return;
    actionLock.current = true;
    setIsSolving(true);
    setCustomTelemetry(null);
    setIsPaused(false);
    setSpeed(1);
    
    try {
      // Start Kociemba optimal solve
      const optResPromise = axios.post(`${API_URL}/solve/optimal`, { state: cubeState }).catch(e => ({ data: null, error: e }));
      
      // Start Custom IDA* solve via WebSocket
      const customPromise = new Promise((resolve) => {
        const wsUrl = API_URL.replace('http', 'ws') + '/ws/solve';
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          ws.send(JSON.stringify({ state: cubeState, max_depth: 12 }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'telemetry') {
            setCustomTelemetry(data);
          } else if (data.type === 'result') {
            resolve(data);
            ws.close();
          } else if (data.type === 'error') {
            resolve({ status: 'error', reason: data.message });
            ws.close();
          }
        };
        
        ws.onerror = () => {
          resolve({ status: 'error', reason: 'WebSocket connection failed' });
          ws.close();
        };
      });

      const [optRes, custRes] = await Promise.all([optResPromise, customPromise]);
      
      let optimalData = (optRes as any).data;
      let customData = custRes as any;
      
      if (optimalData) setOptimalResult(optimalData);
      if (customData && customData.status === 'success') {
        setCustomResult(customData);
      } else {
        setCustomResult(null); // Timeout or error
      }
      
      if (optimalData && optimalData.solution) {
        setInitialMoves(scrambleSequence);
        setMovesQueue(optimalData.solution);
        setCubeKey(prev => prev + 1);
        setCompletedMoveIndex(-1);
        completedMoveIndexRef.current = -1;
        setPlaybackDirection(1);
      } else if (customData && customData.solution) {
        setInitialMoves(scrambleSequence);
        setMovesQueue(customData.solution);
        setCubeKey(prev => prev + 1);
        setCompletedMoveIndex(-1);
        completedMoveIndexRef.current = -1;
        setPlaybackDirection(1);
      }
      
      // Reset the backend state representation back to solved!
      setCubeState('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB');
      
    } catch (e) {
      console.error(e);
    } finally {
      setIsSolving(false);
      actionLock.current = false;
    }
  };

  const handleReplay = (stepByStep: boolean) => {
    if (!optimalResult && !customResult) return;
    const solution = optimalResult ? optimalResult.solution : customResult.solution;
    
    setInitialMoves(scrambleSequence);
    setMovesQueue(solution);
    setCompletedMoveIndex(-1);
    completedMoveIndexRef.current = -1;
    setPlaybackDirection(1);
    setCubeKey(prev => prev + 1);
    
    setIsPaused(stepByStep);
    setSpeed(1); // Reset speed
  };

  const handleScrubTo = (index: number) => {
    if (!optimalResult && !customResult) return;
    const solution = optimalResult ? optimalResult.solution : customResult.solution;
    
    const current = completedMoveIndexRef.current;
    if (index === current) return;
    
    let path: string[] = [];
    if (index > current) {
      path = solution.slice(current + 1, index + 1);
      setPlaybackDirection(1);
    } else {
      const invertMove = (m: string) => {
        if (m.endsWith("'")) return m[0];
        if (m.endsWith("2")) return m;
        return m + "'";
      };
      path = solution.slice(index + 1, current + 1).reverse().map(invertMove);
      setPlaybackDirection(-1);
    }
    
    // Remount exactly at the currently completed mathematical state to avoid animation sync bugs
    const currentApplied = [...scrambleSequence, ...solution.slice(0, current + 1)];
    setInitialMoves(currentApplied);
    setMovesQueue(path);
    setCubeKey(prev => prev + 1);
    setIsPaused(false);
    setSpeed(2.5);
  };

  const handleReset = () => {
    window.location.reload();
  };

  // Derived stats
  const isIdle = !isScrambling && !isSolving && movesQueue.length === 0;
  const isAnimating = movesQueue.length > 0;
  
  return (
    <main className="min-h-screen bg-[#09090b] text-white p-4 md:p-6 lg:p-8 flex flex-col items-center selection:bg-primary selection:text-white overflow-x-hidden relative">
      
      {/* Background Aurora */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] w-full flex flex-col gap-6 relative z-10">
        
        {/* Header */}
        <header className="w-full flex justify-between items-center glass px-8 py-5 rounded-3xl border border-white/10 shadow-2xl bg-black/40 backdrop-blur-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.3)]">
              <Box className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black tracking-tighter text-white leading-tight flex items-center gap-2">
                CubeDuel
              </h1>
              <p className="text-sm text-white/60 font-medium">AI Algorithm Visualizer</p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-xs">API Status</span>
              <span className="flex items-center gap-2 text-green-400"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Connected</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-xs">Engine State</span>
              <span className="text-blue-400">{isAnimating ? (isPaused ? 'Paused' : 'Running') : 'Idle'}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-xs">Framerate</span>
              <span className="text-white">60 FPS</span>
            </div>
          </div>
        </header>

        {/* Hero Thesis */}
        <div className="w-full max-w-4xl mx-auto text-center py-4">
          <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed tracking-wide">
            {COPY.heroThesis.split('Scramble the cube')[0]}
            <span className="text-white font-bold">Scramble the cube{COPY.heroThesis.split('Scramble the cube')[1]}</span>
          </p>
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
          
          {/* Left Column: 3D Cube */}
          <div className="relative glass rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/5 bg-black/20 group h-[600px]">
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
              <h2 className="text-xl font-bold text-white/90 drop-shadow-md flex items-center gap-2 mb-2">
                <Box className="w-5 h-5 text-blue-400" /> Visualization
              </h2>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white/70">
                <span>Standard Orientation:</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-white border border-white/20"/> Top</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-green-500 border border-white/20"/> Front</span>
              </div>
            </div>
            
            <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
              <Cube3D 
                key={cubeKey}
                initialMoves={initialMoves}
                movesQueue={movesQueue} 
                speed={speed}
                isPaused={isPaused}
                stepCounter={stepCounter}
                onMoveComplete={() => {
                  completedMoveIndexRef.current += playbackDirection;
                  setCompletedMoveIndex(completedMoveIndexRef.current);
                }}
                onQueueEmpty={() => {
                  const solution = optimalResult ? optimalResult.solution : customResult?.solution;
                  const currentIdx = completedMoveIndexRef.current;
                  
                  if (playbackDirection !== 1 || speed !== 1) {
                    setIsPaused(true);
                    setSpeed(1);
                    setPlaybackDirection(1);
                    
                    if (solution) {
                      // We finished scrubbing. Queue up the rest of the solution so Play/Step Forward works!
                      setMovesQueue(solution.slice(currentIdx + 1));
                    }
                  } else if (solution && currentIdx === solution.length - 1) {
                    // Reached the end of the full sequence normally
                    setIsPaused(true);
                    setMovesQueue([]); // Clear queue to hide play controls at the end
                  }
                }} 
              />
            </div>
            
            {/* Playback Controls Overlay */}
            {isAnimating && (
              <div className="absolute top-6 right-6 z-10 glass px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 shadow-xl bg-black/60">
                {!isPaused ? (
                  <>
                    <button onClick={() => setSpeed(0.5)} className={`text-xs font-bold px-2 py-1 rounded transition-colors ${speed === 0.5 ? 'bg-primary text-white' : 'hover:bg-white/10 text-white/60'}`}>0.5x</button>
                    <button onClick={() => setSpeed(1)} className={`text-xs font-bold px-2 py-1 rounded transition-colors ${speed === 1 ? 'bg-primary text-white' : 'hover:bg-white/10 text-white/60'}`}>1.0x</button>
                    <button onClick={() => setSpeed(2)} className={`text-xs font-bold px-2 py-1 rounded transition-colors ${speed === 2 ? 'bg-primary text-white' : 'hover:bg-white/10 text-white/60'}`}>2.0x</button>
                    <button onClick={() => setSpeed(4)} className={`text-xs font-bold px-2 py-1 rounded transition-colors ${speed === 4 ? 'bg-primary text-white' : 'hover:bg-white/10 text-white/60'}`}>4.0x</button>
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    <button onClick={() => setIsPaused(true)} className="p-1 hover:bg-white/10 rounded transition-colors text-white" title="Pause">
                      <Pause className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsPaused(false)} className="p-1 hover:bg-white/10 rounded transition-colors text-white" title="Resume Playback">
                      <Play className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    <button onClick={() => setStepCounter(prev => prev + 1)} className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors text-white text-sm font-bold" title="Next Frame">
                      <SkipForward className="w-4 h-4" /> Step Forward
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Action Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 p-3 rounded-2xl glass border border-white/10 shadow-2xl bg-black/60 backdrop-blur-xl w-[90%] max-w-lg">
              <div className="flex items-center gap-3 w-full justify-between">
                <div className="flex bg-white/5 rounded-xl border border-white/10 p-1 flex-1 overflow-x-auto hide-scrollbar">
                   <button onClick={() => setDifficulty(4)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 whitespace-nowrap ${difficulty === 4 ? 'bg-blue-500 text-white' : 'text-white/50 hover:text-white'}`}>Beginner</button>
                   <button onClick={() => setDifficulty(7)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 whitespace-nowrap ${difficulty === 7 ? 'bg-green-500 text-white' : 'text-white/50 hover:text-white'}`}>Easy</button>
                   <button onClick={() => setDifficulty(10)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 whitespace-nowrap ${difficulty === 10 ? 'bg-yellow-500 text-white' : 'text-white/50 hover:text-white'}`}>Medium</button>
                   <button onClick={() => setDifficulty(15)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 whitespace-nowrap ${difficulty === 15 ? 'bg-orange-500 text-white' : 'text-white/50 hover:text-white'}`}>Hard</button>
                </div>

                <button 
                  onClick={handleScramble}
                  disabled={isScrambling || isSolving || actionLock.current}
                  className="group/btn relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden justify-center shrink-0"
                >
                  {isScrambling ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Shuffle className="w-4 h-4 text-blue-400 group-hover/btn:rotate-12 transition-transform" />}
                  <span className="font-semibold tracking-wide text-sm">Auto</span>
                </button>
                
                <button 
                  onClick={handleSolve}
                  disabled={isScrambling || isSolving || actionLock.current || scrambleSequence.length === 0 || optimalResult}
                  className="group/btn relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.4)] justify-center shrink-0"
                >
                  {isSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span className="font-semibold tracking-wide text-sm">Solve</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Algorithm Dashboard */}
          <div className="flex flex-col h-[600px] bg-black/20 rounded-3xl border border-white/5 shadow-2xl p-2 relative overflow-hidden">
             <AlgorithmDashboard optimal={optimalResult} custom={customResult} customTelemetry={customTelemetry} isSolving={isSolving} />
             
             {/* If completely idle and no results, show placeholder */}
             {!optimalResult && !customResult && !isSolving && (
               <div className="absolute inset-0 flex flex-col items-start justify-center bg-black/60 backdrop-blur-sm z-20 rounded-3xl px-12 border-2 border-dashed border-white/10">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                   <Terminal className="w-6 h-6 text-blue-400" /> How to read this
                 </h3>
                 <ul className="space-y-4 text-white/70 text-sm">
                   <li className="flex flex-col gap-1">
                     <span className="text-white font-bold">Nodes explored</span>
                     <span>How many cube states the custom solver had to check before finding (or giving up on) a solution.</span>
                   </li>
                   <li className="flex flex-col gap-1">
                     <span className="text-white font-bold">Search speed</span>
                     <span>Kociemba shows O(1) because group theory reduces the problem to a lookup, not a search.</span>
                   </li>
                   <li className="flex flex-col gap-1">
                     <span className="text-white font-bold">Max depth</span>
                     <span>How many moves deep the custom solver searched before hitting its limit.</span>
                   </li>
                 </ul>
                 <div className="mt-8 pt-6 border-t border-white/10 w-full text-center">
                   <p className="text-white/90">Hit <strong className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Scramble</strong>, then <strong className="text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">Solve Sequence</strong> to watch them race.</p>
                 </div>
               </div>
             )}
             
             {/* Info Toggle Button */}
             <button onClick={() => setIsInfoModalOpen(true)} className="absolute top-4 right-4 z-30 p-2 glass rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white" title="What's actually happening?">
               <Info className="w-5 h-5" />
             </button>
          </div>
          
        </div>

        {/* Bottom Section: Scramble & Solution Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          
          <div className="w-full glass rounded-3xl p-6 border border-white/5 bg-black/40 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold flex items-center gap-2 text-white/90">
                <Terminal className="w-4 h-4 text-blue-400" /> Custom Scramble
              </h3>
            </div>
            
            <div className="flex flex-col gap-3 min-h-[60px] p-4 bg-black/40 rounded-xl border border-white/5 h-full justify-center">
               <p className="text-white/60 text-xs mb-1">Enter your own WCA sequence to test against.</p>
               <input 
                 type="text" 
                 value={customScrambleInput}
                 onChange={(e) => setCustomScrambleInput(e.target.value)}
                 placeholder="e.g. R U R' F2 L2"
                 className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500 transition-colors uppercase font-mono shadow-inner"
                 disabled={isScrambling || isSolving}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') handleCustomScramble();
                 }}
               />
               <button 
                 onClick={handleCustomScramble}
                 disabled={isScrambling || isSolving || actionLock.current || !customScrambleInput.trim()}
                 className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/50 shadow-lg mt-1"
               >
                 Apply Custom Scramble
               </button>
            </div>
          </div>
          
          <div className="w-full glass rounded-3xl p-6 border border-white/5 bg-black/40 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold flex items-center gap-2 text-white/90">
                <Shuffle className="w-4 h-4 text-orange-400" /> Scramble Notation
              </h3>
              <div className="text-xs text-white/50 font-mono">
                {scrambleSequence.length > 0 ? `${scrambleSequence.length} moves` : 'None'}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-black/40 rounded-xl border border-white/5 items-center">
              {scrambleSequence.length === 0 ? (
                <span className="text-white/30 text-sm italic w-full text-center">Generate a scramble to begin.</span>
              ) : (
                scrambleSequence.map((m, i) => {
                  const isCurrent = movesQueue === scrambleSequence && (isPaused ? i === completedMoveIndex : i === completedMoveIndex + 1);
                  const isCompleted = movesQueue === scrambleSequence && (isPaused ? i < completedMoveIndex : i <= completedMoveIndex);
                  return (
                    <span 
                      key={i} 
                      className={`
                        px-3 py-1.5 rounded-md font-mono text-sm font-bold shadow-sm transition-all duration-300 flex-shrink-0
                        ${isCurrent ? 'bg-orange-500 text-white scale-110 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 
                          isCompleted ? 'bg-white/10 text-white/60' : 'bg-white/5 text-white border border-white/10'}
                      `}
                    >
                      {m}
                    </span>
                  )
                })
              )}
            </div>
          </div>

          <div className="w-full glass rounded-3xl p-6 border border-white/5 bg-black/40 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold flex items-center gap-2 text-white/90">
                <CheckCircle className="w-4 h-4 text-green-400" /> Solution Sequence
              </h3>
              <div className="flex items-center gap-2">
                {optimalResult && (
                  <>
                    <button onClick={() => handleReplay(true)} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors text-white">Step-by-Step</button>
                    <button onClick={() => handleReplay(false)} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded transition-colors">Replay Video</button>
                  </>
                )}
                <div className="text-xs text-white/50 font-mono ml-2">
                  {optimalResult ? `${optimalResult.solution.length} moves` : 'None'}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-black/40 rounded-xl border border-white/5 items-center">
              {!optimalResult ? (
                <span className="text-white/30 text-sm italic w-full text-center">Solve the cube to view solution sequence.</span>
              ) : (
                optimalResult.solution.map((m: string, i: number) => {
                  const isCurrent = isPaused ? i === completedMoveIndex : i === completedMoveIndex + 1;
                  const isCompleted = isPaused ? i < completedMoveIndex : i <= completedMoveIndex;
                  return (
                    <button 
                      key={i} 
                      onClick={() => handleScrubTo(i)}
                      className={`
                        px-3 py-1.5 rounded-md font-mono text-sm font-bold shadow-sm transition-all duration-300 flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95
                        ${isCurrent ? 'bg-green-500 text-white scale-110 shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:bg-green-400' : 
                          isCompleted ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/40' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/20'}
                      `}
                      title="Click to view this step"
                    >
                      {m}
                    </button>
                  )
                })
              )}
            </div>
          </div>
          
        </div>

      </div>

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative">
            <button onClick={() => setIsInfoModalOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">What's actually happening here?</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-blue-400 mb-1">What is a "state space"?</h3>
                <p className="text-white/70 text-sm leading-relaxed">Every possible arrangement of a scrambled cube. There are about 43 quintillion of them.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-orange-400 mb-1">What is IDA*?</h3>
                <p className="text-white/70 text-sm leading-relaxed">A search strategy that tries short solutions first, then gradually allows longer ones, backtracking whenever a path looks unpromising.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-purple-400 mb-1">What is a pattern database?</h3>
                <p className="text-white/70 text-sm leading-relaxed">A precomputed table of "roughly how many moves away from solved is this partial state" — used to skip bad paths early instead of exploring them fully.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-green-400 mb-1">Why does Kociemba always win?</h3>
                <p className="text-white/70 text-sm leading-relaxed">Group theory allows the cube's 43-quintillion-state problem to be mathematically split into two much smaller sub-problems, so the "optimal" solver only ever needs to search a tiny fraction of the total space, instead of wandering through it.</p>
              </div>

              <div className="border-t border-white/10 pt-6 mt-6">
                <h3 className="text-lg font-bold text-white mb-3">Cube Move Notation (WCA Standard)</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                    <strong className="text-white">Base Faces</strong><br/>
                    <span className="font-mono text-blue-400">R</span> = Right, <span className="font-mono text-blue-400">L</span> = Left<br/>
                    <span className="font-mono text-blue-400">U</span> = Up, <span className="font-mono text-blue-400">D</span> = Down<br/>
                    <span className="font-mono text-blue-400">F</span> = Front, <span className="font-mono text-blue-400">B</span> = Back
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                    <strong className="text-white">Modifiers</strong><br/>
                    <span className="font-mono text-orange-400">R</span> = 90° Clockwise<br/>
                    <span className="font-mono text-orange-400">R'</span> (Prime) = 90° Counter-Clockwise<br/>
                    <span className="font-mono text-orange-400">R2</span> = 180° Turn
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
