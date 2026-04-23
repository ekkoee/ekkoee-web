// =====================================================================
// lib/i18n/dictionaries — 所有 UI 文字的三語字典
// ---------------------------------------------------------------------
// 這份檔案是唯一的 single source of truth。
// 改文案 → 改這裡。新增語言 → 在 locales.ts 加代號,再複製 zh-Hant
// 的結構來翻。
//
// 結構分區:
//   hud          → CyberpunkFrame 頂/底 HUD
//   hero         → 主視覺(桌面 / 手機 / hint)
//   manifesto    → 01 / MANIFESTO
//   mission      → 02 / MISSION
//   process      → 02/03 DIAGNOSE / DEPLOY / EVOLVE
//   architecture → 05 / ARCHITECTURE 節點 + zone 帶
//   trust        → 03 / TRUST 三帶 RED / YELLOW / GREEN
//   dashboard    → 04 / LIVE SYSTEM 假儀表板
//   cta          → 05 / READY WHEN YOU ARE
//   common       → 按鈕 / 通用詞彙
// =====================================================================

import type { Locale } from './locales';

// -------------------------------------------------------------
// 字典型別(zh-Hant 就是權威形狀,其他語言要符合同樣 shape)
// -------------------------------------------------------------
export type Dictionary = {
  hud: {
    wordmark: string;
    tagline: string;
    node: string;
    clientLogin: string;
    sysLive: string;
    agents: string;
    warn: string;
    scrollHint: string;
  };
  hero: {
    subtitle: string;
    scrollHint: string;
    scrollHintSub: string;
    enter: string;
    skipIntro: string;
  };
  manifesto: {
    tag: string;
    lineA: string;
    lineB: string;
  };
  mission: {
    tag: string;
    claimDont: string;
    claimStrike: string;
    claimWe: string;
    claimWin: string;
    prosePre: string;
    proseStrong: string;
    prosePost: string;
  };
  process: {
    tag: string;
    headline: string;
    steps: Array<{
      num: string;
      label: string;
      title: string;
      body: string;
    }>;
  };
  architecture: {
    tag: string;
    headlineA: string;
    headlineB: string;
    zoneRed: string;
    zoneYellow: string;
    zoneGreen: string;
    hoverHint: string;
    nodes: {
      factory: { label: string; sub: string };
      edge: { label: string; sub: string };
      gateway: { label: string; sub: string };
      cloud: { label: string; sub: string };
    };
  };
  trust: {
    tag: string;
    headline: string;
    zoneRed: string;
    zoneYellow: string;
    zoneGreen: string;
    red: { strong: string; body: string; promise: string };
    yellow: { strong: string; body: string; promise: string };
    green: { strong: string; body: string; promise: string };
  };
  dashboard: {
    tag: string;
    headline: string;
    frameTitle: string;
    live: string;
    tabs: { overview: string; agents: string; alerts: string };
    passRate: string;
    passDelta: string;
    activeAgents: string;
    activeAgentsSub: string;
    detectionsToday: string;
    uptime: string;
    uptimeSla: string;
    agentLog: string;
  };
  cta: {
    tag: string;
    headlineA: string;
    headlineB: string;
    body: string;
    typedFull: string;
    orEmailPre: string;
    orEmailPost: string;
    contactsHeading: string;
    lineLabel: string;
    lineHint: string;
    telegramLabel: string;
    telegramHint: string;
    emailHello: string;
    emailHelloNote: string;
    emailProton: string;
    emailProtonNote: string;
  };
  common: {
    langLabel: string;
  };
};

