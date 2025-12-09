import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Step {
  windowStart: number;
  windowEnd: number;
  description: string;
  detailedExplanation: string;
  sFreq: Record<string, number>;
  pFreq: Record<string, number>;
  result: number[];
  isMatch: boolean;
  action: string;
  leftChar?: string;
  rightChar?: string;
  variables: { i: number; leftPointer: number; rightPointer: number };
  animationType: 'init' | 'remove' | 'add' | 'compare' | 'match' | 'complete';
  executedCode: string[];  // 动态生成的代码
}

// 工具提示组件
const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: '5px' }}>
      <span 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          display: 'inline-block',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'rgba(255, 193, 7, 0.3)',
          border: '2px solid #ffc107',
          color: '#ffc107',
          fontSize: '11px',
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: '12px',
          cursor: 'help'
        }}
      >
        ?
      </span>
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '5px',
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#fff',
          fontSize: '12px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(0, 0, 0, 0.9)'
          }}/>
        </div>
      )}
    </span>
  );
};

// 进度条组件
const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const percentage = (current / total) * 100;
  return (
    <div style={{
      width: '100%',
      height: '18px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '10px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)',
        transition: 'width 0.3s ease',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {percentage > 10 ? `${percentage.toFixed(0)}%` : ''}
      </div>
    </div>
  );
};

// 算法执行器（动态代码生成版）
class AnagramFinder {
  private s: string;
  private p: string;
  private steps: Step[];
  
  constructor(s: string, p: string) {
    this.s = s;
    this.p = p;
    this.steps = [];
    this.generateSteps();
  }
  
  private generateSteps() {
    const sLen = this.s.length;
    const pLen = this.p.length;
    
    if (sLen < pLen) {
      this.steps.push({
        windowStart: -1,
        windowEnd: -1,
        description: '❌ 长度不足',
        detailedExplanation: `s长度(${sLen}) < p长度(${pLen})`,
        sFreq: {},
        pFreq: this.getFreq(this.p),
        result: [],
        isMatch: false,
        action: '检查',
        variables: { i: 0, leftPointer: 0, rightPointer: 0 },
        animationType: 'init',
        executedCode: [
          'function findAnagrams(s, p) {',
          `  if (s.length < p.length) return [];`,
          '}'
        ]
      });
      return;
    }
    
    const pFreq = this.getFreq(this.p);
    const result: number[] = [];
    
    // 初始化
    this.steps.push({
      windowStart: -1,
      windowEnd: -1,
      description: '🎯 统计模式p频率',
      detailedExplanation: `p="${this.p}" → ${JSON.stringify(pFreq)}`,
      sFreq: {},
      pFreq: { ...pFreq },
      result: [],
      isMatch: false,
      action: '初始化',
      variables: { i: 0, leftPointer: 0, rightPointer: pLen - 1 },
      animationType: 'init',
      executedCode: [
        'const pFreq = {};',
        `for (let char of "${this.p}") {`,
        '  pFreq[char] = (pFreq[char] || 0) + 1;',
        '}',
        `// pFreq = ${JSON.stringify(pFreq)}`
      ]
    });
    
    // 第一个窗口
    let sFreq = this.getFreq(this.s.substring(0, pLen));
    this.steps.push({
      windowStart: 0,
      windowEnd: pLen - 1,
      description: `🪟 初始窗口[0,${pLen-1}]`,
      detailedExplanation: `窗口="${this.s.substring(0, pLen)}" → ${JSON.stringify(sFreq)}`,
      sFreq: { ...sFreq },
      pFreq: { ...pFreq },
      result: [],
      isMatch: false,
      action: '建窗口',
      variables: { i: 0, leftPointer: 0, rightPointer: pLen - 1 },
      animationType: 'init',
      executedCode: [
        'let sFreq = {};',
        `for (let i = 0; i < ${pLen}; i++) {`,
        `  const char = s[i]; // "${this.s.substring(0, pLen)}"`,
        '  sFreq[char] = (sFreq[char] || 0) + 1;',
        '}'
      ]
    });
    
    // 检查第一个窗口
    const firstMatch = this.isAnagram(sFreq, pFreq);
    if (firstMatch) result.push(0);
    
    this.steps.push({
      windowStart: 0,
      windowEnd: pLen - 1,
      description: `🔍 检查初始窗口`,
      detailedExplanation: firstMatch ? '✅ 匹配！' : '❌ 不匹配',
      sFreq: { ...sFreq },
      pFreq: { ...pFreq },
      result: [...result],
      isMatch: firstMatch,
      action: '比较',
      variables: { i: 0, leftPointer: 0, rightPointer: pLen - 1 },
      animationType: 'compare',
      executedCode: [
        'if (isEqual(sFreq, pFreq)) {',
        firstMatch ? '  result.push(0); // 匹配!' : '  // 不匹配',
        '}'
      ]
    });
    
    // 滑动窗口
    for (let i = pLen; i < sLen; i++) {
      const leftChar = this.s[i - pLen];
      const rightChar = this.s[i];
      const leftPointer = i - pLen + 1;
      const rightPointer = i;
      
      // 移除
      const oldLeft = sFreq[leftChar];
      sFreq[leftChar]--;
      if (sFreq[leftChar] === 0) delete sFreq[leftChar];
      
      this.steps.push({
        windowStart: i - pLen,      // 使用旧窗口的起始位置
        windowEnd: i - 1,            // 使用旧窗口的结束位置
        description: `⬅️ 移除'${leftChar}'`,
        detailedExplanation: `'${leftChar}'频率: ${oldLeft}→${sFreq[leftChar] || 0}`,
        sFreq: { ...sFreq },
        pFreq: { ...pFreq },
        result: [...result],
        isMatch: false,
        action: '移除',
        leftChar,
        variables: { i, leftPointer, rightPointer },
        animationType: 'remove',
        executedCode: [
          `const left = s[${i - pLen}]; // '${leftChar}'`,
          `sFreq[left]--; // ${oldLeft} -> ${sFreq[leftChar] || 0}`,
          sFreq[leftChar] === undefined ? 'delete sFreq[left];' : ''
        ].filter(Boolean)
      });
      
      // 添加
      const oldRight = sFreq[rightChar] || 0;
      sFreq[rightChar] = (sFreq[rightChar] || 0) + 1;
      
      this.steps.push({
        windowStart: leftPointer,
        windowEnd: rightPointer,
        description: `➡️ 添加'${rightChar}'`,
        detailedExplanation: `'${rightChar}'频率: ${oldRight}→${sFreq[rightChar]}`,
        sFreq: { ...sFreq },
        pFreq: { ...pFreq },
        result: [...result],
        isMatch: false,
        action: '添加',
        rightChar,
        variables: { i, leftPointer, rightPointer },
        animationType: 'add',
        executedCode: [
          `const right = s[${i}]; // '${rightChar}'`,
          `sFreq[right]++; // ${oldRight} -> ${sFreq[rightChar]}`,
          `// 窗口: "${this.s.substring(leftPointer, rightPointer + 1)}"`
        ]
      });
      
      // 比较
      const isMatch = this.isAnagram(sFreq, pFreq);
      if (isMatch) result.push(leftPointer);
      
      this.steps.push({
        windowStart: leftPointer,
        windowEnd: rightPointer,
        description: `🔍 比较[${leftPointer},${rightPointer}]`,
        detailedExplanation: isMatch ? `✅ 匹配！索引${leftPointer}` : '❌ 不匹配',
        sFreq: { ...sFreq },
        pFreq: { ...pFreq },
        result: [...result],
        isMatch,
        action: '比较',
        variables: { i, leftPointer, rightPointer },
        animationType: 'compare',
        executedCode: [
          'if (isEqual(sFreq, pFreq)) {',
          isMatch ? `  result.push(${leftPointer}); // 匹配!` : '  // 不匹配',
          '}'
        ]
      });
    }
    
    // 完成
    this.steps.push({
      windowStart: -1,
      windowEnd: -1,
      description: `🎉 完成`,
      detailedExplanation: `找到${result.length}个: [${result.join(', ')}]`,
      sFreq,
      pFreq,
      result,
      isMatch: false,
      action: '完成',
      variables: { i: sLen, leftPointer: 0, rightPointer: 0 },
      animationType: 'complete',
      executedCode: [
        `return result; // [${result.join(', ')}]`,
        `// 共找到 ${result.length} 个异位词`
      ]
    });
  }
  
