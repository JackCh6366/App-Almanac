/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import AlmanacCard from "./components/AlmanacCard";
import Planner from "./components/Planner";
import DailyFortuneBanner from "./components/DailyFortuneBanner";
import DivineTemple from "./components/DivineTemple";
import ZodiacFortune from "./components/ZodiacFortune";
import SolarFestivals from "./components/SolarFestivals";
import AlmanacAdvisor from "./components/AlmanacAdvisor";

import { 
  CalendarDays, Sparkles, Compass, HelpCircle, 
  BookOpen, MessageSquare, Flame, Star, Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type TabId = "home" | "planner" | "temple" | "zodiac" | "festivals" | "chat";

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<TabId>("home");

  // Global AI Provider State
  const [aiProvider, setAiProvider] = useState<'gemini' | 'nvidia'>(() => {
    return (localStorage.getItem("ai_provider") as 'gemini' | 'nvidia') || 'gemini';
  });

  const handleProviderChange = (provider: 'gemini' | 'nvidia') => {
    setAiProvider(provider);
    localStorage.setItem("ai_provider", provider);
  };

  // 當期選取公曆字串，方便各組件連線
  const formattedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  const tabs = [
    { id: "home", label: "黃曆主看板", icon: CalendarDays, desc: "每日宜忌、干支五行、吉方與胎神" },
    { id: "planner", label: "AI 智慧擇吉", icon: Compass, desc: "量身推薦辦大事之黃道良辰" },
    { id: "temple", label: "民俗求籤正殿", icon: Flame, desc: "誠心祈願、擲筊抽籤、大師 AI 解籤" },
    { id: "zodiac", label: "生肖每日開運", icon: Star, desc: "十二屬相運勢多星盤與幸運細節" },
    { id: "festivals", label: "節氣節慶百科", icon: BookOpen, desc: "24 節氣養生與重要神祇誕辰" },
    { id: "chat", label: "AI 黃曆顧問", icon: MessageSquare, desc: "對話大師，解答日常擇吉與心魔" },
  ];

  return (
    <div className="min-h-screen bg-[#FCF9F2] text-[#1A1A1A] flex flex-col antialiased font-serif">
      
      {/* 頂部東方宮廷花格欄條 */}
      <div className="bg-[#1A1A1A] text-[#FCF9F2] shadow-md relative overflow-hidden shrink-0 border-b-4 border-[#B22222]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#2d1a1a] via-[#1A1A1A] to-[#0d0707] opacity-95"></div>
        {/* 古典祥雲花紋動態意象 */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full border border-[#B22222]/20 opacity-30 transform translate-x-24 -translate-y-24"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 relative">
          
          {/* Logo 標題 */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-[#B22222] rounded-2xl flex items-center justify-center border-2 border-[#1A1A1A] shadow-lg text-white text-2xl font-black shrink-0 relative">
              ☯️
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-widest font-serif text-[#FCF9F2]">
                  萬用農民曆智慧系統
                </h1>
                <span className="text-[10px] bg-[#B22222]/20 border border-[#B22222] text-[#FCF9F2] px-2 py-0.5 rounded-full font-bold font-sans">
                  AI 經典版
                </span>
              </div>
              <p className="text-[#8C8273] text-xs mt-1 tracking-wider font-sans">
                融合古典干支星宿與多 AI 智慧。每日運勢、良辰吉格、求籤正殿一站式集大成。
              </p>
            </div>
          </div>

          {/* AI 服務選擇器與系統標籤 */}
          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
            <span className="text-[11px] text-[#8C8273] block uppercase tracking-widest font-mono">Lunar Almanac System v3.5</span>
            
            <div className="flex items-center gap-2 bg-[#FCF9F2]/10 border border-[#B22222]/30 px-3.5 py-1.5 rounded-xl shadow-inner mt-0.5">
              <Cpu className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-[#8C8273] font-bold">AI 服務：</span>
              <select
                id="ai_provider_selector"
                value={aiProvider}
                onChange={(e) => handleProviderChange(e.target.value as 'gemini' | 'nvidia')}
                className="bg-transparent text-[#FCF9F2] text-xs font-black focus:outline-none cursor-pointer border-none pr-1 focus:ring-0"
                style={{ colorScheme: "dark" }}
              >
                <option value="gemini" className="bg-[#1A1A1A] text-[#FCF9F2]">Google Gemini (3.1-Flash)</option>
                <option value="nvidia" className="bg-[#1A1A1A] text-[#FCF9F2]">NVIDIA NIM (Nemotron)</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 傳統宮廷朱紅與金雙對線邊框 (營造絕頂工藝感) */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 flex-1 flex flex-col gap-6">
        
        {/* 東方扣 Tab 導覽排 */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0 font-sans">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                id={`btn_tab_nav_${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 text-center transition-all duration-300 relative group cursor-pointer ${
                  isActive 
                    ? "border-[#1A1A1A] bg-[#1A1A1A] text-[#FCF9F2] shadow-md transform scale-[1.03]" 
                    : "border-[#D9D3C7] bg-[#F5F1E6] text-[#8C8273] hover:border-[#1A1A1A] hover:bg-[#FCF9F2]"
                }`}
              >
                <div className={`p-2 rounded-xl mb-1.5 transition-transform group-hover:scale-110 ${
                  isActive ? "bg-[#B22222] text-[#FCF9F2]" : "bg-[#FCF9F2] text-[#8C8273] group-hover:text-[#1A1A1A]"
                }`}>
                  <IconComp className="h-4 w-4" />
                </div>
                <span className="font-extrabold text-xs tracking-wide">{tab.label}</span>
                <span className={`text-[9px] mt-1 scale-90 ${isActive ? "text-[#8C8273]" : "text-[#8C8273]/80 group-hover:text-[#8C8273]"}`}>
                  {tab.desc}
                </span>
                
                {/* 底部高亮點 */}
                {isActive && (
                  <motion.span 
                    layoutId="tab_highlight_bar"
                    className="absolute bottom-1 h-1 w-8 bg-[#B22222] rounded-full"
                  ></motion.span>
                )}
              </button>
            );
          })}
        </div>

        {/* 主舞台內容切換 (使用 motion smooth slide+fade) */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeTab === "home" && (
                <div className="space-y-6">
                  <DailyFortuneBanner selectedDate={selectedDate} aiProvider={aiProvider} />
                  <AlmanacCard 
                    selectedDate={selectedDate} 
                    onDateChange={setSelectedDate} 
                    aiProvider={aiProvider}
                  />
                </div>
              )}

              {activeTab === "planner" && (
                <Planner aiProvider={aiProvider} />
              )}

              {activeTab === "temple" && (
                <DivineTemple aiProvider={aiProvider} />
              )}

              {activeTab === "zodiac" && (
                <ZodiacFortune 
                  currentDateStr={formattedDateStr} 
                  aiProvider={aiProvider}
                />
              )}

              {activeTab === "festivals" && (
                <SolarFestivals aiProvider={aiProvider} />
              )}

              {activeTab === "chat" && (
                <AlmanacAdvisor 
                  currentDate={selectedDate} 
                  aiProvider={aiProvider}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* 肅穆沉穩之底欄 */}
      <footer className="bg-[#1A1A1A] text-[#8C8273] border-t-4 border-[#B22222] py-8 text-center text-xs shrink-0 font-medium font-sans">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif text-[#B22222] tracking-widest text-base font-black">☯️ 一幅黃曆，半部中國人生活的歲月史 ☯️</p>
          <p className="text-[#8C8273]/80 tracking-wide leading-relaxed max-w-3xl mx-auto">本系統所推推算黃神方位與宜忌，皆遵循《協紀辨方書》等傳統算沙理法，並經由 Google AI 智慧優雅開示。民俗僅供出行起居參考，祝您事事順遂。</p>
          <p className="text-[#8C8273]/60 font-mono text-[10px] pt-2">© 2026 萬用農民曆智慧系統. Google AI Studio Build. All Rights Reserved.</p>
        </div>
      </footer>

    </div>
  );
}
