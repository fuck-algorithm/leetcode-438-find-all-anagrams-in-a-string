import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useAppStore } from '../../stores/useAppStore';
import styles from './Canvas.module.css';

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { inputData, steps, currentStep } = useAppStore();
  
  const currentStepData = steps[currentStep];

  const drawCanvas = useCallback(() => {
    if (!svgRef.current || !containerRef.current || !currentStepData) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 设置SVG尺寸
    svg.attr('width', width).attr('height', height);

    // 创建主绘图组
    const g = svg.append('g').attr('class', 'main-group');

    // 添加缩放和拖动功能
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // 计算布局
    const { s, p } = inputData;
    const charWidth = 36;
    const charHeight = 40;
    const startX = (width - s.length * charWidth) / 2;
    const stringY = 80;
    const windowY = stringY + charHeight + 60;
    const countY = windowY + 100;

    // 绘制标题
    g.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f7fafc')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(`目标字符串 p = "${p}" (长度: ${p.length})`);

    // 绘制字符串 s
    g.append('text')
      .attr('x', startX - 30)
      .attr('y', stringY + charHeight / 2 + 5)
      .attr('fill', '#a0aec0')
      .attr('font-size', '14px')
      .text('s =');

    // 绘制每个字符
    const { windowState, highlightIndices, isMatch, charCount, targetCount } = currentStepData;

    s.split('').forEach((char, i) => {
      const x = startX + i * charWidth;
      const isInWindow = windowState.left >= 0 && i >= windowState.left && i <= windowState.right;
      const isHighlighted = highlightIndices.includes(i);

      // 字符背景
      g.append('rect')
        .attr('x', x)
        .attr('y', stringY)
        .attr('width', charWidth - 2)
        .attr('height', charHeight)
        .attr('rx', 4)
        .attr('fill', () => {
          if (isMatch && isInWindow) return '#48bb78';
          if (isHighlighted) return '#ed8936';
          if (isInWindow) return '#4299e1';
          return '#2d3748';
        })
        .attr('stroke', isInWindow ? '#63b3ed' : '#4a5568')
        .attr('stroke-width', isInWindow ? 2 : 1);

      // 字符文本
      g.append('text')
        .attr('x', x + charWidth / 2 - 1)
        .attr('y', stringY + charHeight / 2 + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f7fafc')
        .attr('font-size', '16px')
        .attr('font-family', 'monospace')
        .text(char);

      // 索引
      g.append('text')
        .attr('x', x + charWidth / 2 - 1)
        .attr('y', stringY + charHeight + 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#718096')
        .attr('font-size', '10px')
        .text(i);
    });

    // 绘制窗口指针
    if (windowState.left >= 0) {
      const leftX = startX + windowState.left * charWidth + charWidth / 2 - 1;
      const rightX = startX + windowState.right * charWidth + charWidth / 2 - 1;

      // 左指针
      g.append('text')
        .attr('x', leftX)
        .attr('y', stringY - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f6e05e')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text('L');

      g.append('line')
        .attr('x1', leftX)
        .attr('y1', stringY - 5)
        .attr('x2', leftX)
        .attr('y2', stringY)
        .attr('stroke', '#f6e05e')
        .attr('stroke-width', 2);

      // 右指针
      g.append('text')
        .attr('x', rightX)
        .attr('y', stringY - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#68d391')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text('R');

      g.append('line')
        .attr('x1', rightX)
        .attr('y1', stringY - 5)
        .attr('x2', rightX)
        .attr('y2', stringY)
        .attr('stroke', '#68d391')
        .attr('stroke-width', 2);

      // 窗口内容显示
      g.append('text')
        .attr('x', width / 2)
        .attr('y', windowY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f7fafc')
        .attr('font-size', '14px')
        .text(`当前窗口: "${windowState.windowContent}" (长度: ${windowState.windowContent.length})`);
    }

    // 绘制字符频率对比
    const allChars = new Set([...Object.keys(charCount), ...Object.keys(targetCount)]);
    const charArray = Array.from(allChars).sort();
    
    if (charArray.length > 0) {
      const countStartX = (width - charArray.length * 60) / 2;

      // 标题
      g.append('text')
        .attr('x', width / 2)
        .attr('y', countY - 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#a0aec0')
        .attr('font-size', '12px')
        .text('字符频率对比 (窗口 vs 目标)');

      charArray.forEach((char, i) => {
        const x = countStartX + i * 60;
        const windowCount = charCount[char] || 0;
        const target = targetCount[char] || 0;
        const isEqual = windowCount === target;

        // 字符标签
        g.append('text')
          .attr('x', x + 25)
          .attr('y', countY)
          .attr('text-anchor', 'middle')
          .attr('fill', '#f7fafc')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text(`'${char}'`);

        // 窗口计数
        g.append('rect')
          .attr('x', x)
          .attr('y', countY + 10)
          .attr('width', 24)
          .attr('height', 24)
          .attr('rx', 4)
          .attr('fill', isEqual ? '#48bb78' : '#e53e3e')
          .attr('opacity', 0.8);

        g.append('text')
          .attr('x', x + 12)
          .attr('y', countY + 27)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', '12px')
          .text(windowCount);

        // vs 文本
        g.append('text')
          .attr('x', x + 30)
          .attr('y', countY + 27)
          .attr('text-anchor', 'middle')
          .attr('fill', '#718096')
          .attr('font-size', '10px')
          .text('vs');

        // 目标计数
        g.append('rect')
          .attr('x', x + 36)
          .attr('y', countY + 10)
          .attr('width', 24)
          .attr('height', 24)
          .attr('rx', 4)
          .attr('fill', '#4a5568');

        g.append('text')
          .attr('x', x + 48)
          .attr('y', countY + 27)
          .attr('text-anchor', 'middle')
          .attr('fill', '#f7fafc')
          .attr('font-size', '12px')
          .text(target);
      });
    }

    // 绘制结果
    const { results } = currentStepData;
    if (results.length > 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', countY + 80)
        .attr('text-anchor', 'middle')
        .attr('fill', '#48bb78')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(`已找到异位词起始索引: [${results.join(', ')}]`);
    }

    // 绘制步骤描述
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height - 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f7fafc')
      .attr('font-size', '13px')
      .text(currentStepData.description);

  }, [inputData, currentStepData]);

  useEffect(() => {
    drawCanvas();
    
    const handleResize = () => drawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  return (
    <div ref={containerRef} className={styles.container}>
      <svg ref={svgRef} className={styles.svg} />
    </div>
  );
}
