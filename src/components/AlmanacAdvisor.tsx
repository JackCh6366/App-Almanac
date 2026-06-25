/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { MessageSquare, Send, Sparkles, User, ShieldAlert, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAlmanac } from "../utils/almanacEngine";

interface AlmanacAdvisorProps {
  currentDate: Date;
  aiProvider: 'gemini' | 'nvidia';
}

interface Message {
  sender: "user" | "bot";
  text: string;
}

const PRESET_QUESTIONS = [
  "如何化解今天的沖煞？",
  "今天財神和喜神方位，我該如何善加利用？",
  "大師，今天肖屬的整體運勢有何特別提點？",
  "今天的趣味宜忌很特別，大師能詳細開悟我嗎？"
];

export default function AlmanacAdvisor({ currentDate, aiProvider }: AlmanacAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "善信你好。大師在此恭候。我已查明你今日選取之黃曆。今日干支相濟，不知你有何生活起居、擇吉移徙或心靈修行的疑惑？請儘管提問，我將為你排憂解厄。"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    // 添加使用者訊息
    const updatedMessages = [...messages, { sender: "user" as const, text: textToSend }];
    setMessages(updatedMessages);
    setInputText("");
    setLoading(true);

    // 建立黃曆 context，方便 AI 掌握使用者的今日黃曆背景
    const alm = getAlmanac(currentDate);
    const dateContext = {
      gregorianDate: alm.gregorianDate,
      lunarYear: alm.lunarYear,
      lunarAnimal: alm.lunarAnimal,
      lunarMonthDate: alm.lunarMonthDate,
      ganzhiYear: alm.ganzhiYear,
      ganzhiMonth: alm.ganzhiMonth,
      ganzhiDay: alm.ganzhiDay,
      suit: alm.suit,
      avoid: alm.avoid
    };

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          task: "query",
          payload: { question: textToSend, dateContext }
        })
      });

      if (!response.ok) {
        throw new Error("伺服器連線中斷");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [...prev, { sender: "bot", text: data.answer }]);
    } catch (e: any) {
      console.warn("AI 顧問連線超時，啟動大師禪音 Fallback 智慧答詢：", e);
      
      // Fallback
      let fallbackAnswer = "";
      if (textToSend.includes("沖煞")) {
        fallbackAnswer = `【大師解惑今日沖煞】：\n\n今日對沖的屬相是【${alm.conflictAnimal}】。民俗中相沖多指氣場震盪。大師告訴你，相沖並非大難臨頭，而是提醒此屬之人今天行事需「多聽、少言、緩行」。\n\n**化解避凶妙法：**\n1. 今天在身上佩戴紅色、黃色等吉祥絲帶，或口袋放硬幣，以「金氣」或「火氣」化宿仇。\n2. 出行遇事深呼吸 3 秒、保持心平氣和，內心澄淨則一切煞氣莫能侵入！「一心正氣，萬邪自避」是人間最無敵的化煞神器。`;
      } else if (textToSend.includes("方位") || textToSend.includes("喜神") || textToSend.includes("財神")) {
        fallbackAnswer = `【大師親解今日神吉方位】：\n\n今日的開運財神方位在 **【${alm.luckyDirectionWealth}】** ，喜神（姻緣/和合）方位在 **【${alm.luckyDirectionLove}】**。\n\n**求名開運指引：**\n1. **財運吸金：** 若今天有簽約、買彩券或討論重要商案，建議把椅子面向該方位，或者出門前朝該方位直行行走 100 步。一邊走一邊默念心中志望，能吸引當日地磁金元吉氣。\n2. **姻緣提振：** 約會前先往喜神方走一趟，自生喜樂氣場。`;
      } else if (textToSend.includes("宜忌") || textToSend.includes("作死")) {
        fallbackAnswer = `【大師悟解今日現代生活宜忌】：\n\n今日黃曆的趣味宜，包括：${alm.modernSuit.join("、")}。而忌：${alm.modernAvoid.join("、")}。\n\n這代表今日的地磁心象偏向實幹與專注。${alm.modernSuit[0]} 能夠幫助您聚集專心致志的精能。相反地，避免行 ${alm.modernAvoid[0]} 則可省去當天情緒急躁帶來的損失。農民曆融入日常，其宗旨就是讓生活過得更有節律與滋韻。`;
      } else {
        fallbackAnswer = `【大師誠心生活開示】\n\n善信所提之問「${textToSend}」，大師觀今日黃曆干支為【${alm.ganzhiDay}】，五行屬【${alm.wuhang}】。此卦象水土中和，主「厚德載物，隨遇而安」。\n\n世間萬物，有時星辰運會，但最大之「開運黃曆」其實就在個人的起心動念。今天不管要做什麼，只要秉持【誠信、自省、包容】六字，遇逆境而能內省，遇順境而能自謙，今天不論什麼時辰方位，皆是你個人的「黃道吉時吉方」。心安即是福，順其自然，一切必有完美定數。`;
      }

      setMessages((prev) => [...prev, { sender: "bot", text: fallbackAnswer }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border-2 border-[#D9D3C7] bg-[#F5F1E6] p-4 md:p-6 shadow-md flex flex-col md:grid md:grid-cols-12 gap-6 h-[600px] md:h-[550px] font-sans">
      
      {/* 左欄：說明與預設快捷問題 (4/12 欄寬) */}
      <div className="md:col-span-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-[#B22222] rounded-xl text-[#FCF9F2] shadow-sm">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-[#1A1A1A] text-lg font-serif">AI 黃曆禪宗命理顧問</h3>
          </div>
          <p className="text-[#8C8273] text-xs leading-relaxed font-bold">
            融合傳統地磁九星、生肖宿格，與現代日常身心健康。直接與大師交談，獲取今日公農曆最深度、一針見血的民俗解災與心態指引。
          </p>
        </div>

        {/* 快捷推薦問題 */}
        <div className="mt-6 md:mt-0 space-y-2 border-t-2 border-[#D9D3C7] pt-4 md:pt-0">
          <span className="text-[10px] font-black text-[#8C8273] tracking-wider block mb-2">💡 諮詢大師常見問題：</span>
          {PRESET_QUESTIONS.map((q, id) => (
            <button
              id={`preset_q_${id}`}
              key={id}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="w-full text-left px-3.5 py-2.5 text-xs rounded-xl bg-[#FCF9F2] border-2 border-[#D9D3C7] text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-white transition-all font-black cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 右欄：對話對流聊天室 (8/12 欄寬) */}
      <div className="md:col-span-8 flex flex-col h-full bg-[#FCF9F2] rounded-2xl border-2 border-[#1A1A1A] p-4 overflow-hidden relative shadow-md font-sans">
        {/* 對話訊息捲動區 */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {messages.map((msg, index) => {
            const isBot = msg.sender === "bot";
            return (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[85%] ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                {/* 頭像 */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border-2 shadow-sm ${
                  isBot ? "bg-[#B22222] text-[#FCF9F2] border-[#1A1A1A]" : "bg-[#1A1A1A] text-[#FCF9F2] border-[#1A1A1A]"
                }`}>
                  {isBot ? <Cpu className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* 對話氣泡 */}
                <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm font-bold ${
                  isBot 
                    ? "bg-[#F5F1E6] text-[#1A1A1A] border-2 border-[#D9D3C7] whitespace-pre-line" 
                    : "bg-[#B22222] text-[#FCF9F2] border-2 border-[#1A1A1A]"
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* AI 正在輸入 loading */}
          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center">
              <div className="h-8 w-8 rounded-full bg-[#B22222] text-[#FCF9F2] border-2 border-[#1A1A1A] flex items-center justify-center shrink-0 animate-pulse">
                <Cpu className="h-4 w-4" />
              </div>
              <div className="p-3 rounded-2xl bg-[#F5F1E6] text-[#8C8273] border-2 border-[#D9D3C7] text-xs flex items-center gap-2 font-bold shadow-sm">
                <span className="w-1.5 h-1.5 bg-[#8C8273] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-[#8C8273] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-[#8C8273] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                <span>大師正翻查農民曆書，為你開悟...</span>
              </div>
            </div>
          )}
        </div>

        {/* 輸入底欄 */}
        <div className="flex gap-2 border-t-2 border-[#D9D3C7] pt-3 shrink-0">
          <input
            id="advisor_chat_input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="請輸入關於求財、避沖煞、本日運勢的問答..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-[#FCF9F2] border-2 border-[#D9D3C7] focus:outline-none focus:ring-2 focus:ring-[#B22222] disabled:opacity-50 text-[#1A1A1A] font-black"
          />
          <button
            id="btn_send_advisor_chat"
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B22222] hover:bg-[#1A1A1A] text-[#FCF9F2] disabled:opacity-40 transition-all cursor-pointer border-2 border-[#1A1A1A] shadow-sm select-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
