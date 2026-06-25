import { GoogleGenAI, Type } from "@google/genai";
import { FORTUNE_LOTS } from "../src/data/fortuneLots";

function cleanKey(key: string | undefined): string {
  if (!key) return "";
  return key.trim().replace(/^["']|["']$/g, "");
}

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const rawKey = process.env.GEMINI_API_KEY;
    const apiKey = cleanKey(rawKey);
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Helper to convert Google GenAI Schema to standard JSON Schema format for NVIDIA
function cleanSchema(schema: any): any {
  if (!schema) return null;
  const result: any = {};
  if (schema.type) {
    result.type = String(schema.type).toLowerCase();
  }
  if (schema.description) {
    result.description = schema.description;
  }
  if (schema.properties) {
    result.properties = {};
    for (const key in schema.properties) {
      result.properties[key] = cleanSchema(schema.properties[key]);
    }
  }
  if (schema.items) {
    result.items = cleanSchema(schema.items);
  }
  if (schema.required) {
    result.required = schema.required;
  }
  return result;
}

// ----------------------------------------------------
// 🏮 Local Traditional Chinese Fallback Generators
// ----------------------------------------------------
const buildPickDateFallback = (activity: string, year: number, month: number, zodiac: string) => {
  const totalDays = new Date(year, month, 0).getDate();
  const day1 = Math.min(6, totalDays);
  const day2 = Math.min(18, totalDays);
  const day3 = Math.min(24, totalDays);
  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    activity,
    monthLabel: `${year}年${month}月`,
    recommendations: [
      {
        date: `${year}-${pad(month)}-${pad(day1)}`,
        lunarDate: "五月初六",
        suitabilityScore: 92,
        suitReasons: [
          `今日天德吉星高照，對進行【${activity}】有極美滿的加持效能。`,
          "五行干支相生、地氣順暢，利於結盟、起步與開局動土。",
          "諸吉神當道，避開了煞氣干擾，事半功倍，功成名就。"
        ],
        auspiciousHours: ["辰時 (07:00-09:00)", "午時 (11:00-13:00)", "申時 (15:00-17:00)"],
        luckyDirections: {
          wealth: "正南方",
          nobles: "正東方"
        },
        modernWisdom: `今天能量相當舒泰。帶著誠摯與和氣之心去張羅「${activity}」，不但身心舒爽，也能迎得眾人賀彩。`
      },
      {
        date: `${year}-${pad(month)}-${pad(day2)}`,
        lunarDate: "五月十八",
        suitabilityScore: 88,
        suitReasons: [
          `此日多逢歲德合星，對於屬【${zodiac || "不限屬相"}】的緣主而言，契合度極高。`,
          "臨天喜福星，主多路逢源，辦事多遇和顏悅色之人。",
          "避開忌神沖煞，大業開張、移徙出境皆主順坦。"
        ],
        auspiciousHours: ["巳時 (09:00-11:00)", "未時 (13:00-15:00)", "戌時 (19:00-21:00)"],
        luckyDirections: {
          wealth: "東北方",
          nobles: "西北方"
        },
        modernWisdom: `選在本日推展「${activity}」，重在隨順自然。不疾不徐地張羅，則身邊貴人助力自會徐徐浮現。`
      },
      {
        date: `${year}-${pad(month)}-${pad(day3)}`,
        lunarDate: "五月廿四",
        suitabilityScore: 96,
        suitReasons: [
          `天禧吉局臨命，地盤能量充盈，大吉之日也。宜辦重要之事如【${activity}】。`,
          "文吉神氣交會，思維清朗、談判契約容易取得高回報。",
          "諸惡神皆避，利於登高發布、合夥與家庭修造。"
        ],
        auspiciousHours: ["卯時 (05:00-07:00)", "申時 (15:00-17:00)", "酉時 (17:00-19:00)"],
        luckyDirections: {
          wealth: "正西方",
          nobles: "正南方"
        },
        modernWisdom: `謀定而動，萬無一失。這一天行事有天時助攻，放手去辦「${activity}」即可，堅定信念是最大的開運吉星。`
      }
    ]
  };
};

const buildQueryFallback = (question: string, dateContext: any) => {
  let fallbackAnswer = "";
  if (question.includes("沖") || question.includes("煞")) {
    fallbackAnswer = `【大師解惑今日沖煞】：\n\n今日相沖的屬相是【${dateContext?.lunarAnimal || "沖煞生肖"}】。民俗中相沖多指方位磁場的輕微震盪。\n\n大師告訴你，相沖並非大難臨頭，而是提醒這天行事需「多聽、少言、緩行」。\n\n**化解避凶妙法：**\n1. 今天可在身上佩戴一些暖色物件，或是口袋中放兩枚銅板以「金水流通」化戾星。\n2. 凡事退後一步想、深呼吸三秒。「一心正氣、萬邪自避」，內心保持澄澈坦蕩即是人間最高尚的辟邪祥雲。`;
  } else if (question.includes("方位") || question.includes("喜神") || question.includes("財神")) {
    fallbackAnswer = `【大師親解今日神吉方位】：\n\n今日的財神方位在 **【西北方】** ，喜神（人緣/桃花）方位在 **【正南方】**。\n\n**如何巧妙藉地氣開運：**\n1. **財氣大開：** 若今天有簽約、重商務洽談，建議將座位移朝向神吉方，或者出門前朝此方向直行步行百步，閉目祈願，能有效召引財緣地氣。\n2. **姻緣提振：** 多往正南方散步或約會，可使氣息自然祥和、和合和美。`;
  } else if (question.includes("宜忌") || question.includes("作死") || question.includes("宜") || question.includes("忌")) {
    fallbackAnswer = `【大師悟解今日生活宜忌】：\n\n當下黃曆的五行干支和合，宜安穩守成、舒活筋骨。避忌心急火燎、盲目攀比。\n\n農民曆的本原，就是提醒大家「天時有時、地氣有常」。在適合的時間專心做手頭的事（宜），在浮躁的時長（忌）靜下心來、防坑保全。這並非迷信約束，而是古人與大自然相處的和諧美德。`;
  } else {
    fallbackAnswer = `【大師誠心生活開示】\n\n善信所提之問「${question}」，大師觀此日黃曆干支為【${dateContext?.ganzhiDay || "當天"}】。天干地支相生，主「厚德載物，百福並臻」。\n\n世界最大的「開運農民曆」其實一直就在您個人的「起心動念」。無論時局如何沉浮，只要您心懷慈悲、守正不阿，今天無論您身處哪個時辰與方向，皆是專屬於您的「黃道良辰吉方」。心安即是福，心定即是真境。`;
  }
  return { answer: fallbackAnswer };
};

const buildDivineExplainFallback = (fortuneId: string, title: string, poem: string, type: string, customQuestion: string) => {
  return {
    fortuneId: fortuneId || "一",
    title: title || "神靈妙籤",
    poemSentiment: "中吉．吉祥安泰",
    poemExplanation: `這首妙籤「${poem.replace(/\n/g, " ")}」蘊含佛道之無上智慧。籤意是說：世間萬事皆有時令，春回大地則綠柳抽枝，蛟龍得水則展翅飛天。目前切莫浮躁憂慮。求問者若能「安心靜氣、不卑不亢」，必有貴人在不遠處相牽引，福祿不請自來。`,
    advice: {
      career: "工作事業正值沉潛累積期，切不可盲目跳槽或在關係中自大，靜待秋收冬藏。聽取長輩開導，自有錦繡前程。",
      love: "感情重在互相對等之敬愛與包容。多一些和顏悅色，冰雪自然消融，春鶯鳴谷，琴瑟和鳴。",
      wealth: "財星暗拱，正財平順。不宜聽信小道偏門，凡事腳踏實地，聚沙成塔才是真正的神明財氣。",
      health: "健康方面須注意規律飲食，少吃辛溫生辣之物。多出門親近山水，散心舒意，即可消除百憂沉痾。",
      zenQuote: "莫道前程明鏡晦，心無一事自清朗。"
    },
    mindsetShift: "抽籤旨在給予現代高壓心智一次「返璞歸真」的傾聽契機。只要轉念不憂、踏實守正，則凶星亦會轉化為護法吉神。"
  };
};

const buildFortuneTodayFallback = (zodiac: string, dateStr: string) => {
  const seed = (zodiac.charCodeAt(0) || 77) + (dateStr ? dateStr.length : 12);
  const overallScore = 78 + (seed % 18); // 78-95 之間
  const showStar = (offset: number) => Math.min(5, Math.max(1, 3 + ((seed + offset) % 3)));
  
  const colors = ["琥珀金", "硃砂紅", "黛黑色", "雨過天青", "象牙白", "翡翠綠"];
  const luckyColor = colors[seed % colors.length];
  const luckyNumber = String((seed % 9) + 1);
  const dirs = ["正南方", "西北方", "東北方", "東南方", "正北方", "正東方"];
  const luckyDirection = dirs[seed % dirs.length];

  return {
    zodiac,
    overallScore,
    wealthScore: showStar(1),
    careerScore: showStar(2),
    loveScore: showStar(3),
    healthScore: showStar(4),
    luckyColor,
    luckyNumber,
    luckyDirection,
    summary: `生肖屬【${zodiac}】的緣主今日命宮太陰高照，求謀順暢。今日出門交際或辦公事，穿戴「${luckyColor}」之衣服飾品更能提神醒腦、提昇祥瑞磁場。與人接洽要戒躁急，多聽少言，凡事大智若愚，財官利祿自然從天而降！`
  };
};

const buildTermAdviceFallback = (termName: string) => {
  const genericAdvice = {
    termName,
    dietAdvice: {
      recommendedFoods: ["淮山山藥", "冰糖蓮子", "紅棗", "芡實"],
      avoidFoods: ["麻辣重鹹", "生冷冰鎮", "烈酒暴飲", "不潔海鮮"],
      explanation: "此時節地盤冷熱起伏。中醫五行提倡「溫養胃氣、調脾去濕」。蓮子山藥能清潤安神，避開過辛辣發汗厚禮，以免肺火過旺。"
    },
    routineAdvice: {
      sleepAdvice: "建議每晚十點半前安神調息、入睡修養，順應天光早起。",
      exerciseAdvice: "多做舒緩拉伸活動如八段錦、太極拳、慢步散走，不宜暴汗虛耗體力。",
      mindAdvice: "天地氣象更替，人神易躁。可閉目靜坐、隨息數息，放空自我是非得失。",
      explanation: "時節有序，生活有度。慢得下來的人，才儲存得起能量。順應自然作息就是最無價的保命符."
    },
    zenAura: "法界乾坤時相對，虛心自度永安泰。"
  };

  if (termName.includes("春分") || termName.includes("驚蟄")) {
    genericAdvice.dietAdvice.recommendedFoods = ["新鮮香椿", "青皮春筍", "枸杞芽", "野生木耳"];
    genericAdvice.dietAdvice.explanation = "春風拂面，肝氣當令。多吃深綠鮮嫩蔬菜能清肝祛火、暢通經絡，避免吃過度溫熱辛辣的香料。";
  } else if (termName.includes("夏至") || termName.includes("大暑") || termName.includes("小暑")) {
    genericAdvice.dietAdvice.recommendedFoods = ["夏日消暑綠豆", "鮮西瓜衣", "冬瓜薏仁", "涼拌苦瓜"];
    genericAdvice.dietAdvice.explanation = "長夏暑濕，濕熱熏蒸。心火獨高。綠豆薏仁能化濕解脾、生津清暑，一定要防範冰棒冷飲傷及神氣。";
  } else if (termName.includes("秋分") || termName.includes("白露") || termName.includes("處暑")) {
    genericAdvice.dietAdvice.recommendedFoods = ["百合肉", "生津白梨", "蓮藕", "川貝銀耳"];
    genericAdvice.dietAdvice.explanation = "秋燥最易傷肺，令人氣短咽乾。梨羹白蓮能潤燥化痰、清熱滋陰，作息建議提早半小時，以蓄精力。";
  } else if (termName.includes("冬至") || termName.includes("大寒") || termName.includes("小寒")) {
    genericAdvice.dietAdvice.recommendedFoods = ["冬至進補羊肉", "黑芝麻糊", "有機香核桃", "龍眼桂圓"];
    genericAdvice.dietAdvice.explanation = "冬至一陽生，萬物避寒藏精。以羊肉核桃等溫補腎陽、培元固本。切忌過度出汗和吃冰品。";
  }

  return genericAdvice;
};

const buildDailyFortuneFallback = (dateStr: string, ganzhiDay: string, ganzhiMonth: string, wuhang: string, conflictAnimal: string) => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FORTUNE_LOTS.length;
  const localLot = FORTUNE_LOTS[index];

  const summaries = [
    "干支和順，天地清泰。利於洗心內省、廣結善緣與謀定起步。",
    "五行流轉、生機勃勃，今日貴人逢喜。利於出外合作、簽約納財。",
    "今日氣場沉穩，宜務實耕耘、切勿聽信偏門小道，守靜者大吉。",
    "臨歲合大吉星入駐，心中抱持和善則無往不利。利於和解、修造。",
    "地盤水火既濟，諸事通泰。宜簽約開市，以誠信立身能迎來佳音。"
  ];
  const summary = summaries[Math.abs(hash) % summaries.length];

  return {
    summary,
    lot: {
      title: localLot.title,
      poem: localLot.poem,
      meaning: localLot.meaning,
      careerAdvice: `當前幹事應安步當車。配合今日妙籤【${localLot.title}】，行事以誠，遇阻忍耐則能逢凶化吉。`,
      wealthAdvice: `正偏財持平，守成第一。切不可輕信網路偏門或盲從投資，心懷知足則常能生無量財氣。`,
      loveAdvice: `和氣能開百花。感情婚姻宜多些真誠關切、少些情緒抬槓。多與親友歡笑聚餐，祥瑞洋溢。`,
      zenAura: "一池澄波月中明，心底無事即時吉。"
    }
  };
};

