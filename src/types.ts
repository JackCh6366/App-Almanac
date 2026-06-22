/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AlmanacDay {
  gregorianDate: string; // "YYYY-MM-DD"
  year: number;
  month: number;
  day: number;
  weekdayLabel: string; // "星期五"
  
  // 農曆
  lunarYear: string; // "丙午"
  lunarAnimal: string; // "馬"
  lunarMonthDate: string; // "五月初四"
  lunarMonth: string; // "五月"
  lunarDay: string; // "初四"
  isLeapMonth: boolean;

  // 干支
  ganzhiYear: string; // "丙午"
  ganzhiMonth: string; // "甲午"
  ganzhiDay: string; // "癸巳"

  // 傳統黃曆
  suit: string[]; // 宜
  avoid: string[]; // 忌
  shaDirection: string; // 煞方 (煞東, 煞西, etc.)
  conflictAnimal: string; // 沖肖 (沖鼠)
  conflictAge: number; // 沖歲 (31歲)
  wuhang: string; // 五行纳音 ("天河水")
  jianShen: string; // 建除十二神 ("成執開閉...")
  taiShen: string; // 胎神占方
  luckyDirectionWealth: string; // 財神方
  luckyDirectionLove: string; // 喜神方
  luckyDirectionNobles: string; // 貴人方
  
  // 現代趣味宜忌 (融入年輕化解籤)
  modernSuit: string[];
  modernAvoid: string[];
}

export interface ZodiacReport {
  zodiac: string;
  overallScore: number;
  wealthScore: number;
  careerScore: number;
  loveScore: number;
  healthScore: number;
  luckyColor: string;
  luckyNumber: string;
  luckyDirection: string;
  summary: string;
}

export interface RecommendedDay {
  date: string;
  lunarDate: string;
  suitabilityScore: number;
  suitReasons: string[];
  auspiciousHours: string[];
  luckyDirections: {
    wealth: string;
    nobles: string;
  };
  modernWisdom: string;
}

export interface PickDateResponse {
  activity: string;
  monthLabel: string;
  recommendations: RecommendedDay[];
}

export interface DivineResponse {
  fortuneId: string;
  title: string;
  poemSentiment: string; // "大吉", "中平", "下吉" 等
  poemExplanation: string;
  advice: {
    career: string;
    love: string;
    wealth: string;
    health: string;
    zenQuote: string;
  };
  mindsetShift: string;
}

export interface DivineLot {
  id: string;
  title: string;
  sentiment: string;
  poem: string;
  meaning: string;
  legend: string; // 典故
}

export interface SolarTermAdviceResponse {
  termName: string;
  dietAdvice: {
    recommendedFoods: string[];
    avoidFoods: string[];
    explanation: string;
  };
  routineAdvice: {
    sleepAdvice: string;
    exerciseAdvice: string;
    mindAdvice: string;
    explanation: string;
  };
  zenAura: string;
}

export interface DailyFortuneResponse {
  summary: string;
  lot: {
    title: string;
    poem: string;
    meaning: string;
    careerAdvice: string;
    wealthAdvice: string;
    loveAdvice: string;
    zenAura: string;
  };
}

