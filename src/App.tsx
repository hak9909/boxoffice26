import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { MovieListItem } from "./components/MovieListItem";
import { MovieDetailModal } from "./components/MovieDetailModal";
import { DailyBoxOfficeItem, MovieInfo, KOBISBoxOfficeResponse, KOBISMovieInfoResponse } from "./types";
import { Search, Film, Calendar, BarChart3, HelpCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Calculate dates
const getYesterdayDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

const formatDateToString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function App() {
  const yesterdayDate = getYesterdayDate();
  const maxDateStr = formatDateToString(yesterdayDate);

  // States
  const [selectedDate, setSelectedDate] = useState<string>(maxDateStr);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [boxOfficeList, setBoxOfficeList] = useState<DailyBoxOfficeItem[]>([]);
  const [selectedMovieCd, setSelectedMovieCd] = useState<string | null>(null);
  const [movieDetail, setMovieDetail] = useState<MovieInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Loaders & Errors
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Scroll target for mobile view
  const detailRef = useRef<HTMLDivElement>(null);

  // Fetch Daily Box Office List
  useEffect(() => {
    const fetchBoxOffice = async () => {
      setListLoading(true);
      setListError(null);
      // Clean selected movie so we reload clean details
      setSelectedMovieCd(null);
      setMovieDetail(null);

      try {
        const targetDt = selectedDate.replace(/-/g, "");
        const response = await fetch(`/api/boxoffice?date=${targetDt}`);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        const data: KOBISBoxOfficeResponse = await response.json();
        const list = data.boxOfficeResult?.dailyBoxOfficeList || [];
        
        setBoxOfficeList(list);

        if (list.length > 0) {
          // Auto select the #1 movie by default
          setSelectedMovieCd(list[0].movieCd);
        } else {
          setListError(`${selectedDate} 날짜의 박스오피스 정보가 존재하지 않거나 집계 중입니다.`);
        }
      } catch (err: any) {
        console.error("Failed to fetch box office list:", err);
        setListError(err.message || "서버에서 박스오피스 데이터를 불러오지 못했습니다.");
      } finally {
        setListLoading(false);
      }
    };

    fetchBoxOffice();
  }, [selectedDate]);

  // Fetch Movie Details
  useEffect(() => {
    if (!selectedMovieCd) return;

    const fetchMovieDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);

      try {
        const response = await fetch(`/api/movie/${selectedMovieCd}`);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        const data: KOBISMovieInfoResponse = await response.json();
        const info = data.movieInfoResult?.movieInfo;

        if (info) {
          setMovieDetail(info);
        } else {
          setDetailError("상세 영화 정보가 존재하지 않습니다.");
        }
      } catch (err: any) {
        console.error("Failed to fetch movie detail:", err);
        setDetailError("영화 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchMovieDetail();
  }, [selectedMovieCd]);

  // Handler for clicking a movie item
  const handleMovieClick = (movieCd: string) => {
    setSelectedMovieCd(movieCd);
    setIsModalOpen(true);
  };

  // Find corresponding box office stats for selected movie
  const currentBoxOfficeStats = boxOfficeList.find(
    (item) => item.movieCd === selectedMovieCd
  ) || null;

  // Max daily audience in the current list to calculate relative bar widths
  const maxAudience = boxOfficeList.length > 0
    ? Math.max(...boxOfficeList.map((item) => parseInt(item.audiCnt, 10)))
    : 0;

  // Total daily audience
  const totalAudience = boxOfficeList.reduce(
    (sum, item) => sum + parseInt(item.audiCnt, 10),
    0
  );

  // Filter box office list based on search query
  const filteredBoxOfficeList = boxOfficeList.filter((item) =>
    item.movieNm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert target YYYY-MM-DD input date to clean format for title
  const displayedDateFormat = () => {
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return selectedDate;
    return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col font-sans selection:bg-gold selection:text-black antialiased">
      {/* HEADER SECTION */}
      <Header
        selectedDate={selectedDate}
        maxDate={maxDateStr}
        totalAudience={totalAudience}
        onDateChange={setSelectedDate}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-10">
        
        {/* HERO BILLBOARD FOR #1 MOVIE (If list loaded and first item exists) */}
        {!listLoading && !listError && boxOfficeList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full relative overflow-hidden rounded-sm border border-white/10 bg-[#0F0F0F] p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 min-h-[180px]"
          >
            {/* Elegant luxury visual badge container */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/[0.015] rounded-full filter blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-gold text-black text-[10px] font-bold px-2.5 py-0.5 tracking-wider rounded-sm uppercase">
                  RANK 01 // CHAMPION
                </span>
                <span className="text-xs text-white/45 font-mono uppercase tracking-widest">
                  Target Date: {selectedDate.replace(/-/g, "/")}
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-serif italic font-black text-white tracking-tighter mt-1 leading-none">
                {boxOfficeList[0].movieNm}
              </h2>
              <p className="text-xs md:text-sm text-white/70 leading-relaxed font-serif italic max-w-xl mt-1.5">
                당일 하루 동안 {parseInt(boxOfficeList[0].audiCnt, 10).toLocaleString()}명의 관객을 동원하며, 점유율 {boxOfficeList[0].salesShare}%로 전체 박스오피스 정상을 차지하였습니다.
              </p>
            </div>

            <div className="relative z-10 flex flex-row md:flex-col items-baseline md:items-end justify-between md:justify-center gap-6 w-full md:w-auto border-t md:border-t-0 border-white/10 pt-5 md:pt-0 shrink-0">
              <div className="text-left md:text-right">
                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest font-mono">Cumulative Audience</p>
                <p className="text-2xl md:text-3.5xl font-serif italic text-gold mt-1">
                  {parseInt(boxOfficeList[0].audiAcc, 10).toLocaleString()} <span className="text-xs font-sans text-white/60 not-italic">명</span>
                </p>
              </div>
              <button
                onClick={() => handleMovieClick(boxOfficeList[0].movieCd)}
                className="px-5 py-2 hover:bg-white hover:text-black hover:border-white border border-white/20 text-white/80 text-xs font-mono uppercase tracking-wider transition rounded-sm bg-transparent"
              >
                Inspect details
              </button>
            </div>
          </motion.div>
        )}

        {/* MAIN PANEL */}
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
          
          {/* LIST UTILITY BAR (Search & Summary) */}
          <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-serif italic text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" />
                박스오피스 순위표 (Top 10)
              </h2>
              <p className="text-xs text-white/40 mt-1 select-none">
                개별 영화 카드를 클릭하면 상세 정보 및 AI 감상평 확장 팝업창이 나타납니다.
              </p>
            </div>

            {/* Minimalist Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder="영화명으로 빠른 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 text-xs text-white/90 placeholder-white/25 rounded-sm py-2 pl-10 pr-4 outline-none focus:border-gold/40 transition-colors"
              />
            </div>
          </div>

          {/* LIST CONTENT */}
          <div className="flex flex-col">
            {listLoading ? (
              // Skeleton Rows
              <div className="flex flex-col divide-y divide-white/5">
                {[...Array(5)].map((_, idx) => (
                  <div 
                    key={idx} 
                    className="w-full py-5 flex items-center justify-between animate-pulse"
                  >
                    <div className="flex items-center gap-5 w-2/3">
                      <div className="w-8 h-8 bg-white/5 rounded-sm shrink-0" />
                      <div className="space-y-2 w-full">
                        <div className="h-3.5 bg-white/5 rounded w-1/2" />
                        <div className="h-2.5 bg-white/5 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="w-16 h-4 bg-white/5 rounded-sm" />
                  </div>
                ))}
              </div>
            ) : listError ? (
              <div className="border border-white/15 bg-white/[0.01] rounded-sm p-12 text-center flex flex-col items-center justify-center">
                <HelpCircle className="w-8 h-8 text-gold mb-3" />
                <p className="text-xs font-serif italic text-white/70 max-w-sm leading-relaxed">
                  {listError}
                </p>
                <button
                  onClick={() => setSelectedDate(maxDateStr)}
                  className="mt-5 px-5 py-2 hover:bg-white hover:text-black border border-white/25 text-xs font-mono uppercase tracking-widest text-white transition rounded-sm"
                >
                  Return to yesterday
                </button>
              </div>
            ) : filteredBoxOfficeList.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-sm py-16 text-center text-white/35 font-serif italic">
                <p className="text-sm">검색 결과와 일치하는 영화가 순위표에 없습니다.</p>
              </div>
            ) : (
              <div className="border-t border-white/10 divide-y divide-white/10">
                <AnimatePresence initial={false}>
                  {filteredBoxOfficeList.map((item, index) => (
                    <motion.div
                      key={item.movieCd}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.18 }}
                    >
                      <MovieListItem
                        item={item}
                        isActive={selectedMovieCd === item.movieCd}
                        maxAudience={maxAudience}
                        onClick={() => handleMovieClick(item.movieCd)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* DETAILS POPUP MODAL */}
        <MovieDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          movieInfo={movieDetail}
          boxOfficeStats={currentBoxOfficeStats}
          loading={detailLoading}
          error={detailError}
        />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#070707] py-12 mt-24 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">
            <span>영화진흥위원회 통합전산망</span>
            <span>KOREAN FILM COUNCIL</span>
          </div>
          <p className="text-[10px] text-white/30 italic">
            © 2026 Daily Box Office. All data is processed through KOBIS Open API.
          </p>
        </div>
      </footer>
    </div>
  );
}

