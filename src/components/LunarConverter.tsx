/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { getAlmanac, getSolarTerm, getCurrentSolarTermPeriod } from "../utils/almanacEngine";
import { Calendar, RefreshCw, Sparkles, Check, ArrowRightLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LunarConverterProps {
  currentDate: Date;
  onSetMainDate: (date: Date) => void;
}

export default function LunarConverter({ currentDate, onSetMainDate }: LunarConverterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchDateStr, setSearchDateStr] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`
  );
  
  // 當使用者輸入日期改變時，即時推算對應資料
  const convertedData = useMemo(() => {
    if (!searchDateStr) return null;
    const parts = searchDateStr.split("-");
    if (parts.length !== 3) return null;
    
    const yr = parseInt(parts[0], 10);
    const mo = parseInt(parts[1], 10) - 1;
    const dy = parseInt(parts[2], 10);
    
    if (isNaN(yr) || isNaN(mo) || isNaN(dy)) return null;
    
    const targetDate = new Date(yr, mo, dy);
    if (isNaN(targetDate.getTime())) return null;

    const almanac = getAlmanac(targetDate);
    const exactSolarTerm = getSolarTerm(targetDate);
    const solarTermPeriod = getCurrentSolarTermPeriod(targetDate);

    return {
      targetDate,
      almanac,
      exactSolarTerm,
      solarTermPeriod
    };
  }, [searchDateStr]);

  const handleApply = () => {
    if (convertedData?.targetDate) {
      onSetMainDate(convertedData.targetDate);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative font-sans inline-block">
      {/* 傳統卷軸或印章造型的觸發按鈕 */}
      <button
        id="btn_toggle_lunar_converter"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2.5 rounded-xl border-2 cursor-pointer font-black text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
          isOpen
            ? "bg-[#1A1A1A] border-[#1A1A1A] text-[#FCF9F2]"
            : "bg-[#F5F1E6] border-[#D9D3C7] text-[#1A1A1A] hover:bg-white"
        }`}
      >
        <ArrowRightLeft className="h-4 w-4 text-[#B22222]" />
        <span>公農曆對照轉換工具</span>
        <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] bg-[#B22222] text-white rounded font-mono font-bold animate-pulse">
          即時
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 螢幕遮罩以利於在外面點擊關閉 */}
            <div 
              className="fixed inset-0 z-30 cursor-default bg-black/5" 
              onClick={() => setIsOpen(false)}
            ></div>

            {/* 轉換面板小浮窗 */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl border-2 border-[#1A1A1A] bg-[#FCF9F2] p-5 shadow-2xl z-40 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-2 border-[#D9D3C7]">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-[#B22222]" />
                  <h4 className="font-black text-[#1A1A1A] text-sm font-serif">公曆 ⇄ 農曆極速轉換</h4>
                </div>
                <span className="text-[10px] text-[#8C8273] font-bold">隨指即算 ‧ 當下可考</span>
              </div>

              {/* 日期輸入器 */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#8C8273] font-black block">【請選擇或輸入公曆日期】：</label>
                <div className="flex gap-2">
                  <input
                    id="converter_date_input"
                    type="date"
                    value={searchDateStr}
                    onChange={(e) => setSearchDateStr(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-white border-2 border-[#D9D3C7] text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#B22222] cursor-pointer"
                  />
                  <button
                    id="converter_reset_current"
                    onClick={() => {
                      const today = new Date();
                      setSearchDateStr(
                        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-[#F5F1E6] hover:bg-white border-2 border-[#D9D3C7] text-xs font-bold transition-all text-[#1A1A1A] cursor-pointer flex items-center justify-center"
                    title="重設為今日"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 推算結果 */}
              {convertedData ? (
                <div className="space-y-3 bg-[#F5F1E6]/80 p-3.5 rounded-xl border border-[#D9D3C7] text-xs">
                  
                  {/* 農曆八字大字 */}
                  <div className="text-center pb-2.5 border-b border-[#D9D3C7]/60">
                    <span className="text-[10px] text-stone-500 font-extrabold block">【轉換所得農曆日期】</span>
                    <strong className="text-lg font-black text-[#B22222] font-serif block mt-1 tracking-wider">
                      {convertedData.almanac.lunarMonthDate}
                    </strong>
                    <div className="text-[10px] text-stone-700 font-extrabold mt-1">
                      {convertedData.almanac.lunarYear}年【{convertedData.almanac.lunarAnimal}年】
                    </div>
                  </div>

                  {/* 干支與五行對應 */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                    <div className="bg-[#FCF9F2] p-2 rounded-lg border border-[#D9D3C7]/50">
                      <span className="text-[9px] text-stone-500 block mb-0.5">時令月建</span>
                      <span className="text-[#1A1A1A] font-black">{convertedData.almanac.ganzhiMonth}月</span>
                    </div>

                    <div className="bg-[#FCF9F2] p-2 rounded-lg border border-[#D9D3C7]/50">
                      <span className="text-[9px] text-stone-500 block mb-0.5">日差天干</span>
                      <span className="text-[#1A1A1A] font-black">{convertedData.almanac.ganzhiDay}日</span>
                    </div>

                    <div className="bg-[#FCF9F2] p-2 rounded-lg border border-[#D9D3C7]/50 col-span-2 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-stone-500 block">納音五行</span>
                        <span className="text-amber-800 font-black text-[11px]">{convertedData.almanac.wuhang}</span>
                      </div>
                      <span className="text-[9px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.5 rounded-md border border-amber-200">
                        {convertedData.almanac.jianShen}日
                      </span>
                    </div>
                  </div>

                  {/* 節氣資訊 */}
                  <div className="pt-2 border-t border-[#D9D3C7]/60 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-stone-500 font-extrabold">
                      <span>🌞 時令節氣對照</span>
                      {convertedData.exactSolarTerm ? (
                        <span className="bg-[#B22222] text-white text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse">
                          交節氣日
                        </span>
                      ) : (
                        <span>節氣期間</span>
                      )}
                    </div>

                    {convertedData.exactSolarTerm ? (
                      <div className="p-2 bg-[#B22222]/5 border border-[#B22222]/30 rounded-lg">
                        <strong className="text-[#B22222] text-[11px] block font-serif font-black">
                          🎯 今日正逢交節氣：【 {convertedData.exactSolarTerm.name} 】
                        </strong>
                        <p className="text-[10px] text-stone-600 mt-1 leading-normal">
                          {convertedData.exactSolarTerm.info.desc}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 bg-stone-50 rounded-lg">
                        <strong className="text-stone-800 text-[11px] block">
                          🍂 當前天時正處於：【 {convertedData.solarTermPeriod.name} 】
                        </strong>
                        <p className="text-[10px] text-[#8C8273] mt-1 leading-normal font-medium">
                          期間：{convertedData.solarTermPeriod.startStr} ~ {convertedData.solarTermPeriod.endStr}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 快速套用 */}
                  <div className="pt-2">
                    <button
                      id="btn_apply_converted_date"
                      onClick={handleApply}
                      className="w-full py-2 bg-[#B22222] hover:bg-[#1A1A1A] text-white rounded-xl text-[11px] font-black tracking-wide border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] active:scale-95 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>套用此日期至主看板日曆</span>
                    </button>
                  </div>

                </div>
              ) : (
                <div className="py-8 text-center text-xs text-red-700 bg-red-100/50 rounded-xl font-bold">
                  ⚠️ 日期格式異常，請確認輸入是否有誤。
                </div>
              )}

              <p className="text-[9px] text-[#8C8273] text-center leading-normal block font-medium">
                本系統依傳統天文精算演算，提供公元 1970 至今最新精準轉換對照，適應天時調協。
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