// -------------------------------------------------------------
// 繁體中文(預設,權威版本)
// -------------------------------------------------------------
const zhHant: Dictionary = {
  hud: {
    wordmark: 'EKKOEE.COM',
    tagline: 'MINI-AGI FOR MANUFACTURING',
    node: 'NODE::23.4.168',
    clientLogin: '▸ 客戶登入',
    sysLive: 'SYS::LIVE',
    agents: 'AGENTS::05/07',
    warn: '02 WARN',
    scrollHint: '▼ 滾輪 · 拖曳 · 縮放',
  },
  hero: {
    subtitle: 'mini-agi for manufacturing',
    scrollHint: '滾輪進入 · 拖曳環繞',
    scrollHintSub: '任何方向都能打開閘門',
    enter: '↓ 進入',
    skipIntro: '跳過 →',
  },
  manifesto: {
    tag: '[ 01 / 宣言 ]',
    lineA: '所有的智慧,',
    lineB: '為了每個人每分每秒的自由。',
  },
  mission: {
    tag: '[ 02 / 使命 ]',
    claimDont: 'We don’t ',
    claimStrike: 'sell ERP.',
    claimWe: 'We ',
    claimWin: 'grow Mini-AGIs.',
    prosePre: '多數軟體告訴工廠該做什麼。ekkoee 打造的是一個會',
    proseStrong: '一起思考',
    prosePost:
      '的智慧。一座工廠,一套 AI 神經系統 — 就地生長、從你的地板學、永遠屬於你。沒有 SaaS 綁架、沒有矽谷陳腔濫調。只有一個比你 ERP 更了解你機器的 agent。',
  },
  process: {
    tag: '[ 02 / 流程 ]',
    headline: '從一次訪談,到一座會思考的工廠',
    steps: [
      {
        num: '01',
        label: '01 / 企業健檢',
        title: '企業健檢',
        body: '兩週,三次訪談。我們走進你的工廠,理解你的製程、痛點、和不想被碰的核心機密。產出一份診斷報告:哪些環節 AI 可以介入、哪些不該動、投入產出的預期。',
      },
      {
        num: '02',
        label: '02 / 智慧體部署',
        title: '智慧體部署',
        body: '硬體進廠,模型落地。本地 GPU 伺服器接上你的資料源,RAG 索引你的 SOP、歷史記錄、機台規格。紅區資料永不離開工廠,綠區數據透過 ekkoee.com 儀表板遠端監控。',
      },
      {
        num: '03',
        label: '03 / 持續進化',
        title: '持續進化',
        body: '智慧體上線後每天學習。新的異常、新的決策、新的流程都會餵回模型。每月一次校準,每季一次能力擴充。你的工廠,會愈用愈聰明。',
      },
    ],
  },
  architecture: {
    tag: '[ 05 / 架構 ]',
    headlineA: 'hybrid. ',
    headlineB: 'trust-first.',
    zoneRed: '● 紅區',
    zoneYellow: '● 黃區',
    zoneGreen: '● 綠區',
    hoverHint: '滑過任一節點 → 看資料流加速',
    nodes: {
      factory: { label: '你的工廠', sub: '離線 · 本地 GPU' },
      edge: { label: '邊緣 AGENT', sub: '視覺 · 排程 · 告警' },
      gateway: { label: '安全閘道', sub: 'HTTPS · API 金鑰 · 遮罩' },
      cloud: { label: 'EKKOEE.CLOUD', sub: 'portal · 即時 · 管理' },
    },
  },
  trust: {
    tag: '[ 03 / 信任 ]',
    headline: '三帶信任,一條邊界',
    zoneRed: '紅區',
    zoneYellow: '黃區',
    zoneGreen: '綠區',
    red: {
      strong: '配方、定價、財務模型。',
      body: '這些是你工廠的護城河資料。永遠不上雲,甚至不碰網路。只由工廠地板上那台本地 GPU 處理。',
      promise: '// never leaves premises',
    },
    yellow: {
      strong: 'SOP、草稿合約、內部流程。',
      body: '敏感但非核心。預設留在本地;需要同步時,匿名化、遮罩化,每個動作都有稽核軌跡。',
      promise: '// anonymized before upload',
    },
    green: {
      strong: '手冊、法規、公開資料。',
      body: '可自由雲端處理。大模型的火力、零機密風險。Claude、GPT、前沿模型在這裡為你工作 — 也只在這裡。',
      promise: '// cloud-processable',
    },
  },
  dashboard: {
    tag: '[ 04 / 即時系統 ]',
    headline: '工廠的心跳,看得見',
    frameTitle: 'portal.ekkoee.com / camptec · production floor',
    live: '● 即時',
    tabs: { overview: '總覽', agents: '智慧體', alerts: '告警' },
    passRate: '通過率',
    passDelta: '▲ 2.1 vs 上週',
    activeAgents: '在線智慧體',
    activeAgentsSub: '全系統正常',
    detectionsToday: '今日偵測',
    uptime: '連續運作 · 30 日',
    uptimeSla: 'SLA 目標:99.5%',
    agentLog: '智慧體日誌 · 串流',
  },
  cta: {
    tag: '[ 05 / 準備好了就來 ]',
    headlineA: 'stop reporting.',
    headlineB: 'start predicting.',
    body: '第一次顧問面談免費。我們走進你的工廠、畫出流程地圖,具體說清楚:在你的脈絡下,智慧體會長成什麼樣子。',
    typedFull: 'initiate consultation_',
    orEmailPre: '或直接寄信至 ',
    orEmailPost: '',
    contactsHeading: '或用以下方式找我',
    lineLabel: 'LINE · @ekkoee',
    lineHint: '掃 QR 或點擊加入',
    telegramLabel: 'Telegram · @ekkoee',
    telegramHint: '訊息回覆較快',
    emailHello: 'hello@ekkoee.com',
    emailHelloNote: '主信箱,會自動轉寄',
    emailProton: 'ekkoee@protonmail.com',
    emailProtonNote: '私人信箱,端對端加密',
  },
  common: {
    langLabel: '語言',
  },
};

