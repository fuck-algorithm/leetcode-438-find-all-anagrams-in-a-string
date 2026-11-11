import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useAppStore } from '../../stores/useAppStore';
import styles from './Canvas.module.css';

type CharacterDatum = { index: number; char: string };
type CountDatum = { char: string; count: number; target: number; remaining: number };
type TeachingArrow = { id: string; fromX: number; fromY: number; toX: number; toY: number; label: string; color: string };

function getTeachingReason(
  step: NonNullable<ReturnType<typeof useAppStore.getState>['steps'][number]>,
  algorithmType: 'fixed-window' | 'variable-window',
): string {
  const { teaching, charCount, targetCount, windowState, results } = step;
  const { left, right, windowContent } = windowState;
  const windowLength = left < 0 ? 0 : right - left + 1;

  if (teaching.operation === 'init') {
    return algorithmType === 'fixed-window'
      ? `目标 p 长 ${Object.values(targetCount).reduce((sum, count) => sum + count, 0)}；后续只比较同长度窗口的字符频次。`
      : 'cnt = 目标频次 − 窗口频次；cnt < 0 表示该字符在窗口里超量，需要从左侧移出。';
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
      ? `窗口长度 ${windowLength} 尚未达到目标长度；先继续读入字符，长度足够后再比较频次。`
      : `窗口长度已达到目标长度；现在逐字符比较窗口频次与目标频次。`;
  }

  if (teaching.operation === 'shrink') {
    if (algorithmType === 'variable-window') return teaching.decision?.reason ?? '移出左端字符，直到当前字符不再超出目标频次。';
    const removedChar = teaching.countChange?.char;
    return `固定窗口向右滑动，移出左端 '${removedChar ?? '?'}'，为下一轮比较腾出位置。`;
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
      ? '每种字符的窗口频次都与目标频次相等；字符顺序虽可不同，这个窗口仍是异位词。'
      : difference
        ? `频次还不相等：'${difference.char}' 在窗口中${difference.delta > 0 ? `多 ${difference.delta} 个` : `少 ${Math.abs(difference.delta)} 个`}；这个窗口不能记录。`
        : `窗口内容为 “${windowContent}”；继续检查下一段固定长度窗口。`;
  }

  if (teaching.operation === 'done') {
    return results.length ? `答案索引为 [${results.join(', ')}]；每个索引都对应一个长度为 p、频次完全相同的窗口。` : '没有窗口满足目标频次；结果数组保持为空。';
  }

  return '沿用当前窗口状态，继续处理下一个字符。';
}

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { inputData, steps, currentStep, algorithmType } = useAppStore();
  const currentStepData = steps[currentStep];
  const stateRef = useRef({ inputData, currentStepData, algorithmType });

  useEffect(() => {
    const svgElement = svgRef.current;
    const container = containerRef.current;
    if (!svgElement || !container) return;

    stateRef.current = { inputData, currentStepData, algorithmType };
    const svg = d3.select(svgElement);
    svg.append('defs').append('marker').attr('id', 'teaching-arrowhead')
      .attr('viewBox', '0 0 10 10').attr('refX', 8).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', 'context-stroke');
    const root = svg.append('g').attr('class', 'main-group');
    const characters = root.append('g').attr('class', 'character-layer');
    const markers = root.append('g').attr('class', 'marker-layer');
    const counts = root.append('g').attr('class', 'count-layer');
    const annotations = root.append('g').attr('class', 'annotation-layer');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.01, 3])
      .on('zoom', (event) => root.attr('transform', event.transform.toString()));
    svg.call(zoom);

    let width = 0;
    let height = 0;
    let previousInput = '';
    const renderEvent = () => render();
    svgElement.addEventListener('canvas-step-change', renderEvent);

    const draw = (resetView: boolean) => {
      const { inputData, currentStepData, algorithmType } = stateRef.current;
      if (!currentStepData) return;
      width = container.clientWidth;
      height = container.clientHeight;
      if (!width || !height) return;
      svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'none');

      const { s, p } = inputData;
      const charHeight = 40;
      const countChars = [...new Set([...Object.keys(currentStepData.charCount), ...Object.keys(currentStepData.targetCount)])].sort();
      const baseCharWidth = 48;
      const countPitch = 128;
      const contentWidth = Math.max(Math.max(s.length, p.length) * baseCharWidth + 64, countChars.length * countPitch + 64, 360);
      const fitScale = Math.min(1, (width - 24) / contentWidth, (height - 32) / 520);
      const scale = Math.max(0.01, fitScale);
      const logicalWidth = width / scale;
      const logicalHeight = height / scale;
      const desiredCharPitch = 76;
      const charWidth = Math.max(24, Math.min(96, Math.min(desiredCharPitch, (logicalWidth - 160) / Math.max(s.length, p.length, 1))));
      const startX = (logicalWidth - s.length * charWidth) / 2;
      const contentTop = Math.max(36, logicalHeight * 0.1);
      const contentBottom = Math.min(logicalHeight - 76, logicalHeight * 0.94);
      const contentHeight = Math.max(320, contentBottom - contentTop);
      const stringY = contentTop + contentHeight * 0.1;
      const windowY = stringY + charHeight + contentHeight * 0.12;
      const targetY = contentTop + contentHeight * 0.52;
      const countY = contentTop + contentHeight * 0.7;
      const { windowState, highlightIndices, isMatch, charCount, targetCount, teaching } = currentStepData;

      if (resetView) {
        svg.call(zoom.transform, d3.zoomIdentity.translate((width - logicalWidth * scale) / 2, 0).scale(scale));
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
          if (isMatch && inWindow) return '#48bb78';
          if (highlightIndices.includes(d.index)) return '#ed8936';
          return inWindow ? '#4299e1' : '#2d3748';
        })
        .attr('stroke', (d) => windowState.left >= 0 && d.index >= windowState.left && d.index <= windowState.right ? '#63b3ed' : '#4a5568')
        .attr('stroke-width', (d) => windowState.left >= 0 && d.index >= windowState.left && d.index <= windowState.right ? 2 : 1);
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
        { key: 'left', label: 'L', index: windowState.left, color: '#f6e05e' },
        { key: 'right', label: 'R', index: windowState.right, color: '#68d391' },
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

      markers.selectAll<SVGTextElement, string>('text.window-label').data(windowState.left < 0 ? [] : [windowState.windowContent])
        .join('text').attr('class', 'window-label').attr('x', logicalWidth / 2).attr('y', windowY)
        .attr('text-anchor', 'middle').attr('fill', '#f7fafc').attr('font-size', '14px')
        .text((content) => `当前窗口：${content.split('').join(' · ')}  （长度 ${content.length}）`);

      const countData: CountDatum[] = countChars.map((char) => ({
        char,
        count: charCount[char] || 0,
        target: targetCount[char] || 0,
        remaining: charCount[char] || 0,
      }));
      const countStartX = (logicalWidth - Math.max(0, countData.length - 1) * countPitch) / 2 - 50;
      const countJoin = counts.selectAll<SVGGElement, CountDatum>('g.count-card').data(countData, (d) => d.char);
      countJoin.exit().remove();
      const countEnter = countJoin.enter().append('g').attr('class', 'count-card');
      countEnter.append('text').attr('class', 'count-char').attr('text-anchor', 'middle').attr('font-size', '14px').attr('font-weight', 'bold').attr('fill', '#f7fafc');
      countEnter.append('rect').attr('class', 'count-value-bg').attr('width', 24).attr('height', 24).attr('rx', 4).attr('opacity', 0.8);
      countEnter.append('text').attr('class', 'count-value').attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', '12px');
      countEnter.append('text').attr('class', 'count-window-label').attr('text-anchor', 'middle').attr('fill', '#a0aec0').attr('font-size', '8px');
      countEnter.append('text').attr('class', 'count-vs').attr('text-anchor', 'middle').attr('fill', '#718096').attr('font-size', '10px').text('vs');
      countEnter.append('rect').attr('class', 'target-value-bg').attr('x', 48).attr('width', 24).attr('height', 24).attr('rx', 4).attr('fill', '#4a5568');
      countEnter.append('text').attr('class', 'target-value').attr('text-anchor', 'middle').attr('fill', '#f7fafc').attr('font-size', '12px');
      countEnter.append('text').attr('class', 'target-label').attr('text-anchor', 'middle').attr('fill', '#a0aec0').attr('font-size', '8px');
      countEnter.append('text').attr('class', 'count-status').attr('text-anchor', 'middle').attr('fill', '#a0aec0').attr('font-size', '9px');
      const countUpdate = countEnter.merge(countJoin).attr('transform', (_, i) => `translate(${countStartX + i * countPitch},${countY})`);
      countUpdate.select<SVGTextElement>('.count-char').attr('x', 25).attr('y', 0).text((d) => `'${d.char}'`);
      countUpdate.select<SVGRectElement>('.count-value-bg').attr('y', 10)
        .attr('fill', (d) => (algorithmType === 'variable-window' ? d.remaining === 0 : d.count === d.target) ? '#48bb78' : '#e53e3e');
      countUpdate.select<SVGTextElement>('.count-value').attr('x', 12).attr('y', 27)
        .text((d) => algorithmType === 'variable-window' ? d.remaining : d.count);
      countUpdate.select<SVGTextElement>('.count-window-label').attr('x', 12).attr('y', 7)
        .text(() => algorithmType === 'variable-window' ? '剩余' : '窗口');
      countUpdate.select<SVGTextElement>('.count-vs').attr('x', 40).attr('y', 27);
      countUpdate.select<SVGRectElement>('.target-value-bg').attr('y', 10);
      countUpdate.select<SVGTextElement>('.target-value').attr('x', 48).attr('y', 27).text((d) => d.target);
      countUpdate.select<SVGTextElement>('.target-label').attr('x', 48).attr('y', 7).text('目标');
      countUpdate.select<SVGTextElement>('.count-status').attr('x', 40).attr('y', 44)
        .attr('fill', (d) => algorithmType === 'variable-window'
          ? d.remaining < 0 ? '#ff9c9c' : d.remaining === 0 ? '#8fe0b3' : '#f7cf75'
          : d.count === d.target ? '#8fe0b3' : '#ffb1a8')
        .text((d) => algorithmType === 'variable-window'
          ? d.remaining < 0 ? `超 ${Math.abs(d.remaining)}` : d.remaining > 0 ? `缺 ${d.remaining}` : '刚好'
          : d.count === d.target ? '相同'
            : d.count > d.target ? `多 ${d.count - d.target}` : `少 ${d.target - d.count}`);

      const title = '按顺序读入字符 → 检查频次 → 命中记下起点 → 窗口右移';
      annotations.selectAll<SVGTextElement, string>('text.canvas-title').data([title]).join('text')
        .attr('class', 'canvas-title').attr('x', logicalWidth / 2).attr('y', 26).attr('text-anchor', 'middle')
        .attr('fill', '#f7fafc').attr('font-size', '13px').attr('font-weight', 'bold').text((d) => d);
      annotations.selectAll<SVGTextElement, string>('text.target-caption').data(['目标 p：需要匹配的字符组成（顺序不重要）']).join('text')
        .attr('class', 'target-caption').attr('x', logicalWidth / 2).attr('y', targetY - 12).attr('text-anchor', 'middle')
        .attr('fill', '#86d7bf').attr('font-size', '11px').text((d) => d);
      annotations.selectAll<SVGTextElement, string>('text.count-title').data(countData.length ? [algorithmType === 'variable-window'
        ? '剩余需求 cnt = 目标 − 窗口；负数代表超量，需移动左边界'
        : '对照每种字符：窗口频次是否等于目标频次'] : [])
        .join('text').attr('class', 'count-title').attr('x', logicalWidth / 2).attr('y', countY - 20).attr('text-anchor', 'middle')
        .attr('fill', '#a0aec0').attr('font-size', '12px').text((d) => d);
      const legendItems = [
        { id: 'window', color: '#315f58', label: '目标 p' },
        { id: 'active', color: '#4299e1', label: '当前窗口' },
        { id: 'current', color: '#ed8936', label: '本步字符' },
        { id: 'match', color: '#48bb78', label: '匹配成功' },
      ];
      const legendStartX = logicalWidth / 2 - 172;
      const legend = annotations.selectAll<SVGGElement, typeof legendItems[number]>('g.canvas-legend-item')
        .data(legendItems, (d) => d.id);
      legend.exit().remove();
      const legendEnter = legend.enter().append('g').attr('class', 'canvas-legend-item');
      legendEnter.append('rect').attr('width', 12).attr('height', 12).attr('rx', 3);
      legendEnter.append('text').attr('x', 17).attr('y', 10).attr('fill', '#cbd5e0').attr('font-size', '10px');
      legendEnter.merge(legend).attr('transform', (_, i) => `translate(${legendStartX + i * 88},${height / scale - 32})`)
        .select('rect').attr('fill', (d) => d.color);
      legendEnter.merge(legend).select<SVGTextElement>('text').text((d) => d.label);
      annotations.selectAll<SVGTextElement, string>('text.count-explanation').data([])
        .join('text').attr('class', 'count-explanation');
      annotations.selectAll<SVGTextElement, string>('text.results-label')
        .data([`已找到的起点索引：${currentStepData.results.length ? `[${currentStepData.results.join(', ')}]` : '暂无'}`])
        .join('text').attr('class', 'results-label').attr('x', logicalWidth / 2).attr('y', countY + 74)
        .attr('text-anchor', 'middle').attr('fill', '#86d7bf').attr('font-size', '12px').text((d) => d);
      annotations.selectAll<SVGTextElement, string>('text.step-description').data([])
        .join('text').attr('class', 'step-description');
      annotations.selectAll<SVGTextElement, string>('text.window-bounds').data([])
        .join('text').attr('class', 'window-bounds');
      annotations.selectAll<SVGTextElement, string>('text.count-change').data([])
        .join('text').attr('class', 'count-change');

      const change = teaching.countChange;
      const dataArrow: TeachingArrow[] = change && ['enter', 'shrink'].includes(teaching.operation)
        ? [{
            id: 'teaching-data-flow',
            fromX: startX + (teaching.focus?.index ?? windowState.left) * charWidth + charWidth / 2,
            fromY: teaching.operation === 'enter' ? stringY + charHeight : countY - 24,
            toX: countStartX + Math.max(0, countData.findIndex((item) => item.char === change.char)) * countPitch + 12,
            toY: teaching.operation === 'enter' ? countY - 8 : stringY + charHeight,
            label: teaching.operation === 'enter'
              ? `入窗 s[${teaching.focus?.index ?? '?'}]='${change.char}' 计数 ${change.before}→${change.after}`
              : `出窗 s[${teaching.focus?.index ?? '?'}]='${change.char}' 计数 ${change.before}→${change.after}`,
            color: teaching.operation === 'enter' ? '#68d391' : '#f6ad55',
          }]
        : [];
      const arrowJoin = annotations.selectAll<SVGGElement, TeachingArrow>('g.teaching-arrow').data(dataArrow, (d) => d.id);
      arrowJoin.exit().remove();
      const arrowEnter = arrowJoin.enter().append('g').attr('class', 'teaching-arrow');
      arrowEnter.append('line').attr('stroke-width', 2).attr('marker-end', 'url(#teaching-arrowhead)');
      arrowEnter.append('text').attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', 'bold');
      const arrowUpdate = arrowEnter.merge(arrowJoin);
      arrowUpdate.select('line').attr('x1', (d) => d.fromX).attr('y1', (d) => d.fromY)
        .attr('x2', (d) => d.toX).attr('y2', (d) => d.toY).attr('stroke', (d) => d.color);
      arrowUpdate.select('text').attr('x', (d) => (d.fromX + d.toX) / 2).attr('y', (d) => (d.fromY + d.toY) / 2 - 6)
        .attr('fill', (d) => d.color).text((d) => d.label);
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
    const observer = new ResizeObserver(() => draw(false));
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
    stateRef.current = { inputData, currentStepData, algorithmType };
    const svg = svgRef.current;
    if (!svg || !currentStepData) return;
    // State is kept in the effect's closure; triggering a resize-independent render preserves zoom.
    const event = new Event('canvas-step-change');
    svg.dispatchEvent(event);
  }, [currentStepData, inputData, algorithmType]);

  const teaching = currentStepData?.teaching;
  const operationLabel = teaching ? ({ init: '初始化', enter: '入窗', shrink: '移出左端', compare: '检查窗口', match: '命中', done: '完成' }[teaching.operation]) : '准备中';
  const operationDetail = teaching?.narration ?? '';
  const reason = currentStepData ? getTeachingReason(currentStepData, algorithmType) : '';

  return (
    <div className={styles.container}>
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
      </section>
    </div>
  );
}
