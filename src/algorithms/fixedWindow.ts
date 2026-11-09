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
  const steps: Omit<AlgorithmStep, 'teaching'>[] = [];
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
    codeLines: { java: [7, 8], python: [4], golang: [6, 7], javascript: [6, 7] },
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
      codeLines: { java: [11, 12], python: [7, 8], golang: [10, 11], javascript: [10, 11, 12] },
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
        description: `当前窗口只有 ${right + 1} 个字符，未达到 p 的长度 ${p.length}，所以先不比较频次，继续读入下一个字符。`,
        codeLines: { java: [14, 15], python: [10, 11, 12], golang: [13, 14, 15], javascript: [14, 15, 16] },
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
      codeLines: { java: [17, 18], python: [14, 15], golang: [18, 19], javascript: [17, 18] },
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
      codeLines: { java: [21], python: [17, 18, 19, 20], golang: [22], javascript: [21, 22, 23, 24, 25] },
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
    codeLines: { java: [27, 28], python: [51], golang: [74, 75], javascript: [103, 104] },
    variables: { ans: results },
    windowState: { left: -1, right: -1, windowContent: '' },
    charCount: {},
    targetCount: { ...targetCount },
    results: [...results],
    highlightIndices: results,
    isMatch: false,
    animationType: 'result'
  });

  return addTeachingSnapshots(steps, s, 'window-frequency');
}

export function addTeachingSnapshots<T extends Omit<AlgorithmStep, 'teaching'>>(
  steps: T[],
  s: string,
  meaning: 'window-frequency' | 'remaining-demand',
): AlgorithmStep[] {
  let previous = { left: -1, right: -1 };
  let previousCounts: Record<string, number> = {};
  return steps.map((step) => {
    const { left, right } = step.windowState;
    const operation = step.animationType === 'init' ? 'init'
      : step.animationType === 'enter' ? 'enter'
      : step.animationType === 'leave' ? 'shrink'
      : step.animationType === 'match' ? 'match'
      : step.animationType === 'result' ? 'done' : 'compare';
    const index = step.highlightIndices[0];
    // A count delta must describe the character touched by this operation, not an arbitrary map difference.
    const touchedIndex = operation === 'enter' ? step.windowState.right
      : operation === 'shrink' ? (step.variables.removedIndex as number | undefined) ?? index
      : undefined;
    const countChar = touchedIndex === undefined ? undefined : s[touchedIndex];
    const before = countChar ? previousCounts[countChar] || 0 : 0;
    const after = countChar ? step.charCount[countChar] || 0 : 0;
    const triggerChar = typeof step.variables.c === 'string' ? step.variables.c : undefined;
    const stillExcess = meaning === 'remaining-demand' && triggerChar !== undefined
      ? (step.charCount[triggerChar] || 0) < 0 : false;
    const decision = operation === 'compare' || operation === 'match'
      ? { matched: step.isMatch, reason: step.description }
      : operation === 'shrink' && meaning === 'remaining-demand'
        ? { matched: !stillExcess, reason: stillExcess
          ? `移出字符后 cnt['${triggerChar}'] 仍小于 0，${triggerChar} 仍超额，继续收缩`
          : `移出字符后 cnt['${triggerChar}'] 已不小于 0，超额解除，停止收缩` }
        : null;
    const boundsBefore = operation === 'shrink'
      ? { left: (step.variables.removedIndex as number | undefined) ?? left, right }
      : previous;
    const countSummary = countChar ? `${countChar} 的计数 ${before}→${after}` : '';
    const narration = operation === 'enter' && countSummary
      ? `读入 s[${touchedIndex}]='${countChar}'，${countSummary}；当前窗口边界为 [${left}, ${right}]。`
      : operation === 'shrink' && countSummary
        ? `移出 s[${(step.variables.removedIndex as number | undefined) ?? index}]='${countChar}'，${countSummary}；窗口从 [${boundsBefore.left}, ${right}] 移到 [${left}, ${right}]。`
        : operation === 'done'
          ? `扫描完成，找到 ${step.results.length} 个异位词，起始索引为 [${step.results.join(', ')}]。`
          : operation === 'compare' || operation === 'match'
            ? step.description
            : step.description;
    const enriched: AlgorithmStep = { ...step, description: narration, teaching: {
      operation, focus: index === undefined ? null : { char: s[index] ?? '', index },
      countChange: countChar ? { char: countChar, before, after, meaning } : null,
      bounds: { before: boundsBefore, after: { left, right } }, decision, narration,
    } };
    previous = { left, right };
    previousCounts = step.charCount;
    return enriched;
  });
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
