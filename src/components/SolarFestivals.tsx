/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { SOLAR_TERMS_INFO, getCurrentSolarTermPeriod } from "../utils/almanacEngine";
import { Sparkles, CalendarDays, BookOpen, HeartPulse, Cpu, Utensils, Activity, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SolarTermAdviceResponse } from "../types";

const FESTIVALS = [
  { lunar: "正月初九", name: "天公生", god: "玉皇上帝萬壽", desc: "傳統全家齋醮、備香燈，叩謝蒼天護佑，祈求諸事大吉。" },
  { lunar: "二月初二", name: "土地公誕辰", god: "福德正神萬壽 (頭牙)", desc: "俗稱「龍抬頭」，做生意者備牲禮、發糕拜土地公，祈求開口大發首財。" },
  { lunar: "二月十九", name: "觀音大士誕辰", god: "觀世音菩薩聖誕", desc: "吃齋、祈福、祈安、放生之日，凡人心靈寧靜、慈悲為本。" },
  { lunar: "三月廿三", name: "媽祖生", god: "天上聖母聖誕", desc: "台灣最隆重的民俗節慶之一。各地萬人空巷、信眾隨香空前熱烈。" },
  { lunar: "四月八日", name: "浴佛節", god: "釋迦牟尼佛聖誕", desc: "以香湯灌沐佛身，洗滌自心塵垢，祈增福慧、消弭業障。" },
  { lunar: "六月廿四", name: "關公诞辰", god: "關聖帝君萬壽", desc: "正氣磅礴之日。求財、消災、求學、義氣盟約者皆宜備禮焚香叩首。" },
  { lunar: "七月十五", name: "中元普渡", god: "地官大帝聖誕", desc: "地官赦罪。民間大辦中元普度，祭祀無主孤魂，展現悲天憫人之胸懷。" },
  { lunar: "八月十五", name: "中秋佳節", god: "月下老人 / 太陰星君聖誕", desc: "人月兩團圓。未婚男女宜求月老牽紅線，家庭各房拜月娘保長生安泰。" },
  { lunar: "九月初九", name: "重陽天", god: "九皇大帝萬壽", desc: "尊老敬老登高日，媽祖得道昇天良辰，常備重陽茱萸糕以辟除邪祟。" },
  { lunar: "冬至之日", name: "冬至節", god: "元始天尊萬壽", desc: "亞歲。全家圍坐吃湯圓，稱「吃一歲添一歲」，積蓄元陽，順應冬藏。" },
  { lunar: "十二月十六", name: "尾牙良辰", god: "土地公謝福恩 (尾牙)", desc: "年尾商家謝神感謝土地公一整年財氣蔭護，並辦尾牙宴款待员工辛勞。" }
];

interface SolarFestivalsProps {
  aiProvider: 'gemini' | 'nvidia';
}

