import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useAppStore } from '../../stores/useAppStore';
import styles from './Canvas.module.css';

type CharacterDatum = { index: number; char: string };
type CountDatum = { char: string; count: number; target: number; remaining: number };

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 680;
const COUNT_COLUMNS = 7;
const COUNT_COLUMN_PITCH = 88;
const COUNT_ROW_PITCH = 94;
const COUNT_CARD_WIDTH = 76;
function getTeachingReason(
  step: NonNullable<ReturnType<typeof useAppStore.getState>['steps'][number]>,
  algorithmType: 'fixed-window' | 'variable-window',
): string {
  const { teaching, charCount, targetCount, windowState, results } = step;
  const { left, right, windowContent } = windowState;
  const windowLength = left < 0 ? 0 : right - left + 1;

  if (teaching.operation === 'init') {
    return algorithmType === 'fixed-window'
      ? `先数清 p 里每种字符：接下来只检查长度为 ${Object.values(targetCount).reduce((sum, count) => sum + count, 0)} 的窗口。`
      : '先记住 p 需要哪些字符、各要几个。窗口里每读入一个字符，就把它的剩余需求减一。';
  }

  if (teaching.operation === 'enter' && teaching.focus) {
    const char = teaching.focus.char;
    if (algorithmType === 'variable-window') {
      const remaining = charCount[char] || 0;
      return remaining < 0
        ? `cnt['${char}']=${remaining}，窗口里的 '${char}' 比目标多 ${Math.abs(remaining)} 个；下一步必须左移并移出字符。`
        : remaining === 0
          ? `cnt['${char}']=0，窗口中的 '${char}' 已达到目标频次；检查是否需要继续扩窗。`
          : `cnt['${char}']=${remaining}，窗口中的 '${char}' 还缺 ${remaining} 个；当前无需收缩。`;
    }
    return windowLength < Object.values(targetCount).reduce((sum, count) => sum + count, 0)
      ? `窗口现在有 ${windowLength} 个字符，还差 ${Object.values(targetCount).reduce((sum, count) => sum + count, 0) - windowLength} 个才够长；先继续读，暂不比较频次。`
      : `窗口已满 ${windowLength} 个字符；现在逐个核对窗口频次和目标频次。`;
  }

  if (teaching.operation === 'shrink') {
    if (algorithmType === 'variable-window') return teaching.decision?.reason ?? '左侧字符离开窗口；重复这个动作直到每种字符都不再超量。';
    const removedChar = teaching.countChange?.char;
    return `窗口已满：移出最左边的 '${removedChar ?? '?'}'，下一步才能读入新字符而保持长度不变。`;
  }

  if (teaching.operation === 'compare' || teaching.operation === 'match') {
    if (algorithmType === 'variable-window') {
      return teaching.operation === 'match'
        ? `窗口没有任何超额字符，且长度 ${windowLength} 等于 p 的长度；因此每种字符频次都恰好相同。`
        : `窗口已无超额字符，但长度 ${windowLength} 不等于目标长度；只有长度相等时才是异位词。`;
    }
    if (windowLength < Object.values(targetCount).reduce((sum, count) => sum + count, 0)) {
      return `窗口长度只有 ${windowLength}，目标 p 长 ${Object.values(targetCount).reduce((sum, count) => sum + count, 0)}；长度不够，暂不比较频次。`;
    }
    const difference = [...new Set([...Object.keys(charCount), ...Object.keys(targetCount)])]
      .map((char) => ({ char, delta: (charCount[char] || 0) - (targetCount[char] || 0) }))
      .find(({ delta }) => delta !== 0);
    return teaching.operation === 'match'
      ? `窗口 “${windowContent}” 和 p 含有相同的字符次数；顺序不同也没关系，记录起点 ${left}。`
      : difference
        ? `这个窗口还不是答案：字符 '${difference.char}' 在窗口里${difference.delta > 0 ? `多 ${difference.delta} 个` : `少 ${Math.abs(difference.delta)} 个`}。`
        : `窗口 “${windowContent}” 的频次吻合，记录起点 ${left}。`;
  }

  if (teaching.operation === 'done') {
    return results.length ? `答案索引为 [${results.join(', ')}]；每个索引都对应一个长度为 p、频次完全相同的窗口。` : '没有窗口满足目标频次；结果数组保持为空。';
  }

  return '沿用当前窗口状态，继续处理下一个字符。';
}

