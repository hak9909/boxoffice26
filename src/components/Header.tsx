import React from "react";
import { Film, Calendar, TrendingUp } from "lucide-react";

interface HeaderProps {
  selectedDate: string;
  totalAudience: number;
  onDateChange: (date: string) => void;
  maxDate: string;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  totalAudience,
  onDateChange,
  maxDate,
}) => {
  // Convert YYYY-MM-DD to human-readable Uppercase English Month
  const formatEnglishDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    }).toUpperCase();
  };

  return (
    <header id="app-header" className="border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-5 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-baseline md:items-end justify-between gap-6">
        
        {/* LOGO & TITLE SECTION */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] tracking-[0.35em] uppercase text-gold font-mono font-bold">
              KOBIS API // DAILY REPORT
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-4xl md:text-5.5xl font-serif italic tracking-tighter leading-none text-white">
              Box Office
            </h1>
            <span className="text-xs font-serif text-slate-400 font-medium tracking-wide">
              일일 박스오피스 리포트
            </span>
          </div>
        </div>

        {/* CONTROLS & STATS */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-start md:justify-end">
          {/* Real-time stats */}
          {totalAudience > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-sm bg-white/5 font-mono text-[11px] uppercase tracking-wider">
              <span className="text-slate-400">Total Audience //</span>
              <span className="text-gold font-bold">{totalAudience.toLocaleString()} 명</span>
            </div>
          )}

          {/* Elegant Slate & Gold Date Selector */}
          <div className="flex flex-col items-start gap-1 w-full sm:w-auto">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 hover:border-gold/30 px-4 py-2 rounded-full transition-all w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-serif italic text-gold font-semibold uppercase tracking-wider">
                  {formatEnglishDate(selectedDate)}
                </span>
              </div>
              
              <div className="relative">
                <input
                  id="kobis-date-picker"
                  type="date"
                  value={selectedDate}
                  max={maxDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-transparent text-slate-100 font-mono text-xs font-semibold outline-none border-none py-0.5 cursor-pointer [color-scheme:dark] w-28 text-right focus:text-gold"
                />
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </header>
  );
};