export default function SolarFestivals({ aiProvider }: SolarFestivalsProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "festivals">("terms");
  const [selectedTerm, setSelectedTerm] = useState<string>("立春");

  // AI 諮詢養生活動相關
  const curPeriod = getCurrentSolarTermPeriod(new Date());
  const [advice, setAdvice] = useState<SolarTermAdviceResponse | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [errorAdvice, setErrorAdvice] = useState<string | null>(null);

  const fetchTermAdvice = async () => {
    setLoadingAdvice(true);
    setErrorAdvice(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          task: "term-advice",
          payload: { termName: curPeriod.name }
        }),
      });
      if (!res.ok) {
        throw new Error("向大師求教失敗");
      }
      const data = await res.json();
      setAdvice(data);
    } catch (err: any) {
      setErrorAdvice(err.message || "大師可能正在打坐，請稍後再試。");
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="rounded-3xl border-2 border-[#1A1A1A] bg-[#FCF9F2] p-6 shadow-md space-y-6 font-sans">
      
      {/* 頂頁簽切換 */}
      <div className="flex border-b-2 border-[#D9D3C7] pb-4 justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2.5">
          <button
            id="btn_tab_terms"
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all border-2 border-[#1A1A1A] ${
              activeTab === "terms" 
                ? "bg-[#B22222] text-[#FCF9F2] shadow-[3px_3px_0px_#1A1A1A]" 
                : "bg-[#F5F1E6] text-[#1A1A1A] hover:bg-white"
            }`}
          >
            二十四節氣索引與養生
          </button>
          <button
            id="btn_tab_festivals"
            onClick={() => setActiveTab("festivals")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all border-2 border-[#1A1A1A] ${
              activeTab === "festivals" 
                ? "bg-[#B22222] text-[#FCF9F2] shadow-[3px_3px_0px_#1A1A1A]" 
                : "bg-[#F5F1E6] text-[#1A1A1A] hover:bg-white"
            }`}
          >
            重要神佛誕辰與民俗節慶
          </button>
        </div>

        <span className="text-[11px] text-[#8C8273] font-extrabold flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          傳統民俗瑰寶 · 萬用索引百科
        </span>
      </div>

      <AnimatePresence mode="wait">
        
        {/* 24 節氣區 */}
        {activeTab === "terms" && (
          <motion.div 
            key="tab_terms"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* 頂部：節氣即時建議面板（寬度佔滿 12 欄） */}
            <div className="lg:col-span-12 rounded-3xl bg-[#F5F1E6] border-2 border-[#1A1A1A] p-6 relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#B22222]/5 rounded-bl-full pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D9D3C7] pb-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#B22222] animate-ping"></span>
                    <span className="text-[10px] bg-[#B22222] text-[#FCF9F2] font-black px-2 py-0.5 rounded-lg">系統天時即時檢測</span>
                  </div>
                  <h4 className="text-xl font-black text-[#1A1A1A] font-serif flex items-center gap-1.5 pt-1">
                    當前節氣期間：【 {curPeriod.name} 】
                    <span className="text-xs text-[#8C8273] font-mono">({curPeriod.startStr} ~ {curPeriod.endStr})</span>
                  </h4>
                  <p className="text-xs text-[#8C8273] font-bold">
                    今日是公曆 2026 年 6 月 19 日，地經運行與大氣磁氣，正處於古人智慧【{curPeriod.name}】精準修練節點。
                  </p>
                </div>

                {!advice && !loadingAdvice && (
                  <button
                    id="btn_get_ai_term_advice"
                    onClick={fetchTermAdvice}
                    className="px-5 py-3 bg-[#B22222] hover:bg-[#1A1A1A] text-[#FCF9F2] font-black text-xs rounded-xl active:scale-95 transition-all shadow-[3px_3px_0px_#1A1A1A] border-2 border-[#1A1A1A] flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <Cpu className="h-4 w-4" />
                    <span>大師 AI 實時養生指引</span>
                  </button>
                )}
              </div>

              {/* 加載中 */}
              {loadingAdvice && (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-[#B22222] border-dotted rounded-full animate-spin" style={{ animationDuration: "10s" }}></div>
                    <span className="text-2xl animate-pulse">☯️</span>
                  </div>
                  <h5 className="mt-4 font-black text-[#B22222] text-xs animate-pulse tracking-widest">大師正細研黃帝內經與五行運氣，為您撰寫即時調養心法...</h5>
                </div>
              )}

              {/* 錯誤 */}
              {errorAdvice && (
                <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl font-bold border border-red-200">
                  {errorAdvice}
                </p>
              )}

              {/* 生成好的 AI 建議 */}
              {advice && !loadingAdvice && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* 大師禪意金句 */}
                  <div className="p-4 bg-[#B22222] text-[#FCF9F2] rounded-2xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] text-center tracking-wider relative overflow-hidden">
                    <div className="absolute top-0 left-0 text-xl font-serif text-[#FCF9F2]/10 p-2">☯️</div>
                    <span className="text-[10px] block opacity-80 mb-1 font-serif font-black">🧘 大師時節禪意加持開示</span>
                    <strong className="text-sm font-black font-serif">&ldquo; {advice.zenAura} &rdquo;</strong>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. 飲食調理 */}
                    <div className="p-4 bg-[#FCF9F2] rounded-2xl border-2 border-[#1A1A1A] space-y-3 shadow-sm">
                      <div className="flex items-center gap-1.5 border-b border-[#D9D3C7] pb-2 text-[#B22222]">
                        <Utensils className="h-4 w-4" />
                        <h5 className="font-extrabold text-xs">飲食滋補調理</h5>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] font-black text-emerald-700 block mb-1">【天時宜食推薦】：</span>
                          <div className="flex flex-wrap gap-1.5">
                            {advice.dietAdvice.recommendedFoods.map((f, i) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-extrabold text-[11px]">{f}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-black text-rose-800 block mb-1">【時令避寒禁忌】：</span>
                          <div className="flex flex-wrap gap-1.5">
                            {advice.dietAdvice.avoidFoods.map((f, i) => (
                              <span key={i} className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 font-extrabold text-[11px]">{f}</span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#D9D3C7]/60">
                          <span className="text-[10px] font-black text-[#8C8273] block mb-1">【五行調補原理】：</span>
                          <p className="text-[11px] text-[#1A1A1A] leading-relaxed font-bold">{advice.dietAdvice.explanation}</p>
                        </div>
                      </div>
                    </div>

                    {/* 2. 作息生活 */}
                    <div className="p-4 bg-[#FCF9F2] rounded-2xl border-2 border-[#1A1A1A] space-y-3 shadow-sm">
                      <div className="flex items-center gap-1.5 border-b border-[#D9D3C7] pb-2 text-[#B22222]">
                        <Activity className="h-4 w-4" />
                        <h5 className="font-extrabold text-xs">日常作息修持</h5>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="bg-[#F5F1E6] p-2.5 rounded-xl border border-[#D9D3C7]">
                            <strong className="text-[10px] text-[#B22222] block mb-0.5">🛌 睡眠養陽：</strong>
                            <p className="text-[11px] text-stone-700 font-bold leading-normal">{advice.routineAdvice.sleepAdvice}</p>
                          </div>
                          <div className="bg-[#F5F1E6] p-2.5 rounded-xl border border-[#D9D3C7]">
                            <strong className="text-[10px] text-indigo-700 block mb-0.5">🏃 運動伸展：</strong>
                            <p className="text-[11px] text-stone-700 font-bold leading-normal">{advice.routineAdvice.exerciseAdvice}</p>
                          </div>
                        </div>

                        <div className="bg-[#F5F1E6] p-2.5 rounded-xl border border-[#D9D3C7]">
                          <strong className="text-[10px] text-teal-700 block mb-0.5">🧘 情緒管理與禪心：</strong>
                          <p className="text-[11px] text-stone-700 font-bold leading-normal">{advice.routineAdvice.mindAdvice}</p>
                        </div>

                        <div className="pt-1.5 border-t border-[#D9D3C7]/60">
                          <span className="text-[10px] font-black text-[#8C8273] block mb-1">【導師綜合提示】：</span>
                          <p className="text-[11px] text-[#1A1A1A] leading-relaxed font-bold">{advice.routineAdvice.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      id="btn_refresh_ai_term_advice"
                      onClick={fetchTermAdvice}
                      className="text-[10px] font-black text-[#B22222] hover:underline flex items-center gap-1 bg-none border-none cursor-pointer"
                    >
                      <span>🔄 重新參悟 AI 建議</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 左側：24節氣格子 (5/12 寬) */}
            <div className="lg:col-span-5 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2">
              {Object.keys(SOLAR_TERMS_INFO).map((termName) => {
                const isSelected = selectedTerm === termName;
                return (
                  <button
                    id={`btn_term_select_${termName}`}
                    key={termName}
                    onClick={() => setSelectedTerm(termName)}
                    className={`py-2 rounded-xl border-2 text-xs font-black cursor-pointer select-none transition-all ${
                      isSelected 
                        ? "border-[#1A1A1A] bg-[#B22222] text-[#FCF9F2] shadow-[3px_3px_0px_#1A1A1A] scale-[1.03]" 
                        : "border-[#D9D3C7] bg-[#F5F1E6] text-[#1A1A1A] hover:bg-white"
                    }`}
                  >
                    {termName}
                  </button>
                );
              })}
            </div>

            {/* 右側：節氣詳解卡片 (7/12 寬) */}
            <div className="lg:col-span-7 rounded-2xl bg-[#FCF9F2] border-2 border-[#1A1A1A] p-5 flex flex-col justify-between space-y-4 relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400 rounded-bl-full opacity-10"></div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-[#B22222] text-[#FCF9F2] flex items-center justify-center border-2 border-[#1A1A1A] shadow-sm">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-[#B22222] text-base font-serif">二十四節氣 · 【 {selectedTerm} 】</h4>
                    <span className="text-[10px] text-[#8C8273] block mt-0.5 font-bold">Solar Term &bull; 黃道太陽運行之經天軌跡</span>
                  </div>
                </div>

                <p className="text-xs text-[#1A1A1A] leading-relaxed font-bold">
                  {SOLAR_TERMS_INFO[selectedTerm]?.desc}
                </p>
              </div>

              {/* 養生與防寒 */}
              <div className="rounded-xl bg-[#F5F1E6] p-4 border-2 border-[#D9D3C7] shadow-sm flex items-start gap-3">
                <div className="p-2 bg-[#B22222] text-[#FCF9F2] border border-[#1A1A1A] rounded-lg shrink-0">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="font-black text-[#1A1A1A] text-xs mb-1">【季節開運與養生食補引導】</h5>
                  <p className="text-[11px] text-[#1A1A1A] leading-relaxed font-bold">
                    {SOLAR_TERMS_INFO[selectedTerm]?.regime}
                  </p>
                </div>
              </div>

              <span className="text-[10px] text-[#8C8273] text-center block font-bold">
                二十四節氣是以太陽直射北半球之角度為精算基礎，兩千多年來是華人耕作耕耘、調整生活與飲食精能的核心法門。
              </span>
            </div>
          </motion.div>
        )}

        {/* 12重要祭祀誕辰節慶 */}
        {activeTab === "festivals" && (
          <motion.div 
            key="tab_festivals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FESTIVALS.map((fest, index) => (
                <div 
                  key={index}
                  className="rounded-2xl border-2 border-[#1A1A1A] bg-[#FCF9F2] p-4 hover:border-[#B22222] hover:bg-white transition-all duration-300 flex items-start gap-4 shadow-sm"
                >
                  {/* 月份牌 */}
                  <div className="flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-[#B22222] text-[#FCF9F2] border border-[#1A1A1A] shrink-0 font-serif font-black text-xs w-20 text-center shadow-md">
                    <span>{fest.lunar}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-[#1A1A1A] text-sm tracking-wide">{fest.name}</span>
                      <span className="text-[10px] bg-[#F5F1E6] text-[#B22222] font-black border-2 border-[#1A1A1A] px-1.5 py-0.5 rounded-full scale-90">{fest.god}</span>
                    </div>
                    <p className="text-[11px] text-stone-700 leading-relaxed font-bold">
                      {fest.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
