/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { AlmanacDay } from "../types";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from "recharts";
import { Sparkles, Milestone } from "lucide-react";

interface WuxingRadarChartProps {
  dayData: AlmanacDay;
}

// 天干五行映射
const STEM_WUXING: { [key: string]: string } = {
  "甲": "木", "乙": "木",
  "丙": "火", "丁": "火",
  "戊": "土", "己": "土",
  "庚": "金", "辛": "金",
  "壬": "水", "癸": "水"
};

// 地支五行映射
const BRANCH_WUXING: { [key: string]: string } = {
  "寅": "木", "卯": "木",
  "巳": "火", "午": "火",
  "申": "金", "酉": "金",
  "亥": "水", "子": "水",
  "辰": "土", "戌": "土", "丑": "土", "未": "土"
};

// 五行名稱
const ELEMENTS = ["金", "木", "水", "火", "土"] as const;

// 各五行詳盡解讀
const ELEMENT_DETAILS: { [key in typeof ELEMENTS[number]]: {
  title: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  desc: string;
  regime: string;
} } = {
  "金": {
    title: "素商金炁 · 主剛毅、收斂、決斷",
    color: "#BCAAA4", // 柔和的金屬灰/白金
    bgColor: "bg-amber-50",
    textColor: "text-amber-900",
    borderColor: "border-amber-300",
    desc: "金主收斂、決斷。今日金之能量充足，適合整理繁重工作、定奪決議及簽約立誓，代表判斷力奇高。避固執己見。",
    regime: "宜：整理雜物、制定規章。忌：口舌之爭。"
  },
  "木": {
    title: "蒼靈木炁 · 主仁慈、生發、生機",
    color: "#2E7D32", // 典雅深綠
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-900",
    borderColor: "border-emerald-300",
    desc: "木主生發生長、欣欣向榮。代表創造力、生機勃勃，適合開啟新方案、學習、栽種、拉伸或健走運動。萬事開局順風。",
    regime: "宜：戶外漫步、閱讀學習。忌：久坐抑鬱。"
  },
  "水": {
    title: "玄冥水炁 · 主柔順、智慧、流動",
    color: "#1565C0", // 澄淨天青藍
    bgColor: "bg-blue-50",
    textColor: "text-blue-950",
    borderColor: "border-blue-300",
    desc: "水主智慧、流動與包容。今日水流潺潺，人際溝通、智慧感悟極上。適合安靜思考、心靈沉澱、做研究規劃，多所頓悟。",
    regime: "宜：探討學問、溫熱水足浴。忌：過度憂思。"
  },
  "火": {
    title: "朱明火炁 · 主禮樂、熱烈、光明",
    color: "#B22222", // 宮廷朱紅
    bgColor: "bg-red-50/50",
    textColor: "text-[#B22222]",
    borderColor: "border-red-300",
    desc: "火主光明、熱烈傳播。火之氣能點燃行動力與信心，利於展示成果、交際聯絡、演講推廣。惟注意防急躁，戒驕戒躁。",
    regime: "宜：多展露熱情、拜訪貴人。忌：過度暴飲。"
  },
  "土": {
    title: "后土土炁 · 主誠信、沈穩、承載",
    color: "#8D6E63", // 泥土黃褐
    bgColor: "bg-stone-100",
    textColor: "text-stone-800",
    borderColor: "border-stone-400",
    desc: "土主中正、承載與積蓄。厚載萬物，利於沉澱內核、積攢資產。凡商討中長期契約、修繕家居或立定基石，皆能厚德載物。",
    regime: "宜：居家整理、理財規劃。忌：懶散拖延。"
  }
};

