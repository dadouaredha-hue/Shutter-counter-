import React from 'react';
import { motion } from 'motion/react';
import { ScanResult } from '../types';
import { Camera, ShieldCheck, Activity, Download, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { HealthGauge } from './HealthGauge';

interface ResultsDashboardProps {
  key?: React.Key | string;
  result: ScanResult;
  onReset: () => void;
  onCompare?: () => void;
  isComparison?: boolean;
}

export function ResultsDashboard({ result, onReset, onCompare, isComparison }: ResultsDashboardProps) {
  // Stroke Dasharray for SVG Circle (Circumference of r=40 is ~251.2)
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (result.healthScore / 100) * circumference;

  const scoreColor = result.healthScore > 70 
    ? "text-cyber-green" 
    : result.healthScore > 30 
      ? "text-cyber-orange" 
      : "text-red-500";
      
  const strokeColor = result.healthScore > 70 
    ? "#00FF66" 
    : result.healthScore > 30 
      ? "#FF7B00" 
      : "#EF4444";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full mx-auto flex flex-col gap-6", isComparison ? "flex-1 max-w-[800px]" : "max-w-[800px]")}
    >
      <div className="flex justify-between items-center w-full mb-4">
        <button 
          onClick={onReset}
          className="px-4 py-2 bg-white/5 text-white/80 font-mono text-[10px] uppercase tracking-widest rounded-lg border border-white/10 hover:bg-white/10 transition-colors flex items-center"
        >
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> {isComparison ? "Start Over" : "Back to Scanner"}
        </button>
      </div>

      <div className={cn("flex gap-6", isComparison ? "flex-col" : "flex-col md:flex-row")}>
        {/* Main Analysis Panel */}
        <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">Analysis Complete</span>
              <h3 className="text-xl font-bold text-white">{result.make} {result.model}</h3>
              <span className="text-[10px] font-mono text-white/40 flex items-center mt-1">
                <Camera className="w-3 h-3 mr-1" /> {result.fileName}
              </span>
            </div>
            <div className="bg-[#FF8A00]/10 text-[#FF8A00] text-[10px] font-mono px-2 py-1 rounded border border-[#FF8A00]/20">
              {result.estimatedLifespan >= 200000 ? 'PRO_EQUIPMENT' : 'CONSUMER_EQUIPMENT'}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-mono text-white/60">SHUTTER_COUNT</span>
                <span className="text-3xl font-mono text-white font-bold tracking-tighter">
                  {result.shutterCount !== null ? result.shutterCount.toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className={cn("h-full shadow-[0_0_10px_currentColor]", scoreColor)}
                  style={{ backgroundColor: strokeColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (result.shutterCount || 0) / result.estimatedLifespan * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px] font-mono text-white/30 uppercase">
                <span>0</span>
                <span>EST. RATING: {result.estimatedLifespan.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-white/40 block mb-1">SERIAL_NO</span>
                <span className="text-sm font-mono text-white">{result.serialNumber || 'Unknown'}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-white/40 block mb-1">FIRMWARE</span>
                <span className="text-sm font-mono text-white">{result.firmware || 'Unknown'}</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 mt-8 mb-4">
              <HealthGauge score={result.healthScore} size={140} />
              <div className="flex-1 space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[11px] items-center">
                    <span className="text-white/60">HEALTH_SCORE</span>
                    <span className={cn("font-mono", scoreColor)}>
                      {result.healthScore.toFixed(1)}% - {result.healthScore > 70 ? 'OPTIMAL' : result.healthScore > 30 ? 'MODERATE' : 'CRITICAL'}
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "h-2 rounded-sm transition-colors",
                          i < Math.round(result.healthScore / 10) 
                            ? (result.healthScore > 70 ? "bg-[#00FF66]" : result.healthScore > 30 ? "bg-[#FF8A00]" : "bg-[#EF4444]")
                            : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className={cn("bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col", isComparison ? "w-full" : "w-full md:w-[320px]")}>
          <h4 className="text-[11px] font-mono text-white/60 uppercase tracking-widest mb-4">Actions & Export</h4>
          
          <div className="flex-1 flex flex-col">
            <div className="mb-6 p-4 bg-white/5 border border-white/5 rounded-xl">
              <span className="text-[9px] font-mono text-white/40 block mb-2 uppercase">Status</span>
              <div className="flex items-start gap-2">
                {result.shutterCount !== null ? (
                  <ShieldCheck className="w-4 h-4 text-[#00FF66] mt-0.5" />
                ) : (
                  <Activity className="w-4 h-4 text-red-500 mt-0.5" />
                )}
                <div>
                  <div className="text-sm text-white font-medium">{result.shutterCount !== null ? 'Verified' : 'Missing'}</div>
                  <div className="text-xs text-white/40 mt-1">
                    {result.shutterCount !== null ? 'Extracted from MakerNotes' : 'Requires physical connection'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              {onCompare && (
                <button 
                  onClick={onCompare}
                  className="w-full py-4 bg-[#00FF66] text-[#0A0A0C] font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:brightness-110 transition-all flex items-center justify-center"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Compare Another
                </button>
              )}
              <button className={cn("w-full py-4 text-[#0A0A0C] font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center", onCompare ? "bg-[#FF8A00] shadow-[0_0_20px_rgba(255,138,0,0.3)] hover:brightness-110" : "bg-[#FF8A00] shadow-[0_0_20px_rgba(255,138,0,0.3)] hover:brightness-110")}>
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </button>
              <button className="w-full py-3 bg-white/5 text-white/80 font-semibold text-[10px] uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10">
                B2B Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {result.shutterCount === null && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} delay={0.5}
          className="mt-4 p-4 bg-[#FF8A00]/10 border border-[#FF8A00]/30 rounded-xl flex items-start"
        >
          <div className="w-2 h-2 rounded-full bg-[#FF8A00] mt-1.5 mr-4 flex-shrink-0" />
          <p className="text-sm text-zinc-300">
            <strong className="text-white font-medium block mb-1">Hybrid Mode Recommended</strong>
            This camera model ({result.make}) does not store shutter count directly in standard image metadata. 
            To get an accurate reading, please use the ShutterPulse Pro desktop client via USB tethering.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
