import styles from './ProblemDescription.module.css';

interface ProblemDescriptionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProblemDescription({ isOpen, onClose }: ProblemDescriptionProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="problem-title">
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>LEETCODE 438</span>
            <h2 id="problem-title" className={styles.title}>找到字符串中所有字母异位词</h2>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="关闭题目描述">×</button>
        </header>

        <div className={styles.body}>
          <p className={styles.lead}>给定两个字符串 <code>s</code> 和 <code>p</code>，找到 <code>s</code> 中所有是 <code>p</code> 的字母异位词的子串，并返回这些子串的起始索引。</p>
          <div className={styles.example}>
            <span className={styles.exampleLabel}>示例</span>
            <p><b>s</b> = <code>"cbaebabacd"</code></p>
            <p><b>p</b> = <code>"abc"</code></p>
            <p><b>输出</b> = <code>[0, 6]</code></p>
            <p className={styles.note}>从索引 0 开始的 “cba” 和从索引 6 开始的 “bac”，都恰好包含 a、b、c 各一次。</p>
          </div>
          <section className={styles.definition}>
            <h3>什么是字母异位词？</h3>
            <p>两个字符串包含的字符和每个字符的出现次数都相同，只是排列顺序不同。例如 “abc” 和 “bca”。</p>
          </section>
          <p className={styles.constraint}>约束：<code>s</code> 和 <code>p</code> 只包含小写英文字母，且 <code>1 ≤ p.length ≤ s.length ≤ 3 × 10⁴</code>。</p>
        </div>
        <footer className={styles.footer}>
          <a href="https://leetcode.cn/problems/find-all-anagrams-in-a-string/" target="_blank" rel="noopener noreferrer">查看 LeetCode 原题</a>
          <button className={styles.start} onClick={onClose}>开始看动画</button>
        </footer>
      </section>
    </div>
  );
}