// -------------------------------------------------------------
// English
// -------------------------------------------------------------
const en: Dictionary = {
  hud: {
    wordmark: 'EKKOEE.COM',
    tagline: 'MINI-AGI FOR MANUFACTURING',
    node: 'NODE::23.4.168',
    clientLogin: '▸ CLIENT LOGIN',
    sysLive: 'SYS::LIVE',
    agents: 'AGENTS::05/07',
    warn: '02 WARN',
    scrollHint: '▼ SCROLL · DRAG · ZOOM',
  },
  hero: {
    subtitle: 'mini-agi for manufacturing',
    scrollHint: 'SCROLL TO ENTER · DRAG TO ORBIT',
    scrollHintSub: 'EITHER DIRECTION OPENS THE GATE',
    enter: '↓ ENTER',
    skipIntro: 'SKIP INTRO →',
  },
  manifesto: {
    tag: '[ 01 / MANIFESTO ]',
    lineA: 'All of intelligence,',
    lineB: 'so every person can have every second free.',
  },
  mission: {
    tag: '[ 02 / MISSION ]',
    claimDont: 'We don’t ',
    claimStrike: 'sell ERP.',
    claimWe: 'We ',
    claimWin: 'grow Mini-AGIs.',
    prosePre:
      'Most software tells factories what to do. ekkoee grows an intelligence that ',
    proseStrong: 'thinks alongside you',
    prosePost:
      '. One factory, one AI nervous system — grown in place, learning from your floor, yours forever. No SaaS lock-in. No Silicon Valley clichés. Just an agent that knows your machines better than your ERP ever could.',
  },
  process: {
    tag: '[ 02 / PROCESS ]',
    headline: 'From one interview to a factory that thinks',
    steps: [
      {
        num: '01',
        label: '01 / DIAGNOSE',
        title: 'Operational Diagnosis',
        body: 'Two weeks, three interviews. We walk your floor, map your process, pain points, and the trade secrets you don’t want touched. You get a report: where AI can step in, where it shouldn’t, and what returns to expect.',
      },
      {
        num: '02',
        label: '02 / DEPLOY',
        title: 'Agent Deployment',
        body: 'Hardware in, model grounded. A local GPU server plugs into your data sources. RAG indexes your SOPs, history, and machine specs. Red-zone data never leaves the plant; green-zone telemetry streams to your ekkoee.com dashboard.',
      },
      {
        num: '03',
        label: '03 / EVOLVE',
        title: 'Continuous Evolution',
        body: 'Once live, the agent learns daily. New anomalies, new decisions, new flows feed back into the model. Monthly calibration, quarterly capability expansion. Your factory gets smarter the longer you run it.',
      },
    ],
  },
  architecture: {
    tag: '[ 05 / ARCHITECTURE ]',
    headlineA: 'hybrid. ',
    headlineB: 'trust-first.',
    zoneRed: '● RED ZONE',
    zoneYellow: '● YELLOW ZONE',
    zoneGreen: '● GREEN ZONE',
    hoverHint: 'hover any node to see the data flow accelerate →',
    nodes: {
      factory: { label: 'YOUR FACTORY', sub: 'air-gapped · local GPU' },
      edge: { label: 'EDGE.AGENT', sub: 'vision · scheduling · alert' },
      gateway: { label: 'SECURE GATEWAY', sub: 'HTTPS · API key · masked' },
      cloud: { label: 'EKKOEE.CLOUD', sub: 'portal · realtime · admin' },
    },
  },
  trust: {
    tag: '[ 03 / TRUST ]',
    headline: 'Three zones of trust, one boundary',
    zoneRed: 'RED ZONE',
    zoneYellow: 'YELLOW ZONE',
    zoneGreen: 'GREEN ZONE',
    red: {
      strong: 'Recipes, pricing, financial models.',
      body: 'Your factory’s moat. Never the cloud, never the internet. Handled only by the local GPU sitting on your shop floor.',
      promise: '// never leaves premises',
    },
    yellow: {
      strong: 'SOPs, draft contracts, internal workflows.',
      body: 'Sensitive but not core. Stays local by default; when sync is needed, it’s anonymized and masked, with an audit trail on every action.',
      promise: '// anonymized before upload',
    },
    green: {
      strong: 'Manuals, regulations, public knowledge.',
      body: 'Free to process in the cloud. Full firepower of frontier models, zero secret exposure. Claude, GPT and others work for you here — and only here.',
      promise: '// cloud-processable',
    },
  },
  dashboard: {
    tag: '[ 04 / LIVE SYSTEM ]',
    headline: 'See the heartbeat of your factory',
    frameTitle: 'portal.ekkoee.com / camptec · production floor',
    live: '● LIVE',
    tabs: { overview: 'OVERVIEW', agents: 'AGENTS', alerts: 'ALERTS' },
    passRate: 'PASS RATE',
    passDelta: '▲ 2.1 vs last week',
    activeAgents: 'ACTIVE AGENTS',
    activeAgentsSub: 'all systems nominal',
    detectionsToday: 'DETECTIONS TODAY',
    uptime: 'UPTIME · 30d',
    uptimeSla: 'SLA target: 99.5%',
    agentLog: 'AGENT LOG · STREAM',
  },
  cta: {
    tag: '[ 05 / READY WHEN YOU ARE ]',
    headlineA: 'stop reporting.',
    headlineB: 'start predicting.',
    body: 'The first consultation is on us. We walk your plant, map the flow, and tell you plainly what an agent would look like in your context.',
    typedFull: 'initiate consultation_',
    orEmailPre: 'or email ',
    orEmailPost: ' directly',
    contactsHeading: 'or reach me here',
    lineLabel: 'LINE · @ekkoee',
    lineHint: 'scan QR or tap to add',
    telegramLabel: 'Telegram · @ekkoee',
    telegramHint: 'fastest reply',
    emailHello: 'hello@ekkoee.com',
    emailHelloNote: 'forwarded to me',
    emailProton: 'ekkoee@protonmail.com',
    emailProtonNote: 'personal · end-to-end encrypted',
  },
  common: {
    langLabel: 'LANGUAGE',
  },
};

