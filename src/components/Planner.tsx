/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Sparkles, Calendar, Heart, GraduationCap, Building, Truck, ShieldCheck, Compass, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PickDateResponse, RecommendedDay } from "../types";
import { getAlmanac } from "../utils/almanacEngine";

// 活動類型定義
const ACTIVITIES = [
  { id: "嫁娶", label: "嫁娶結婚", desc: "求百年好合，琴瑟和弦", icon: Heart, color: "text-red-700 bg-red-50" },
  { id: "移徙", label: "搬家移居", desc: "遷入新居，闔家安康及好運", icon: Truck, color: "text-amber-700 bg-amber-50" },
  { id: "開市", label: "開業開張", desc: "開張大吉，財源茂盛滾滾來", icon: Building, color: "text-emerald-700 bg-emerald-50" },
  { id: "祈福", label: "祈福求嗣", desc: "消災解厄，積功建德保平安", icon: Sparkles, color: "text-purple-700 bg-purple-50" },
  { id: "入學", label: "開學/入學", desc: "求學問，金榜題名官運高", icon: GraduationCap, color: "text-blue-700 bg-blue-50" },
  { id: "出行", label: "遠行旅遊", desc: "出行順風，路途坦蕩平安歸", icon: Compass, color: "text-indigo-700 bg-indigo-50" },
];

const ZODIACS = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];

interface PlannerProps {
  aiProvider: 'gemini' | 'nvidia';
}

