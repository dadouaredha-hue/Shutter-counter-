import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ApertureDropzone } from './components/ApertureDropzone';
import { ResultsDashboard } from './components/ResultsDashboard';
import { extractMetadata } from './lib/fileSlicer';
import { ScanResult, ScanStatus } from './types';
import { Camera, Hexagon } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [results, setResults] = useState<ScanResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      setStatus('slicing');
      setErrorMsg(null);
      
      // Artificial delay to show the cool slicing UI (in a real app, slicing is instant)
      await new Promise(resolve => setTimeout(resolve, 800));
      setStatus('parsing');

      const data = await extractMetadata(file);
      
      let estimatedLifespan = data.estimatedLifespan;
      let healthScore = data.healthScore;

      if (data.make && data.make !== 'Unknown Make' && data.model && data.model !== 'Unknown Model') {
        setStatus('fetching_lifespan');
        try {
          const res = await fetch('/api/lifespan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ make: data.make, model: data.model }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.lifespan) {
              estimatedLifespan = json.lifespan;
              if (data.shutterCount !== null) {
                healthScore = Math.max(0, 100 - (data.shutterCount / estimatedLifespan) * 100);
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch lifespan", e);
        }
      }
      
      setResults(prev => {
        const newResult = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          fileName: file.name,
          ...data,
          estimatedLifespan,
          healthScore
        };
        return [...prev, newResult].slice(-2);
      });
      
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to read metadata. The file might not be a valid RAW/JPEG or lacks EXIF data.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResults([]);
    setErrorMsg(null);
  };

  const handleCompare = () => {
    setStatus('idle');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E0E0E0] font-sans flex flex-col p-8 box-border relative overflow-hidden">
      {/* Immersive Background Blur Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#00FF66] blur-[120px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] rounded-full bg-[#FF8A00] blur-[100px]"></div>
      </div>

      {/* Top Navigation */}
      <header className="flex justify-between items-center mb-10 relative z-10 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#00FF66] rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-[#00FF66] rounded-full shadow-[0_0_15px_#00FF66]"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase text-white">
              Shutter<span className="text-[#00FF66]">Pulse</span>
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Zero-Bandwidth Metadata Parser v2.4.0
            </p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-6 items-center font-mono text-[11px] text-white/60">
          <div className="flex flex-col items-end">
            <span>SYSTEM_STATUS</span>
            <span className="text-[#00FF66]">OPTIMAL_CONNECTED</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex flex-col items-end">
            <span>WASM_ENGINE</span>
            <span className="text-white">READY_ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center relative z-10 w-full mx-auto">
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'slicing' || status === 'parsing' || status === 'fetching_lifespan' ? (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex-1 flex flex-col justify-center items-center relative"
            >
              <div className="text-center mb-8">
                <h2 className="text-lg font-semibold text-white mb-2 uppercase tracking-wide">
                  {results.length === 1 ? "Scan Second Camera" : "Analyze RAW Sequence"}
                </h2>
                <p className="text-xs text-white/40 max-w-[300px] mx-auto">
                  {results.length === 1 
                    ? "Drag & drop a photo from another camera to compare" 
                    : "Drag & drop ARW, NEF, CR3, or DNG for instant client-side chunking"}
                </p>
                {results.length === 1 && status === 'idle' && (
                  <button onClick={() => setStatus('success')} className="mt-4 text-[10px] text-white/40 hover:text-white uppercase tracking-widest font-mono underline">
                    Cancel Comparison
                  </button>
                )}
              </div>

              <ApertureDropzone 
                onFileSelect={handleFileSelect} 
                status={status} 
              />
              
              {status === 'error' && errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center max-w-md"
                >
                  {errorMsg}
                  <button onClick={handleReset} className="block w-full mt-3 text-white underline">Try another file</button>
                </motion.div>
              )}
            </motion.div>
          ) : status === 'success' && results.length > 0 ? (
            <div className={cn(
              "w-full mx-auto",
              results.length === 2 ? "flex flex-col xl:flex-row gap-6 max-w-[1600px] items-start justify-center" : "max-w-[800px]"
            )}>
              {results.map((res, index) => (
                <ResultsDashboard 
                  key={res.id}
                  result={res}
                  onReset={handleReset}
                  onCompare={index === 0 && results.length === 1 ? handleCompare : undefined}
                  isComparison={results.length === 2}
                />
              ))}
            </div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-8 flex justify-between items-end relative z-10">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-white/30 uppercase">Latent Sync</span>
            <span className="text-xs font-mono text-white/70 tracking-widest">CLOUD_SYNC: ACTIVE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-white/30 uppercase">Processing</span>
            <span className="text-xs font-mono text-white/70 tracking-widest">WASM_THREADS: 08</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-white/20">
          DESIGNED FOR PROFESSIONALS // SHUTTERPULSE ECOSYSTEM © 2026
        </div>
      </footer>
    </div>
  );
}
