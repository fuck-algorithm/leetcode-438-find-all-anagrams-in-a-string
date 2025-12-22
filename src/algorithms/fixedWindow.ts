import type { AlgorithmStep, AlgorithmCode } from '../types';

// 定长滑窗算法代码
export const fixedWindowCode: AlgorithmCode = {
  java: `class Solution {
    public List<Integer> findAnagrams(String s, String p) {
        List<Integer> ans = new ArrayList<>();
        int[] cntP = new int[26];
        int[] cntS = new int[26];
        
        for (char c : p.toCharArray()) {
            cntP[c - 'a']++;
        }
        
        for (int right = 0; right < s.length(); right++) {
            cntS[s.charAt(right) - 'a']++;
            
            int left = right - p.length() + 1;
            if (left < 0) continue;
            
            if (Arrays.equals(cntS, cntP)) {
                ans.add(left);
            }
            
            cntS[s.charAt(left) - 'a']--;
        }
        return ans;
    }
}`,
  python: `class Solution:
    def findAnagrams(self, s: str, p: str) -> List[int]:
        ans = []
        cnt_p = Counter(p)
        cnt_s = Counter()
        
        for right, c in enumerate(s):
            cnt_s[c] += 1
            
            left = right - len(p) + 1
            if left < 0:
                continue
            
            if cnt_s == cnt_p:
                ans.append(left)
            
            out = s[left]
            cnt_s[out] -= 1
            if cnt_s[out] == 0:
                del cnt_s[out]
        
        return ans`,
  golang: `func findAnagrams(s string, p string) []int {
    ans := []int{}
    cntP := [26]int{}
    cntS := [26]int{}
    
    for _, c := range p {
        cntP[c-'a']++
    }
    
    for right := 0; right < len(s); right++ {
        cntS[s[right]-'a']++
        
        left := right - len(p) + 1
        if left < 0 {
            continue
        }
        
        if cntS == cntP {
            ans = append(ans, left)
        }
        
        cntS[s[left]-'a']--
    }
    return ans
}`,
  javascript: `var findAnagrams = function(s, p) {
    const ans = [];
    const cntP = new Map();
    const cntS = new Map();
    
    for (const c of p) {
        cntP.set(c, (cntP.get(c) || 0) + 1);
    }
    
    for (let right = 0; right < s.length; right++) {
        const c = s[right];
        cntS.set(c, (cntS.get(c) || 0) + 1);
        
        const left = right - p.length + 1;
        if (left < 0) continue;
        
        if (mapsEqual(cntS, cntP)) {
            ans.push(left);
        }
        
        const out = s[left];
        cntS.set(out, cntS.get(out) - 1);
        if (cntS.get(out) === 0) {
            cntS.delete(out);
        }
    }
    return ans;
};`
};

// 生成定长滑窗算法步骤
export function generateFixedWindowSteps(s: string, p: string): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepId = 0;

  // 初始化目标计数
  const targetCount: Record<string, number> = {};
  for (const c of p) {
    targetCount[c] = (targetCount[c] || 0) + 1;
  }

  // 初始化步骤
  steps.push({
    id: stepId++,
    description: `初始化：统计目标字符串 p="${p}" 中每个字符的出现次数`,
    codeLines: { java: [5, 6, 7, 8], python: [2, 3], golang: [3, 4, 5, 6], javascript: [3, 4, 5, 6] },
    variables: { cntP: { ...targetCount }, cntS: {} },
    windowState: { left: -1, right: -1, windowContent: '' },
    charCount: {},
    targetCount: { ...targetCount },
    results: [],
    highlightIndices: [],
    isMatch: false,
    animationType: 'init'
  });

  const charCount: Record<string, number> = {};
  const results: number[] = [];

  // 遍历字符串
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    charCount[c] = (charCount[c] || 0) + 1;

    // 右指针移动，字符进入窗口
    steps.push({
      id: stepId++,
      description: `右指针移动到位置 ${right}，字符 '${c}' 进入窗口`,
      codeLines: { java: [10, 11], python: [5, 6], golang: [8, 9], javascript: [8, 9, 10] },
      variables: { right, c, cntS: { ...charCount } },
      windowState: { 
        left: Math.max(0, right - p.length + 1), 
        right, 
        windowContent: s.slice(Math.max(0, right - p.length + 1), right + 1) 
      },
      charCount: { ...charCount },
      targetCount: { ...targetCount },
      results: [...results],
      highlightIndices: [right],
      isMatch: false,
      animationType: 'enter'
    });

    const left = right - p.length + 1;
    
    if (left < 0) {
      steps.push({
        id: stepId++,
        description: `窗口长度不足 ${p.length}，继续扩展窗口`,
        codeLines: { java: [13, 14], python: [8, 9], golang: [11, 12, 13], javascript: [12, 13] },
        variables: { left, windowLength: right + 1, targetLength: p.length },
        windowState: { left: 0, right, windowContent: s.slice(0, right + 1) },
        charCount: { ...charCount },
        targetCount: { ...targetCount },
        results: [...results],
        highlightIndices: Array.from({ length: right + 1 }, (_, i) => i),
        isMatch: false,
        animationType: 'compare'
      });
      continue;
    }

    // 检查是否匹配
    const isMatch = mapsEqual(charCount, targetCount);
    
    steps.push({
      id: stepId++,
      description: isMatch 
        ? `窗口 [${left}, ${right}] 的字符频率与目标匹配！找到异位词，起始索引 ${left}` 
        : `窗口 [${left}, ${right}] 的字符频率与目标不匹配`,
      codeLines: { java: [16, 17, 18], python: [11, 12], golang: [15, 16, 17], javascript: [15, 16, 17] },
      variables: { left, right, isMatch, windowContent: s.slice(left, right + 1) },
      windowState: { left, right, windowContent: s.slice(left, right + 1) },
      charCount: { ...charCount },
      targetCount: { ...targetCount },
      results: isMatch ? [...results, left] : [...results],
      highlightIndices: Array.from({ length: p.length }, (_, i) => left + i),
      isMatch,
      animationType: isMatch ? 'match' : 'compare'
    });

    if (isMatch) {
      results.push(left);
    }

    // 左端点字符离开窗口
    const out = s[left];
    charCount[out]--;
    if (charCount[out] === 0) {
      delete charCount[out];
    }

    steps.push({
      id: stepId++,
      description: `左指针移动，字符 '${out}' 离开窗口`,
      codeLines: { java: [20, 21], python: [14, 15, 16, 17], golang: [19], javascript: [19, 20, 21, 22] },
      variables: { left, out, cntS: { ...charCount } },
      windowState: { left: left + 1, right, windowContent: s.slice(left + 1, right + 1) },
      charCount: { ...charCount },
      targetCount: { ...targetCount },
      results: [...results],
      highlightIndices: [left],
      isMatch: false,
      animationType: 'leave'
    });
  }

  // 最终结果
  steps.push({
    id: stepId++,
    description: `算法结束，找到 ${results.length} 个异位词，起始索引为 [${results.join(', ')}]`,
    codeLines: { java: [23], python: [19], golang: [21], javascript: [24] },
    variables: { ans: results },
    windowState: { left: -1, right: -1, windowContent: '' },
    charCount: {},
    targetCount: { ...targetCount },
    results: [...results],
    highlightIndices: results,
    isMatch: false,
    animationType: 'result'
  });

  return steps;
}

function mapsEqual(a: Record<string, number>, b: Record<string, number>): boolean {
  const keysA = Object.keys(a).filter(k => a[k] > 0);
  const keysB = Object.keys(b).filter(k => b[k] > 0);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
