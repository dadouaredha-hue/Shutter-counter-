import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, FileImage } from 'lucide-react';
import { cn } from '../lib/utils';

interface ApertureDropzoneProps {
  onFileSelect: (file: File) => void;
  status: 'idle' | 'slicing' | 'parsing' | 'fetching_lifespan' | 'success' | 'error';
}

export function ApertureDropzone({ onFileSelect, status }: ApertureDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const isScanning = status === 'slicing' || status === 'parsing' || status === 'fetching_lifespan';

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  // Generate 6 blades for the aperture effect
  const blades = Array.from({ length: 6 });

  return (
    <div className="flex-1 flex flex-col justify-center items-center relative w-full">
      <div className="absolute top-0 left-0 text-[10px] font-mono text-white/20">[SCAN_ZONE_42_X]</div>
      <div className="relative w-full max-w-[480px] aspect-square border border-white/5 rounded-full flex items-center justify-center bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
        <div className="absolute inset-4 border border-dashed border-white/10 rounded-full animate-pulse"></div>
        <div className="absolute inset-12 border border-white/5 rounded-full"></div>
        
        {/* Crosshairs */}
        <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-[#00FF66]/50 shadow-[0_0_10px_#00FF66] pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-[#00FF66]/50 shadow-[0_0_10px_#00FF66] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 w-[1px] h-8 bg-[#00FF66]/50 shadow-[0_0_10px_#00FF66] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 w-[1px] h-8 bg-[#00FF66]/50 shadow-[0_0_10px_#00FF66] pointer-events-none"></div>

        <div 
          className={cn(
            "w-80 h-80 rounded-full overflow-hidden border-2 flex flex-col items-center justify-center text-center p-8 group z-10 transition-colors duration-300 relative cursor-pointer",
            isDragActive ? "border-[#00FF66] bg-[#00FF66]/5" : "border-white/20 hover:border-[#00FF66]/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Aperture Blades */}
          <div className={cn(
            "absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-0 pointer-events-none",
            isDragActive || isScanning ? "scale-110 rotate-12" : "scale-100 rotate-0"
          )}>
            {blades.map((_, i) => (
              <div 
                key={i}
                className="absolute top-1/2 left-1/2 w-[120%] h-[120%] bg-[#0A0A0C]/80 backdrop-blur-sm border-l border-white/10 origin-top-left aperture-blade opacity-80"
                style={{
                  transform: `rotate(${i * 60}deg) translate(-15%, -15%) skewX(${isDragActive || isScanning ? '0deg' : '30deg'})`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-4 w-16 h-16 border border-[#FF8A00]/40 rounded-lg flex items-center justify-center bg-[#FF8A00]/5 text-[#FF8A00]">
                    <Camera className="w-8 h-8 animate-spin-slow" />
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-2 uppercase tracking-wide">
                    {status === 'fetching_lifespan' ? 'Searching Database...' : 'Extracting Metadata...'}
                  </h2>
                  <div className="py-2 px-4 border border-[#FF8A00]/30 rounded-full text-[10px] font-mono text-[#FF8A00] tracking-tighter">
                    {status === 'fetching_lifespan' ? 'AI_SEARCH_GROUNDING' : 'ZERO_BANDWIDTH_SLICING'}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-4 w-16 h-16 border border-[#00FF66]/40 rounded-lg flex items-center justify-center bg-[#00FF66]/5">
                    {isDragActive ? (
                      <Upload className="w-8 h-8 text-[#00FF66]" />
                    ) : (
                      <FileImage className="w-8 h-8 text-[#00FF66]/60" />
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-2 uppercase tracking-wide">
                    {isDragActive ? 'Drop Image Here' : 'Select RAW or JPEG'}
                  </h2>
                  <div className="py-2 px-4 border border-white/10 rounded-full text-[10px] font-mono text-white/60 tracking-tighter mt-2">
                    IDLE_WAITING_FOR_INPUT
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hidden Input */}
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            accept="image/jpeg,image/png,image/tiff,image/x-adobe-dng,image/x-canon-cr2,image/x-canon-cr3,image/x-nikon-nef,image/x-sony-arw,image/x-fuji-raf"
            onChange={handleChange}
            disabled={isScanning}
          />
        </div>
      </div>
    </div>
  );
}