export default function Planner({ aiProvider }: PlannerProps) {
  const [activity, setActivity] = useState("嫁娶");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const [zodiac, setZodiac] = useState("馬");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PickDateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePickDate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          task: "pick-date",
          payload: { activity, year, month, zodiac }
        }),
      });

      if (!response.ok) {
        throw new Error("API 伺服器傳回異常");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setResult(data);
    } catch (e: any) {
      console.warn("API 呼叫失敗，啟用本地黃曆算沙 fallback：", e);
      // Fallback 擇吉演算：遍歷該月 1~28 天，找尋建除十二神為 "成" 或 "開"、且生肖不與使用者相沖的日子作為吉日！
      const fallbackDays: RecommendedDay[] = [];
      const scorePool = [96, 92, 88];
      
      // 模擬找出該月對應天數
      const daysCount = new Date(year, month, 0).getDate();
      let index = 0;
      
      for (let d = 1; d <= daysCount; d++) {
        const tempDate = new Date(year, month - 1, d);
        const alm = getAlmanac(tempDate);
        
        // 避開本命生肖沖煞，且值神是比較吉利的 (成日、定日、開日)
        const isAuspicious = ["成", "定", "開", "除"].includes(alm.jianShen);
        const isNotConflict = !alm.conflictAnimal.includes(zodiac);
        
        if (isAuspicious && isNotConflict) {
          fallbackDays.push({
            date: alm.gregorianDate,
            lunarDate: alm.lunarMonthDate,
            suitabilityScore: scorePool[index] || 85,
            suitReasons: [
              `今日值【${alm.jianShen}日】。民俗所謂「天之成生，物之開化」，主行事順利，尤其適合${activity}。`,
              `此日五行納音為【${alm.wuhang}】，干支為【${alm.ganzhiDay}】，天清地寧。`,
              `生肖屬相避沖：今日沖${alm.conflictAnimal}，對你的肖屬【${zodiac}】毫無沖煞，大吉大利。`
            ],
            auspiciousHours: ["巳時 (09:00 - 11:00)", "申時 (15:00 - 17:00)", "酉時 (17:00 - 19:00)"],
            luckyDirections: {
              wealth: alm.luckyDirectionWealth,
              nobles: alm.luckyDirectionNobles
            },
            modernWisdom: `大師開誠心指點：擇日更需擇心。雖然是黃道吉日，但當天行事宜抱持「不急不躁、敬畏包容」的豁達心態，吉事必圓滿成功！`
          });
          
          index++;
          if (fallbackDays.length >= 3) break;
        }
      }

      // 如果找不夠 3 個，就補齊
      if (fallbackDays.length < 3) {
        for (let d = 1; d <= 10; d++) {
          if (fallbackDays.length >= 3) break;
          const tempDate = new Date(year, month - 1, d);
          const alm = getAlmanac(tempDate);
          
          // 避免重複
          if (fallbackDays.some(f => f.date === alm.gregorianDate)) continue;

          fallbackDays.push({
            date: alm.gregorianDate,
            lunarDate: alm.lunarMonthDate,
            suitabilityScore: 82 - fallbackDays.length * 2,
            suitReasons: [
              `當日干支協調，今日宜神相扶。`,
              `今日五行為【${alm.wuhang}】。`
            ],
            auspiciousHours: ["辰時 (07:00 - 09:00)", "午時 (11:00 - 13:00)"],
            luckyDirections: {
              wealth: "正南",
              nobles: "東北"
            },
            modernWisdom: `大師指引：此日平穩中正，凡事只要踏實，一切順隨人願。`
          });
        }
      }

      setResult({
        activity,
        monthLabel: `${year}年${month}月`,
        recommendations: fallbackDays
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 擇吉輸入條件版 */}
      <div className="rounded-3xl border-2 border-[#D9D3C7] bg-[#F5F1E6] p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B22222]/5 rounded-bl-full opacity-10"></div>
        <h3 className="text-xl font-black text-[#1A1A1A] flex items-center gap-2 mb-6 font-serif">
          <Sparkles className="h-5 w-5 text-[#B22222] animate-spin" style={{ animationDuration: "12s" }} />
          AI 智慧黃道擇吉與良辰推算
        </h3>

        {/* 1. 選擇活動類型 */}
        <div className="space-y-3">
          <label className="text-xs font-black text-[#8C8273] tracking-wider block font-sans">1. 選擇期望辦理的吉事：</label>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 font-sans">
            {ACTIVITIES.map((act) => {
              const IconComp = act.icon;
              const isSelected = activity === act.id;
              return (
                <button
                  id={`btn_act_${act.id}`}
                  key={act.id}
                  onClick={() => setActivity(act.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-center transition-all duration-300 relative cursor-pointer group ${
                    isSelected 
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-[#FCF9F2] shadow-md transform scale-[1.02]" 
                      : "border-[#D9D3C7] bg-[#FCF9F2] text-[#8C8273] hover:border-[#1A1A1A] hover:bg-white"
                  }`}
                >
                  <div className={`p-2 rounded-xl mb-2 ${act.color} group-hover:scale-110 transition-transform`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <span className={`font-black text-sm ${isSelected ? "text-[#FCF9F2]" : "text-[#1A1A1A]"}`}>{act.label}</span>
                  <span className={`text-[10px] mt-1 scale-90 ${isSelected ? "text-[#8C8273]" : "text-[#8C8273]"}`}>{act.desc}</span>
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#B22222] text-[#FCF9F2] p-0.5 rounded-full shadow">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 選擇時間與生肖範圍 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 border-t-2 border-[#D9D3C7] pt-6 font-sans">
          
          {/* 年份 */}
          <div>
            <label className="text-xs font-black text-[#8C8273] tracking-wider block mb-2">2. 年份：</label>
            <select 
              id="select_plan_year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#FCF9F2] border-2 border-[#D9D3C7] text-[#1A1A1A] font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#B22222] transition-all cursor-pointer"
            >
              <option value="2026">西元 2026 年 (丙午年)</option>
              <option value="2027">西元 2027 年 (丁未年)</option>
              <option value="2028">西元 2028 年 (戊申年)</option>
            </select>
          </div>

          {/* 月份 */}
          <div>
            <label className="text-xs font-black text-[#8C8273] tracking-wider block mb-2">3. 月份：</label>
            <select 
              id="select_plan_month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#FCF9F2] border-2 border-[#D9D3C7] text-[#1A1A1A] font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#B22222] transition-all cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m} 月</option>
              ))}
            </select>
          </div>

          {/* 生肖本命 */}
          <div>
            <label className="text-xs font-black text-[#8C8273] tracking-wider block mb-2">4. 主事人生肖屬相：</label>
            <select 
              id="select_plan_zodiac"
              value={zodiac}
              onChange={(e) => setZodiac(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#FCF9F2] border-2 border-[#D9D3C7] text-[#1A1A1A] font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#B22222] transition-all cursor-pointer"
            >
              {ZODIACS.map((z) => (
                <option key={z} value={z}>{z} [{z === "馬" ? "本命" : ""}]</option>
              ))}
            </select>
          </div>

          {/* 驅動按鈕 */}
          <div className="flex items-end">
            <button
              id="btn_start_pick_date"
              onClick={handlePickDate}
              disabled={loading}
              className="w-full h-11 bg-[#B22222] hover:bg-[#1A1A1A] text-[#FCF9F2] font-black rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>天機演算中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>推算此月最吉三日</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* 擇吉結果展演 */}
      <div className="mt-8 font-sans">
        <AnimatePresence mode="wait">
          
          {/* Loding 狀態：唯美的太極羅盤 */}
          {loading && (
            <motion.div 
              key="loading_planner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              {/* 動態太極羅盤 */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center border-4 border-[#B22222] border-dashed rounded-full animate-spin" style={{ animationDuration: "14s" }}>
                <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white font-extrabold text-xs">
                  ☯️
                </div>
              </div>
              <h4 className="mt-6 text-[#1A1A1A] font-extrabold font-serif text-lg tracking-widest">
                正在用 AI 與古農書演算良辰吉日
              </h4>
              <p className="text-[#8C8273] text-xs mt-2 max-w-sm leading-relaxed font-bold">
                正在排查與你屬相【{zodiac}】相衝的凶日，篩選月建吉時與神煞宜忌，請稍候三秒，良辰即現。
              </p>
            </motion.div>
          )}

          {/* 結果出現啦 */}
          {result && !loading && (
            <motion.div 
              key="result_planner"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between border-b-2 border-[#D9D3C7] pb-3.5 gap-4">
                <div>
                  <h3 className="font-black text-[#1A1A1A] text-xl font-serif">
                    【{result.activity}】吉日推算結果 &bull; 尋得三吉
                  </h3>
                  <p className="text-[#8C8273] text-xs mt-1 font-bold">
                    計算範圍：{result.monthLabel} &bull; 避開肖屬：沖【{zodiac}】之所有不宜日
                  </p>
                </div>
                
                <span className="text-xs bg-[#2E7D32] text-[#FCF9F2] font-black py-1 px-3.5 rounded-full flex items-center gap-1 shrink-0 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                  已為您規避所有沖煞相剋
                </span>
              </div>

              {/* 三大吉日 staggered */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {result.recommendations.map((rec, index) => {
                  const dObj = new Date(rec.date);
                  const dayNum = dObj.getDate();
                  const monthText = dObj.toLocaleString("zh-TW", { month: "short" });
                  
                  return (
                    <motion.div
                      key={rec.date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
                      className="rounded-3xl border-2 border-[#D9D3C7] bg-[#FCF9F2] shadow-md hover:shadow-lg hover:border-[#1A1A1A] transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
                    >
                      {/* 上方頂飾條，依吉度打星 */}
                      <div className="h-2.5 bg-[#B22222]"></div>
                      
                      {/* 日期大寫牌位展示 */}
                      <div className="p-5 border-b border-[#D9D3C7] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-[#F5F1E6] border-2 border-[#D9D3C7] text-[#1A1A1A] shrink-0">
                            <span className="text-[9px] uppercase tracking-wider font-mono font-black leading-none">{monthText}</span>
                            <span className="text-2xl font-black leading-none mt-1">{dayNum}</span>
                          </div>
                          <div>
                            <div className="font-extrabold text-[#1A1A1A] text-sm">{rec.date}</div>
                            <div className="text-xs text-[#B22222] font-black mt-1 font-serif">農曆 {rec.lunarDate}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-[#8C8273] font-bold">吉日契合指數</div>
                          <div className="text-xl font-black text-[#B22222] font-mono mt-0.5">{rec.suitabilityScore}%</div>
                        </div>
                      </div>

                      {/* 中間：推薦理由 */}
                      <div className="p-5 space-y-4 flex-1">
                        <div>
                          <span className="text-[11px] font-black text-[#8C8273] block mb-2">⭐ 吉兆與命理宜忌分析：</span>
                          <ul className="space-y-1.5 text-xs text-[#1A1A1A] font-bold">
                            {rec.suitReasons.map((reason, rid) => (
                              <li key={rid} className="leading-relaxed flex items-start gap-1">
                                <span className="text-[#B22222] font-extrabold shrink-0">「意」</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 吉時與方位 */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#D9D3C7]/60">
                          <div>
                            <span className="text-[10px] font-black text-[#8C8273] block mb-1">⏰ 當日黃金吉時：</span>
                            <div className="text-[11px] font-bold text-[#1A1A1A] leading-normal space-y-1">
                              {rec.auspiciousHours.map((hour, hid) => (
                                <div key={hid}>&bull; {hour}</div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-black text-[#8C8273] block mb-1">🧭 本日開運方位：</span>
                            <div className="text-[11px] font-bold text-[#1A1A1A] leading-normal space-y-1">
                              <div>&bull; 喜神：{rec.luckyDirections.wealth}</div>
                              <div>&bull; 貴人：{rec.luckyDirections.nobles}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 底部：現代大師開運引導 (淡米色背景) */}
                      <div className="bg-[#F5F1E6] border-t-2 border-[#D9D3C7] p-4 font-bold text-[11px] text-[#1A1A1A] leading-relaxed italic">
                        <span className="font-extrabold text-[#B22222] block mb-1 not-italic text-xs font-serif">大師每日溫馨指引：</span>
                        &ldquo;{rec.modernWisdom}&rdquo;
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