// -------------------------------------------------------------
// 简体中文(opencc-js 不夠用於用詞差異,所以手寫較自然)
// -------------------------------------------------------------
const zhHans: Dictionary = {
  hud: {
    wordmark: 'EKKOEE.COM',
    tagline: 'MINI-AGI FOR MANUFACTURING',
    node: 'NODE::23.4.168',
    clientLogin: '▸ 客户登录',
    sysLive: 'SYS::LIVE',
    agents: 'AGENTS::05/07',
    warn: '02 WARN',
    scrollHint: '▼ 滚轮 · 拖拽 · 缩放',
  },
  hero: {
    subtitle: 'mini-agi for manufacturing',
    scrollHint: '滚轮进入 · 拖拽环绕',
    scrollHintSub: '任一方向皆可开启闸门',
    enter: '↓ 进入',
    skipIntro: '跳过 →',
  },
  manifesto: {
    tag: '[ 01 / 宣言 ]',
    lineA: '所有的智能,',
    lineB: '为了每个人每分每秒的自由。',
  },
  mission: {
    tag: '[ 02 / 使命 ]',
    claimDont: 'We don’t ',
    claimStrike: 'sell ERP.',
    claimWe: 'We ',
    claimWin: 'grow Mini-AGIs.',
    prosePre: '多数软件告诉工厂该做什么。ekkoee 打造的是一个会',
    proseStrong: '一起思考',
    prosePost:
      '的智能体。一座工厂,一套 AI 神经系统 — 就地生长、从你的车间学、永远属于你。没有 SaaS 绑架,没有硅谷陈词滥调。只有一个比你 ERP 更懂你设备的 agent。',
  },
  process: {
    tag: '[ 02 / 流程 ]',
    headline: '从一次访谈,到一座会思考的工厂',
    steps: [
      {
        num: '01',
        label: '01 / 企业健检',
        title: '企业健检',
        body: '两周,三次访谈。我们走进你的工厂,理解你的工艺、痛点、以及不愿被触碰的核心机密。输出一份诊断报告:哪些环节 AI 可介入、哪些不该动、投入产出的预期。',
      },
      {
        num: '02',
        label: '02 / 智能体部署',
        title: '智能体部署',
        body: '硬件进厂,模型落地。本地 GPU 服务器接入你的数据源,RAG 索引你的 SOP、历史记录、设备规格。红区数据永不离厂,绿区数据通过 ekkoee.com 仪表板远程监控。',
      },
      {
        num: '03',
        label: '03 / 持续进化',
        title: '持续进化',
        body: '智能体上线后每天学习。新的异常、新的决策、新的流程都会喂回模型。每月一次校准,每季一次能力扩展。你的工厂,会越用越聪明。',
      },
    ],
  },
  architecture: {
    tag: '[ 05 / 架构 ]',
    headlineA: 'hybrid. ',
    headlineB: 'trust-first.',
    zoneRed: '● 红区',
    zoneYellow: '● 黄区',
    zoneGreen: '● 绿区',
    hoverHint: '鼠标悬停任一节点 → 看数据流加速',
    nodes: {
      factory: { label: '你的工厂', sub: '离线 · 本地 GPU' },
      edge: { label: '边缘 AGENT', sub: '视觉 · 排程 · 告警' },
      gateway: { label: '安全网关', sub: 'HTTPS · API 密钥 · 脱敏' },
      cloud: { label: 'EKKOEE.CLOUD', sub: 'portal · 实时 · 管理' },
    },
  },
  trust: {
    tag: '[ 03 / 信任 ]',
    headline: '三区信任,一条边界',
    zoneRed: '红区',
    zoneYellow: '黄区',
    zoneGreen: '绿区',
    red: {
      strong: '配方、定价、财务模型。',
      body: '这些是你工厂的护城河数据。永远不上云,甚至不碰网络。只由车间里那台本地 GPU 处理。',
      promise: '// never leaves premises',
    },
    yellow: {
      strong: 'SOP、合同草案、内部流程。',
      body: '敏感但非核心。默认留在本地;需要同步时,脱敏、遮罩处理,每一步都有审计轨迹。',
      promise: '// anonymized before upload',
    },
    green: {
      strong: '手册、法规、公开资料。',
      body: '可自由上云处理。大模型的全部火力,零机密暴露。Claude、GPT、前沿模型在这里为你工作 — 也只在这里。',
      promise: '// cloud-processable',
    },
  },
  dashboard: {
    tag: '[ 04 / 实时系统 ]',
    headline: '工厂的心跳,看得见',
    frameTitle: 'portal.ekkoee.com / camptec · production floor',
    live: '● 实时',
    tabs: { overview: '总览', agents: '智能体', alerts: '告警' },
    passRate: '合格率',
    passDelta: '▲ 2.1 vs 上周',
    activeAgents: '在线智能体',
    activeAgentsSub: '全系统正常',
    detectionsToday: '今日检测',
    uptime: '连续运行 · 30 天',
    uptimeSla: 'SLA 目标:99.5%',
    agentLog: '智能体日志 · 流',
  },
  cta: {
    tag: '[ 05 / 准备好就来 ]',
    headlineA: 'stop reporting.',
    headlineB: 'start predicting.',
    body: '首次顾问面谈免费。我们走进你的工厂、画出流程地图,具体说清楚:在你的语境下,智能体会长成什么样子。',
    typedFull: 'initiate consultation_',
    orEmailPre: '或直接发信至 ',
    orEmailPost: '',
    contactsHeading: '或通过以下方式联系我',
    lineLabel: 'LINE · @ekkoee',
    lineHint: '扫 QR 或点击加入',
    telegramLabel: 'Telegram · @ekkoee',
    telegramHint: '消息回复更快',
    emailHello: 'hello@ekkoee.com',
    emailHelloNote: '主邮箱,自动转发',
    emailProton: 'ekkoee@protonmail.com',
    emailProtonNote: '私人邮箱,端到端加密',
  },
  common: {
    langLabel: '语言',
  },
};

// -------------------------------------------------------------
// 集合輸出
// -------------------------------------------------------------
export const DICTIONARIES: Record<Locale, Dictionary> = {
  'zh-Hant': zhHant,
  en,
  'zh-Hans': zhHans,
};