const buildTodayAuraFallback = (dateStr: string) => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  
  const levels = ["大吉", "吉", "小吉", "中平", "宜定", "避凶"];
  const fortuneLevel = levels[Math.abs(hash) % levels.length];
  
  const quotes = [
    {
      q: "春風得意馬蹄疾，一日看盡長安花。",
      int: "今日天光清朗，行事如沐春風。心中只要存有光明慈念，所到之處皆是平坦坦途，大吉之相。"
    },
    {
      q: "莫聽穿林打葉聲，何妨吟嘯且徐行。",
      int: "外在風雨雖有微瀾，亦不妨礙內心泰然。今日宜保持沉著、按部就班，靜則生智，中平化吉。"
    },
    {
      q: "一溪流水綠盈盈，兩岸好山青更青。",
      int: "五行能量此消彼長，恰到好處。今日利於和合交友、梳理心緒，親近綠意更可轉化一天的祥瑞。"
    },
    {
      q: "千淘萬漉雖辛苦，吹盡狂沙始到金。",
      int: "今天可能稍微需要一些耐心與磨練，但這正是累積氣運、大器晚成的考驗。多深呼吸，好轉在即。"
    },
    {
      q: "不畏浮雲遮望眼，自緣身在最高層。",
      int: "莫因一時風雲變幻而自亂手腳，立足長遠方能洞察天時。今日宜靜心謀劃，避開浮躁爭端。"
    },
    {
      q: "竹杖芒鞋輕勝馬，誰怕？一蓑煙雨任平生。",
      int: "今日氣象雖偶有沖突，好在福星護持。以淡雅曠達之胸懷度過此日，反而能激發生命底氣，避凶趨吉。"
    }
  ];
  
  const picked = quotes[Math.abs(hash) % quotes.length];
  return {
    fortuneLevel,
    poemQuote: picked.q,
    interpretation: picked.int
  };
};