function getNextAction(
  step: NonNullable<ReturnType<typeof useAppStore.getState>['steps'][number]>,
  algorithmType: 'fixed-window' | 'variable-window',
  inputData: { s: string; p: string },
): string {
  const { teaching, windowState } = step;
  const { s, p } = inputData;
  const nextIndex = windowState.right + 1;
  const windowLength = windowState.left < 0 ? 0 : windowState.right - windowState.left + 1;

  if (teaching.operation === 'done' || nextIndex >= s.length && teaching.operation !== 'shrink') {
    return '扫描结束，查看最终索引。';
  }
  if (algorithmType === 'fixed-window') {
    if (teaching.operation === 'init') return `从 s[0] 开始读入；窗口长度目标是 ${p.length}，凑满之前不判断。`;
    if (teaching.operation === 'enter' && windowLength < p.length) return windowLength === p.length - 1
      ? `这是最后一个待填位置 s[${step.windowState.right}]；下一步窗口凑满，开始比较频次。`
      : `继续读入 s[${nextIndex}]；还需 ${p.length - windowLength} 个字符凑满窗口。`;
    if (teaching.operation === 'enter') return '窗口已凑满。下一步逐字符比较窗口频次和目标频次。';
    if (teaching.operation === 'compare' || teaching.operation === 'match') return teaching.operation === 'match'
      ? `频次相同，答案记下起点 ${windowState.left}。下一步移出最左字符，准备滑到右边一格。`
      : '频次不同，不记录答案。下一步移出最左字符，准备检查下一个窗口。';
    if (teaching.operation === 'shrink') return nextIndex < s.length
      ? `左端已移走。下一步读入 s[${nextIndex}]，窗口整体右移一格。`
      : '左端已移走；所有字符都检查完，返回已记录的索引。';
  } else {
    if (teaching.operation === 'init') return '先建好 p 的剩余需求；下一步从 s[0] 开始扩展窗口。';
    if (teaching.operation === 'enter' && teaching.focus && (step.charCount[teaching.focus.char] ?? 0) < 0) return `读入的 '${teaching.focus.char}' 已超出需求；下一步移出左边界，直到它不再超量。`;
    if (teaching.operation === 'enter' || teaching.operation === 'shrink') {
      const stillExcess = Object.values(step.charCount).some((count) => count < 0);
      if (stillExcess) return '移出后仍有字符超量；下一步继续右移左边界。';
      return windowLength === p.length
        ? `窗口合法且长度刚好是 ${p.length}；下一步记录起点 ${windowState.left}。`
        : `窗口已合法但长度是 ${windowLength}，还没凑满 ${p.length}；下一步继续向右扩展。`;
    }
    if (teaching.operation === 'compare' || teaching.operation === 'match') return teaching.operation === 'match'
      ? `记录起点 ${windowState.left}。下一步读入 s[${nextIndex}]，继续扫描。`
      : `窗口长度 ${windowLength} 还不等于 ${p.length}。下一步读入 s[${nextIndex}]。`;
  }
  return '继续播放下一步。';
}

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { inputData, steps, currentStep, algorithmType } = useAppStore();
  const currentStepData = steps[currentStep];
  const frameRevision = useAppStore((state) => state.steps.length);
  const stateRef = useRef({ inputData, currentStepData, algorithmType, currentStep, totalSteps: steps.length });

  useEffect(() => {
    const svgElement = svgRef.current;
    const container = containerRef.current;
    if (!svgElement || !container) return;

    stateRef.current = { inputData, currentStepData, algorithmType, currentStep, totalSteps: steps.length };
    const svg = d3.select(svgElement);
    const root = svg.append('g').attr('class', 'main-group');
    const characters = root.append('g').attr('class', 'character-layer');
    const markers = root.append('g').attr('class', 'marker-layer');
    const counts = root.append('g').attr('class', 'count-layer');
    const annotations = root.append('g').attr('class', 'annotation-layer');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 3])
      .on('zoom', (event) => root.attr('transform', event.transform.toString()));
    svg.call(zoom);

    let width = 0;
    let height = 0;
    let previousInput = '';
    const renderEvent = () => render();
    svgElement.addEventListener('canvas-step-change', renderEvent);

    const draw = (resetView: boolean) => {
      const { inputData, currentStepData, algorithmType, currentStep, totalSteps } = stateRef.current;
      if (!currentStepData) return;
      width = container.clientWidth;
      height = container.clientHeight;
      if (!width || !height) return;
      const { s, p } = inputData;
      const charHeight = 40;
      const countChars = [...new Set([...s, ...p])].sort();
      const contentWidth = Math.max(CANVAS_WIDTH, s.length * 76 + 160, p.length * 76 + 160);
      const countColumns = Math.min(COUNT_COLUMNS, Math.max(1, countChars.length));
      const rowCount = Math.max(1, Math.ceil(countChars.length / countColumns));
      const logicalWidth = Math.max(contentWidth, countColumns * COUNT_COLUMN_PITCH + 120);
      const stringY = 176;
      const windowY = 246;
      const countY = 344;
      const countSectionBottom = countY + (rowCount - 1) * COUNT_ROW_PITCH + 96;
      const resultsY = countSectionBottom + 40;
      const targetY = Math.max(630, resultsY + 58);
      const logicalHeight = Math.max(CANVAS_HEIGHT, targetY + charHeight + 110);
      svg.attr('viewBox', `0 0 ${logicalWidth} ${logicalHeight}`).attr('preserveAspectRatio', 'xMidYMid meet');
      root.attr('transform', `translate(${(CANVAS_WIDTH - logicalWidth) / 2}, 0)`);
      const charPitch = 76;
      const charWidth = charPitch - 8;
      const startX = Math.max(96, (logicalWidth - s.length * charPitch) / 2 + 4);
      const { windowState, highlightIndices, isMatch, charCount, targetCount, teaching } = currentStepData;
      const countChange = teaching.countChange && ['enter', 'shrink'].includes(teaching.operation)
        ? teaching.countChange
        : null;

      if (resetView) {
        svg.call(zoom.transform, d3.zoomIdentity);
      }

      const chars: CharacterDatum[] = Array.from(s, (char, index) => ({ char, index }));
      const charJoin = characters.selectAll<SVGGElement, CharacterDatum>('g.character')
        .data(chars, (d) => String(d.index));
      charJoin.exit().remove();
      const charEnter = charJoin.enter().append('g').attr('class', 'character');
      charEnter.append('rect').attr('class', 'character-background').attr('rx', 4);
      charEnter.append('text').attr('class', 'character-text').attr('text-anchor', 'middle')
        .attr('fill', '#f7fafc').attr('font-size', '16px').attr('font-family', 'monospace');
      charEnter.append('text').attr('class', 'character-index').attr('text-anchor', 'middle')
        .attr('fill', '#718096').attr('font-size', '10px');
      const charUpdate = charEnter.merge(charJoin).attr('data-key', (d) => d.index);
      charUpdate.select<SVGRectElement>('rect')
        .attr('x', (d) => startX + d.index * charWidth).attr('y', stringY)
        .attr('width', charWidth - Math.min(8, charWidth * 0.12)).attr('height', charHeight)
        .attr('fill', (d) => {
          const inWindow = windowState.left >= 0 && d.index >= windowState.left && d.index <= windowState.right;
          if (isMatch && inWindow) return '#287c60';
          if (teaching.operation === 'shrink' && d.index === (typeof currentStepData.variables.removedIndex === 'number' ? currentStepData.variables.removedIndex : teaching.focus?.index)) return '#b9842f';
          if (countChange && d.index === teaching.focus?.index) return '#b9842f';
          if (highlightIndices.includes(d.index)) return '#c99438';
          return inWindow ? '#356e5d' : '#26342e';
        })
        .attr('stroke', (d) => countChange && d.index === teaching.focus?.index
          || teaching.operation === 'shrink' && d.index === (typeof currentStepData.variables.removedIndex === 'number' ? currentStepData.variables.removedIndex : teaching.focus?.index)
          ? '#f1c76e'
          : windowState.left >= 0 && d.index >= windowState.left && d.index <= windowState.right ? '#83c8a9' : '#4b6156')
        .attr('stroke-width', (d) => countChange && d.index === teaching.focus?.index
          || teaching.operation === 'shrink' && d.index === (typeof currentStepData.variables.removedIndex === 'number' ? currentStepData.variables.removedIndex : teaching.focus?.index)
          ? 3
          : windowState.left >= 0 && d.index >= windowState.left && d.index <= windowState.right ? 2 : 1);
      charUpdate.select<SVGTextElement>('.character-text')
        .attr('x', (d) => startX + d.index * charWidth + charWidth / 2 - 1).attr('y', stringY + charHeight / 2 + 5)
        .text((d) => d.char);
      charUpdate.select<SVGTextElement>('.character-index')
        .attr('x', (d) => startX + d.index * charWidth + charWidth / 2 - 1).attr('y', stringY + charHeight + 16)
        .text((d) => d.index);

      characters.selectAll<SVGTextElement, string>('text.string-label').data(['s =']).join('text')
        .attr('class', 'string-label').attr('x', startX - 30).attr('y', stringY + charHeight / 2 + 5)
        .attr('fill', '#a0aec0').attr('font-size', '14px').text((d) => d);

      const targetStartX = (logicalWidth - p.length * charWidth) / 2;
      characters.selectAll<SVGTextElement, string>('text.target-label').data(['p =']).join('text')
        .attr('class', 'target-label').attr('x', targetStartX - 30).attr('y', targetY + charHeight / 2 + 5)
        .attr('fill', '#a0aec0').attr('font-size', '14px').text((d) => d);
      const targetChars: CharacterDatum[] = Array.from(p, (char, index) => ({ char, index }));
      const targetJoin = characters.selectAll<SVGGElement, CharacterDatum>('g.target-character')
        .data(targetChars, (d) => String(d.index));
      targetJoin.exit().remove();
      const targetEnter = targetJoin.enter().append('g').attr('class', 'target-character');
      targetEnter.append('rect').attr('rx', 4).attr('fill', '#315f58').attr('stroke', '#56b89c');
      targetEnter.append('text').attr('text-anchor', 'middle').attr('fill', '#fff')
        .attr('font-size', '16px').attr('font-family', 'monospace');
      const targetUpdate = targetEnter.merge(targetJoin);
      targetUpdate.select<SVGRectElement>('rect')
        .attr('x', (d) => targetStartX + d.index * charWidth).attr('y', targetY)
        .attr('width', charWidth - Math.min(8, charWidth * 0.12)).attr('height', charHeight);
      targetUpdate.select<SVGTextElement>('text')
        .attr('x', (d) => targetStartX + d.index * charWidth + charWidth / 2 - 1)
        .attr('y', targetY + charHeight / 2 + 5).text((d) => d.char);

      const pointerData = windowState.left < 0 ? [] : [
        { key: 'left', label: '左', index: windowState.left, color: '#e5b85c' },
        { key: 'right', label: '右', index: windowState.right, color: '#72c8a8' },
      ];
      const pointerJoin = markers.selectAll<SVGGElement, typeof pointerData[number]>('g.pointer')
        .data(pointerData, (d) => d.key);
      pointerJoin.exit().remove();
      const pointerEnter = pointerJoin.enter().append('g').attr('class', 'pointer');
      pointerEnter.append('text').attr('text-anchor', 'middle').attr('font-size', '12px').attr('font-weight', 'bold');
      pointerEnter.append('line').attr('y1', stringY - 5).attr('y2', stringY).attr('stroke-width', 2);
      pointerEnter.merge(pointerJoin)
        .select<SVGTextElement>('text').attr('x', (d) => startX + d.index * charWidth + charWidth / 2 - 1)
        .attr('y', stringY - 10).attr('fill', (d) => d.color).text((d) => d.label);
      pointerEnter.merge(pointerJoin).select<SVGLineElement>('line')
        .attr('x1', (d) => startX + d.index * charWidth + charWidth / 2 - 1)
        .attr('x2', (d) => startX + d.index * charWidth + charWidth / 2 - 1).attr('stroke', (d) => d.color);

      markers.selectAll<SVGTextElement, string>('text.window-label')
        .data([windowState.left < 0 ? null : windowState.windowContent])
        .join('text').attr('class', 'window-label').attr('x', logicalWidth / 2).attr('y', windowY)
        .attr('text-anchor', 'middle').attr('fill', '#f7fafc').attr('font-size', '14px')
        .text((content) => content === null
          ? '当前窗口：尚未开始'
          : `当前窗口：${content.split('').join(' · ')}  （长度 ${content.length}）`);

      const isInitializing = teaching.operation === 'init';
      const countData: CountDatum[] = countChars.map((char) => ({
        char,
        count: isInitializing && algorithmType === 'fixed-window' ? targetCount[char] || 0 : charCount[char] || 0,
        target: targetCount[char] || 0,
        remaining: charCount[char] || 0,
      }));
      const comparedChar = teaching.operation === 'compare' && !isMatch
        ? countData.find((item) => algorithmType === 'variable-window' ? item.remaining < 0 : item.count !== item.target)?.char ?? null
        : null;
      const focusedCountChar = countChange?.char ?? comparedChar;
      const countStartX = (logicalWidth - (countColumns - 1) * COUNT_COLUMN_PITCH) / 2 - COUNT_CARD_WIDTH / 2;
      const countPitch = COUNT_COLUMN_PITCH;
      const countJoin = counts.selectAll<SVGGElement, CountDatum>('g.count-card').data(countData, (d) => d.char);
      countJoin.exit().remove();
      const countEnter = countJoin.enter().append('g').attr('class', 'count-card');
      countEnter.append('rect').attr('class', 'count-focus-ring').attr('x', -5).attr('y', -5)
        .attr('width', COUNT_CARD_WIDTH + 10).attr('height', 76).attr('rx', 8)
        .attr('fill', 'none').attr('stroke', 'none').attr('stroke-width', 2);
      countEnter.append('text').attr('class', 'count-char').attr('text-anchor', 'middle')
        .attr('font-size', '14px').attr('font-weight', 'bold').attr('fill', '#f7fafc');
      countEnter.append('text').attr('class', 'count-char-caption').attr('text-anchor', 'middle')
        .attr('font-size', '9px').attr('fill', '#9aaba0');
      countEnter.append('text').attr('class', 'count-window-label').attr('text-anchor', 'middle')
        .attr('font-size', '9px').attr('fill', '#a0aec0');
      countEnter.append('rect').attr('class', 'count-value-bg').attr('rx', 4).attr('opacity', 0.9);
      countEnter.append('text').attr('class', 'count-value').attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '12px');
      countEnter.append('text').attr('class', 'count-vs').attr('text-anchor', 'middle').attr('fill', '#718096').attr('font-size', '10px').text('→');
      countEnter.append('text').attr('class', 'target-label').attr('text-anchor', 'middle')
        .attr('font-size', '9px').attr('fill', '#a0aec0');
      countEnter.append('rect').attr('class', 'target-value-bg').attr('x', 48).attr('rx', 4).attr('fill', '#4a5568');
      countEnter.append('text').attr('class', 'target-value').attr('text-anchor', 'middle').attr('fill', '#f7fafc').attr('font-size', '12px');
      countEnter.append('text').attr('class', 'count-status').attr('text-anchor', 'middle').attr('fill', '#a0aec0').attr('font-size', '9px');
      countEnter.append('text').attr('class', 'count-change-label').attr('text-anchor', 'middle')
        .attr('font-size', '10px').attr('font-weight', 'bold');
      const countUpdate = countEnter.merge(countJoin).attr('transform', (_, i) => {
        const column = i % countColumns;
        const row = Math.floor(i / countColumns);
        return `translate(${countStartX + column * countPitch},${countY + row * COUNT_ROW_PITCH})`;
      });
      countUpdate.select<SVGRectElement>('.count-focus-ring')
        .attr('stroke', (d) => focusedCountChar === d.char ? '#e5b85c' : 'none')
        .attr('opacity', (d) => focusedCountChar === d.char ? 1 : 0);
      countUpdate.select<SVGTextElement>('.count-char').attr('x', COUNT_CARD_WIDTH / 2).attr('y', 8).text((d) => `'${d.char}'`);
      countUpdate.select<SVGTextElement>('.count-char-caption').attr('x', COUNT_CARD_WIDTH / 2).attr('y', 19)
        .text((d) => countChange?.char === d.char || comparedChar === d.char ? '本步字符' : '字符');
      countUpdate.select<SVGTextElement>('.count-window-label').attr('x', 12).attr('y', 34)
        .text(() => isInitializing && algorithmType === 'fixed-window' ? '目标' : algorithmType === 'variable-window' ? '剩余' : '窗口');
      countUpdate.select<SVGRectElement>('.count-value-bg').attr('x', 0).attr('y', 38).attr('width', 26).attr('height', 24)
        .attr('fill', (d) => isInitializing && algorithmType === 'fixed-window' ? '#356e5d'
          : algorithmType === 'variable-window' ? d.remaining >= 0 ? '#356e5d' : '#8b5148'
            : d.count === d.target ? '#287c60' : '#8b5148')
        .attr('stroke', '#17211d').attr('stroke-width', 2);
      countUpdate.select<SVGTextElement>('.count-value').attr('x', 13).attr('y', 54)
        .text((d) => algorithmType === 'variable-window' ? d.remaining : d.count);
      countUpdate.select<SVGTextElement>('.count-vs').attr('x', 39).attr('y', 54);
      countUpdate.select<SVGTextElement>('.target-label').attr('x', 60).attr('y', 34).text('目标');
      countUpdate.select<SVGRectElement>('.target-value-bg').attr('x', 48).attr('y', 38).attr('width', 26).attr('height', 24);
      countUpdate.select<SVGTextElement>('.target-value').attr('x', 61).attr('y', 54).text((d) => d.target);
      countUpdate.select<SVGTextElement>('.count-status').attr('x', COUNT_CARD_WIDTH / 2).attr('y', 73)
        .attr('fill', (d) => isInitializing && algorithmType === 'fixed-window' ? '#9ab4a4' : algorithmType === 'variable-window'
          ? d.remaining < 0 ? '#efaa9c' : d.remaining === 0 ? '#8bd0ae' : '#e9c877'
          : d.count === d.target ? '#8bd0ae' : '#efaa9c')
        .text((d) => isInitializing && algorithmType === 'fixed-window' ? '目标频次'
          : algorithmType === 'variable-window'
            ? d.remaining < 0 ? `超 ${Math.abs(d.remaining)}` : d.remaining > 0 ? `缺 ${d.remaining}` : '刚好'
            : d.count === d.target ? '相同'
              : d.count > d.target ? `多 ${d.count - d.target}` : `少 ${d.target - d.count}`);
      countUpdate.select<SVGTextElement>('.count-change-label').attr('x', COUNT_CARD_WIDTH / 2).attr('y', 91)
        .attr('fill', (d) => countChange?.char === d.char ? '#f0ce7a' : 'none')
        .text((d) => countChange?.char === d.char ? `${countChange.before} → ${countChange.after}`
          : countChange ? ''
            : comparedChar === d.char ? algorithmType === 'variable-window'
              ? d.remaining < 0 ? `超 ${Math.abs(d.remaining)}` : d.remaining > 0 ? `缺 ${d.remaining}` : '刚好'
              : d.count > d.target ? `多 ${d.count - d.target}` : `少 ${d.target - d.count}`
            : '');

      const operationTitle = teaching.operation === 'init' ? '先统计目标字符'
        : teaching.operation === 'enter' ? '读入一个新字符'
        : teaching.operation === 'shrink' ? algorithmType === 'fixed-window' ? '移出窗口最左字符'
          : '移出超量字符'
        : teaching.operation === 'compare' ? algorithmType === 'fixed-window' ? '比较窗口频次' : '检查窗口长度'
        : teaching.operation === 'match' ? '找到一个异位词'
        : '扫描完成';
      const stepTitle = `第 ${currentStep + 1} / ${totalSteps} 步  ·  ${operationTitle}`;
      annotations.selectAll<SVGTextElement, string>('text.canvas-title').data([stepTitle]).join('text')
        .attr('class', 'canvas-title').attr('x', logicalWidth / 2).attr('y', 27).attr('text-anchor', 'middle')
        .attr('fill', '#f7fafc').attr('font-size', '15px').attr('font-weight', 'bold').text((d) => d);
      annotations.selectAll<SVGTextElement, string>('text.frame-narration').data([teaching.narration]).join('text')
        .attr('class', 'frame-narration').attr('x', logicalWidth / 2).attr('y', 49).attr('text-anchor', 'middle')
        .attr('fill', '#b8c9be').attr('font-size', '11px').text((d) => d);
      const stageLabels = algorithmType === 'fixed-window'
        ? ['统计 p', '读入字符', '比较频次', '窗口右移']
        : ['统计 p', '读入字符', '移出超量', '判断长度'];
      const activeStage = teaching.operation === 'init' ? 0
        : teaching.operation === 'enter' ? 1
        : teaching.operation === 'shrink' ? algorithmType === 'variable-window' ? 2 : 3
        : teaching.operation === 'match' || teaching.operation === 'done' ? 3
        : algorithmType === 'variable-window' ? 3 : 2;
      const stageGap = Math.min(220, (logicalWidth - 280) / 3);
      const stageStartX = (logicalWidth - stageGap * 3) / 2;
      const stageJoin = annotations.selectAll<SVGGElement, { label: string; index: number }>('g.algorithm-stage')
        .data(stageLabels.map((label, index) => ({ label, index })), (d) => String(d.index));
      stageJoin.exit().remove();
      const stageEnter = stageJoin.enter().append('g').attr('class', 'algorithm-stage');
      stageEnter.append('line').attr('class', 'stage-connector').attr('y1', 0).attr('y2', 0);
      stageEnter.append('circle').attr('class', 'stage-dot').attr('r', 5);
      stageEnter.append('text').attr('class', 'stage-label').attr('text-anchor', 'middle').attr('y', 20);
      const stageUpdate = stageEnter.merge(stageJoin).attr('transform', (d) => `translate(${stageStartX + d.index * stageGap}, 68)`);
      stageUpdate.select('line').attr('x1', -stageGap / 2).attr('x2', stageGap / 2)
        .attr('stroke', (d) => d.index < activeStage ? '#72b89a' : '#43534b').attr('stroke-width', 2);
      stageUpdate.select('circle').attr('fill', (d) => d.index === activeStage ? '#e5b85c' : d.index < activeStage ? '#72b89a' : '#43534b')
        .attr('stroke', '#17211d').attr('stroke-width', 2);
      stageUpdate.select<SVGTextElement>('text.stage-label').attr('fill', (d) => d.index === activeStage ? '#f0ce7a' : '#aab9b0')
        .attr('font-size', (d) => d.index === activeStage ? 11 : 10).text((d) => d.label);
      annotations.selectAll<SVGTextElement, string>('text.target-caption').data(['目标 p：需要匹配的字符组成（顺序不重要）']).join('text')
        .attr('class', 'target-caption').attr('x', logicalWidth / 2).attr('y', targetY - 18).attr('text-anchor', 'middle')
        .attr('fill', '#86d7bf').attr('font-size', '11px').text((d) => d);
      annotations.selectAll<SVGTextElement, string>('text.count-title').data(countData.length ? [algorithmType === 'variable-window'
        ? '剩余需求 cnt = 目标 − 窗口；负数代表超量，需移动左边界'
        : '对照每种字符：窗口频次是否等于目标频次'] : [])
        .join('text').attr('class', 'count-title').attr('x', logicalWidth / 2).attr('y', countY - 22).attr('text-anchor', 'middle')
        .attr('fill', '#a0aec0').attr('font-size', '12px').text((d) => d);
      const legendItems = [
        { id: 'window', color: '#315f58', label: '目标 p' },
        { id: 'active', color: '#356e5d', label: '当前窗口' },
        { id: 'current', color: '#c99438', label: '本步字符' },
        { id: 'match', color: '#287c60', label: '匹配成功' },
      ];
      const legendStartX = logicalWidth / 2 - 172;
      const legend = annotations.selectAll<SVGGElement, typeof legendItems[number]>('g.canvas-legend-item')
        .data(legendItems, (d) => d.id);
      legend.exit().remove();
      const legendEnter = legend.enter().append('g').attr('class', 'canvas-legend-item');
      legendEnter.append('rect').attr('width', 12).attr('height', 12).attr('rx', 3);
      legendEnter.append('text').attr('x', 17).attr('y', 10).attr('fill', '#cbd5e0').attr('font-size', '10px');
      legendEnter.merge(legend).attr('transform', (_, i) => `translate(${legendStartX + i * 88},${logicalHeight - 44})`)
        .select('rect').attr('fill', (d) => d.color);
      legendEnter.merge(legend).select<SVGTextElement>('text').text((d) => d.label);
      annotations.selectAll<SVGTextElement, string>('text.count-explanation').data([])
        .join('text').attr('class', 'count-explanation');
      annotations.selectAll<SVGTextElement, string>('text.results-label')
        .data([`已找到的起点索引：${currentStepData.results.length ? `[${currentStepData.results.join(', ')}]` : '暂无'}`])
        .join('text').attr('class', 'results-label').attr('x', logicalWidth / 2).attr('y', resultsY)
        .attr('text-anchor', 'middle').attr('fill', '#86d7bf').attr('font-size', '12px').text((d) => d);
      annotations.selectAll<SVGTextElement, string>('text.step-description').data([])
        .join('text').attr('class', 'step-description');
      annotations.selectAll<SVGTextElement, string>('text.window-bounds').data([])
        .join('text').attr('class', 'window-bounds');
      annotations.selectAll<SVGTextElement, string>('text.count-change').data([])
        .join('text').attr('class', 'count-change');

      annotations.selectAll<SVGTextElement, string>('text.teaching-decision').data([])
        .join('text').attr('class', 'teaching-decision');
    };

    const render = () => {
      const inputKey = `${stateRef.current.inputData.s}\u0000${stateRef.current.inputData.p}`;
      const inputChanged = inputKey !== previousInput;
      previousInput = inputKey;
      draw(inputChanged);
    };
    render();
    const observer = new ResizeObserver(() => draw(true));
    observer.observe(container);
    return () => {
      observer.disconnect();
      svgElement.removeEventListener('canvas-step-change', renderEvent);
      svg.on('.zoom', null);
      svg.selectAll('*').remove();
    };
  // The persistent D3 scene and zoom behavior must outlive step changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stateRef.current = { inputData, currentStepData, algorithmType, currentStep, totalSteps: steps.length };
    const svg = svgRef.current;
    if (!svg || !currentStepData) return;
    // State is kept in the effect's closure; triggering a resize-independent render preserves zoom.
    const event = new Event('canvas-step-change');
    svg.dispatchEvent(event);
  }, [currentStep, currentStepData, inputData, algorithmType, steps.length, frameRevision]);

  const teaching = currentStepData?.teaching;
  const operationLabel = teaching ? ({ init: '初始化', enter: '入窗', shrink: '移出左端', compare: '检查窗口', match: '命中', done: '完成' }[teaching.operation]) : '准备中';
  const operationDetail = teaching?.narration ?? '';
  const reason = currentStepData ? getTeachingReason(currentStepData, algorithmType) : '';
  const nextAction = currentStepData ? getNextAction(currentStepData, algorithmType, inputData) : '';

  return (
    <div className={styles.container}>
      <div className={styles.canvasKey} aria-hidden="true">
        <span><i className={styles.keyWindow} /> 当前窗口</span>
        <span><i className={styles.keyCurrent} /> 本步字符</span>
        <span><i className={styles.keyMatch} /> 频次相同</span>
      </div>
      <div ref={containerRef} className={styles.canvasViewport}>
        <svg ref={svgRef} className={styles.svg} />
      </div>
      <section className={styles.teachingPanel} aria-live="polite" aria-label="当前步骤讲解">
        <div className={styles.teachingBlock}>
          <span className={styles.teachingLabel}>本步操作 · {operationLabel}</span>
          <div className={styles.teachingValue}>{operationDetail}</div>
        </div>
        <div className={styles.teachingBlock}>
          <span className={styles.teachingLabel}>判断依据 / 状态变化</span>
          <div className={styles.teachingValue}>{reason}</div>
        </div>
        <div className={styles.nextAction}>
          <span className={styles.nextActionLabel}>接下来</span>
          <span>{nextAction}</span>
        </div>
      </section>
    </div>
  );
}
