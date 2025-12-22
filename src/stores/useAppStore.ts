import { create } from 'zustand';
import type { AlgorithmStep, AlgorithmType, ProgrammingLanguage, InputData } from '../types';
import { generateFixedWindowSteps, generateVariableWindowSteps } from '../algorithms';
import { getSetting, saveSetting } from '../utils/indexedDB';

interface AppState {
  // 输入数据
  inputData: InputData;
  setInputData: (data: InputData) => void;

  // 算法类型
  algorithmType: AlgorithmType;
  setAlgorithmType: (type: AlgorithmType) => void;

  // 编程语言
  language: ProgrammingLanguage;
  setLanguage: (lang: ProgrammingLanguage) => void;

  // 算法步骤
  steps: AlgorithmStep[];
  generateSteps: () => void;

  // 播放状态
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;

  // 初始化
  initialize: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 默认输入数据
  inputData: { s: 'cbaebabacd', p: 'abc' },
  setInputData: (data) => {
    set({ inputData: data });
    get().generateSteps();
  },

  // 默认算法类型
  algorithmType: 'fixed-window',
  setAlgorithmType: (type) => {
    set({ algorithmType: type, currentStep: 0, isPlaying: false });
    get().generateSteps();
  },

  // 默认语言
  language: 'python',
  setLanguage: async (lang) => {
    set({ language: lang });
    await saveSetting('language', lang);
  },

  // 算法步骤
  steps: [],
  generateSteps: () => {
    const { inputData, algorithmType } = get();
    const steps = algorithmType === 'fixed-window'
      ? generateFixedWindowSteps(inputData.s, inputData.p)
      : generateVariableWindowSteps(inputData.s, inputData.p);
    set({ steps, currentStep: 0, isPlaying: false });
  },

  // 播放状态
  currentStep: 0,
  setCurrentStep: (step) => set({ currentStep: step }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  speed: 1,
  setSpeed: async (speed) => {
    set({ speed });
    await saveSetting('speed', speed);
  },

  // 初始化
  initialize: async () => {
    const language = await getSetting<ProgrammingLanguage>('language', 'python');
    const speed = await getSetting<number>('speed', 1);
    set({ language, speed });
    get().generateSteps();
  },
}));