export default function WuxingRadarChart({ dayData }: WuxingRadarChartProps) {
  // 對當日天干、地支、納音五行進行多維度加權精算，得出一組完美符合該天五行強弱的精準比例數據
  const { chartData, dominantElement, weakestElement } = useMemo(() => {
    const { ganzhiDay, ganzhiMonth, wuhang } = dayData;

    // 基底值（保證雷達圖不崩塌，有飽滿基礎骨架）
    const scores: { [key in typeof ELEMENTS[number]]: number } = {
      "金": 15,
      "木": 15,
      "水": 15,
      "火": 15,
      "土": 15
    };

    // 1. 日干支 (日天干 +25, 日地支 +25)
    if (ganzhiDay && ganzhiDay.length >= 2) {
      const stem = ganzhiDay.charAt(0);
      const branch = ganzhiDay.charAt(1);
      const elStem = STEM_WUXING[stem] as typeof ELEMENTS[number] | undefined;
      const elBranch = BRANCH_WUXING[branch] as typeof ELEMENTS[number] | undefined;
      
      if (elStem) scores[elStem] += 25;
      if (elBranch) scores[elBranch] += 25;
    }

    // 2. 月干支 (月天干 +15, 月地支 +15)
    if (ganzhiMonth && ganzhiMonth.length >= 2) {
      const stem = ganzhiMonth.charAt(0);
      const branch = ganzhiMonth.charAt(1);
      const elStem = STEM_WUXING[stem] as typeof ELEMENTS[number] | undefined;
      const elBranch = BRANCH_WUXING[branch] as typeof ELEMENTS[number] | undefined;

      if (elStem) scores[elStem] += 15;
      if (elBranch) scores[elBranch] += 15;
    }

    // 3. 納音五行 (包含的金木水火土 +35)
    if (wuhang) {
      const found = ELEMENTS.find((el) => wuhang.includes(el));
      if (found) {
        scores[found] += 35;
      }
    }

    // 4. 重整及轉換為 Recharts 格式
    const dataList = ELEMENTS.map((name) => ({
      subject: `${name}氣`,
      value: scores[name],
      fullMark: 120
    }));

    // 尋找極強與極弱元素
    let maxVal = -1;
    let minVal = 999;
    let dominant: typeof ELEMENTS[number] = "土";
    let weakest: typeof ELEMENTS[number] = "水";

    ELEMENTS.forEach((el) => {
      const val = scores[el];
      if (val > maxVal) {
        maxVal = val;
        dominant = el;
      }
      if (val < minVal) {
        minVal = val;
        weakest = el;
      }
    });

    return {
      chartData: dataList,
      dominantElement: dominant,
      weakestElement: weakest
    };
  }, [dayData]);

  const dominantInfo = ELEMENT_DETAILS[dominantElement];

  return (
    <div className="rounded-3xl border-2 border-[#1A1A1A] bg-[#FCF9F2] p-5 shadow-md flex flex-col md:flex-row gap-5 items-stretch font-sans">
      
      {/* 左邊：雷達圖繪製區 */}
      <div className="w-full md:w-[45%] flex flex-col items-center justify-center p-2 rounded-2xl bg-[#F5F1E6]/50 border-2 border-[#D9D3C7]/40 relative min-h-[220px]">
        
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 bg-[#B22222] rounded-full"></span>
          <span className="text-[9px] text-[#8C8273] font-bold tracking-wider font-serif">當天五行星盤 (NaYin Map)</span>
        </div>

        <div className="w-full h-[180px] mt-2 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="#D9D3C7" strokeWidth={1} strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: "#1A1A1A", fontSize: 11, fontWeight: 900, fontFamily: "sans-serif" }} 
              />
              <Radar
                name="能量強度"
                dataKey="value"
                stroke="#B22222"
                fill="#B22222"
                fillOpacity={0.18}
                strokeWidth={2}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1A1A1A] border border-[#1A1A1A] text-[#FCF9F2] text-[10px] p-2 rounded shadow-md font-sans">
                        <strong className="block">{data.subject}：{data.value}</strong>
                        <span className="text-gray-400">當日五行相對權重</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 五行小膠囊圖例 */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
          {ELEMENTS.map((el) => {
            const isDom = el === dominantElement;
            const det = ELEMENT_DETAILS[el];
            return (
              <span 
                key={el}
                style={{ borderColor: isDom ? "#1A1A1A" : "transparent" }}
                className={`text-[9px] px-1.5 py-0.5 rounded-md font-black flex items-center gap-1 border ${det.bgColor} ${det.textColor}`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: det.color }}></span>
                {el}
                {isDom && <span className="text-[8px] bg-[#B22222] text-white px-0.5 rounded">旺</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* 右邊：大師批註與開運指引 */}
      <div className="w-full md:w-[55%] flex flex-col justify-between space-y-3 pt-1">
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[#B22222] text-xs font-black font-serif">
            <Sparkles className="h-4 w-4" />
            <span>【 每日五行能量主批 】</span>
          </div>

          <h5 className="text-[13px] font-black text-[#1A1A1A] flex items-center gap-1 font-serif">
            今日天時以 <strong className="text-[#B22222] border-b-2 border-[#B22222] pb-0.5 text-sm">【 {dominantElement} 能量 】</strong>最為得令提振
          </h5>

          <p className="text-xs text-stone-700 leading-relaxed font-bold">
            {dominantInfo.desc}
          </p>
        </div>

        {/* 實用生克調養 */}
        <div className={`p-3 rounded-xl border border-dashed flex flex-col gap-1 ${dominantInfo.bgColor} ${dominantInfo.borderColor}`}>
          <div className="flex items-center gap-1 text-[#1A1A1A]">
            <Milestone className="h-3.5 w-3.5 text-[#B22222] shrink-0" />
            <strong className="text-[11px] font-black">五行日常克洩調養秘訣：</strong>
          </div>
          <p className="text-[10px] text-stone-700 font-bold leading-normal">
            {dominantInfo.regime}
          </p>
          {weakestElement !== dominantElement && (
            <span className="text-[9px] text-[#8C8273] block mt-1 border-t border-[#D9D3C7]/40 pt-1 font-medium">
              ☯️ 註：今日 <strong>{weakestElement}氣</strong> 最弱，宜收心內觀，注意補充對應精力。
            </span>
          )}
        </div>

      </div>

    </div>
  );
}
