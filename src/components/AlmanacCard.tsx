/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { getAlmanac, getSolarTerm } from "../utils/almanacEngine";
import { AlmanacDay } from "../types";
import { 
  Calendar, ChevronLeft, ChevronRight, Compass, ShieldAlert, BadgeInfo, 
  MapPin, RefreshCw, Smile, Moon, Sparkles, Clock, CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import WuxingRadarChart from "./WuxingRadarChart";
import LunarConverter from "./LunarConverter";

interface AlmanacCardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  aiProvider: 'gemini' | 'nvidia';
}

// 時辰對照
const SHICHEN_LIST = [
  { name: "子時", hours: "23:00 - 01:00", element: "水", lucky: "吉" },
  { name: "丑時", hours: "01:00 - 03:00", element: "土", lucky: "凶" },
  { name: "寅時", hours: "03:00 - 05:00", element: "木", lucky: "吉" },
  { name: "卯時", hours: "05:00 - 07:00", element: "木", lucky: "吉" },
  { name: "辰時", hours: "07:00 - 09:00", element: "土", lucky: "凶" },
  { name: "巳時", hours: "09:00 - 11:00", element: "火", lucky: "吉" },
  { name: "午時", hours: "11:00 - 13:00", element: "火", lucky: "凶" },
  { name: "未時", hours: "13:00 - 15:00", element: "土", lucky: "吉" },
  { name: "申時", hours: "15:00 - 17:00", element: "金", lucky: "凶" },
  { name: "酉時", hours: "17:00 - 19:00", element: "金", lucky: "吉" },
  { name: "戌時", hours: "19:00 - 21:00", element: "土", lucky: "凶" },
  { name: "亥時", hours: "21:00 - 23:00", element: "水", lucky: "吉" },
];

