/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { FORTUNE_LOTS } from "../data/fortuneLots";
import { DivineLot, DivineResponse } from "../types";
import { 
  Sparkles, HelpCircle, Heart, DollarSign, Briefcase, Activity, 
  HelpCircle as QuestionIcon, ShieldCheck, RefreshCw, Cpu 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type TempleStep = "ask" | "shao" | "draw" | "confirm" | "reveal";

const DIVINE_TYPES = [
  { id: "綜合", label: "避凶引導", icon: HelpCircle, color: "bg-stone-100 text-stone-800 border-stone-200" },
  { id: "感情", label: "求姻緣桃花", icon: Heart, color: "bg-red-50 text-red-700 border-red-200" },
  { id: "事業", label: "求事業功名", icon: Briefcase, color: "bg-indigo-50 text-indigo-750 border-indigo-200" },
  { id: "財運", label: "求正偏求財", icon: DollarSign, color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "健康", label: "求疾厄安康", icon: Activity, color: "bg-teal-50 text-teal-800 border-teal-200" },
];

export default function DivineTemple() {
  const [step, setStep] = useState<TempleStep>("ask");
  const [questionType, setQuestionType] = useState("綜合");
  const [customQuestion, setCustomQuestion] = useState("");
  
  // 擲筊狀態
  const [rollingJiao, setRollingJiao] = useState(false);
  const [jiaoResult, setJiaoResult] = useState<"sheng" | "xiao" | "yin" | null>(null);
  
  // 抽中之籤
  const [selectedLot, setSelectedLot] = useState<DivineLot | null>(null);
  
  // AI 解籤
  const [explainLoading, setExplainLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<DivineResponse | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  // 1. 開始祈願，擲筊請示
  const handleStartJiao = () => {
    setRollingJiao(true);
    setJiaoResult(null);

    setTimeout(() => {
      setRollingJiao(false);
      // 一定機率給予聖筊，讓使用者能夠推進。聖筊: sheng (50%), 笑筊: xiao (25%), 陰筊: yin (25%)
      const rand = Math.random();
      if (rand < 0.55) {
        setJiaoResult("sheng"); // 聖吉
      } else if (rand < 0.8) {
        setJiaoResult("xiao"); // 笑筊
      } else {
        setJiaoResult("yin"); // 陰筊
      }
    }, 1800);
  };

  // 2. 獲准抽籤
  const handleProceedToDraw = () => {
    setStep("draw");
    setJiaoResult(null);
  };

  // 3. 抽籤筒
  const [drawingLot, setDrawingLot] = useState(false);
  const handleDrawLot = () => {
    setDrawingLot(true);
    setTimeout(() => {
      setDrawingLot(false);
      // 隨機選出一支籤
      const lot = FORTUNE_LOTS[Math.floor(Math.random() * FORTUNE_LOTS.length)];
      setSelectedLot(lot);
      setStep("confirm");
    }, 2000);
  };

  // 4. 再次擲筊確認是不是此籤 (民俗經典細節)
  const handleConfirmLotJiao = () => {
    setRollingJiao(true);
    setJiaoResult(null);

    setTimeout(() => {
      setRollingJiao(false);
      const rand = Math.random();
      // 聖筊確認機率提高至 65%，增加順暢感
      if (rand < 0.65) {
        setJiaoResult("sheng");
      } else if (rand < 0.85) {
        setJiaoResult("xiao");
      } else {
        setJiaoResult("yin");
      }
    }, 1800);
  };

  // 5. 筊杯確認對了，掀開籤詩門帷
  const handleRevealFortune = () => {
    setStep("reveal");
    setJiaoResult(null);
  };

  // 6. 重新開始
  const handleReset = () => {
    setStep("ask");
    setQuestionType("綜合");
    setCustomQuestion("");
    setSelectedLot(null);
    setJiaoResult(null);
    setAiAnalysis(null);
    setExplainError(null);
  };

  // 7. AI 深度禪心解籤
  const handleAiExplain = async () => {
    if (!selectedLot) return;
    setExplainLoading(true);
    setExplainError(null);
    setAiAnalysis(null);

    try {
      const response = await fetch("/api/almanac/divine-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fortuneId: selectedLot.id,
          title: selectedLot.title,
          poem: selectedLot.poem,
          type: questionType,
          customQuestion: customQuestion
        })
      });

      if (!response.ok) {
        throw new Error("大師解籤線路繁忙");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAiAnalysis(data);
    } catch (e: any) {
      console.warn("AI 解籤失敗，使用本地籤意 fallback 呈現：", e);
      
      // Fallback AI 解析
      const scoreMap: { [key: string]: string } = {
        "一": "大吉", "二": "上吉", "三": "中平", "四": "下下", "五": "中吉",
        "六": "大吉", "七": "中下", "八": "上吉", "九": "中吉", "十": "中平"
      };
      
      setAiAnalysis({
        fortuneId: selectedLot.id,
        title: selectedLot.title,
        poemSentiment: scoreMap[selectedLot.id] || "中平",
        poemExplanation: `【白話翻譯】：${selectedLot.meaning} 本日所求之事屬天行有常，不宜操之過急。`,
        advice: {
          career: "【事業功名】：求職或晉升皆平順，只要為人厚道誠實，自得福報，不宜強求速成。",
          love: "【感情姻緣】：桃花暗湧，單身之人不日將遇知己，已婚之人則宜注重溝通、包容體貼。",
          wealth: "【偏正求財】：財運平穩。切忌投機博弈，以免血本無歸。腳踏實地，積微成著。",
          health: "【身体安康】：心氣鬱結，宜多接觸大自然、放鬆身心。足疾可緩解。",
          zenQuote: "命由心造，境隨心轉。寬心處世者，事事皆好景。"
        },
        mindsetShift: "大師開示：「凡事莫急躁。轉念即是福，順其自然則天地寬廣。多行善積德，自能化凶為吉、錦上添花。」"
      });
    } finally {
      setExplainLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border-4 border-[#1A1A1A] bg-[#5c1c1c] text-amber-50 p-6 shadow-2xl relative min-h-[580px] flex flex-col justify-between overflow-hidden">
      {/* 宮殿雕漆大背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#7a2323] via-[#4a1212] to-[#240606] opacity-95 -z-10"></div>
      
      {/* 閣門雕花裝飾 */}
      <div className="absolute top-0 inset-x-0 h-4 bg-[repeating-linear-gradient(45deg,_#5c1c1c,_#5c1c1c_10px,_#421212_10px,_#421212_20px)] opacity-40"></div>
      <div className="absolute bottom-0 inset-x-0 h-4 bg-[repeating-linear-gradient(45deg,_#5c1c1c,_#5c1c1c_10px,_#421212_10px,_#421212_20px)] opacity-40"></div>

      {/* 第一部分：香火裊裊 & 聖光頂端 */}
      <div className="flex items-center justify-between border-b border-red-900 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center font-bold font-serif text-sm border border-amber-600 shadow-md">
            廟
          </div>
          <div>
            <h3 className="font-extrabold text-[#f3ca52] text-xl font-serif tracking-widest">觀音靈籤．擲筊請示正殿</h3>
            <p className="text-red-300 text-[10px] mt-0.5">誠心虔祈 · 冥冥指引 · 超強 AI 禪解</p>
          </div>
        </div>
        
        {/* 香爐煙火動態意象 */}
        <div className="flex items-center gap-1 bg-amber-950/80 border border-amber-900 rouded-xl px-3 py-1 rounded-full text-amber-400 text-[10px]">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping shrink-0"></span>
          <span>供案香火鼎盛</span>
        </div>
      </div>

      {/* 第二部分：互動大舞台 (隨著 step 做動畫切換) */}
      <div className="flex-1 my-6 flex flex-col justify-center items-center">
        <AnimatePresence mode="wait">
          
          {/* 步驟 1：輸入所企問事項 */}
          {step === "ask" && (
            <motion.div 
              key="step_ask"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl space-y-6 text-center"
            >
              <h4 className="text-lg font-bold text-[#f3ca52] font-serif">一、誠心祈願與挑選問卜事項</h4>
              <p className="text-xs text-red-200 leading-relaxed max-w-md mx-auto">
                請雙手合十、心中默唸您的姓名、出生年月、當前住址，並閉眼默念兩遍您想問詢的事情（如感情發展、投標商事等）。
              </p>

              {/* 求問類別 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {DIVINE_TYPES.map((dt) => {
                  const IconC = dt.icon;
                  const isSelected = questionType === dt.id;
                  return (
                    <button
                      id={`btn_divine_type_${dt.id}`}
                      key={dt.id}
                      onClick={() => setQuestionType(dt.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? "border-[#f3ca52] bg-[#f3ca52] shadow-lg text-[#1A1A1A] scale-105 font-black" 
                          : "border-[#1A1A1A] bg-red-950/40 text-red-100 hover:border-[#f3ca52]"
                      }`}
                    >
                      <IconC className="h-5 w-5 mb-1" />
                      <span className="text-xs">{dt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 自訂問題文字框 */}
              <div className="space-y-2">
                <input
                  id="divine_question_input"
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="可在此輸入具體的求問事項（例如：下週的面試順利嗎？），可留空..."
                  className="w-full px-4 py-3.5 rounded-2xl bg-stone-950/50 border-2 border-[#1A1A1A] focus:outline-none focus:border-[#f3ca52] text-xs text-[#FCF9F2] placeholder-stone-500 font-extrabold font-sans"
                />
              </div>

              {/* 執杯按紐：先問神明，今日能不能抽籤 */}
              <button
                id="btn_jiao_request"
                onClick={handleStartJiao}
                disabled={rollingJiao}
                className="px-6 py-3.5 bg-[#f3ca52] text-[#1A1A1A] font-black text-sm rounded-xl hover:bg-[#ffdf72] active:scale-95 transition-all shadow-[4px_4px_0px_#1A1A1A] border-2 border-[#1A1A1A] cursor-pointer inline-flex items-center gap-2 font-sans"
              >
                <span>叩首擲筊請示</span>
              </button>
            </motion.div>
          )}

          {/* 擲筊請示中 animation */}
          {rollingJiao && (
            <motion.div 
              key="step_rolling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              {/* 兩枚立體筊杯在空中猛動旋轉的 CSS 動畫 */}
              <div className="flex gap-10 justify-center items-center py-6">
                <motion.div 
                  animate={{ rotate: [0, 360, 720, 1080], y: [0, -60, 0, -20, 0] }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                  className="w-16 h-8 bg-amber-900 border-2 border-amber-600 rounded-t-full shadow-lg origin-center"
                  style={{ borderRadius: "100px 100px 0 0" }}
                ></motion.div>
                <motion.div 
                  animate={{ rotate: [0, -360, -720, -1080], y: [0, -70, 0, -30, 0] }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                  className="w-16 h-8 bg-amber-900 border-2 border-amber-600 rounded-b-full shadow-lg origin-center"
                  style={{ borderRadius: "0 0 100px 100px" }}
                ></motion.div>
              </div>

              <h4 className="text-sm font-bold text-[#f3ca52] tracking-wider animate-bounce">
                硿硿！筊杯在案桌翻滾旋轉，神靈正側耳聆聽
              </h4>
              <p className="text-red-300 text-xs font-medium">一片至誠，必有神光保佑，請稍候三刻...</p>
            </motion.div>
          )}

          {/* 筊杯落地後結果 */}
          {!rollingJiao && jiaoResult && (step === "ask" || step === "confirm") && (
            <motion.div 
              key="step_jiao_result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 max-w-md mx-auto"
            >
              {/* 筊杯幾何形狀展示 */}
              <div className="flex gap-8 justify-center items-center py-4">
                {jiaoResult === "sheng" ? (
                  <>
                    {/* 一平一凸（一正一反） */}
                    <div className="w-16 h-8 bg-amber-950 border border-amber-600 rounded-t-full rotate-45" style={{ borderRadius: "100px 100px 0 0" }}></div>
                    <div className="w-16 h-8 bg-[#cc3333] border border-amber-600 rounded-b-full -rotate-45" style={{ borderRadius: "0 0 100px 100px" }}></div>
                  </>
                ) : jiaoResult === "xiao" ? (
                  <>
                    {/* 雙平（兩正，均成兩瓣） */}
                    <div className="w-16 h-8 bg-amber-950 border border-[#f3ca52] rounded-t-full rotate-12" style={{ borderRadius: "100px 100px 0 0" }}></div>
                    <div className="w-16 h-8 bg-amber-950 border border-[#f3ca52] rounded-t-full -rotate-12" style={{ borderRadius: "100px 100px 0 0" }}></div>
                  </>
                ) : (
                  <>
                    {/* 陰筊（雙凸，均蓋著） */}
                    <div className="w-16 h-8 bg-[#992222] border border-amber-900 rounded-b-full rotate-12" style={{ borderRadius: "0 0 100px 100px" }}></div>
                    <div className="w-16 h-8 bg-[#992222] border border-amber-900 rounded-b-full -rotate-12" style={{ borderRadius: "0 0 100px 100px" }}></div>
                  </>
                )}
              </div>

              {jiaoResult === "sheng" ? (
                <div className="space-y-4">
                  <h4 className="text-2xl font-black text-emerald-400 font-serif tracking-widest">
                    【 聖 筊 】- 神靈應允！
                  </h4>
                  <p className="text-stone-300 text-xs leading-relaxed">
                    {step === "ask" 
                      ? "觀音菩薩微微點頭，同意賜您一支靈籤，請前往籤前虔心抽籤！" 
                      : "神明降杯認得：這支籤確實是神明要賜給您的指引，可以開榜看籤了！"}
                  </p>
                  
                  <button
                    id="btn_jiao_ok_next"
                    onClick={step === "ask" ? handleProceedToDraw : handleRevealFortune}
                    className="px-6 py-2.5 bg-emerald-600 border border-emerald-500 text-stone-50 font-bold text-xs rounded-xl hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1 shadow-md"
                  >
                    <span>{step === "ask" ? "前去抽靈籤" : "解讀賜下籤文"}</span>
                  </button>
                </div>
              ) : jiaoResult === "xiao" ? (
                <div className="space-y-4">
                  <h4 className="text-2xl font-black text-[#f3ca52] font-serif tracking-widest">
                    【 笑 筊 】- 天機未明
                  </h4>
                  <p className="text-stone-300 text-xs leading-relaxed">
                    神明笑而未答。可能您求問的事由不夠誠懇清晰、或者時機未成熟。無妨，請沉澱心思，一邊洗滌心障一邊重新投筊。
                  </p>
                  
                  <button
                    id="btn_jiao_retry_xiao"
                    onClick={step === "ask" ? handleStartJiao : handleConfirmLotJiao}
                    className="px-6 py-2.5 bg-amber-700 border border-amber-600 text-stone-50 font-bold text-xs rounded-xl hover:bg-amber-800 active:scale-95 transition-all cursor-pointer"
                  >
                    重整思緒，再次祈筊
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-2xl font-black text-red-400 font-serif tracking-widest">
                    【 陰 筊 】- 神明不允
                  </h4>
                  <p className="text-stone-300 text-xs leading-relaxed">
                    神明微擺頭不允。可能是方向需要修正、或是此時不宜做決定、亦或是您的心緒太過浮躁焦慮。請大吸一口氣、向大師重新祝禱再問。
                  </p>
                  
                  {step === "confirm" ? (
                    <div className="flex justify-center gap-4">
                      <button
                        id="btn_jiao_unconfirmed_retry_draw"
                        onClick={() => setStep("draw")}
                        className="px-4 py-2 bg-red-900 border border-red-800 text-red-200 text-xs rounded-xl hover:bg-red-950 cursor-pointer"
                      >
                        神不許此籤，回筒重抽
                      </button>
                      <button
                        id="btn_jiao_unconfirmed_retry_jiao"
                        onClick={handleConfirmLotJiao}
                        className="px-4 py-2 bg-amber-700 border border-amber-600 text-white text-xs rounded-xl hover:bg-amber-800 cursor-pointer"
                      >
                        誠心懇求，再次覆筊
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn_jiao_retry_yin"
                      onClick={handleStartJiao}
                      className="px-6 py-2.5 bg-amber-700 border border-amber-600 text-stone-50 font-bold text-xs rounded-xl hover:bg-amber-800 active:scale-95 transition-all cursor-pointer"
                    >
                      重新致誠祈願
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* 步驟 2：神殿抽籤筒 */}
          {step === "draw" && !drawingLot && (
            <motion.div 
              key="step_draw"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 max-w-md mx-auto"
            >
              {/* 古雅竹筒視覺形象 */}
              <div className="flex justify-center py-4">
                <div className="w-20 h-32 bg-amber-950 border-4 border-amber-700 rounded-b-xl relative flex flex-col justify-end p-2 shrink-0">
                  <div className="absolute top-0 inset-x-0 flex gap-0.5 justify-around px-2 -translate-y-8">
                    {/* 三根簽條 protruding */}
                    <div className="w-2 h-12 bg-amber-100 rounded-t-sm transform -rotate-12 translate-y-2"></div>
                    <div className="w-2 h-14 bg-amber-100/90 rounded-t-sm"></div>
                    <div className="w-2 h-12 bg-amber-100 rounded-t-sm transform rotate-12 translate-y-2"></div>
                  </div>
                  <span className="text-[10px] text-amber-500 font-bold tracking-widest text-center mt-3 block font-serif">神明賜靈籤</span>
                </div>
              </div>

              <h4 className="text-lg font-bold text-[#f3ca52] font-serif">二、福靈聚氣，在案前抽取靈籤</h4>
              <p className="text-red-300 text-xs">
                屏氣凝神，點擊晃動抽籤筒，百折千迴中，菩薩會浮出一支與你因緣最深的命運竹籤。
              </p>

              <button
                id="btn_shake_lot_cylinder"
                onClick={handleDrawLot}
                className="px-6 py-3 bg-[#f3ca52] text-stone-950 font-black text-xs rounded-xl hover:bg-[#ffdf72] cursor-pointer animation-pulse"
              >
                🪘 晃動籤筒召喚靈籤
              </button>
            </motion.div>
          )}

          {/* 抽籤中 animation */}
          {drawingLot && (
            <motion.div 
              key="step_drawing_animate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              {/* 竹筒左右快速晃動的動畫 */}
              <motion.div 
                animate={{ rotate: [-8, 8, -8, 8, -8, 8, 0] }}
                transition={{ repeat: Infinity, duration: 0.3 }}
                className="w-22 h-32 bg-amber-950 border-4 border-amber-700 rounded-b-xl mx-auto relative flex flex-col justify-end p-2 shrink-0"
              >
                <div className="absolute top-0 inset-x-0 flex gap-0.5 justify-around px-2 -translate-y-10">
                  <div className="w-2 h-14 bg-amber-100/90 rounded-t" style={{ animationDelay: "50ms" }}></div>
                  <div className="w-2 h-16 bg-amber-200" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-15 bg-amber-100/70 rounded-t" style={{ animationDelay: "200ms" }}></div>
                </div>
              </motion.div>
              <h4 className="text-sm font-bold text-amber-300 animate-pulse mt-4">
                沙沙沙... 案桌竹籤碰撞碰撞... 天人感應中
              </h4>
            </motion.div>
          )}

          {/* 步驟 3：抽到籤，但必須擲筊確定是不是這支 */}
          {step === "confirm" && !rollingJiao && !jiaoResult && selectedLot && (
            <motion.div 
              key="step_confirm_lot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 max-w-sm mx-auto"
            >
              <div className="bg-amber-950/70 rounded-2xl border border-amber-900 p-6 shadow-md">
                <span className="text-[10px] text-amber-500 font-bold block mb-1">抽中靈籤：</span>
                <h4 className="text-xl font-black text-[#f3ca52] font-serif">{selectedLot.title}</h4>
                <div className="my-4 text-xs font-serif leading-relaxed italic text-red-100 whitespace-pre-line bg-amber-950/40 p-3 rounded-xl border border-stone-800">
                  &ldquo;{selectedLot.poem}&rdquo;
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#f3ca52] font-serif">三、民俗大探：需擲筊確認是否此籤</h4>
                <p className="text-red-300 text-xs leading-normal">
                  傳統民俗中，抽到籤後必須「再次執筊」獲得一次聖筊，神明點頭認證才算合契。若神明不認（得笑或陰筊），需放回重抽。此謂之慎重誠心。
                </p>

                <button
                  id="btn_jiao_confirm_this_lot"
                  onClick={handleConfirmLotJiao}
                  className="px-6 py-2.5 bg-[#f3ca52] text-stone-950 font-black text-xs rounded-xl hover:bg-[#ffdf72] active:scale-95 cursor-pointer shadow-md"
                >
                  執筊請示菩薩認證此籤
                </button>
              </div>
            </motion.div>
          )}

          {/* 步驟 4：大成揭示 (本地籤意 + AI 精妙解籤按紐) */}
          {step === "reveal" && selectedLot && (
            <motion.div 
              key="step_reveal_fortune"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* 左邊卡大：傳統籤本尊 */}
              <div className="md:col-span-5 rounded-3xl bg-[#4D1414] border-2 border-[#1A1A1A] p-6 flex flex-col justify-between shadow-2xl relative min-h-[380px]">
                {/* 裝飾印章 */}
                <div className="absolute top-4 right-4 bg-red-950/80 text-xs font-black border border-red-800 text-[#f3ca52] px-3 py-1 rounded-full shadow-sm">
                  {selectedLot.sentiment}
                </div>

                <div className="text-center pt-2 border-b-2 border-red-950 pb-4">
                  <span className="text-[10px] text-[#f3ca52]/80 tracking-wider font-black">觀音大士神簽金榜</span>
                  <h4 className="text-2xl font-black text-[#f3ca52] font-serif tracking-widest mt-1">
                    {selectedLot.title}
                  </h4>
                </div>

                {/* 籤詩 */}
                <div className="my-6 text-center border-l-4 border-r-4 border-[#1A1A1A] px-4 py-3 bg-[#3F1010] rounded-xl relative">
                  <p className="text-base font-black font-serif leading-loose text-red-100 whitespace-pre-line tracking-widest">
                    {selectedLot.poem}
                  </p>
                </div>

                {/* 底 */}
                <div className="text-xs text-stone-200 border-t-2 border-red-950 pt-4 space-y-2">
                  <div>
                    <strong className="text-[#f3ca52] font-serif font-black block mb-1">【斷曰解析】：</strong>
                    <p className="text-[11px] leading-relaxed text-red-200 font-bold">{selectedLot.meaning}</p>
                  </div>
                  <div className="pt-2 border-t border-red-950/50">
                    <strong className="text-[#f3ca52] font-serif font-black block mb-1">【籤詩神典故】：</strong>
                    <p className="text-[11px] leading-relaxed text-red-200 italic font-bold">{selectedLot.legend}</p>
                  </div>
                </div>
              </div>

              {/* 右邊卡大：AI 大師靈驗深度解碼 */}
              <div className="md:col-span-7 flex flex-col gap-4 font-sans">
                
                {/* AI 點化按紐與狀態 */}
                {!aiAnalysis && !explainLoading && (
                  <div className="rounded-3xl bg-[#F5F1E6] text-[#1A1A1A] p-6 flex flex-col items-center justify-center text-center border-2 border-[#1A1A1A] space-y-4 shadow-md h-full min-h-[250px]">
                    <div className="p-3 bg-[#B22222] rounded-full text-[#FCF9F2] shadow-md animate-bounce">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <h3 className="font-black text-[#1A1A1A] text-xl font-serif">大師 AI 禪意深解與日常開合</h3>
                    <p className="text-xs text-[#8C8273] leading-relaxed max-w-sm font-bold">
                      本地斷語太過籠統？大師 AI 將結合您的求問項目【{questionType}】{customQuestion ? `及特定問題：「${customQuestion}」` : ""}，進行周公伏羲、易經八卦與現代積極心理學的一針見血深度心法剖析。
                    </p>

                    <button
                      id="btn_request_ai_lot_explain"
                      onClick={handleAiExplain}
                      className="px-6 py-3 bg-[#B22222] hover:bg-[#1A1A1A] text-[#FCF9F2] font-black text-xs rounded-xl active:scale-95 cursor-pointer shadow-[3px_3px_0px_#1A1A1A] border-2 border-[#1A1A1A] inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>請求大師 AI 深度解籤</span>
                    </button>
                  </div>
                )}

                {/* AI 解釋 Loading 狀態：絕美禪意旋轉 */}
                {explainLoading && (
                  <div className="rounded-3xl bg-amber-950/20 border-2 border-[#1A1A1A] p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      {/* 外卦象圈 */}
                      <div className="absolute inset-0 border-4 border-[#f3ca52] border-dotted rounded-full animate-spin" style={{ animationDuration: "12s" }}></div>
                      {/* 外八卦 */}
                      <span className="text-3xl text-amber-500 font-bold">☯️</span>
                    </div>
                    <h4 className="mt-6 font-black text-[#f3ca52] text-sm tracking-widest font-serif animate-pulse">
                      大師 AI 正點香、叩首開解【{selectedLot.title}】
                    </h4>
                    <p className="text-red-300 text-xs mt-2 max-w-xs leading-relaxed font-bold">
                      正以八卦六爻、神佛智慧，契合您的心結事件與當前五行，引渡一條逢凶化吉的智慧大道。
                    </p>
                  </div>
                )}

                {/* AI 大師禪學解籤正式呈現！ */}
                {aiAnalysis && !explainLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl bg-[#FCF9F2] text-[#1A1A1A] p-5.5 border-2 border-[#1A1A1A] shadow-md space-y-4 text-xs font-bold"
                  >
                    {/* 一針見血禪門金句 */}
                    <div className="rounded-2xl bg-[#B2BB22] bg-[#B22222] text-[#FCF9F2] px-4 py-3.5 text-center tracking-widest border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
                      <span className="text-[10px] block opacity-85 mb-1 font-serif font-black">🧘 大師禪門棒擊開示金句</span>
                      <strong className="text-sm font-black font-serif">&ldquo; {aiAnalysis.advice.zenQuote} &rdquo;</strong>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 白話翻譯 */}
                      <div className="col-span-2 border-b-2 border-[#D9D3C7]/80 pb-3">
                        <strong className="text-[#B22222] text-sm font-black block mb-1 font-serif">🧘 大師白話斷籤：</strong>
                        <p className="text-[#1A1A1A] leading-relaxed text-[11px] font-bold">{aiAnalysis.poemExplanation}</p>
                      </div>

                      {/* 事業與感情 */}
                      <div className="bg-[#F5F1E6] p-3 rounded-xl border-2 border-[#D9D3C7]">
                        <strong className="text-[#B22222] flex items-center gap-1 font-serif mb-1 font-black">
                          <Briefcase className="h-4 w-4 text-indigo-700" />
                          求問事業/工作：
                        </strong>
                        <p className="text-[11px] text-[#1A1A1A] leading-normal font-bold">{aiAnalysis.advice.career}</p>
                      </div>

                      <div className="bg-[#F5F1E6] p-3 rounded-xl border-2 border-[#D9D3C7]">
                        <strong className="text-[#B22222] flex items-center gap-1 font-serif mb-1 font-black">
                          <Heart className="h-4 w-4 text-red-650" />
                          求問感情/姻緣：
                        </strong>
                        <p className="text-[11px] text-[#1A1A1A] leading-normal font-bold">{aiAnalysis.advice.love}</p>
                      </div>

                      {/* 財運與健康 */}
                      <div className="bg-[#F5F1E6] p-3 rounded-xl border-2 border-[#D9D3C7]">
                        <strong className="text-[#B22222] flex items-center gap-1 font-serif mb-1 font-black">
                          <DollarSign className="h-4 w-4 text-emerald-700" />
                          求問財運/商業：
                        </strong>
                        <p className="text-[11px] text-[#1A1A1A] leading-normal font-bold">{aiAnalysis.advice.wealth}</p>
                      </div>

                      <div className="bg-[#F5F1E6] p-3 rounded-xl border-2 border-[#D9D3C7]">
                        <strong className="text-[#B22222] flex items-center gap-1 font-serif mb-1 font-black">
                          <Activity className="h-4 w-4 text-teal-700" />
                          求問安康/健康：
                        </strong>
                        <p className="text-[11px] text-[#1A1A1A] leading-normal font-bold">{aiAnalysis.advice.health}</p>
                      </div>

                      {/* 心態修持 */}
                      <div className="col-span-2 bg-[#F5F1E6] p-4 rounded-xl border-2 border-[#D9D3C7] text-[#1A1A1A] leading-relaxed">
                        <strong className="text-[#B22222] block mb-1 font-serif font-black">☯️ 心態修煉與化凶為吉之道：</strong>
                        <p className="text-[11px] italic font-bold">{aiAnalysis.mindsetShift}</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        id="btn_temple_restart"
                        onClick={handleReset}
                        className="px-5 py-2.5 bg-[#B22222] hover:bg-[#1A1A1A] text-[#FCF9F2] rounded-xl active:scale-95 cursor-pointer text-xs font-black transition-all border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]"
                      >
                        事情已明，叩謝神明重新求籤
                      </button>
                    </div>

                  </motion.div>
                )}

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
