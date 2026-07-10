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
  const [isGenerating, setIsGenerating] = React.useState(false);

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

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // --- COLOR PALETTE ---
      const primaryBrand = [255, 138, 0]; // #FF8A00 (Orange)
      const textDark = [20, 20, 25];       // Very dark grey
      const textMuted = [120, 120, 128];   // Muted grey
      const lightFill = [248, 248, 250];   // Off-white/light grey for cards
      const borderCol = [230, 230, 235];   // Card borders
      
      // Select status color based on health score
      let statusColor = [0, 204, 82]; // Green
      let statusText = "OPTIMAL";
      let healthDescription = "Optimal Condition. Your camera's shutter mechanism is in great shape with plenty of estimated life remaining. Continue shooting with confidence!";
      
      if (result.healthScore <= 30) {
        statusColor = [239, 68, 68]; // Red
        statusText = "CRITICAL";
        healthDescription = "Critical Wear. Your shutter count is approaching or has exceeded its estimated lifespan rating. We recommend contacting an authorized service center for a proactive shutter mechanism inspection or replacement.";
      } else if (result.healthScore <= 70) {
        statusColor = [255, 138, 0]; // Orange
        statusText = "MODERATE";
        healthDescription = "Moderate Wear. The shutter has experienced moderate usage. It is performing well, but keep an eye on upcoming maintenance schedules if you plan intensive high-volume shoots.";
      }

      // --- PAGE 1 ---

      // 1. Decorative Header Bar (Orange accent line at the very top)
      doc.setFillColor(primaryBrand[0], primaryBrand[1], primaryBrand[2]);
      doc.rect(0, 0, 210, 4, 'F');

      // 2. Main Title Header (Y: 15 to 35)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text("SHUTTERPULSE", 20, 20);
      
      // Title Orange Accent Dot
      doc.setFillColor(primaryBrand[0], primaryBrand[1], primaryBrand[2]);
      doc.circle(91, 16.5, 1.5, 'F');

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text("ZERO-BANDWIDTH METADATA REPORT", 20, 26);

      // Document Details (Top Right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text("REPORT ID:", 145, 18);
      doc.setFont("helvetica", "normal");
      doc.text(result.id.slice(0, 8).toUpperCase(), 170, 18);

      doc.setFont("helvetica", "bold");
      doc.text("DATE:", 145, 23);
      doc.setFont("helvetica", "normal");
      const dateStr = new Date(result.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(dateStr, 170, 23);

      doc.setFont("helvetica", "bold");
      doc.text("FILE NAME:", 145, 28);
      doc.setFont("helvetica", "normal");
      // Truncate filename if too long
      const shortFileName = result.fileName.length > 20 ? result.fileName.slice(0, 17) + "..." : result.fileName;
      doc.text(shortFileName, 170, 28);

      // Divider Line
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      // 3. Camera Specs Card (Y: 45 to 80)
      doc.setFillColor(lightFill[0], lightFill[1], lightFill[2]);
      doc.roundedRect(20, 45, 170, 35, 3, 3, 'F');
      
      // Header band for card
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryBrand[0], primaryBrand[1], primaryBrand[2]);
      doc.text("CAMERA PROFILE", 26, 53);

      // Spec details
      doc.setFontSize(9);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text("CAMERA BRAND:", 26, 61);
      doc.text("CAMERA MODEL:", 26, 67);
      doc.text("SERIAL NUMBER:", 26, 73);

      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFont("helvetica", "bold");
      doc.text(result.make.toUpperCase(), 65, 61);
      doc.text(result.model, 65, 67);
      doc.setFont("helvetica", "normal");
      doc.text(result.serialNumber || "N/A (Not in metadata)", 65, 73);

      // Right side of card: Firmware + Category
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text("FIRMWARE:", 125, 61);
      doc.text("EQUIPMENT TYPE:", 125, 67);

      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(result.firmware || "N/A", 160, 61);
      doc.setFont("helvetica", "bold");
      doc.text(result.estimatedLifespan >= 200000 ? "PRO EQUIPMENT" : "CONSUMER EQUIPMENT", 160, 67);

      // 4. Primary Metrics Section (Y: 90 to 180)
      doc.setFillColor(lightFill[0], lightFill[1], lightFill[2]);
      doc.roundedRect(20, 90, 170, 90, 3, 3, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryBrand[0], primaryBrand[1], primaryBrand[2]);
      doc.text("SHUTTER LIFESPAN ANALYSIS", 26, 98);

      // Shutter stats grid
      doc.setFontSize(11);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.setFont("helvetica", "normal");
      doc.text("Current Shutter Count", 26, 110);
      doc.text("Rated Shutter Lifespan", 125, 110);

      doc.setFontSize(24);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFont("helvetica", "bold");
      const shutterCountFormatted = result.shutterCount !== null ? result.shutterCount.toLocaleString() : 'N/A';
      doc.text(shutterCountFormatted, 26, 121);
      doc.text(result.estimatedLifespan.toLocaleString(), 125, 121);

      // Horizontal Separator
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.line(26, 128, 184, 128);

      // Health Score Graphic and percentage
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text("Mechanical Health Score", 26, 138);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`${result.healthScore.toFixed(1)}%`, 26, 151);

      // Status Pill Badge
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(90, 138, 30, 7, 1.5, 1.5, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(statusText, 105, 143, { align: 'center' });

      // Progress bar for health score
      doc.setFillColor(235, 235, 240);
      doc.roundedRect(26, 160, 158, 4, 2, 2, 'F');
      
      const progressBarWidth = (result.healthScore / 100) * 158;
      if (progressBarWidth > 0) {
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(26, 160, progressBarWidth, 4, 2, 2, 'F');
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text("0% (CRITICAL)", 26, 170);
      doc.text("100% (NEW)", 161, 170);

      // 5. Insights & Actionable Recommendations (Y: 190 to 240)
      doc.setFillColor(lightFill[0], lightFill[1], lightFill[2]);
      doc.roundedRect(20, 190, 170, 45, 3, 3, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryBrand[0], primaryBrand[1], primaryBrand[2]);
      doc.text("EXPERT RECOMMENDATION", 26, 198);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      
      const lines = doc.splitTextToSize(healthDescription, 156);
      doc.text(lines, 26, 207);

      if (result.shutterCount === null) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryBrand[0], primaryBrand[1], primaryBrand[2]);
        doc.text("NOTICE: Hybrid Mode recommended to verify direct counts via physical tethering.", 26, 227);
      }

      // 6. Footer (Y: 270)
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.line(20, 265, 190, 265);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text("This document is generated automatically using ShutterPulse's metadata analysis engine.", 20, 271);
      doc.text("For certified evaluations or legal purposes, a full mechanical disassembly is recommended.", 20, 275);
      doc.text("Page 1 of 1", 190, 271, { align: 'right' });

      doc.save(`shutterpulse-report-${result.make.toLowerCase()}-${result.model.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

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
              <button 
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className={cn(
                  "w-full py-4 text-[#0A0A0C] font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed",
                  "bg-[#FF8A00] shadow-[0_0_20px_rgba(255,138,0,0.3)] hover:brightness-110"
                )}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0A0A0C] border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </>
                )}
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