  private getFreq(str: string): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  }
  
  private isAnagram(freq1: Record<string, number>, freq2: Record<string, number>): boolean {
    const keys1 = Object.keys(freq1).sort();
    const keys2 = Object.keys(freq2).sort();
    if (keys1.length !== keys2.length) return false;
    for (let i = 0; i < keys1.length; i++) {
      if (keys1[i] !== keys2[i] || freq1[keys1[i]] !== freq2[keys2[i]]) return false;
    }
    return true;
  }
  
  getSteps(): Step[] {
    return this.steps;
  }
}

const App: React.FC = () => {
  const [s, setS] = useState('cbaebabacd');
  const [p, setP] = useState('abc');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [steps, setSteps] = useState<Step[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLegend, setShowLegend] = useState(true); // 默认显示图例
  const [showStats, setShowStats] = useState(true);
  const [showIntervalHistory, setShowIntervalHistory] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true); // 首次访问欢迎提示
  const [highlightWindow, setHighlightWindow] = useState(false); // 高亮窗口提示
  const svgRef = useRef<SVGSVGElement>(null);
  const intervalHistoryRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    const finder = new AnagramFinder(s, p);
    setSteps(finder.getSteps());
    setCurrentStep(0);
    setIsPlaying(false);
  }, [s, p]);
  
  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500 / speed);
      return () => clearTimeout(timer);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep, steps.length, speed]);
  
  // 首次访问3秒后自动隐藏欢迎提示
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  // 窗口高亮提示动画
  useEffect(() => {
    if (currentStep > 0 && currentStep < 3) {
      setHighlightWindow(true);
      const timer = setTimeout(() => setHighlightWindow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);
  
  // D3可视化
  useEffect(() => {
    if (!svgRef.current || steps.length === 0) return;
    
    const step = steps[currentStep];
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const width = 1000;
    const height = 260;
    const charWidth = Math.min(50, width / (s.length + 2));
    const charHeight = 55;
    
    // 字符串s
    const sGroup = svg.append('g').attr('transform', 'translate(30, 40)');
    sGroup.append('text').attr('x', -10).attr('y', -10).attr('fill', '#fff').attr('font-size', '14px').text('字符串 s:');
    
    s.split('').forEach((char, i) => {
      const x = i * charWidth;
      const isInWindow = i >= step.windowStart && i <= step.windowEnd;
      const isMatchStart = step.result.some(r => r === i);
      const isRemoving = step.leftChar && i === step.windowStart - 1;
      const isAdding = step.rightChar && i === step.windowEnd;
      
      let fillColor = '#475569'; // 深灰色
      if (isMatchStart) fillColor = '#10b981'; // 绿色（匹配起点）
      else if (isInWindow && step.isMatch) fillColor = '#34d399'; // 浅绿（匹配窗口）
      else if (isInWindow) fillColor = '#60a5fa'; // 蓝色（当前窗口）
      
      let strokeWidth = 2;
      let strokeColor = '#fff';
      if (isRemoving) { strokeColor = '#f44336'; strokeWidth = 4; }
      if (isAdding) { strokeColor = '#4caf50'; strokeWidth = 4; }
      
      sGroup.append('rect')
        .attr('x', x).attr('y', 0)
        .attr('width', charWidth - 4).attr('height', charHeight)
        .attr('fill', fillColor).attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth).attr('rx', 6);
      
      sGroup.append('text')
        .attr('x', x + (charWidth - 4) / 2).attr('y', charHeight / 2 + 6)
        .attr('text-anchor', 'middle').attr('fill', '#fff')
        .attr('font-size', '20px').attr('font-weight', 'bold').text(char);
      
      sGroup.append('text')
        .attr('x', x + (charWidth - 4) / 2).attr('y', charHeight + 18)
        .attr('text-anchor', 'middle').attr('fill', '#90a4ae')
        .attr('font-size', '11px').text(i);
      
      if (isMatchStart) {
        sGroup.append('text').attr('x', x + (charWidth - 4) / 2).attr('y', -5)
          .attr('text-anchor', 'middle').attr('fill', '#4caf50')
          .attr('font-size', '18px').text('✓');
      }
      if (isRemoving) {
        sGroup.append('text').attr('x', x + (charWidth - 4) / 2).attr('y', -5)
          .attr('text-anchor', 'middle').attr('fill', '#f44336')
          .attr('font-size', '20px').text('⬅');
      }
      if (isAdding) {
        sGroup.append('text').attr('x', x + (charWidth - 4) / 2).attr('y', -5)
          .attr('text-anchor', 'middle').attr('fill', '#4caf50')
          .attr('font-size', '20px').text('➡');
      }
    });
    
    // 🪟 滑动窗口框（最关键的可视化！）
    if (step.windowStart >= 0 && step.windowEnd >= 0) {
      const windowX = step.windowStart * charWidth;
      const windowWidth = (step.windowEnd - step.windowStart + 1) * charWidth - 4;
      const windowY = -35;
      const windowHeight = charHeight + 60;
      
      // 绘制一个明显的窗口框架
      const windowGroup = sGroup.append('g');
      
      // 窗口内部半透明填充（让窗口更明显）
      windowGroup.append('rect')
        .attr('x', windowX - 6)
        .attr('y', windowY)
        .attr('width', windowWidth + 12)
        .attr('height', windowHeight)
        .attr('fill', step.isMatch ? 'rgba(16, 185, 129, 0.1)' : 'rgba(96, 165, 250, 0.1)')
        .attr('rx', 10);
      
      // 窗口外框（粗边框，带阴影）
      windowGroup.append('rect')
        .attr('x', windowX - 6)
        .attr('y', windowY)
        .attr('width', windowWidth + 12)
        .attr('height', windowHeight)
        .attr('fill', 'none')
        .attr('stroke', step.isMatch ? '#10b981' : '#60a5fa')
        .attr('stroke-width', 6)
        .attr('rx', 10)
        .style('filter', 'drop-shadow(0 0 15px ' + (step.isMatch ? '#10b981' : '#60a5fa') + ')')
        .style('animation', 'pulse 2s ease-in-out infinite'); // 持续脉冲提示
      
      // 窗口顶部超大标签
      const labelBg = windowGroup.append('rect')
        .attr('x', windowX + windowWidth / 2 - 70)
        .attr('y', windowY - 25)
        .attr('width', 140)
        .attr('height', 30)
        .attr('fill', step.isMatch ? '#10b981' : '#60a5fa')
        .attr('rx', 15)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))');
      
      const labelText = windowGroup.append('text')
        .attr('x', windowX + windowWidth / 2)
        .attr('y', windowY - 25 + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text('← 这是窗口 →');
      
      // 窗口说明文字（下方）
      windowGroup.append('text')
        .attr('x', windowX + windowWidth / 2)
        .attr('y', windowY + windowHeight + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '13px')
        .attr('font-weight', 'bold')
        .text(`包含 ${step.windowEnd - step.windowStart + 1} 个字符`);
      
      // 左右边界标识线
      // 左边界
      windowGroup.append('line')
        .attr('x1', windowX)
        .attr('y1', windowY - 5)
        .attr('x2', windowX)
        .attr('y2', windowY + windowHeight + 5)
        .attr('stroke', '#f44336')
        .attr('stroke-width', 3);
      
      windowGroup.append('circle')
        .attr('cx', windowX)
        .attr('cy', windowY + windowHeight / 2)
        .attr('r', 6)
        .attr('fill', '#f44336')
        .style('filter', 'drop-shadow(0 0 5px #f44336)');
      
      // 右边界
      windowGroup.append('line')
        .attr('x1', windowX + windowWidth + 6)
        .attr('y1', windowY - 5)
        .attr('x2', windowX + windowWidth + 6)
        .attr('y2', windowY + windowHeight + 5)
        .attr('stroke', '#4caf50')
        .attr('stroke-width', 3);
      
      windowGroup.append('circle')
        .attr('cx', windowX + windowWidth + 6)
        .attr('cy', windowY + windowHeight / 2)
        .attr('r', 6)
        .attr('fill', '#4caf50')
        .style('filter', 'drop-shadow(0 0 5px #4caf50)');
      
      // 滑动方向大箭头（显示窗口往哪边移动）
      if (step.animationType === 'remove' || step.animationType === 'add') {
        // 在窗口右侧显示大箭头，表示向右滑动
        const arrowX = windowX + windowWidth + 30;
        const arrowY = windowY + windowHeight / 2;
        
        // 大箭头背景
        windowGroup.append('circle')
          .attr('cx', arrowX)
          .attr('cy', arrowY)
          .attr('r', 20)
          .attr('fill', 'rgba(96, 165, 250, 0.3)')
          .attr('stroke', '#60a5fa')
          .attr('stroke-width', 2)
          .style('animation', 'pulse 1s ease-in-out infinite');
        
        // 箭头符号
        windowGroup.append('text')
          .attr('x', arrowX)
          .attr('y', arrowY + 8)
          .attr('text-anchor', 'middle')
          .attr('fill', '#60a5fa')
          .attr('font-size', '28px')
          .attr('font-weight', 'bold')
          .text('→')
          .style('animation', 'slideInFromRight 1s ease-in-out infinite');
        
        // 提示文字
        windowGroup.append('text')
          .attr('x', arrowX)
          .attr('y', arrowY + 40)
          .attr('text-anchor', 'middle')
          .attr('fill', '#60a5fa')
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .text('向右滑');
      }
    }
    
    // 指针
    if (step.windowStart >= 0 && step.windowEnd >= 0) {
      const leftX = step.windowStart * charWidth + (charWidth - 4) / 2;
      const rightX = step.windowEnd * charWidth + (charWidth - 4) / 2;
      
      sGroup.append('line')
        .attr('x1', leftX).attr('y1', charHeight + 35)
        .attr('x2', rightX).attr('y2', charHeight + 35)
        .attr('stroke', '#ffc107').attr('stroke-width', 3).attr('stroke-dasharray', '5,5');
      
      sGroup.append('polygon')
        .attr('points', `${leftX-5},${charHeight+45} ${leftX+5},${charHeight+45} ${leftX},${charHeight+35}`)
        .attr('fill', '#f44336');
      
      sGroup.append('text').attr('x', leftX).attr('y', charHeight + 63)
        .attr('text-anchor', 'middle').attr('fill', '#f44336')
        .attr('font-size', '14px').attr('font-weight', 'bold').text('左边界');
      
      sGroup.append('polygon')
        .attr('points', `${rightX-5},${charHeight+45} ${rightX+5},${charHeight+45} ${rightX},${charHeight+35}`)
        .attr('fill', '#4caf50');
      
      sGroup.append('text').attr('x', rightX).attr('y', charHeight + 63)
        .attr('text-anchor', 'middle').attr('fill', '#4caf50')
        .attr('font-size', '14px').attr('font-weight', 'bold').text('右边界');
    }
    
    // 模式p
    const pGroup = svg.append('g').attr('transform', 'translate(30, 160)');
    pGroup.append('text').attr('x', -10).attr('y', -10).attr('fill', '#fff').attr('font-size', '14px').text('模式 p:');
    
    p.split('').forEach((char, i) => {
      const x = i * charWidth;
      pGroup.append('rect')
        .attr('x', x).attr('y', 0)
        .attr('width', charWidth - 4).attr('height', charHeight)
        .attr('fill', '#64748b').attr('stroke', '#fff')
        .attr('stroke-width', 2).attr('rx', 6);
      
      pGroup.append('text')
        .attr('x', x + (charWidth - 4) / 2).attr('y', charHeight / 2 + 6)
        .attr('text-anchor', 'middle').attr('fill', '#fff')
        .attr('font-size', '20px').attr('font-weight', 'bold').text(char);
    });
    
  }, [currentStep, steps, s, p]);
  
  // 区间历史可视化（像参考网站那样）
  useEffect(() => {
    if (!intervalHistoryRef.current || steps.length === 0) return;
    
    const svg = d3.select(intervalHistoryRef.current);
    svg.selectAll('*').remove();
    
    const width = 1000;
    const height = 150;
    const barHeight = 30;
    const step = steps[currentStep];
    
    // 收集所有历史窗口（到当前步骤为止）
    const historyWindows: Array<{start: number; end: number; isMatch: boolean; stepIndex: number}> = [];
    for (let i = 0; i <= currentStep; i++) {
      const s = steps[i];
      if (s.windowStart >= 0 && s.windowEnd >= 0) {
        // 只在比较步骤记录
        if (s.animationType === 'compare') {
          historyWindows.push({
            start: s.windowStart,
            end: s.windowEnd,
            isMatch: s.isMatch,
            stepIndex: i
          });
        }
      }
    }
    
    const scaleX = d3.scaleLinear()
      .domain([0, s.length - 1])
      .range([50, width - 50]);
    
    // 标题
    svg.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', '#90caf9')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('📊 窗口滑动历史（蓝色区间）');
    
    // 绘制时间轴
    svg.append('line')
      .attr('x1', scaleX(0))
      .attr('y1', 35)
      .attr('x2', scaleX(s.length - 1))
      .attr('y2', 35)
      .attr('stroke', '#455a64')
      .attr('stroke-width', 2);
    
    // 绘制刻度
    for (let i = 0; i < s.length; i++) {
      svg.append('line')
        .attr('x1', scaleX(i))
        .attr('y1', 30)
        .attr('x2', scaleX(i))
        .attr('y2', 40)
        .attr('stroke', '#455a64')
        .attr('stroke-width', 1);
      
      svg.append('text')
        .attr('x', scaleX(i))
        .attr('y', 50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#90a4ae')
        .attr('font-size', '10px')
        .text(i);
    }
    
    // 绘制历史窗口条
    historyWindows.forEach((win, idx) => {
      const y = 60 + (idx % 3) * (barHeight + 5);
      const isCurrent = idx === historyWindows.length - 1;
      
      // 窗口条
      const bar = svg.append('rect')
        .attr('x', scaleX(win.start))
        .attr('y', y)
        .attr('width', scaleX(win.end) - scaleX(win.start))
        .attr('height', barHeight)
        .attr('fill', win.isMatch ? '#10b981' : '#60a5fa')
        .attr('stroke', isCurrent ? '#f59e0b' : '#fff')
        .attr('stroke-width', isCurrent ? 4 : 2)
        .attr('rx', 8)
        .attr('opacity', isCurrent ? 1 : 0.6);
      
      if (isCurrent) {
        bar.style('animation', 'pulse 1s ease-in-out infinite');
      }
      
      // 区间文本
      svg.append('text')
        .attr('x', (scaleX(win.start) + scaleX(win.end)) / 2)
        .attr('y', y + barHeight / 2 + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`[${win.start}, ${win.end}]`);
      
      // 匹配标记
      if (win.isMatch) {
        svg.append('text')
          .attr('x', scaleX(win.end) + 15)
          .attr('y', y + barHeight / 2 + 5)
          .attr('fill', '#4caf50')
          .attr('font-size', '16px')
          .text('✓');
      }
    });
    
  }, [currentStep, steps, s, p, showIntervalHistory]);
  
  const currentStepData = steps[currentStep];
  const stats = currentStepData ? {
    totalSteps: steps.length,
    currentStep: currentStep + 1,
    matchesFound: currentStepData.result.length,
    windowSize: p.length
  } : null;
  
  return (
    <div style={{
      minHeight: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      padding: '8px',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 5px currentColor); }
          50% { filter: drop-shadow(0 0 15px currentColor); }
        }
      `}</style>
      
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        height: 'calc(100vh - 16px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 标题栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => setShowLegend(!showLegend)} 
              style={{
                padding: '6px 10px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: showLegend ? 'rgba(96, 165, 250, 0.8)' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s'
              }}
              title="显示/隐藏颜色图例"
            >
              🎨
            </button>
            <button 
              onClick={() => setShowStats(!showStats)} 
              style={{
                padding: '6px 10px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: showStats ? 'rgba(96, 165, 250, 0.8)' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s'
              }}
              title="显示/隐藏统计信息"
            >
              📊
            </button>
            <button 
              onClick={() => setShowIntervalHistory(!showIntervalHistory)} 
              style={{
                padding: '6px 10px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: showIntervalHistory ? 'rgba(96, 165, 250, 0.8)' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
                opacity: 0.6
              }}
              title="高级：显示窗口滑动轨迹图（可选）"
            >
              📈
            </button>
          </div>
          
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{
              margin: 0,
              marginBottom: '3px',
              fontSize: '22px',
              fontWeight: 'bold'
            }}>
              <a 
                href="https://leetcode.cn/problems/find-all-anagrams-in-a-string/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                🔍 LeetCode 438 - 找到字符串中所有字母异位词
              </a>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
              <p style={{ margin: 0, color: '#90caf9', fontSize: '11px' }}>
                ⚡ 滑动窗口 | ⏱️ O(n) | 💾 O(1)
              </p>
              <a 
                href="https://leetcode.cn/problems/find-all-anagrams-in-a-string/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  background: 'rgba(96, 165, 250, 0.7)',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="点击跳转到LeetCode原题"
              >
                🔗 原题链接
              </a>
            </div>
          </div>
          
          <button 
            onClick={() => setShowTutorial(!showTutorial)} 
            style={{
              padding: '6px 10px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #ffc107 0%, #ffa000 100%)'
            }}
            title="显示/隐藏教程"
          >
            {showTutorial ? '📖' : '📕'}
          </button>
        </div>
        
        {/* 统计面板 */}
        {showStats && stats && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '8px',
            borderRadius: '8px',
            marginBottom: '5px',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '18px' }}>📈</div>
                <div>
                  <div style={{ fontSize: '10px', color: '#90caf9' }}>进度</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffc107' }}>
                    {stats.currentStep}/{stats.totalSteps}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '18px' }}>✅</div>
                <div>
                  <div style={{ fontSize: '10px', color: '#90caf9' }}>已找到</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffc107' }}>
                    {stats.matchesFound} 个
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '18px' }}>🪟</div>
                <div>
                  <div style={{ fontSize: '10px', color: '#90caf9' }}>窗口</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffc107' }}>
                    {stats.windowSize}
                  </div>
                </div>
              </div>
              
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ marginBottom: '4px', fontSize: '10px', color: '#90caf9' }}>
                  总体进度 <Tooltip text="当前步骤占总步骤的百分比" />
                </div>
                <ProgressBar current={currentStep + 1} total={steps.length} />
              </div>
            </div>
          </div>
        )}
        
        {/* 颜色图例 */}
        {showLegend && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '8px',
            borderRadius: '8px',
            marginBottom: '5px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { color: '#455a64', text: '普通字符（还没检查到）' },
                { color: '#60a5fa', text: '🪟 当前窗口范围' },
                { color: '#10b981', text: '✅ 找到匹配！' },
                { color: '#f44336', border: true, text: '⬅️ 正在移除的字母' },
                { color: '#4caf50', border: true, text: '➡️ 正在添加的字母' },
                { color: '#64748b', text: '🎯 目标模式p' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    background: item.color,
                    border: item.border ? '3px solid ' + item.color : '2px solid #fff'
                  }}></div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 首次访问欢迎提示 */}
        {showWelcome && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '30px',
            borderRadius: '20px',
            border: '3px solid #60a5fa',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            maxWidth: '600px',
            animation: 'fadeIn 0.5s ease-in-out'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>👋</div>
              <h2 style={{ 
                margin: '0 0 15px 0', 
                color: '#60a5fa',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                欢迎来到滑动窗口算法可视化！
              </h2>
            </div>
            
            <div style={{
              fontSize: '15px',
              lineHeight: '1.8',
              color: '#e2e8f0',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 15px 0' }}>
                <strong style={{ color: '#ffc107' }}>🎯 这个工具可以帮你：</strong>
              </p>
              <ul style={{ paddingLeft: '20px', margin: '0 0 15px 0' }}>
                <li style={{ marginBottom: '8px' }}>👀 <strong>看懂</strong>滑动窗口是如何工作的</li>
                <li style={{ marginBottom: '8px' }}>🎬 <strong>动画演示</strong>每一步的详细过程</li>
                <li style={{ marginBottom: '8px' }}>🧠 <strong>理解</strong>为什么这个算法这么快</li>
              </ul>
              
              <div style={{
                background: 'rgba(96, 165, 250, 0.2)',
                padding: '15px',
                borderRadius: '10px',
                borderLeft: '4px solid #60a5fa',
                marginTop: '15px'
              }}>
                <strong style={{ color: '#60a5fa' }}>💡 新手提示：</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                  看到蓝色的<strong style={{ color: '#60a5fa' }}>框框</strong>了吗？那就是"窗口"！
                  它会在字符串上<strong>来回滑动</strong>，就像用放大镜找东西一样 🔍
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowWelcome(false);
                  setShowTutorial(true);
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
              >
                📚 查看新手教程
              </button>
              <button
                onClick={() => setShowWelcome(false)}
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '2px solid #60a5fa',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🚀 直接开始
              </button>
            </div>
            
            <div style={{
              textAlign: 'center',
              marginTop: '15px',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              💡 提示：这个消息5秒后会自动消失
            </div>
          </div>
        )}
        
        {/* 半透明遮罩 */}
        {showWelcome && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9998
          }} onClick={() => setShowWelcome(false)} />
        )}
        
        {/* 教程 */}
        {showTutorial && (
          <div style={{
            background: 'rgba(51, 65, 85, 0.6)',
            border: '2px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '5px',
            fontSize: '12px',
            lineHeight: '1.6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, color: '#60a5fa', fontSize: '14px', fontWeight: 'bold' }}>💡 算法原理 - 新手教程</h3>
              <button
                onClick={() => setShowTutorial(false)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                ✕ 隐藏
              </button>
            </div>
            
            <div style={{ marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <strong style={{ color: '#4fc3f7', fontSize: '13px' }}>📋 我们要解决什么问题？</strong>
              <p style={{ margin: '4px 0 0 0', color: '#fff' }}>
                <strong style={{ color: '#ffc107', fontSize: '15px' }}>用人话说：</strong><br/>
                有一个<strong style={{ color: '#60a5fa' }}>长字符串s</strong>和一个<strong style={{ color: '#4caf50' }}>短字符串p</strong>，
                我们要在长字符串里<strong>找出所有</strong>和短字符串<strong style={{ color: '#ffc107' }}>字母一样但顺序可能不同</strong>的部分。
              </p>
              <div style={{ 
                margin: '10px 0 0 0', 
                padding: '10px',
                background: 'rgba(96, 165, 250, 0.15)',
                borderRadius: '6px',
                borderLeft: '3px solid #60a5fa'
              }}>
                <strong style={{ color: '#60a5fa' }}>🌰 举个例子：</strong>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', lineHeight: '1.6' }}>
                  s = "<strong style={{ color: '#f44336' }}>cba</strong>ebabacd"，p = "abc"<br/>
                  "<strong style={{ color: '#f44336' }}>cba</strong>" 和 "abc" 字母完全一样（都是a、b、c各1个），只是顺序不同 ✓<br/>
                  所以位置<strong style={{ color: '#4caf50' }}>0</strong>就是答案之一！
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <strong style={{ color: '#4fc3f7', fontSize: '13px' }}>🔄 什么叫"字母一样但顺序不同"？</strong>
              <p style={{ margin: '8px 0', color: '#fff', fontSize: '14px' }}>
                就像玩<strong style={{ color: '#ffc107' }}>字母重组游戏</strong>！🎲
              </p>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%)',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #4caf50',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '20px', textAlign: 'center', marginBottom: '8px' }}>✅ 这些都算</div>
                <div style={{ color: '#fff', fontSize: '13px', lineHeight: '1.8' }}>
                  • "<strong>abc</strong>" → "<strong>bca</strong>" → "<strong>cab</strong>" （就像洗牌🃏，都有a、b、c各1张）<br/>
                  • "<strong>aab</strong>" → "<strong>aba</strong>" → "<strong>baa</strong>" （都有2张a、1张b）
                </div>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.1) 100%)',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #f44336'
              }}>
                <div style={{ fontSize: '20px', textAlign: 'center', marginBottom: '8px' }}>❌ 这些不算</div>
                <div style={{ color: '#fff', fontSize: '13px', lineHeight: '1.8' }}>
                  • "abc" 和 "<strong style={{ color: '#f44336' }}>abd</strong>" （牌不一样，一个是c一个是d）<br/>
                  • "abc" 和 "<strong style={{ color: '#f44336' }}>abcc</strong>" （牌的数量不对，多了一张c）
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <strong style={{ color: '#4fc3f7', fontSize: '13px' }}>🎯 怎么找？超简单3步！</strong>
              <p style={{ margin: '6px 0', color: '#90caf9', fontSize: '12px' }}>
                就像用<strong style={{ color: '#ffc107' }}>一个透明框框</strong>在字符串上滑来滑去 🔍
              </p>
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ 
                    background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)', 
                    color: '#fff', 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    minWidth: '60px', 
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.4)'
                  }}>👉 第1步</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#ffc107', fontSize: '14px' }}>🔲 准备一个透明框框</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6' }}>
                      框框的大小 = 短字符串p的长度。比如p是"abc"(3个字母)，框框就能装<strong style={{ color: '#4caf50' }}>3个字母</strong>。
                      <br/>🎉 就像一个能看3个字母的放大镜！
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ 
                    background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', 
                    color: '#fff', 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    minWidth: '60px', 
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.4)'
                  }}>👉 第2步</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#ffc107', fontSize: '14px' }}>📊 数一数每个字母有1张</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6' }}>
                      把每个字母当成<strong style={{ color: '#60a5fa' }}>扑克牌🃏</strong>，数一数每种牌有1张。
                      <br/>比如"abc" → <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '3px' }}>a有1张, b有1张, c有1张</code>
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ 
                    background: 'linear-gradient(135deg, #ff9800 0%, #ffa726 100%)', 
                    color: '#fff', 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    minWidth: '60px', 
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.4)'
                  }}>👉 第3步</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#ffc107', fontSize: '14px' }}>🚗 开始滑动！</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6' }}>
                      框框像<strong style={{ color: '#60a5fa' }}>小火车🚂</strong>一样向右移动：
                      <br/>• <span style={{ color: '#f44336', fontWeight: 'bold' }}>⬅️ 左边踢出1个字母</span>
                      <br/>• <span style={{ color: '#4caf50', fontWeight: 'bold' }}>➡️ 右边拉进1个新字母</span>
                      <br/>• <span style={{ color: '#ffc107', fontWeight: 'bold' }}>🔍 看看框里的牌和目标是否一样</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ 
              padding: '12px', 
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.25) 0%, rgba(56, 142, 60, 0.15) 100%)',
              borderRadius: '10px', 
              border: '2px solid #4caf50',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
            }}>
              <strong style={{ color: '#4caf50', fontSize: '15px' }}>🚀 为什么这个方法这么快？</strong>
              <div style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#fff', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                  ⏱️ <strong style={{ color: '#ffc107' }}>超级快！</strong>
                  <br/>每个字母<strong>只看一遍</strong>，不用重复检查。就像坐火车🚂，一直往前走，不走回头路！
                </div>
                <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                  💾 <strong style={{ color: '#ffc107' }}>几乎不占空间！</strong>
                  <br/>只需记录26个字母的数量，就算字符串有100万个字符也一样！
                </div>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '12px', 
              padding: '12px 16px', 
              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.25) 0%, rgba(33, 150, 243, 0.1) 100%)',
              borderRadius: '10px', 
              fontSize: '13px', 
              color: '#fff', 
              textAlign: 'center',
              border: '2px solid #2196f3',
              fontWeight: 'bold'
            }}>
              🎬 接下来，点击下面的 <span style={{ color: '#4caf50', fontSize: '15px' }}>"▶ 播放"</span> 按钮，看完整动画演示！🎉
            </div>
          </div>
        )}
        
        {/* 输入区 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          padding: '8px',
          borderRadius: '8px',
          marginBottom: '5px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <div style={{ flex: '2', minWidth: '200px' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#90caf9' }}>
                📝 长字符串 s <span style={{ fontSize: '10px', color: '#90a4ae', marginLeft: '4px' }}>(在这里找)</span>
              </label>
              <input 
                type="text" 
                value={s}
                onChange={(e) => setS(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#90caf9' }}>
                🎯 目标 p <span style={{ fontSize: '10px', color: '#90a4ae', marginLeft: '4px' }}>(要找的)</span>
              </label>
              <input 
                type="text" 
                value={p}
                onChange={(e) => setP(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={() => {
                  const finder = new AnagramFinder(s, p);
                  setSteps(finder.getSteps());
                  setCurrentStep(0);
                  setIsPlaying(false);
                }}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✔️ 应用
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { s: 'cbaebabacd', p: 'abc', name: '示例1：经典', desc: '找2个' },
              { s: 'abab', p: 'ab', name: '示例2：简单', desc: '找3个' },
              { s: 'baa', p: 'aa', name: '示例3：重复字母', desc: '担心找不到？' }
            ].map((ex, idx) => (
              <button 
                key={idx}
                onClick={() => { setS(ex.s); setP(ex.p); }}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  background: 'rgba(103, 58, 183, 0.3)',
                  color: '#fff',
                  border: '1px solid #673ab7',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(103, 58, 183, 0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(103, 58, 183, 0.3)'}
                title={ex.desc}
              >
                � {ex.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* 主区域 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '5px', flexWrap: 'wrap', flex: 1, overflow: 'hidden' }}>
          {/* 左侧 */}
          <div style={{ flex: 2 }}>
            {/* SVG */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '8px',
              marginBottom: '5px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4 style={{ margin: 0, color: '#90caf9', fontSize: '13px' }}>
                  📊 滑动窗口可视化
                  <Tooltip text="黄色=窗口，绿色=匹配，箭头=操作" />
                </h4>
                {currentStepData && (
                  <div style={{
                    padding: '3px 10px',
                    background: currentStepData.animationType === 'init' ? 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)' :
                               currentStepData.animationType === 'remove' ? 'linear-gradient(135deg, #f44336 0%, #e57373 100%)' :
                               currentStepData.animationType === 'add' ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' :
                               'linear-gradient(135deg, #ff9800 0%, #ffa726 100%)',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {currentStepData.animationType === 'init' ? '🎯' :
                     currentStepData.animationType === 'remove' ? '⬅️' :
                     currentStepData.animationType === 'add' ? '➡️' : '🔍'} {currentStepData.action}
                  </div>
                )}
              </div>
              <svg ref={svgRef} width="100%" height="260" style={{ display: 'block' }} />
            </div>
            
            {/* 区间历史可视化 */}
            {showIntervalHistory && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '8px',
                marginBottom: '5px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, color: '#90caf9', fontSize: '13px' }}>
                    📈 窗口滑动轨迹图（高级）
                    <Tooltip text="蓝色=普通检查，绿色=找到匹配" />
                  </h4>
                  <button
                    onClick={() => setShowIntervalHistory(false)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ 隐藏
                  </button>
                </div>
                <svg ref={intervalHistoryRef} width="100%" height="150" style={{ display: 'block' }} />
                <div style={{ 
                  marginTop: '8px', 
                  padding: '6px', 
                  background: 'rgba(51, 65, 85, 0.5)', 
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#cbd5e1'
                }}>
                  💡 这个图显示窗口每次移动后检查的位置。如果感觉复杂，可以隐藏它，只看上面的窗口动画就够了。
                </div>
              </div>
            )}
            
            {/* 字符频率 */}
            {currentStepData && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#90caf9', fontSize: '14px', fontWeight: 'bold' }}>
                  🎲 字母数量对比（就像比较手里的牌）
                  <Tooltip text="P=目标p里的数量 | W=窗口里的数量 | 绿色✓=数量一样" />
                </h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Array.from(new Set([...Object.keys(currentStepData.sFreq), ...Object.keys(currentStepData.pFreq)])).map((char, idx) => {
                    const sCount = currentStepData.sFreq[char] || 0;
                    const pCount = currentStepData.pFreq[char] || 0;
                    const matches = sCount === pCount;
                    
                    return (
                      <div key={char} style={{
                        padding: '6px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        minWidth: '55px',
                        background: matches 
                          ? 'rgba(16, 185, 129, 0.8)' 
                          : 'rgba(100, 116, 139, 0.6)',
                        border: matches ? '2px solid #10b981' : '2px solid #64748b',
                        fontSize: '11px',
                        animation: `fadeIn 0.5s ease-in-out ${idx * 0.1}s both`,
                        transition: 'all 0.3s ease',
                        boxShadow: matches ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                      }}>
                        <div style={{ 
                          fontSize: '15px', 
                          fontWeight: 'bold', 
                          marginBottom: '2px'
                        }}>{char}</div>
                        <div style={{ fontSize: '10px', opacity: 0.9 }}>目标:{pCount}张</div>
                        <div style={{ fontSize: '10px', opacity: 0.9 }}>窗口:{sCount}张</div>
                        <div style={{ 
                          fontSize: '13px', 
                          marginTop: '2px'
                        }}>
                          {matches ? '✓' : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* 右侧 */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            {/* 动态代码 */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
              padding: '8px',
              marginBottom: '5px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '11px'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#90caf9', fontSize: '12px' }}>
                💻 这一步在运行的代码
                <Tooltip text="这就是程序员写的真实代码" />
              </h4>
              {currentStepData && currentStepData.executedCode.map((line, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '3px 6px',
                    margin: '2px 0',
                    background: line.includes('//') ? 'rgba(255, 193, 7, 0.15)' : 'transparent',
                    color: line.includes('//') ? '#ffc107' : '#cfd8dc',
                    borderRadius: '3px'
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
            
            {/* 变量状态 */}
            {currentStepData && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '8px',
                padding: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#90caf9', fontSize: '13px', fontWeight: 'bold' }}>
                  � 当前状态一览
                  <Tooltip text="这些数字在不断变化" />
                </h4>
                {[
                  { icon: '�', name: '当前位置', value: currentStepData.variables.i, tip: '正在检查第几个字母' },
                  { icon: '⬅️', name: '窗口左边', value: currentStepData.variables.leftPointer, color: '#f44336', tip: '窗口的左边界在第几个' },
                  { icon: '➡️', name: '窗口右边', value: currentStepData.variables.rightPointer, color: '#4caf50', tip: '窗口的右边界在第几个' },
                  { icon: '🔲', name: '窗口长度', value: p.length + ' 个字母', tip: '窗口始终是这么大' },
                  { icon: '🎉', name: '找到了', value: `${currentStepData.result.length} 个`, color: '#4caf50', tip: '已经找到的匹配数量' }
                ].map((v, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    margin: '3px 0',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#90caf9', display: 'flex', alignItems: 'center' }}>
                      {v.icon} {v.name}
                      <Tooltip text={v.tip} />
                    </span>
                    <span style={{ color: v.color || '#ffc107', fontSize: '12px', fontWeight: 'bold' }}>
                      {v.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 步骤说明 */}
        {currentStepData && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '5px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* 大号当前操作提示 */}
            <div style={{
              marginBottom: '10px',
              padding: '12px',
              background: currentStepData.animationType === 'init' ? 'rgba(96, 165, 250, 0.15)' :
                         currentStepData.animationType === 'remove' ? 'rgba(239, 68, 68, 0.15)' :
                         currentStepData.animationType === 'add' ? 'rgba(16, 185, 129, 0.15)' :
                         currentStepData.animationType === 'compare' ? 'rgba(245, 158, 11, 0.15)' :
                         'rgba(168, 85, 247, 0.15)',
              borderRadius: '10px',
              border: `3px solid ${
                currentStepData.animationType === 'init' ? '#60a5fa' :
                currentStepData.animationType === 'remove' ? '#ef4444' :
                currentStepData.animationType === 'add' ? '#10b981' :
                currentStepData.animationType === 'compare' ? '#f59e0b' :
                '#a855f7'
              }`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
                {currentStepData.animationType === 'init' && '🎯 第一步：准备工作'}
                {currentStepData.animationType === 'remove' && '⬅️ 窗口向右滑：踢掉左边的字母'}
                {currentStepData.animationType === 'add' && '➡️ 窗口向右滑：加入右边的字母'}
                {currentStepData.animationType === 'compare' && '🔍 检查时刻：看看是否匹配'}
                {currentStepData.animationType === 'complete' && '🎉 搜索完成！'}
              </div>
              <div style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.8' }}>
                {currentStepData.animationType === 'init' && '📌 先统计一下目标字符串p里每个字母出现了几次，然后创建第一个窗口'}
                {currentStepData.animationType === 'remove' && `📌 窗口要往右移了！首先把左边的 "${currentStepData.leftChar}" 踢出窗口（就像小火车🚂走了，后面的车厢离开了）`}
                {currentStepData.animationType === 'add' && `📌 现在把右边的新字母 "${currentStepData.rightChar}" 拉进窗口（就像小火车🚂往前开，前面的车厢进来了）`}
                {currentStepData.animationType === 'compare' && '📌 数一数窗口里的每个字母数量，看看是否和目标字符串p完全一样（字母种类和数量都要匹配）'}
                {currentStepData.animationType === 'complete' && '📌 窗口已经滑到字符串最右边了，所有可能的位置都检查完了！'}
              </div>
            </div>

            {/* 详细说明 */}
            <div style={{ 
              fontSize: '13px', 
              color: '#fff', 
              lineHeight: '1.7', 
              marginBottom: '10px',
              padding: '10px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px'
            }}>
              <strong style={{ color: '#ffc107', fontSize: '14px' }}>💬 本步说明：</strong><br/>
              <span style={{ fontSize: '14px', color: '#e2e8f0' }}>{currentStepData.detailedExplanation}</span>
            </div>
            {currentStepData.result.length > 0 && (
              <div style={{
                marginTop: '5px',
                padding: '5px',
                background: 'rgba(76, 175, 80, 0.2)',
                borderRadius: '6px',
                borderLeft: '3px solid #4caf50'
              }}>
                <strong style={{ color: '#4caf50', fontSize: '11px' }}>✅ 已找到: </strong>
                <span style={{ color: '#4caf50', fontSize: '13px', fontWeight: 'bold' }}>
                  [{currentStepData.result.join(', ')}]
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* 控制面板 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
            {[
              { label: '↺ 重置', action: () => { setCurrentStep(0); setIsPlaying(false); }, disabled: false },
              { label: '← 上一步', action: () => setCurrentStep(prev => prev - 1), disabled: currentStep === 0 },
              { label: isPlaying ? '⏸ 暂停' : '▶ 播放', action: () => setIsPlaying(!isPlaying), disabled: false, special: true },
              { label: '下一步 →', action: () => setCurrentStep(prev => prev + 1), disabled: currentStep >= steps.length - 1 }
            ].map((btn, idx) => (
              <button 
                key={idx}
                onClick={btn.action}
                disabled={btn.disabled}
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  background: btn.special 
                    ? (isPlaying ? 'rgba(100, 116, 139, 0.8)' : 'rgba(16, 185, 129, 0.8)')
                    : 'rgba(96, 165, 250, 0.8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: btn.disabled ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: btn.disabled ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ color: '#cfd8dc', fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                ⚡ 速度: {speed}x
                <Tooltip text="0.5x最慢，3x最快" />
              </label>
              <input 
                type="range" 
                min="0.5" 
                max="3" 
                step="0.5" 
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                style={{ width: '100px' }}
              />
            </div>
            <div style={{ color: '#cfd8dc', fontSize: '11px', display: 'flex', alignItems: 'center' }}>
              📍 步骤: <strong style={{ color: '#ffc107', marginLeft: '4px' }}>{currentStep + 1}</strong> / {steps.length}
              <Tooltip text="当前/总步骤数" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
