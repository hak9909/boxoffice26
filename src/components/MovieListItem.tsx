import React from "react";
import { DailyBoxOfficeItem } from "../types";
import { ArrowUpRight, ArrowDownRight, Minus, Flame } from "lucide-react";
import { motion } from "motion/react";

interface MovieListItemProps {
  item: DailyBoxOfficeItem;
  isActive: boolean;
  onClick: () => void;
  maxAudience: number;
}

export const MovieListItem: React.FC<MovieListItemProps> = ({
  item,
  isActive,
  onClick,
  maxAudience,
}) => {
  const rankNum = parseInt(item.rank, 10);
  const rankIntenNum = parseInt(item.rankInten, 10);

  // Formatted audience counts
  const dailyAudiStr = parseInt(item.audiCnt, 10).toLocaleString();
  const accAudiStr = parseInt(item.audiAcc, 10).toLocaleString();

  // Determine rank styling
  const formatRankNum = (num: number) => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  // Determine audience intensity color / class
  const getIntensityBadge = () => {
    if (item.rankOldAndNew === "NEW") {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gold/15 text-gold font-mono text-[10px] font-extrabold rounded-sm">
          <Flame className="w-2.5 h-2.5 fill-current" />
          NEW
        </span>
      );
    }

    if (rankIntenNum > 0) {
      return (
        <span className="flex items-center text-emerald-400 font-mono text-[11px] font-bold">
          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
          {rankIntenNum}
        </span>
      );
    } else if (rankIntenNum < 0) {
      return (
        <span className="flex items-center text-rose-500 font-mono text-[11px] font-bold">
          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
          {Math.abs(rankIntenNum)}
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-white/20 font-mono text-[11px]">
          <Minus className="w-3.5 h-3.5" />
        </span>
      );
    }
  };

  // Relative width for the progress bar (daily audience compared to max daily audience)
  const relativeShare = maxAudience > 0 ? (parseInt(item.audiCnt, 10) / maxAudience) * 100 : 0;

  return (
    <motion.button
      id={`boxoffice-item-${item.movieCd}`}
      whileHover={{ x: 6, backgroundColor: "rgba(255, 255, 255, 0.04)" }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className={`relative w-full text-left py-4 px-3 sm:px-5 border-b border-white/10 transition-all flex items-center justify-between gap-4 overflow-hidden focus:outline-none ${
        isActive
          ? "bg-white/5 border-l-4 border-l-gold !border-b-white/20"
          : "border-l-4 border-l-transparent"
      }`}
    >
      {/* Dynamic background meter - extremely subtle trace */}
      <div 
        className="absolute top-0 left-0 bottom-0 bg-gold/[0.02] transition-all duration-500 pointer-events-none" 
        style={{ width: `${relativeShare}%` }} 
      />

      <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
        {/* Rank Display (Playfair Italic Serif) */}
        <span className={`text-2xl sm:text-3xl font-serif italic leading-none shrink-0 w-8 transition-colors ${
          isActive ? "text-gold font-bold" : "text-white/35 group-hover:text-gold"
        }`}>
          {formatRankNum(rankNum)}
        </span>

        {/* Rank Intensity / Status */}
        <div className="w-12 shrink-0 flex justify-start">
          {getIntensityBadge()}
        </div>

        {/* Title and open date */}
        <div className="min-w-0 flex-1">
          <h3 className={`font-serif text-sm sm:text-base tracking-tight truncate leading-snug transition-colors ${
            isActive ? "text-white font-bold" : "text-white/90"
          }`}>
            {item.movieNm}
          </h3>
          <p className="text-[10px] sm:text-xs text-white/50 font-mono mt-1">
            RELEASE: {item.openDt.replace(/-/g, ".")}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="text-right shrink-0 relative z-10">
        <span className="text-white/90 font-mono font-bold text-sm leading-none block">
          {dailyAudiStr} <span className="text-[10px] text-white/50 font-normal">명</span>
        </span>
        <span className="text-[10px] text-white/40 font-serif italic block mt-1.5">
          ACC: {parseInt(item.audiAcc, 10) >= 10000 
            ? `${(parseInt(item.audiAcc, 10) / 10000).toFixed(1)}만`
            : `${accAudiStr}`
          }
        </span>
      </div>
    </motion.button>
  );
};

