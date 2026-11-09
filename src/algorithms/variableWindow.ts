import type { AlgorithmStep, AlgorithmCode } from '../types';
import { addTeachingSnapshots } from './fixedWindow';

// 不定长滑窗算法代码
export const variableWindowCode: AlgorithmCode = {
  java: `class Solution {
    public List<Integer> findAnagrams(String s, String p) {
        List<Integer> ans = new ArrayList<>();
        int[] cnt = new int[26];
        
        for (char c : p.toCharArray()) {
            cnt[c - 'a']++;
        }
        
        int left = 0;
        for (int right = 0; right < s.length(); right++) {
            cnt[s.charAt(right) - 'a']--;
            
            while (cnt[s.charAt(right) - 'a'] < 0) {
                cnt[s.charAt(left) - 'a']++;
                left++;
            }
            
            if (right - left + 1 == p.length()) {
                ans.add(left);
            }
        }
        return ans;
    }
}`,
  python: `class Solution:
    def findAnagrams(self, s: str, p: str) -> List[int]:
        cnt = Counter(p)
        ans = []
        left = 0
        
        for right, c in enumerate(s):
            cnt[c] -= 1
            
            while cnt[c] < 0:
                cnt[s[left]] += 1
                left += 1
            
            if right - left + 1 == len(p):
                ans.append(left)
        
        return ans`,
  golang: `func findAnagrams(s string, p string) []int {
    ans := []int{}
    cnt := [26]int{}
    
    for _, c := range p {
        cnt[c-'a']++
    }
    
    left := 0
    for right := 0; right < len(s); right++ {
        cnt[s[right]-'a']--
        
        for cnt[s[right]-'a'] < 0 {
            cnt[s[left]-'a']++
            left++
        }
        
        if right-left+1 == len(p) {
            ans = append(ans, left)
        }
    }
    return ans
}`,
  javascript: `var findAnagrams = function(s, p) {
    const ans = [];
    const cnt = new Map();
    
    for (const c of p) {
        cnt.set(c, (cnt.get(c) || 0) + 1);
    }
    
    let left = 0;
    for (let right = 0; right < s.length; right++) {
        const c = s[right];
        cnt.set(c, (cnt.get(c) || 0) - 1);
        
        while (cnt.get(c) < 0) {
            cnt.set(s[left], cnt.get(s[left]) + 1);
            left++;
        }
        
        if (right - left + 1 === p.length) {
            ans.push(left);
        }
    }
    return ans;
};`
};

// 生成不定长滑窗算法步骤
export function generateVariableWindowSteps(s: string, p: string): AlgorithmStep[] {
  const steps: Omit<AlgorithmStep, 'teaching'>[] = [];
  let stepId = 0;

  // 初始化目标计数
  const targetCount: Record<string, number> = {};
  for (const c of p) {
    targetCount[c] = (targetCount[c] || 0) + 1;
  }

  // 初始化计数器（从目标开始减）
  const cnt: Record<string, number> = { ...targetCount };

  // 初始化步骤
  steps.push({
    id: stepId++,
    description: `初始化：将 p="${p}" 的频次填入 cnt；cnt 表示剩余需求（目标频次 − 窗口频次）`,
    codeLines: { java: [10, 11], python: [3, 4], golang: [7, 8], javascript: [5, 6] },
    variables: { cnt: { ...cnt } },
    windowState: { left: 0, right: -1, windowContent: '' },
    charCount: { ...cnt },
    targetCount: { ...targetCount },
    results: [],
    highlightIndices: [],
    isMatch: false,
    animationType: 'init'
  });

  const results: number[] = [];
  let left = 0;

  // 遍历字符串
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    cnt[c] = (cnt[c] || 0) - 1;

    // 右指针移动，字符进入窗口
    steps.push({
      id: stepId++,
      description: `右指针移动到位置 ${right}，字符 '${c}' 进入窗口，cnt['${c}'] 减 1 变为 ${cnt[c]}`,
      codeLines: { java: [16], python: [37], golang: [57], javascript: [81] },
      variables: { right, c, cnt: { ...cnt }, 'cnt[c]': cnt[c] },
      windowState: { left, right, windowContent: s.slice(left, right + 1) },
      charCount: { ...cnt },
      targetCount: { ...targetCount },
      results: [...results],
      highlightIndices: [right],
      isMatch: false,
      animationType: 'enter'
    });

    // 如果当前字符计数小于0，需要收缩窗口
    while (cnt[c] < 0) {
      const outChar = s[left];
      cnt[outChar] = (cnt[outChar] || 0) + 1;
      const removedIndex = left;
      left++;

      steps.push({
        id: stepId++,
        description: `当前字符 '${c}' 超出目标需求；移出 s[${removedIndex}]='${outChar}' 后 cnt['${c}']=${cnt[c]}，left 推进到 ${left}`,
        codeLines: { java: [18, 19, 20], python: [39, 40, 41], golang: [59, 60, 61], javascript: [83, 84, 85] },
        variables: { left, outChar, c, removedIndex, cnt: { ...cnt }, 'cnt[c]': cnt[c] },
        windowState: { left, right, windowContent: s.slice(left, right + 1) },
        charCount: { ...cnt },
        targetCount: { ...targetCount },
        results: [...results],
        highlightIndices: [removedIndex],
        isMatch: false,
        animationType: 'leave'
      });
    }

    // 检查窗口长度是否等于目标长度
    const windowLength = right - left + 1;
    const isMatch = windowLength === p.length;

    steps.push({
      id: stepId++,
      description: isMatch
        ? `缩窗后每个字符均未超出目标需求（cnt ≥ 0），且窗口长度 ${windowLength} 等于目标长度 ${p.length}，因此频次完全相同；找到异位词，起始索引 ${left}`
        : `缩窗后每个字符均未超出目标需求（cnt ≥ 0）；窗口长度 ${windowLength} ${windowLength < p.length ? '小于' : '大于'} 目标长度 ${p.length}，继续`,
      codeLines: { java: [23, 24], python: [43, 44], golang: [64, 65], javascript: [88, 89] },
      variables: { windowLength, targetLength: p.length, isMatch },
      windowState: { left, right, windowContent: s.slice(left, right + 1) },
      charCount: { ...cnt },
      targetCount: { ...targetCount },
      results: isMatch ? [...results, left] : [...results],
      highlightIndices: Array.from({ length: windowLength }, (_, i) => left + i),
      isMatch,
      animationType: isMatch ? 'match' : 'compare'
    });

    if (isMatch) {
      results.push(left);
    }
  }

  // 最终结果
  steps.push({
    id: stepId++,
    description: `算法结束，找到 ${results.length} 个异位词，起始索引为 [${results.join(', ')}]`,
    codeLines: { java: [27, 28], python: [46], golang: [67, 68], javascript: [91, 92, 93] },
    variables: { ans: results },
    windowState: { left: -1, right: -1, windowContent: '' },
    charCount: {},
    targetCount: { ...targetCount },
    results: [...results],
    highlightIndices: results,
    isMatch: false,
    animationType: 'result'
  });

  return addTeachingSnapshots(steps, s, 'remaining-demand');
}
