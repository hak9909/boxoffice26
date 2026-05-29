import React, { useState, useEffect } from "react";
import { MovieInfo, DailyBoxOfficeItem } from "../types";
import { 
  X, 
  Clapperboard, 
  Clock, 
  Globe, 
  Tags, 
  Award, 
  CirclePercent, 
  Sparkles, 
  Copy, 
  Check, 
  PenTool, 
  Flame,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

interface MovieDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieInfo: MovieInfo | null;
  boxOfficeStats: DailyBoxOfficeItem | null;
  loading: boolean;
  error: string | null;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  isOpen,
  onClose,
  movieInfo,
  boxOfficeStats,
  loading,
  error,
}) => {
  // Local states for the review generator
  const [shortReview, setShortReview] = useState<string>("");
  const [detailedReview, setDetailedReview] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  // Restore saved review from localStorage whenever movie selection changes
  useEffect(() => {
    if (movieInfo?.movieCd) {
      const savedReview = localStorage.getItem(`review-${movieInfo.movieCd}`);
      const savedShort = localStorage.getItem(`short-review-${movieInfo.movieCd}`);
      if (savedReview) {
        setDetailedReview(savedReview);
        setShowReviewForm(true);
      } else {
        setDetailedReview("");
      }
      if (savedShort) {
        setShortReview(savedShort);
      } else {
        setShortReview("");
      }
      setGeneratorError(null);
    }
  }, [movieInfo?.movieCd]);

  // Clean form state if modal is closed
  useEffect(() => {
    if (!isOpen) {
      setGeneratorError(null);
      setIsCopied(false);
    }
  }, [isOpen]);

  // Handle outside Esc click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Age rating badge colors
  const getWatchGradeBadge = (grade: string) => {
    if (!grade) return null;
    const isAll = grade.includes("전체");
    const is12 = grade.includes("12");
    const is15 = grade.includes("15");
    const is18 = grade.includes("청소년관람불가") || grade.includes("대형관람불가") || grade.includes("18") || grade.includes("제한");

    let colorClasses = "bg-white/5 text-white/80 border-white/10";
    let shortTxt = "ALL";

    if (isAll) {
      colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      shortTxt = "전체";
    } else if (is12) {
      colorClasses = "bg-sky-500/10 text-sky-400 border-sky-500/20";
      shortTxt = "12";
    } else if (is15) {
      colorClasses = "bg-gold/10 text-gold border-gold/20";
      shortTxt = "15";
    } else if (is18) {
      colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20";
      shortTxt = "청불";
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono tracking-wider border rounded-sm ${colorClasses}`}>
        {grade} // {shortTxt}
      </span>
    );
  };

  // Generate critique review with backend proxy calls
  const handleGenerateReview = async () => {
    if (!movieInfo) return;
    if (!shortReview.trim()) {
      setGeneratorError("감상평 내용을 간단하게라도 기입해주세요.");
      return;
    }

    setIsGenerating(true);
    setGeneratorError(null);
    setIsCopied(false);

    try {
      const directorsStr = movieInfo.directors?.map(d => d.peopleNm).join(", ") || "";
      const genresStr = movieInfo.genres?.map(g => g.genreNm).join(", ") || "";

      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieNm: movieInfo.movieNm,
          movieNmEn: movieInfo.movieNmEn,
          directors: directorsStr,
          genres: genresStr,
          shortReview: shortReview
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "리뷰를 생성하는 중 서버 통신 장애가 발생했습니다.");
      }

      const data = await response.json();
      setDetailedReview(data.review);
      
      // Persist in localStorage
      localStorage.setItem(`review-${movieInfo.movieCd}`, data.review);
      localStorage.setItem(`short-review-${movieInfo.movieCd}`, shortReview);

    } catch (err: any) {
      console.error(err);
      setGeneratorError(err.message || "감상평 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy with Clipboard API
  const handleCopyReview = async () => {
    if (!detailedReview) return;
    try {
      await navigator.clipboard.writeText(detailedReview);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative bg-[#0B0B0B] border border-white/10 rounded-sm w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden z-10"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0F0F0F]">
            <h3 className="font-serif italic text-lg text-gold flex items-center gap-2">
              <Clapperboard className="w-5 h-5" />
              영화 정보 헤드라인
            </h3>
            <button
               onClick={onClose}
               className="text-white/40 hover:text-white hover:bg-white/5 p-1 rounded-sm transition-colors focus:outline-none"
               aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal scrollable content body */}
          <div className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-white/10 border-t-gold rounded-full animate-spin mb-4" />
                <p className="text-xs text-white/40 font-mono tracking-widest animate-pulse uppercase">Retrieving Movie Data...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="p-3 bg-white/5 border border-white/10 text-gold rounded-full mb-4">
                  <Clapperboard className="w-6 h-6" />
                </div>
                <h3 className="text-base font-serif italic text-white/90">영화 정보를 찾을 수 없습니다</h3>
                <p className="text-xs text-white/40 max-w-xs mt-2 font-mono leading-relaxed">
                  {error}
                </p>
              </div>
            ) : !movieInfo ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <p className="text-xs text-white/40 font-serif italic">선택된 영화 세부정보가 올바르지 않습니다.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Meta details header info */}
                <div className="relative pb-5 border-b border-white/10">
                  {boxOfficeStats && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gold text-black font-sans text-[11px] font-black tracking-wide rounded-sm">
                        <Award className="w-3.5 h-3.5" />
                        RANK {boxOfficeStats.rank}
                      </span>
                      {parseInt(boxOfficeStats.rankInten) !== 0 && (
                        <span className="inline-flex items-center text-[11px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded-sm border border-white/5">
                          변동: {parseInt(boxOfficeStats.rankInten) > 0 ? `▲ ${boxOfficeStats.rankInten}` : `▼ ${Math.abs(parseInt(boxOfficeStats.rankInten))}`}
                        </span>
                      )}
                      {boxOfficeStats.rankOldAndNew === "NEW" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-rose-600 text-white font-mono text-[10px] font-bold rounded-sm">
                          NEW ENTRY
                        </span>
                      )}
                    </div>
                  )}

                  <h2 className="text-2xl md:text-3xl font-serif text-white font-medium">
                    {movieInfo.movieNm}
                  </h2>
                  {movieInfo.movieNmEn && (
                    <p className="text-xs text-white/45 font-mono tracking-wider italic mt-1.5 uppercase">
                      {movieInfo.movieNmEn} {movieInfo.prdtYear && `// ${movieInfo.prdtYear}`}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {movieInfo.showTm && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/5 text-white/80 text-[11px] font-mono border border-white/10 rounded-sm">
                        <Clock className="w-3 h-3 text-gold" />
                        {movieInfo.showTm} MIN
                      </span>
                    )}
                    {movieInfo.genres?.[0] && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/5 text-white/80 text-[11px] font-sans border border-white/10 rounded-sm">
                        <Tags className="w-3 h-3 text-gold" />
                        {movieInfo.genres.map(g => g.genreNm).slice(0, 2).join(", ")}
                      </span>
                    )}
                    {movieInfo.nations?.[0] && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/5 text-white/80 text-[11px] font-sans border border-white/10 rounded-sm">
                        <Globe className="w-3 h-3 text-gold" />
                        {movieInfo.nations[0].nationNm}
                      </span>
                    )}
                  </div>
                </div>

                {/* Box Office Metrics Grid */}
                {boxOfficeStats && (
                  <div className="grid grid-cols-2 gap-4 p-5 bg-white/[0.02] rounded-sm border border-white/10">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest font-mono block">
                        Daily Audience
                      </span>
                      <p className="font-serif italic text-xl text-gold mt-1">
                        {parseInt(boxOfficeStats.audiCnt, 10).toLocaleString()} <span className="text-xs font-sans text-white/60 not-italic">명</span>
                      </p>
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        당일 매출 비율: {boxOfficeStats.salesShare}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest font-mono block">
                        Total Audience
                      </span>
                      <p className="font-serif italic text-xl text-white mt-1">
                        {parseInt(boxOfficeStats.audiAcc, 10).toLocaleString()} <span className="text-xs font-sans text-white/60 not-italic">명</span>
                      </p>
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        누적: {parseInt(boxOfficeStats.salesAcc, 10) >= 100000000 
                          ? `${(parseInt(boxOfficeStats.salesAcc, 10) / 100000000).toFixed(1)} 억원`
                          : `${parseInt(boxOfficeStats.salesAcc, 10).toLocaleString()} 원`
                        }
                      </p>
                    </div>

                    {/* Sales Share Bar */}
                    <div className="col-span-2 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between text-[11px] mb-2 font-mono uppercase tracking-wider">
                        <span className="text-white/40 flex items-center gap-1">
                          <CirclePercent className="w-3.5 h-3.5 text-gold" />
                          Sales Share Meter
                        </span>
                        <span className="text-gold font-bold">
                          {boxOfficeStats.salesShare}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-none overflow-hidden">
                        <div 
                          className="h-full bg-gold transition-all duration-1000"
                          style={{ width: `${boxOfficeStats.salesShare}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Creative Staff Details */}
                <div className="flex flex-col gap-3 font-sans text-xs">
                  {/* Director */}
                  {movieInfo.directors && movieInfo.directors.length > 0 && (
                    <div className="flex gap-4 border-b border-white/5 pb-2.5">
                      <span className="w-16 font-mono text-white/30 uppercase tracking-widest shrink-0">Director</span>
                      <p className="font-serif italic text-sm text-white/90">
                        {movieInfo.directors.map(d => d.peopleNm).join(", ")}
                        {movieInfo.directors[0].peopleNmEn && (
                          <span className="text-xs text-white/40 font-mono not-italic ml-1.5">// {movieInfo.directors[0].peopleNmEn}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Actors */}
                  {movieInfo.actors && movieInfo.actors.length > 0 && (
                    <div className="flex gap-4 border-b border-white/5 pb-2.5">
                      <span className="w-16 font-mono text-white/30 uppercase tracking-widest shrink-0">Actors</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-1.5">
                          {movieInfo.actors.slice(0, 4).map((actor, idx) => (
                            <div 
                              key={idx} 
                              className="px-2 py-0.5 border border-white/10 bg-white/[0.02] rounded-sm text-xs text-white flex items-center gap-1"
                            >
                              <span className="font-serif italic text-white/95">{actor.peopleNm}</span>
                              {actor.cast && (
                                <span className="text-[10px] text-white/40 font-mono">({actor.cast})</span>
                              )}
                            </div>
                          ))}
                          {movieInfo.actors.length > 4 && (
                            <span className="text-[10px] uppercase text-white/30 font-mono tracking-wider py-1 select-none whitespace-nowrap">
                              + {movieInfo.actors.length - 4} More
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audit Watch Grade */}
                  {movieInfo.audits && movieInfo.audits.length > 0 && (
                    <div className="flex gap-4 border-b border-white/5 pb-2.5">
                      <span className="w-16 font-mono text-white/30 uppercase tracking-widest shrink-0">Rating</span>
                      <div>
                        {getWatchGradeBadge(movieInfo.audits[0].watchGradeNm)}
                      </div>
                    </div>
                  )}

                  {/* Agency / Companies */}
                  {movieInfo.companys && movieInfo.companys.length > 0 && (
                    <div className="flex gap-4 border-b border-white/5 pb-2.5">
                      <span className="w-16 font-mono text-white/30 uppercase tracking-widest shrink-0">Agency</span>
                      <div className="text-[11px] text-white/60 leading-snug">
                        {movieInfo.companys.slice(0, 2).map((comp, idx) => (
                          <span key={idx} className="block font-sans">
                            {comp.companyNm} <span className="text-[10px] text-white/30 font-mono uppercase">// {comp.companyPartNm}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Release */}
                  {movieInfo.openDt && (
                    <div className="flex gap-4 pb-1">
                      <span className="w-16 font-mono text-white/30 uppercase tracking-widest shrink-0">Release</span>
                      <p className="font-mono text-gold text-xs font-semibold uppercase tracking-wider">
                        {movieInfo.openDt.substring(0, 4)}.{movieInfo.openDt.substring(4, 6)}.{movieInfo.openDt.substring(6, 8)}
                      </p>
                    </div>
                  )}
                </div>

                {/* AI Review Segment */}
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif italic text-base text-white/90 flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-gold" />
                      나만의 감상평 & AI 평론 확장
                    </h4>
                    
                    {!showReviewForm && (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="px-3.5 py-1.5 bg-gold hover:bg-white text-black font-sans text-xs font-medium tracking-wide transition rounded-sm flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        감상평 작성하기
                      </button>
                    )}
                  </div>

                  {showReviewForm && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono tracking-widest text-white/40 uppercase block">
                          한 줄 한글 소감 (예: 배우들의 연기력이 눈물 나네요)
                        </label>
                        <textarea
                          placeholder="영화의 특색이나 와닿았던 점을 아주 짤막하게 기입해 주세요. 평론가풍 영화 비평 에세이로 근사하게 보정 및 고도화를 해줍니다."
                          value={shortReview}
                          onChange={(e) => setShortReview(e.target.value)}
                          rows={3}
                          maxLength={300}
                          className="w-full bg-[#111] border border-white/10 rounded-sm p-3 text-xs text-white/90 placeholder-white/20 outline-none focus:border-gold/45 transition-colors font-sans"
                        />
                        <div className="flex items-center justify-between text-[10px] text-white/30 font-mono">
                          <span>* Gemini 3.5 Flash 구동</span>
                          <span>{shortReview.length} / 300자</span>
                        </div>
                      </div>

                      {/* Submit action trigger */}
                      <div className="flex justify-end gap-3">
                        {detailedReview && (
                          <button
                            onClick={() => {
                              setShortReview("");
                              setDetailedReview("");
                              localStorage.removeItem(`review-${movieInfo.movieCd}`);
                              localStorage.removeItem(`short-review-${movieInfo.movieCd}`);
                            }}
                            className="px-3.5 py-1.5 border border-white/10 hover:border-white/30 text-white/60 hover:text-white text-xs font-mono transition rounded-sm uppercase"
                          >
                            초기화
                          </button>
                        )}
                        <button
                          onClick={handleGenerateReview}
                          disabled={isGenerating || !shortReview.trim()}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/25 disabled:opacity-30 disabled:hover:bg-white/5 text-gold hover:text-white font-mono text-xs uppercase tracking-wider transition rounded-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-3 h-3 border border-white/25 border-t-gold animate-spin rounded-full" />
                              발췌 비평문 직조 중...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-gold" />
                              AI 감상평 확장하기
                            </>
                          )}
                        </button>
                      </div>

                      {/* Generator Error container */}
                      {generatorError && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-sm text-xs text-rose-400 font-sans">
                          {generatorError}
                        </div>
                      )}

                      {/* Detailed Critique Result Container */}
                      {isGenerating && (
                        <div className="p-5 bg-white/[0.01] border border-white/5 rounded-sm animate-pulse space-y-3">
                          <div className="h-4 bg-white/10 rounded w-1/3" />
                          <div className="space-y-2">
                            <div className="h-3 bg-white/5 rounded w-full" />
                            <div className="h-3 bg-white/5 rounded w-5/6" />
                            <div className="h-3 bg-white/5 rounded w-4/5" />
                          </div>
                        </div>
                      )}

                      {!isGenerating && detailedReview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.99 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative p-6 bg-white/[0.02] border border-white/10 rounded-sm"
                        >
                          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                            <span className="text-[10px] font-mono tracking-widest text-[#B5945B] uppercase font-bold">
                              Cinema Critique Essay // KOBIS & Gemini
                            </span>
                            <button
                              onClick={handleCopyReview}
                              className="text-white/40 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-[10px] font-mono"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  COPIED!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  COPY ESSAY
                                </>
                              )}
                            </button>
                          </div>

                          {/* Markdown Styled Essay content */}
                          <div className="prose prose-invert max-w-none text-white/90 selection:bg-gold selection:text-black font-serif italic text-sm md:text-base leading-relaxed antialiased">
                            <ReactMarkdown>{detailedReview}</ReactMarkdown>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Modal bottom action status footer */}
          <div className="bg-[#0F0F0F] border-t border-white/10 px-6 py-3.5 flex items-center justify-between text-[10px] text-white/30 font-mono uppercase tracking-widest">
            <span>Daily Box Office Radar</span>
            <span>PRESS ESC TO CLOSE</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