// ----------------------------------------------------
// 🚀 Main Serverless Function Handler
// ----------------------------------------------------
export default async function handler(req: any, res: any) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { provider, task, payload } = req.body;

  if (!task) {
    return res.status(400).json({ error: 'Missing required field: task' });
  }

  const selectedProvider = provider || 'gemini';

  // 1. Task Definition & Variable extraction
  let systemInstruction = "";
  let userPrompt = "";
  let responseSchema: any = null;
  let fallbackGenerator: () => any;

  switch (task) {
    case 'pick-date': {
      const { activity, year, month, zodiac } = payload || {};
      if (!activity || !year || !month) {
        return res.status(400).json({ error: "缺少必要參數（活動、年份、月份）" });
      }
      systemInstruction = `你是一位精通東方傳統堪輿、擇日星宿及八字紫微的國學大師。
請根據使用者提供的活動項目、年份、月份，以及使用者的生肖屬相，推算出最適合的 3 個黃道吉日，並提供兼備傳統民俗與現代生活哲理的詳細說明。
請以結構化 JSON 格式回傳，所有回傳的內容必須使用繁體中文。`;
      userPrompt = `活動項目: ${activity}
預計年月: ${year} 年 ${month} 月
使用者生肖: ${zodiac || "不指定"}
請推算並給出 3 個吉日以及每日的吉時、吉方與開運引導。`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          activity: { type: Type.STRING },
          monthLabel: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            description: "吉日推薦列表（恰好3個）",
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "公曆日期，格式 YYYY-MM-DD" },
                lunarDate: { type: Type.STRING, description: "農曆日期，例如：五月初八" },
                suitabilityScore: { type: Type.INTEGER, description: "吉日契合指數，1-100 之間" },
                suitReasons: {
                  type: Type.ARRAY,
                  description: "推薦理由/宜忌分析",
                  items: { type: Type.STRING }
                },
                auspiciousHours: {
                  type: Type.ARRAY,
                  description: "當日黃金吉時",
                  items: { type: Type.STRING }
                },
                luckyDirections: {
                  type: Type.OBJECT,
                  description: "方位指南",
                  properties: {
                    wealth: { type: Type.STRING, description: "喜神/財神方" },
                    nobles: { type: Type.STRING, description: "貴人方" }
                  },
                  required: ["wealth", "nobles"]
                },
                modernWisdom: { type: Type.STRING, description: "給使用者的現代日常、心態開運溫馨建議（100字內）" }
              },
              required: ["date", "lunarDate", "suitabilityScore", "suitReasons", "auspiciousHours", "luckyDirections", "modernWisdom"]
            }
          }
        },
        required: ["activity", "monthLabel", "recommendations"]
      };

      fallbackGenerator = () => buildPickDateFallback(activity, parseInt(year), parseInt(month), zodiac);
      break;
    }

    case 'query': {
      const { question, dateContext } = payload || {};
      if (!question) {
        return res.status(400).json({ error: "問題內容不可為空" });
      }
      const contextStr = dateContext 
        ? `當前選取的日期資訊：公曆 ${dateContext.gregorianDate}，農曆 ${dateContext.lunarYear}${dateContext.lunarAnimal}年${dateContext.lunarMonthDate}，干支：${dateContext.ganzhiYear}年 ${dateContext.ganzhiMonth}月 ${dateContext.ganzhiDay}日，今日宜：${dateContext.suit?.join("、")}，今日忌：${dateContext.avoid?.join("、")}。`
        : "無日期上下文。";

      systemInstruction = `你是一位風趣、智慧且知性的東方民俗生活導師。
結合了傳統農民曆黃曆（五行、干支、星宿、生肖沖煞）與現代生活心理學，為使用者解答關於日常生活、擇吉、出行、風水、生肖運勢或心靈指引的疑惑。
回答時請依照以下原則：
1. 口吻親切、溫和有智慧，不生硬迷信，而是一種溫慢的傳統生活指引。
2. 結合使用者提供的「當前黃曆日期上下文」進行具體分析。
3. 結構清晰，可用 markdown 格式，多使用「吉祥開運」、「心態調整」等面向來給予溫馨建議。
4. 字數控制在 350 字以內，精煉有味。`;
      userPrompt = `使用者問題："${question}"
${contextStr}
請就此問題給予生動、專業的大師分析與開運引導。`;

      fallbackGenerator = () => buildQueryFallback(question, dateContext);
      break;
    }

    case 'divine-explain': {
      const { fortuneId, title, poem, type, customQuestion } = payload || {};
      if (!poem) {
        return res.status(400).json({ error: "缺少籤詩資訊" });
      }
      systemInstruction = `你是一位深諳太極八卦與禪宗心法的古老寺廟解籤僧侶。
你的職責是解讀六十甲子神籤。
不管籤詩本身看起來是吉是凶，你都能在民俗吉凶之外，給予使用者最深的「禪意啟發」、「行事指引」與「心理慰藉」，引導修行自我。
請針對使用者所求之項目（如求財、健康、感情、事業、學業、或特定的自訂問題）提供精緻的解籤。
請以結構化 JSON 格式回傳，格式必須完全符合指定的 JSON Schema，所有文字內容請使用繁體中文。`;
      userPrompt = `籤號：${fortuneId} (${title})
籤詩本文：
${poem}
使用者求問項目：${type || "綜合指引"}
${customQuestion ? `使用者具體求問問題："${customQuestion}"` : ""}
請結合籤意為其指點迷津。`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          fortuneId: { type: Type.STRING },
          title: { type: Type.STRING },
          poemSentiment: { type: Type.STRING, description: "籤詩屬性（大吉、上吉、中平、下下等）" },
          poemExplanation: { type: Type.STRING, description: "籤文白話文義解讀" },
          advice: {
            type: Type.OBJECT,
            properties: {
              career: { type: Type.STRING, description: "求事業/工作指引" },
              love: { type: Type.STRING, description: "求感情/婚姻指引" },
              wealth: { type: Type.STRING, description: "求財運/投資指引" },
              health: { type: Type.STRING, description: "求健康/出行指引" },
              zenQuote: { type: Type.STRING, description: "送給使用者的禪意一針見血開示（30字內金句）" }
            },
            required: ["career", "love", "wealth", "health", "zenQuote"]
          },
          mindsetShift: { type: Type.STRING, description: "如何轉念，化凶為吉或保泰持盈的心態修煉建議（100字內）" }
        },
        required: ["fortuneId", "title", "poemSentiment", "poemExplanation", "advice", "mindsetShift"]
      };

      fallbackGenerator = () => buildDivineExplainFallback(fortuneId, title, poem, type, customQuestion);
      break;
    }

    case 'fortune-today': {
      const { zodiac, dateStr } = payload || {};
      if (!zodiac) {
        return res.status(400).json({ error: "請指定生肖" });
      }
      systemInstruction = `你是一位資深的八字命理與生肖運勢專家。
請基於生肖，為今天（${dateStr || "今日"}）安排一份生動且兼顧娛樂性與啟發性的「生肖每日開運報告」。
請以結構化 JSON 格式回傳，格式必須完全符合指定的 JSON Schema，所有文字內容請使用繁體中文。`;
      userPrompt = `生肖項目: "${zodiac}"
請推算並給出今日的運勢評分與方位、幸運細節。`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          zodiac: { type: Type.STRING },
          overallScore: { type: Type.INTEGER, description: "今日運勢綜合評分 (60-100)" },
          wealthScore: { type: Type.INTEGER, description: "財運指數 (1-5 星)" },
          careerScore: { type: Type.INTEGER, description: "工作指數 (1-5 星)" },
          loveScore: { type: Type.INTEGER, description: "桃花指數 (1-5 星)" },
          healthScore: { type: Type.INTEGER, description: "精神指數 (1-5 星)" },
          luckyColor: { type: Type.STRING, description: "今日開運色" },
          luckyNumber: { type: Type.STRING, description: "今日幸運數字" },
          luckyDirection: { type: Type.STRING, description: "今日開運方位" },
          summary: { type: Type.STRING, description: "今日運勢總結與穿搭、交際防坑指南（120字內，風趣溫切）" }
        },
        required: [
          "zodiac", "overallScore", "wealthScore", "careerScore", 
          "loveScore", "healthScore", "luckyColor", "luckyNumber", 
          "luckyDirection", "summary"
        ]
      };

      fallbackGenerator = () => buildFortuneTodayFallback(zodiac, dateStr);
      break;
    }

    case 'term-advice': {
      const { termName } = payload || {};
      if (!termName) {
        return res.status(400).json({ error: "請提供節氣名稱" });
      }
      systemInstruction = `你是一位精通中醫經絡五行、黃帝內經、與禪宗心法的養生大師。
請根據當前的24節氣名稱，為使用者生成一套結合東方養生智慧與現代高壓社會「一針見血、極具可操作性」的飲食與作息生活實時建議。
請以結構化 JSON 格式回傳，格式必須完全符合指定的 JSON Schema，所有文字內容請使用繁體中文。`;
      userPrompt = `當前節氣期間：【${termName}】
請推算出本時節的：
1. 飲食調理（推薦食材、應少吃/忌口食材、詳細白話調理原理）。
2. 作息生活（睡眠養生、運動與拉伸指引、心靈情緒調適、詳細生活綜合開導）。
3. 大師加持：送給使用者一首針對本時節養生並蘊含禪意的開示金句（字數 30 字內）。`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          termName: { type: Type.STRING },
          dietAdvice: {
            type: Type.OBJECT,
            properties: {
              recommendedFoods: { 
                type: Type.ARRAY, 
                description: "推薦多吃或滋補的食材（繁體中文，例：山藥、綠豆，4個左右）",
                items: { type: Type.STRING } 
              },
              avoidFoods: { 
                type: Type.ARRAY, 
                description: "此節氣應少吃或傳統忌口食材（繁體中文，4個左右）",
                items: { type: Type.STRING } 
              },
              explanation: { type: Type.STRING, description: "飲食調養的詳細中醫五行原理繁體中文白話解說，100字內" }
            },
            required: ["recommendedFoods", "avoidFoods", "explanation"]
          },
          routineAdvice: {
            type: Type.OBJECT,
            properties: {
              sleepAdvice: { type: Type.STRING, description: "作息與睡眠養生建議，例如早睡晚起、午間小憩等，繁體中文" },
              exerciseAdvice: { type: Type.STRING, description: "本時節的適宜運動類型與強度，繁體中文" },
              mindAdvice: { type: Type.STRING, description: "此節氣下的情緒管理、心靈安定與防焦防躁方法，繁體中文" },
              explanation: { type: Type.STRING, description: "作息生活的綜合開導與特別溫馨提示，繁體中文，100字內" }
            },
            required: ["sleepAdvice", "exerciseAdvice", "mindAdvice", "explanation"]
          },
          zenAura: { type: Type.STRING, description: "大師對本時節特別開釋的一首養生五言絕句，或富含禪意的開悟金句（繁體中文，30字內）" }
        },
        required: ["termName", "dietAdvice", "routineAdvice", "zenAura"]
      };

      fallbackGenerator = () => buildTermAdviceFallback(termName);
      break;
    }

    case 'daily-fortune': {
      const { dateStr, ganzhiDay, ganzhiMonth, wuhang, conflictAnimal } = payload || {};
      if (!dateStr || !ganzhiDay) {
        return res.status(400).json({ error: "請提供日期與干支日資訊以進行推算" });
      }
      systemInstruction = `你是一位精通東方傳統八字命理、易經占卜、干支五行與陰陽術數的國學智慧大師。
請根據使用者提供的當日公曆日期、干支日、干支月、五行以及沖煞生肖，為今日推算出一套極富禪意、古典優雅且能安撫當代人心靈的「每日運勢總結與運勢籤」。
請以結構化 JSON 格式回傳，格式必須完全符合指定的 JSON Schema，所有文字內容請使用繁體中文。`;
      userPrompt = `公曆日期：${dateStr}
當日干支月：${ganzhiMonth || "未知"}
當日干支日：${ganzhiDay}
當日五行納音：${wuhang || "未知"}
今日相沖生肖：${conflictAnimal || "無"}

請為此特殊天時推算：
1. 每日運勢總結（summary）：結合干支五行，以一句古典、極其優美雅緻的語句（約 20 至 25 字內）來概括、啟迪今日運勢。
2. 運勢籤（lot）：包含一首古典靈驗籤詩及其禪意解析。
   - 籤名（title）：富有古典意境的籤名。
   - 籤詩（poem）：一首極具古代風格、對仗工整的七言或五言籤詩（共 4 句）。
   - 籤意白話總解（meaning）：對籤詩所藴含意境與吉凶象徵的優美白話解讀（80字內）。
   - 功名事業指引（careerAdvice）：今日的工作、學業之指引建議（50字內）。
   - 財源生計指引（wealthAdvice）：今日的財運開支與生財調理引導（50字內）。
   - 紅鸞姻緣指引（loveAdvice）：今日的桃花感情、人際關係契機與修持（50字內）。
   - 禪心大師開示（zenAura）：一句充滿禪宗哲理、能夠寬慰心靈的心流金句（30字內）。`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "古典優雅、富含哲理的 25 字內今日運勢總結" },
          lot: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "富有典雅風格的籤名" },
              poem: { type: Type.STRING, description: "4句七言 or 五言古典籤詩，對仗工整" },
              meaning: { type: Type.STRING, description: "對籤詩的白話哲理優美解讀" },
              careerAdvice: { type: Type.STRING, description: "事業與學業指引" },
              wealthAdvice: { type: Type.STRING, description: "財運與生財指引" },
              loveAdvice: { type: Type.STRING, description: "感情與人際交往指引" },
              zenAura: { type: Type.STRING, description: "大師對今日生活最驚艷的禪意開悟金句" }
            },
            required: ["title", "poem", "meaning", "careerAdvice", "wealthAdvice", "loveAdvice", "zenAura"]
          }
        },
        required: ["summary", "lot"]
      };

      fallbackGenerator = () => buildDailyFortuneFallback(dateStr, ganzhiDay, ganzhiMonth, wuhang, conflictAnimal);
      break;
    }

    case 'today-aura': {
      const { dateStr, ganzhiDay, lunarMonthDate, jianShen } = payload || {};
      if (!dateStr) {
        return res.status(400).json({ error: "必須輸入日期" });
      }
      systemInstruction = `你是一位精通易經與傳統古典文學的黃曆大師。請專為這一天推算吉凶氣場磁場，並生成一句極具古典文采與開悟禪意的每日一言。所有文字內容請使用繁體中文。`;
      userPrompt = `公曆日期為: ${dateStr}, 當天干支: ${ganzhiDay || "未知"}, 當天農曆日期: ${lunarMonthDate || "未知"}, 當日值日宿神: ${jianShen || "未知"}。
請結合以上要素，判斷並精準輸出大局吉凶預測與一句經典優美、朗朗上口的古詩詞風格開運佳句，並提供簡短點撥。`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          fortuneLevel: { type: Type.STRING, description: "今日大局吉凶預測，例：大吉/吉/小吉/中平/宜持重/避凶/起筆" },
          poemQuote: { type: Type.STRING, description: "極富古風文采、對仗精美的七言或五言修心開運言" },
          interpretation: { type: Type.STRING, description: "大師對此每日一言與今日氣運的心靈白話溫馨啟迪（70字以內），文風和煦開朗。" }
        },
        required: ["fortuneLevel", "poemQuote", "interpretation"]
      };

      fallbackGenerator = () => buildTodayAuraFallback(dateStr);
      break;
    }

    default: {
      return res.status(400).json({ error: `Unknown task: ${task}` });
    }
  }

  // 2. Call the AI service
  try {
    let resultText = "";

    if (selectedProvider === 'gemini') {
      const rawKey = process.env.GEMINI_API_KEY;
      const geminiKey = cleanKey(rawKey);
      if (!geminiKey) {
        throw new Error("GEMINI_API_KEY is not configured on the server.");
      }

      const ai = getGeminiClient();

      const config: any = {
        systemInstruction,
      };

      if (responseSchema) {
        config.responseMimeType = "application/json";
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [userPrompt],
        config,
      });

      resultText = response.text || "";
    } else if (selectedProvider === 'nvidia') {
      const rawNvidiaKey = process.env.NVIDIA_API_KEY;
      const nvidiaKey = cleanKey(rawNvidiaKey);
      if (!nvidiaKey) {
        throw new Error("NVIDIA_API_KEY is not configured on the server.");
      }

      // Append standard JSON schema details to the user prompt if schema exists
      let enhancedUserPrompt = userPrompt;
      if (responseSchema) {
        const cleaned = cleanSchema(responseSchema);
        enhancedUserPrompt += `\n\n[IMPORTANT REQUIREMENT] You must output a JSON object adhering strictly to this schema:
${JSON.stringify(cleaned, null, 2)}
Ensure the response contains no markdown wrapper or only valid JSON.`;
      }

      const nvidiaResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nvidiaKey}`
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: enhancedUserPrompt }
          ],
          temperature: 0.5,
          max_tokens: 1024,
          response_format: responseSchema ? { type: "json_object" } : undefined
        })
      });

      if (!nvidiaResponse.ok) {
        const errText = await nvidiaResponse.text();
        throw new Error(`NVIDIA API response error: ${nvidiaResponse.status} ${errText}`);
      }

      const data = await nvidiaResponse.json();
      resultText = data.choices?.[0]?.message?.content || "";
    } else {
      throw new Error(`Unsupported AI Provider: ${selectedProvider}`);
    }

    if (!resultText || resultText.trim() === "") {
      throw new Error("AI provider returned empty response");
    }

    // Parse Response
    if (responseSchema) {
      // Robust JSON extraction (strip potential Markdown blocks)
      let cleanedJson = resultText.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      const parsed = JSON.parse(cleanedJson);
      return res.status(200).json(parsed);
    } else {
      return res.status(200).json({ answer: resultText });
    }

  } catch (error: any) {
    console.error(`[API Error] Provider: ${selectedProvider}, Task: ${task}. Error:`, error.message);
    try {
      // Fallback
      const fallbackData = fallbackGenerator!();
      return res.status(200).json(fallbackData);
    } catch (fallbackError: any) {
      return res.status(500).json({
        error: "後端服務異常且備用方案載入失敗，請檢查 API Key 設定與連線狀態。",
        details: error.message
      });
    }
  }
}
