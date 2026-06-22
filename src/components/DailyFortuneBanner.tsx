/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { getAlmanac } from "../utils/almanacEngine";
import { DailyFortuneResponse } from "../types";
import { Sparkles, HelpCircle, Loader2, Award, HeartPulse, Coins, Compass, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DailyFortuneBannerProps {
  selectedDate: Date;
}

export default function DailyFortuneBanner({ selectedDate }: DailyFortuneBannerProps) {
  const [fortuneData, setFortuneData] = useState<DailyFortuneResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 取得當前日期的 YYYY-MM-DD
  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    const fetchFortune = async () => {
      setLoading(true);
      setError(null);
      
      // 嘗試從本地 Session 緩存提取，達到秒開效果
      const cacheKey = `daily_fortune_${dateStr}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          setFortuneData(JSON.parse(cached));
          setLoading(false);
          return;
        } catch (e) {
          // 忽略錯誤，重新請求
        }
      }

      // 計算當天的干支與五行
      const almanac = getAlmanac(selectedDate);
      
      try {
        const res = await fetch("/api/almanac/daily-fortune", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dateStr,
            ganzhiDay: almanac.ganzhiDay,
            ganzhiMonth: almanac.ganzhiMonth,
            wuhang: almanac.wuhang,
            conflictAnimal: almanac.conflictAnimal,
          }),
        });

        if (!res.ok) {
          throw new Error("向大師求取今日天時氣運失敗");
        }

        const data: DailyFortuneResponse = await res.json();
        setFortuneData(data);
        
        // 寫入緩存
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err: any) {
        console.error("Fetch fortune error:", err);
        setError(err.message || "天機難測，請稍後重試。");
      } finally {
        setLoading(false);
      }
    };

    fetchFortune();
  }, [dateStr, selectedDate]);

  return (
    <div className="font-sans">
      {/* 行政橫幅 */}
      <div className="rounded-3xl border-2 border-[#1A1A1A] bg-[#5C1C1C] text-[#FCF9F2] p-5 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        {/* 背景放射與古木紋裝飾 */}
        <div className="absolute inset-0 bg-radial-gradient from-[#722121] to-[#3a0d0d] opacity-90 -z-10"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full border border-yellow-500/15 pointer-events-none"></div>

        {/* 左側：大師星批 */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-11 w-11 rounded-2xl bg-[#FCF9F2]/10 border border-[#FCF9F2]/20 flex items-center justify-center shrink-0 text-xl font-bold font-serif relative shadow-inner text-[#f3ca52]">
            批
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f3ca52] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f3ca52]"></span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] bg-[#f3ca52] text-[#1A1A1A] px-2 py-0.5 rounded font-black tracking-normal uppercase">今日天時妙批</span>
              <span className="text-xs text-amber-200/90 font-bold font-mono">Lunar Zodiac Cosmic Sync</span>
            </div>
            
            {loading ? (
              <div className="flex items-center gap-1.5 py-0.5">
                <Loader2 className="h-4.5 w-4.5 text-[#f3ca52] animate-spin" />
                <span className="text-xs text-amber-100/80 animate-pulse font-medium">大師正俯察地理星緯，為您測度天命...</span>
              </div>
            ) : error ? (
              <p className="text-xs text-amber-200/80 italic font-medium">{error}</p>
            ) : (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs md:text-sm font-black text-[#FCF9F2] leading-relaxed font-serif tracking-wide"
              >
                &ldquo; {fortuneData?.summary} &rdquo;
              </motion.p>
            )}
          </div>
        </div>

        {/* 右側：誠心抽籤按鈕 */}
        <div className="shrink-0 w-full md:w-auto flex md:justify-end">
          <button
            id="btn_request_daily_lot"
            disabled={loading}
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto px-5 py-3 rounded-xl border-2 border-[#1A1A1A] bg-[#f3ca52] text-[#1A1A1A] font-black text-xs cursor-pointer select-none shadow-[3px_3px_0px_#1A1A1A] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>誠心解籤 · 抽今日運勢籤</span>
          </button>
        </div>
      </div>

      {/* 運勢籤彈窗 Modal */}
      <AnimatePresence>
        {showModal && fortuneData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            
            {/* 點擊背景關閉 */}
            <div className="absolute inset-0 cursor-default" onClick={() => setShowModal(false)}></div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg rounded-3xl border-4 border-[#1A1A1A] bg-[#FCF9F2] shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              
              {/* 大師蓋大紅朱砂印章效果 */}
              <div className="absolute top-12 right-12 w-20 h-20 border-4 border-red-700/35 rounded-full flex items-center justify-center rotate-12 select-none pointer-events-none">
                <span className="text-red-700/35 font-serif font-black text-xs leading-none text-center">
                  大師加持<br />大吉大利
                </span>
              </div>

              {/* 右上角關閉按鈕 */}
              <button
                id="btn_close_lot_modal"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-[#F5F1E6] hover:bg-red-900 hover:text-[#FCF9F2] border-2 border-[#1A1A1A] flex items-center justify-center cursor-pointer transition-all active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>

              {/* 籤詩頂部裝飾 */}
              <div className="text-center space-y-1 mb-5">
                <span className="text-[10px] bg-[#B22222] text-[#FCF9F2] px-2.5 py-0.5 rounded-full font-black tracking-widest font-serif shadow-sm">
                  萬用農民曆 · 靈籤妙批
                </span>
                <h4 className="text-2xl font-black text-[#1A1A1A] font-serif pt-1">
                  【 {fortuneData.lot.title} 】
                </h4>
                <p className="text-[10px] text-[#8C8273] font-bold">
                  西曆 {dateStr} ‧ 誠心沐浴祈願 ‧ 降求所得
                </p>
              </div>

              {/* 聖籤紙張主體 */}
              <div className="rounded-2xl border-2 border-red-900 bg-amber-50/50 p-5 shadow-inner relative space-y-4">
                
                {/* 古典籤詩展示（紅條金字框） */}
                <div className="border-y-2 border-dashed border-red-900/40 py-3 text-center">
                  <p className="text-sm text-red-950 font-serif font-bold italic tracking-widest leading-loose max-w-xs mx-auto whitespace-pre-line">
                    {fortuneData.lot.poem}
                  </p>
                </div>

                {/* 籤意白話總讀 */}
                <div className="space-y-1 border-b border-[#D9D3C7]/60 pb-3">
                  <span className="text-[10px] font-black text-red-800 block">📚 籤意白話啟迪：</span>
                  <p className="text-xs text-[#1A1A1A] font-bold leading-relaxed">
                    {fortuneData.lot.meaning}
                  </p>
                </div>

                {/* 1. 功名 & 財源 & 紅鸞 各細項 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 py-1">
                  
                  <div className="bg-[#F5F1E6] p-2.5 rounded-xl border-2 border-[#D9D3C7] space-y-1">
                    <div className="flex items-center gap-1 text-[#B22222]">
                      <Compass className="h-3.5 w-3.5" />
                      <strong className="text-[10px] font-black">💼 功名事業</strong>
                    </div>
                    <p className="text-[10px] text-stone-700 font-bold leading-normal">
                      {fortuneData.lot.careerAdvice}
                    </p>
                  </div>

                  <div className="bg-[#F5F1E6] p-2.5 rounded-xl border-2 border-[#D9D3C7] space-y-1">
                    <div className="flex items-center gap-1 text-[#2E7D32]">
                      <Coins className="h-3.5 w-3.5" />
                      <strong className="text-[10px] font-black">💰 財源生計</strong>
                    </div>
                    <p className="text-[10px] text-stone-700 font-bold leading-normal">
                      {fortuneData.lot.wealthAdvice}
                    </p>
                  </div>

                  <div className="bg-[#F5F1E6] p-2.5 rounded-xl border-2 border-[#D9D3C7] space-y-1">
                    <div className="flex items-center gap-1 text-pink-700">
                      <HeartPulse className="h-3.5 w-3.5" />
                      <strong className="text-[10px] font-black">💖 紅鸞姻緣</strong>
                    </div>
                    <p className="text-[10px] text-stone-700 font-bold leading-normal">
                      {fortuneData.lot.loveAdvice}
                    </p>
                  </div>

                </div>

                {/* 大師禪意一指 */}
                <div className="p-3 bg-[#B22222] text-[#FCF9F2] rounded-xl border border-[#1A1A1A] shadow-sm relative overflow-hidden">
                  <span className="text-[9px] block text-amber-300 font-black tracking-widest font-serif opacity-90 mb-0.5">
                    🧘 大師禪心一指開悟：
                  </span>
                  <strong className="text-xs font-black font-serif block">
                    &ldquo; {fortuneData.lot.zenAura} &rdquo;
                  </strong>
                </div>

              </div>

              {/* 關閉底按鈕 */}
              <div className="mt-5 text-center">
                <button
                  id="btn_dismiss_lot_modal"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#FCF9F2] font-black text-xs cursor-pointer select-none hover:bg-red-900 hover:border-red-900 transition-all active:scale-95"
                >
                  弟子叩謝，心領神會
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
