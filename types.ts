export interface StyleConfig {
  name: string;
  description: string;
}

export interface GenerationState {
  isGenerating: boolean;
  step: 'idle' | 'writing' | 'imagining' | 'styling' | 'complete' | 'error';
  progress: number; // 0 to 100
  error?: string;
}

export interface ArticleData {
  topic: string;
  style: string;
  wordCount: number;
  content: string; // Raw HTML content
  coverUrl?: string;
}

export type StyleKey = 
  | "中医科普风"
  | "权威科普风"
  | "情感共鸣风"
  | "干货教程风"
  | "小红书种草风"
  | "幽默吐槽风"
  | "商业分析风"
  | "鸡汤励志风";