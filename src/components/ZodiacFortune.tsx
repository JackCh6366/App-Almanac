/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { ZodiacReport } from "../types";
import { Star, ShieldCheck, Sparkles, RefreshCw, Loader2, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ZodiacFortuneProps {
  currentDateStr: string; // "YYYY-MM-DD"
}

const ZODIACS = [
  { name: "鼠", branch: "子", desc: "機敏靈巧，見微知著" },
  { name: "牛", branch: "丑", desc: "勤懇務實，厚積薄發" },
  { name: "虎", branch: "寅", desc: "雄姿英發，一往無前" },
  { name: "兔", branch: "卯", desc: "溫雅內斂，動靜咸宜" },
  { name: "龍", branch: "辰", desc: "志存高遠，見龍在天" },
  { name: "蛇", branch: "巳", desc: "靈動睿智，隨機應變" },
  { name: "馬", branch: "午", desc: "龍馬精神，馬到成功" },
  { name: "羊", branch: "未", desc: "溫順祥和，吉人天相" },
  { name: "猴", branch: "申", desc: "聰慧敏捷，出奇制勝" },
  { name: "雞", branch: "酉", desc: "朝氣蓬勃，雞鳴曉旦" },
  { name: "狗", branch: "戌", desc: "忠厚誠懇，安守四方" },
  { name: "豬", branch: "亥", desc: "福澤深厚，知足常樂" }
];

export default function ZodiacFortune({ currentDateStr }: ZodiacFortuneProps) {
  const [selectedZodiac, setSelectedZodiac] = useState("馬");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ZodiacReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchZodiacFortune = async (zodiacName: string) => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/almanac/fortune-today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zodiac: zodiacName, dateStr: currentDateStr })
      });

      if (!response.ok) {
        throw new Error("伺服器連線超時");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setReport(data);
    } catch (e: any) {
      console.warn("生肖 Fortune API 失敗，啟用本地天文宿星 Hash Fallback 運算：", e);
      
      // Fallback 算法：依據 selectedZodiac、當前日期的 Hash 算出一組固定的好分數
      const dateParts = currentDateStr.split("-");
      const year = Number(dateParts[0]) || 2026;
      const month = Number(dateParts[1]) || 6;
      const day = Number(dateParts[2]) || 19;

      const zodiacIdx = ZODIACS.findIndex(z => z.name === zodiacName);
      const randSeed = (year * 3 + month * 17 + day * 31 + zodiacIdx * 101) % 100;
      
      const overallScore = 75 + (randSeed % 21); // 75 ~ 95 分
      const wealthScore = 3 + (randSeed % 3); // 3-5
      const careerScore = 3 + ((randSeed + 1) % 3); 
      const loveScore = 2 + ((randSeed + 2) % 4); // 2-5
      const healthScore = 3 + ((randSeed + 3) % 3);

      const colors = ["琥珀金", "宮廷朱紅", "玄鐵黑", "青瓷綠", "象牙白", "天青藍", "櫻草黃", "黛紫", "妃紅"];
      const luckyColor = colors[(randSeed) % colors.length];

      const luckyNumber = String((randSeed * 7) % 9 + 1);
      const directions = ["正東", "正西", "正南", "正北", "東北", "西北", "東南", "西南"];
      const luckyDirection = directions[(randSeed * 3) % directions.length];

      const tips = [
        `肖${zodiacName}今日命宮適逢「天德」吉星高照。生活中有意外驚喜，適合出門會親、進行重要工作部署，唯忌浮躁。`,
        `肖${zodiacName}今日五行平和。做事專注，身邊會有貴人暗中相助，是個極佳的「收納財祿」之日，穿搭宜配 ${luckyColor}。`,
        `肖${zodiacName}今日心氣有些浮躁。宜沉心靜修，飲食不宜油膩。在辦公室中朝 **【${luckyDirection}】** 安設擺件，能快速聚集福氣。`,
        `肖${zodiacName}今日逢生肖合局。運勢高昂，適合跟心儀的人表白，或者找朋友一同聚會，幸運數字是 【${luckyNumber}】。`
      ];
      const summary = tips[randSeed % tips.length];

      setReport({
        zodiac: zodiacName,
        overallScore,
        wealthScore,
        careerScore,
        loveScore,
        healthScore,
        luckyColor,
        luckyNumber,
        luckyDirection,
        summary
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始與當期日期、生肖變更時自動獲取
  useEffect(() => {
    fetchZodiacFortune(selectedZodiac);
  }, [selectedZodiac, currentDateStr]);

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, id) => (
          <Star 
            key={id} 
            className={`h-4 w-4 ${id < score ? "fill-amber-400 text-amber-500" : "text-stone-200 fill-stone-100"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 頂部 12 生肖選扣單 */}
      <div className="rounded-3xl border-2 border-[#1A1A1A] bg-[#FCF9F2] p-5 shadow-md space-y-4">
        <label className="text-xs font-black text-[#1A1A1A] tracking-wider block">查看今日 12 生肖開運報告：</label>
        
        <div className="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-2">
          {ZODIACS.map((z) => {
            const isSelected = selectedZodiac === z.name;
            return (
              <button
                id={`btn_zodiac_tab_${z.name}`}
                key={z.name}
                onClick={() => setSelectedZodiac(z.name)}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all cursor-pointer select-none relative overflow-hidden group ${
                  isSelected 
                    ? "border-[#1A1A1A] bg-[#B22222] text-[#FCF9F2] font-black scale-[1.03] shadow-[3px_3px_0px_#1A1A1A]" 
                    : "border-[#D9D3C7] text-stone-700 bg-[#F5F1E6] hover:border-[#1A1A1A] hover:bg-white"
                }`}
              >
                {/* 裝飾底紋 */}
                <span className="text-xl leading-none font-black">{z.name}</span>
                <span className={`text-[10px] mt-1 scale-90 group-hover:scale-100 transition-transform font-mono font-bold ${isSelected ? "text-[#f3ca52]" : "text-stone-500"}`}>{z.branch}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 生肖日運呈現 */}
      <AnimatePresence mode="wait">
        
        {loading && (
          <motion.div 
            key="zodiac_loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-[#1A1A1A] bg-[#FCF9F2] shadow-md font-sans"
          >
            <Loader2 className="h-8 w-8 text-[#B22222] animate-spin" />
            <h4 className="mt-4 text-[#1A1A1A] font-black text-sm tracking-wider font-serif">正由大師排查今日生肖星軌</h4>
          </motion.div>
        )}

        {report && !loading && (
          <motion.div 
            key="zodiac_report"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            
            {/* 左邊：吉福大章（綜合大分數） */}
            <div className="lg:col-span-4 rounded-3xl bg-[#5c1c1c] text-[#FCF9F2] border-2 border-[#1A1A1A] p-6 flex flex-col justify-between items-center text-center shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-amber-950 to-[#240606] opacity-90 -z-10"></div>
              
              <div className="space-y-1">
                <span className="text-amber-300 font-extrabold text-xs">十二生肖今日開運大吉</span>
                <h4 className="text-4xl font-black font-serif text-[#f3ca52]">【 肖 {report.zodiac} 運 勢 】</h4>
              </div>

              {/* 大紅福字大好運圓盤 */}
              <div className="my-6 relative flex items-center justify-center h-40 w-40 shrink-0">
                {/* 圓網底 */}
                <div className="absolute inset-0 border-4 border-[#f3ca52] border-dashed rounded-full animate-spin" style={{ animationDuration: "14s" }}></div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-amber-300 font-black uppercase tracking-widest font-mono">Luck Index</span>
                  <strong className="text-4xl font-black font-mono text-[#FCF9F2] mt-1">{report.overallScore}%</strong>
                  <span className="text-[10px] bg-[#B22222] border-2 border-[#1A1A1A] font-black px-2.5 py-0.5 rounded-full mt-2 text-[#f3ca52] shadow-sm">喜上眉梢</span>
                </div>
              </div>

              {/* 開運格言 */}
              <div className="text-xs text-amber-200/90 font-black italic leading-relaxed text-center max-w-[200px]">
                &ldquo; {ZODIACS.find(z => z.name === report.zodiac)?.desc} &rdquo;
              </div>
            </div>

            {/* 右邊：各項運勢雷達及細節 */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* 各分項指數（財運、事業等） */}
              <div className="rounded-3xl bg-[#FCF9F2] border-2 border-[#1A1A1A] p-6 shadow-md space-y-4">
                <h4 className="font-black text-[#1A1A1A] text-sm flex items-center gap-1 font-serif">
                  <Award className="h-5 w-5 text-[#B22222]" />
                  今日具體運勢指數
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 工 */}
                  <div className="flex items-center justify-between p-3.5 bg-[#F5F1E6] rounded-2xl border-2 border-[#D9D3C7]">
                    <span className="text-xs font-black text-[#1A1A1A] block">💼 工作功名指數</span>
                    {renderStars(report.careerScore)}
                  </div>
                  {/* 財 */}
                  <div className="flex items-center justify-between p-3.5 bg-[#F5F1E6] rounded-2xl border-2 border-[#D9D3C7]">
                    <span className="text-xs font-black text-[#1A1A1A] block">💰 財源進祿指數</span>
                    {renderStars(report.wealthScore)}
                  </div>
                  {/* 愛 */}
                  <div className="flex items-center justify-between p-3.5 bg-[#F5F1E6] rounded-2xl border-2 border-[#D9D3C7]">
                    <span className="text-xs font-black text-[#1A1A1A] block">💖 紅鸞桃花指數</span>
                    {renderStars(report.loveScore)}
                  </div>
                  {/* 精 */}
                  <div className="flex items-center justify-between p-3.5 bg-[#F5F1E6] rounded-2xl border-2 border-[#D9D3C7]">
                    <span className="text-xs font-black text-[#1A1A1A] block">🔋 精神安康指數</span>
                    {renderStars(report.healthScore)}
                  </div>
                </div>
              </div>

              {/* 開運三寶：幸運色、數字、方位 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                
                {/* 色 */}
                <div className="rounded-2xl border-2 border-[#1A1A1A] bg-[#FCF9F2] p-4 shadow-md flex flex-col items-center text-center justify-center relative overflow-hidden">
                  <span className="text-[11px] font-black text-stone-500 block mb-1">今日開運色</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="h-4 w-4 rounded-full border border-stone-800" style={{ backgroundColor: report.luckyColor === "琥珀金" ? "#d97706" : report.luckyColor === "宮廷朱紅" ? "#be1212" : report.luckyColor === "玄鐵黑" ? "#1c1917" : report.luckyColor === "青瓷綠" ? "#0f766e" : report.luckyColor === "天青藍" ? "#0369a1" : "#be1212" }}></span>
                    <strong className="text-sm text-[#1A1A1A] font-black">{report.luckyColor}</strong>
                  </div>
                </div>

                {/* 數 */}
                <div className="rounded-2xl border-2 border-[#1A1A1A] bg-[#FCF9F2] p-4 shadow-md flex flex-col items-center text-center justify-center relative overflow-hidden">
                  <span className="text-[11px] font-black text-stone-500 block mb-1">今日幸運數</span>
                  <strong className="text-2xl text-[#1A1A1A] font-black font-mono mt-0.5">{report.luckyNumber}</strong>
                </div>

                {/* 位 */}
                <div className="rounded-2xl border-2 border-[#1A1A1A] bg-[#FCF9F2] p-4 shadow-md flex flex-col items-center text-center justify-center relative overflow-hidden">
                  <span className="text-[11px] font-black text-stone-500 block mb-1">今日開運方位</span>
                  <strong className="text-sm text-[#B22222] font-black mt-1">{report.luckyDirection}</strong>
                </div>

              </div>

              {/* 大師日誌 summary */}
              <div className="rounded-3xl bg-[#F5F1E6] border-2 border-[#D9D3C7] p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-amber-400 rounded-bl-full opacity-10"></div>
                
                <h5 className="font-black text-[#1A1A1A] text-xs flex items-center gap-1 mb-2 font-serif">
                  <Sparkles className="h-4 w-4 text-[#B22222]" />
                  大師今日肖屬生活指引大綱：
                </h5>
                <p className="text-xs text-[#1A1A1A] leading-relaxed font-black italic">
                  &ldquo; {report.summary} &rdquo;
                </p>
              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
