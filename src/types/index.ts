// 算法步骤类型
export type StepOperation = 'init' | 'enter' | 'shrink' | 'compare' | 'match' | 'done';

export interface AlgorithmTeaching {
  operation: StepOperation;
  focus: { char: string; index: number } | null;
  countChange: { char: string; before: number; after: number; meaning: 'window-frequency' | 'remaining-demand' } | null;
  bounds: { before: { left: number; right: number }; after: { left: number; right: number } };
  decision: { matched: boolean; reason: string } | null;
  narration: string;
}

export interface AlgorithmStep {
  id: number;
  description: string;
  // 代码行高亮 - 支持多语言
  codeLines: {
    java: number[];
    python: number[];
    golang: number[];
    javascript: number[];
  };
  // 变量状态
  variables: Record<string, unknown>;
  // 窗口状态
  windowState: {
    left: number;
    right: number;
    windowContent: string;
  };
  // 字符频率计数
  charCount: Record<string, number>;
  targetCount: Record<string, number>;
  // 当前找到的结果
  results: number[];
  // 高亮的字符索引
  highlightIndices: number[];
  // 是否匹配
  isMatch: boolean;
  // 动画类型
  animationType: 'enter' | 'leave' | 'match' | 'compare' | 'init' | 'result';
  teaching: AlgorithmTeaching;
}

// 算法类型
export type AlgorithmType = 'fixed-window' | 'variable-window';

// 编程语言类型
export type ProgrammingLanguage = 'java' | 'python' | 'golang' | 'javascript';

// 算法代码
export interface AlgorithmCode {
  java: string;
  python: string;
  golang: string;
  javascript: string;
}

// 播放状态
export interface PlaybackState {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
}

// 输入数据
export interface InputData {
  s: string;
  p: string;
}

// 样例数据
export interface SampleData {
  name: string;
  s: string;
  p: string;
}