export default function AlmanacCard({ selectedDate, onDateChange, aiProvider }: AlmanacCardProps) {
  const [dayData, setDayData] = useState<AlmanacDay | null>(null);
  const [solarTerm, setSolarTerm] = useState<any>(null);
  const [currentHourText, setCurrentHourText] = useState("");
  const [currentShichen, setCurrentShichen] = useState("");

  // 今日吉凶預覽 - 每日一言狀態
  const [todayAura, setTodayAura] = useState<{
    fortuneLevel: string;
    poemQuote: string;
    interpretation: string;
  } | null>(null);
  const [auraLoading, setAuraLoading] = useState(false);

  useEffect(() => {
    const data = getAlmanac(selectedDate);
    setDayData(data);
    setSolarTerm(getSolarTerm(selectedDate));
  }, [selectedDate]);

  // 本地大師運算保障方法 (當網絡發生阻隔或 Gemini 冷啟動時)
  const buildTodayAuraFallbackLocal = (dateStr: string) => {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const levels = ["大吉", "吉", "小吉", "中平", "宜定", "避凶"];
    const fortuneLevel = levels[Math.abs(hash) % levels.length];
    const quotes = [
      { q: "春風得意馬蹄疾，一日看盡長安花。", int: "今日天光清朗，行事如沐春風。心中只要存有光明慈念，所到之處皆是平坦路。" },
      { q: "莫聽穿林打葉聲，何妨吟嘯且徐行。", int: "外在風雨雖有微瀾，亦不妨礙內心泰然。今日宜保持沉著、按部就班。" },
      { q: "一溪流水綠盈盈，兩岸好山青更青。", int: "五行能量此消彼長，恰到好處。今日利於和合交友、梳理心緒。" },
      { q: "千淘萬漉雖辛苦，吹盡狂沙始到金。", int: "今天可能稍微需要一些耐心與磨練，但這正是累積氣運、大器晚成的考驗。" },
      { q: "不畏浮雲遮望眼，自緣身在最高層。", int: "莫因一時風雲变幻而自亂手腳，立足長遠方能洞察天時。宜退一步海闊天空。" },
      { q: "竹杖芒鞋輕勝馬，誰怕？一蓑煙雨任平生。", int: "今日氣象雖偶有沖突，好在福星護持。以淡雅曠達之胸懷度過此日，反而能避凶趨吉。" }
    ];
    const picked = quotes[Math.abs(hash) % quotes.length];
    return { fortuneLevel, poemQuote: picked.q, interpretation: picked.int };
  };

  // 監聽日曆數據載入，自動更新每日一言
  useEffect(() => {
    if (!dayData) return;
    setAuraLoading(true);
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: aiProvider,
        task: "today-aura",
        payload: {
          dateStr: dayData.gregorianDate,
          ganzhiDay: dayData.ganzhiDay,
          lunarMonthDate: dayData.lunarMonthDate,
          jianShen: dayData.jianShen,
        }
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Aura API 請求異常");
        return res.json();
      })
      .then((data) => {
        if (data && data.fortuneLevel && data.poemQuote) {
          setTodayAura(data);
        } else {
          setTodayAura(buildTodayAuraFallbackLocal(dayData.gregorianDate));
        }
        setAuraLoading(false);
      })
      .catch((err) => {
        console.warn("Aura fetching fallback:", err);
        setTodayAura(buildTodayAuraFallbackLocal(dayData.gregorianDate));
        setAuraLoading(false);
      });
  }, [dayData, aiProvider]);

  // 每秒更新目前時間與時辰
  useEffect(() => {
    const updateTimeAndShichen = () => {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, "0");
      const secs = now.getSeconds().toString().padStart(2, "0");
      setCurrentHourText(`${now.toLocaleDateString("zh-TW")} ${String(hrs).padStart(2, "0")}:${mins}:${secs}`);

      // 時辰計算
      let shichenIdx = 0;
      if (hrs >= 23 || hrs < 1) shichenIdx = 0;
      else shichenIdx = Math.floor((hrs + 1) / 2);
      
      const sc = SHICHEN_LIST[shichenIdx];
      setCurrentShichen(`${sc.name} (${sc.hours}) · 五行屬${sc.element} · ${sc.lucky === "吉" ? "「吉時」" : "「避凶」"}`);
    };

    updateTimeAndShichen();
    const interval = setInterval(updateTimeAndShichen, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dayData) return null;

  const navigateDays = (offset: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + offset);
    onDateChange(nextDate);
  };

  const setToday = () => {
    onDateChange(new Date());
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onDateChange(new Date(e.target.value));
    }
  };

  return (
    <div className="space-y-6">
      {/* 上方頂級日期查詢列 */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#F5F1E6] border-2 border-[#D9D3C7] p-5 shadow-md font-sans">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#B22222]" />
          <span className="font-extrabold text-[#1A1A1A] tracking-wider text-sm">公曆黃曆查詢</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            id="btn_prev_day"
            onClick={() => navigateDays(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCF9F2] border-2 border-[#D9D3C7] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FCF9F2] hover:border-[#1A1A1A] transition-all duration-300 active:scale-95 shadow-sm"
            title="前一天"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="relative">
            <input 
              id="almanac_datepicker"
              type="date"
              value={dayData.gregorianDate}
              onChange={handleDateInput}
              className="px-4 py-2.5 rounded-xl bg-[#FCF9F2] border-2 border-[#D9D3C7] text-[#1A1A1A] font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-[#B22222] hover:border-[#1A1A1A] transition-all cursor-pointer shadow-sm"
            />
          </div>

          <button 
            id="btn_next_day"
            onClick={() => navigateDays(1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCF9F2] border-2 border-[#D9D3C7] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FCF9F2] hover:border-[#1A1A1A] transition-all duration-300 active:scale-95 shadow-sm"
            title="後一天"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button 
            id="btn_today"
            onClick={setToday}
            className="px-5 py-2.5 rounded-xl bg-[#B22222] border-2 border-[#B22222] text-[#FCF9F2] font-black text-sm hover:bg-[#1A1A1A] hover:border-[#1A1A1A] active:scale-95 transition-all duration-300 cursor-pointer shadow-sm"
          >
            回今日
          </button>

          <LunarConverter currentDate={selectedDate} onSetMainDate={onDateChange} />
        </div>
      </div>

      {/* 每日五行能量條 */}
      <WuxingRadarChart dayData={dayData} />

      {/* 傳統農民曆大看板 Layout (響應式分欄：左大黃曆，右資訊) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左側：精緻傳統撕曆 (4 欄位) */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-between rounded-3xl border-4 border-[#1A1A1A] bg-[#F5F1E6] p-6 shadow-xl relative overflow-hidden min-h-[420px]">
          {/* 古典角花邊飾 */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-4 border-l-4 border-[#B22222] opacity-90"></div>
          <div className="absolute top-3 right-3 w-5 h-5 border-t-4 border-r-4 border-[#B22222] opacity-90"></div>
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-4 border-l-4 border-[#B22222] opacity-90"></div>
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-4 border-r-4 border-[#B22222] opacity-90"></div>

          {/* 節氣高亮 */}
          {solarTerm && (
            <div className="absolute top-5 right-5 bg-[#B22222] text-[#FCF9F2] text-xs px-3 py-1 rounded-full font-black animate-pulse shadow-md flex items-center gap-1 font-sans">
              <Sparkles className="h-3 w-3" />
              今日交節氣：{solarTerm.name}
            </div>
          )}

          {/* 日曆頂部 */}
          <div className="text-center border-b-2 border-[#D9D3C7] pb-4">
            <h2 className="font-mono text-[#8C8273] text-sm tracking-widest font-black uppercase">
              公元 {dayData.year} 年 &bull; MONTH {dayData.month}
            </h2>
            <div className="mt-2 text-[#1A1A1A] font-black text-sm font-sans">
              {dayData.weekdayLabel}
            </div>
          </div>

          {/* 日曆中央大數字 */}
          <div className="my-8 text-center relative">
            {/* 水印背景字 */}
            <div className="absolute inset-0 flex items-center justify-center text-[100px] font-black text-[#1A1A1A] opacity-[0.03] select-none pointer-events-none">
              {solarTerm ? solarTerm.name : "黃曆"}
            </div>
            
            <motion.h1 
              key={dayData.day}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-9xl md:text-[130px] font-black text-[#1A1A1A] tracking-tighter leading-none relative z-10"
            >
              {dayData.day}
            </motion.h1>
            
            <div className="mt-4 inline-block bg-[#1A1A1A] text-[#FCF9F2] text-xs py-1.5 px-4 rounded-md font-black tracking-widest font-sans shadow-md">
              干支紀日：{dayData.ganzhiDay}
            </div>
          </div>

          {/* 日曆底部農曆大字 */}
          <div className="text-center pt-4 border-t-2 border-[#D9D3C7]">
            <div className="text-[#8C8273] font-black text-xs font-sans">農曆丙午年【馬年】</div>
            <div className="text-4xl font-black text-[#B22222] mt-2 tracking-widest font-serif">
              {dayData.lunarMonthDate}
            </div>
            
            <div className="mt-3 flex justify-center gap-3 text-xs text-[#8C8273] font-extrabold font-sans">
              <span>月建：{dayData.ganzhiMonth}</span>
              <span>•</span>
              <span>值日：{dayData.jianShen}日</span>
            </div>
          </div>
        </div>

        {/* 右側：詳細吉凶喜忌 (7 欄位) */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6 font-sans">
          
          {/* 🌟 新增：今日吉凶預覽・每日一言 */}
          <AnimatePresence mode="wait">
            {todayAura && (
              <motion.div
                key={dayData.gregorianDate}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl border-2 border-[#B22222]/30 bg-gradient-to-br from-[#FCF9F2] to-[#F5F1E6] p-5 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-5"
              >
                {/* 背景禪意太極暗紋 */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 text-[#1A1A1A]/[0.02] font-black text-9xl pointer-events-none select-none">
                  ☯️
                </div>

                {/* 左側吉凶太極盤 */}
                <div className="relative shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-[#B22222] bg-[#1A1A1A] text-[#FCF9F2] shadow-md">
                  <span className="text-[10px] text-[#8C8273] uppercase tracking-widest leading-none mb-1 font-sans font-bold">今日氣場</span>
                  <span className="text-xl font-black font-serif text-amber-300 tracking-wider">
                    {auraLoading ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-amber-300" />
                    ) : (
                      todayAura.fortuneLevel
                    )}
                  </span>
                  <div className="absolute -bottom-1 text-[8px] bg-[#B22222] text-white px-2 py-0.5 rounded-full font-sans tracking-tight">
                    吉凶盤
                  </div>
                </div>

                {/* 右側開運詩與大師指引 */}
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-[#8C8273] font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                    <span>大師 Gemini 占測每日一言</span>
                    {auraLoading && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded animate-pulse">運算中...</span>}
                  </div>
                  
                  <blockquote className="text-base md:text-lg font-black font-serif text-[#B22222] tracking-wider leading-relaxed">
                    「{todayAura.poemQuote}」
                  </blockquote>
                  
                  <p className="text-xs text-[#1A1A1A] leading-relaxed font-semibold">
                    {todayAura.interpretation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. 重磅宜忌展示 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-3xl bg-[#F5F1E6] border-2 border-[#D9D3C7] p-6 shadow-md relative overflow-hidden">
            {/* 宜 */}
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-[#FCF9F2] font-black text-xl font-serif shadow-md">
                宜
              </div>
              <div className="flex flex-wrap gap-2.5 content-start pt-1">
                {dayData.suit.map((s, idx) => (
                  <span 
                    key={idx} 
                    className="px-3.5 py-1.5 rounded-xl bg-white text-[#2E7D32] border-2 border-[#D9D3C7] text-sm font-black tracking-wide shadow-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* 忌 */}
            <div className="flex gap-4 border-t-2 border-[#D9D3C7] pt-6 md:border-t-0 md:pt-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#B22222] text-[#FCF9F2] font-black text-xl font-serif shadow-md">
                忌
              </div>
              <div className="flex flex-wrap gap-2.5 content-start pt-1">
                {dayData.avoid.map((a, idx) => (
                  <span 
                    key={idx} 
                    className="px-3.5 py-1.5 rounded-xl bg-[#FCF9F2] text-[#B22222] border-2 border-[#B22222]/30 text-sm font-black tracking-wide shadow-sm"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 2. 傳統神明胎神、五行、相沖 (資訊網格) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 煞沖胎五行 */}
            <div className="rounded-3xl bg-[#FCF9F2] border-2 border-[#D9D3C7] p-5 shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-[#D9D3C7] pb-2">
                <ShieldAlert className="h-5 w-5 text-[#B22222]" />
                <h3 className="font-extrabold text-[#1A1A1A] text-sm">傳統黃曆煞吉沖解</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs">
                <div>
                  <span className="text-[#8C8273] font-bold">當日沖煞：</span>
                  <strong className="text-[#B22222] text-sm font-black ml-1">沖{dayData.conflictAnimal} ({dayData.conflictAge}歲)</strong>
                </div>
                <div>
                  <span className="text-[#8C8273] font-bold">避凶方位：</span>
                  <strong className="text-[#1A1A1A] font-black ml-1">{dayData.shaDirection}</strong>
                </div>
                <div className="col-span-2 border-t border-[#D9D3C7]/50 pt-2">
                  <span className="text-[#8C8273] font-bold">胎神占方：</span>
                  <strong className="text-[#1A1A1A] font-black ml-1">{dayData.taiShen}</strong>
                </div>
                <div className="border-t border-[#D9D3C7]/50 pt-2">
                  <span className="text-[#8C8273] font-bold">五行納音：</span>
                  <strong className="text-[#1A1A1A] font-black ml-1">{dayData.wuhang}</strong>
                </div>
                <div className="border-t border-[#D9D3C7]/50 pt-2">
                  <span className="text-[#8C8273] font-bold">建除值：</span>
                  <strong className="text-[#2E7D32] font-black ml-1">{dayData.jianShen}日 (吉)</strong>
                </div>
              </div>
            </div>

            {/* 開運吉神方 */}
            <div className="rounded-3xl bg-[#FCF9F2] border-2 border-[#D9D3C7] p-5 shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-[#D9D3C7] pb-2">
                <Compass className="h-5 w-5 text-[#B22222]" />
                <h3 className="font-extrabold text-[#1A1A1A] text-sm">開運吉神方位</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-[#F5F1E6] p-2 border-2 border-[#D9D3C7]">
                  <span className="text-[10px] text-[#8C8273] block mb-1 font-black">財神方</span>
                  <span className="font-black text-[#1A1A1A] text-sm">{dayData.luckyDirectionWealth}</span>
                </div>
                <div className="rounded-xl bg-[#F5F1E6] p-2 border-2 border-[#B22222]/30">
                  <span className="text-[10px] text-[#8C8273] block mb-1 font-black">喜神方</span>
                  <span className="font-black text-[#B22222] text-sm">{dayData.luckyDirectionLove}</span>
                </div>
                <div className="rounded-xl bg-[#F5F1E6] p-2 border-2 border-[#D9D3C7]">
                  <span className="text-[10px] text-[#8C8273] block mb-1 font-black">貴人方</span>
                  <span className="font-black text-[#2E7D32] text-sm">{dayData.luckyDirectionNobles}</span>
                </div>
              </div>
              <p className="text-[10px] text-[#8C8273] text-center leading-relaxed font-bold">
                財神管祿、喜神管福喜、貴人解紛爭。出行、設案、簽字建議面向該吉星方位。
              </p>
            </div>
          </div>

          {/* 3. 現代生活趣味宜忌 (融入當代人心聲) */}
          <div className="rounded-3xl bg-[#F5F1E6] border-2 border-[#D9D3C7] p-5 shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#B22222]/10 rotate-45 transform translate-x-8 -translate-y-8 opacity-20"></div>
            
            <div className="flex items-center gap-2 border-b-2 border-[#D9D3C7] pb-2">
              <Smile className="h-5 w-5 text-[#B22222]" />
              <h3 className="font-extrabold text-[#1A1A1A] text-sm">當代生活實用坊</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-black text-[#2E7D32] flex items-center gap-1">
                  <span>✨ 當代宜日常：</span>
                </div>
                <ul className="list-disc pl-5 text-xs text-[#1A1A1A] space-y-1.5 font-bold">
                  {dayData.modernSuit.map((ms, id) => (
                    <li key={id}>{ms}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 border-t border-[#D9D3C7]/40 pt-3 md:border-t-0 md:pt-0">
                <div className="text-xs font-black text-[#B22222] flex items-center gap-1">
                  <span>⛈️ 行事避忌：</span>
                </div>
                <ul className="list-disc pl-5 text-xs text-[#1A1A1A] space-y-1.5 font-bold">
                  {dayData.modernAvoid.map((ma, id) => (
                    <li key={id}>{ma}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 4. 即時交節氣與動態時辰 */}
          <div className="rounded-3xl bg-[#1A1A1A] text-[#FCF9F2] border-2 border-[#1A1A1A] p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FCF9F2]/10 rounded-2xl border border-[#FCF9F2]/20 text-[#FCF9F2]">
                <Clock className="h-5 w-5 animate-spin text-[#B22222]" style={{ animationDuration: "10s" }} />
              </div>
              <div>
                <div className="text-[10px] text-[#8C8273]">真太陽時 / 即時時辰：</div>
                <div className="text-xs font-mono font-black text-[#FCF9F2] mt-1">{currentShichen}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-[10px] text-[#8C8273]">系統標準時間</div>
              <div className="text-xs font-mono text-[#FCF9F2] font-black mt-1">{currentHourText}</div>
            </div>
          </div>

        </div>

      </div>

      {/* 24節氣特別解讀卡片房 */}
      {solarTerm && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border-2 border-[#B22222] bg-[#F5F1E6] p-6 shadow-md flex flex-col md:flex-row items-start gap-4"
        >
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-[#B22222] text-[#FCF9F2] flex items-center justify-center font-black font-serif shrink-0 shadow-md text-sm md:text-base">
            節氣
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-[#1A1A1A] text-lg font-serif">今日恰逢二十四節氣 &bull; 【{solarTerm.name}】</h4>
            <p className="text-[#1A1A1A] text-xs leading-relaxed font-sans font-bold">{solarTerm.info.desc}</p>
            <div className="text-xs text-[#B22222] font-extrabold bg-[#FCF9F2] border-2 border-[#D9D3C7] rounded-xl px-4 py-2.5 mt-2 leading-relaxed font-sans">
              💡 <strong>季節開運食氣指引：</strong> {solarTerm.info.regime}
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
