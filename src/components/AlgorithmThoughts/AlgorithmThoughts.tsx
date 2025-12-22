import { useAppStore } from '../../stores/useAppStore';
import styles from './AlgorithmThoughts.module.css';

interface AlgorithmThoughtsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlgorithmThoughts({ isOpen, onClose }: AlgorithmThoughtsProps) {
  const { algorithmType } = useAppStore();

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {algorithmType === 'fixed-window' ? '定长滑窗' : '不定长滑窗'} - 算法思路
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {algorithmType === 'fixed-window' ? (
            <FixedWindowThoughts />
          ) : (
            <VariableWindowThoughts />
          )}
        </div>
      </div>
    </div>
  );
}

function FixedWindowThoughts() {
  return (
    <>
      <section className={styles.section}>
        <h3>核心思路</h3>
        <p>
          设 n 是 p 的长度。枚举 s 的所有长为 n 的子串 s'，如果 s' 的每种字母的出现次数，
          和 p 的每种字母的出现次数都相同，那么 s' 是 p 的异位词。
        </p>
      </section>

      <section className={styles.section}>
        <h3>算法步骤</h3>
        <ol className={styles.steps}>
          <li>统计目标字符串 p 中每个字符的出现次数，存入 cntP</li>
          <li>用滑动窗口枚举 s 的所有长为 n 的子串</li>
          <li>维护当前窗口内每种字母的出现次数 cntS</li>
          <li>当窗口长度达到 n 时，比较 cntS 和 cntP 是否相等</li>
          <li>如果相等，说明找到了一个异位词，记录左端点索引</li>
          <li>移动窗口：右端点字符进入，左端点字符离开</li>
        </ol>
      </section>

      <section className={styles.section}>
        <h3>复杂度分析</h3>
        <ul className={styles.complexity}>
          <li><strong>时间复杂度：</strong>O(|Σ|m + n)，其中 m 是 s 的长度，n 是 p 的长度，|Σ|=26 是字符集大小</li>
          <li><strong>空间复杂度：</strong>O(|Σ|)，用于存储字符计数</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3>关键点</h3>
        <ul className={styles.keyPoints}>
          <li>窗口大小固定为 p 的长度</li>
          <li>每次移动窗口时，只需更新进入和离开的字符计数</li>
          <li>使用哈希表或数组存储字符频率，比较时间为 O(|Σ|)</li>
        </ul>
      </section>
    </>
  );
}

function VariableWindowThoughts() {
  return (
    <>
      <section className={styles.section}>
        <h3>核心思路</h3>
        <p>
          枚举子串 s' 的右端点，如果发现 s' 其中一种字母的出现次数大于 p 的这种字母的出现次数，
          则增大 s' 的左端点（缩小窗口）。如果发现 s' 的长度等于 p 的长度，则说明 s' 是 p 的异位词。
        </p>
      </section>

      <section className={styles.section}>
        <h3>算法步骤</h3>
        <ol className={styles.steps}>
          <li>统计目标字符串 p 中每个字符的出现次数，存入 cnt</li>
          <li>遍历字符串 s，右指针字符进入窗口时，cnt 对应值减 1</li>
          <li>如果 cnt 中某字符计数小于 0，说明该字符过多，需要收缩窗口</li>
          <li>左指针右移，离开的字符在 cnt 中加 1，直到不再有字符过多</li>
          <li>当窗口长度等于 p 的长度时，找到一个异位词</li>
        </ol>
      </section>

      <section className={styles.section}>
        <h3>复杂度分析</h3>
        <ul className={styles.complexity}>
          <li><strong>时间复杂度：</strong>O(m + n)，其中 m 是 s 的长度，n 是 p 的长度</li>
          <li><strong>空间复杂度：</strong>O(|Σ|)，用于存储字符计数</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3>关键点</h3>
        <ul className={styles.keyPoints}>
          <li>窗口大小不固定，根据字符频率动态调整</li>
          <li>cnt 数组/哈希表同时记录目标和窗口的差值</li>
          <li>当某字符计数为负时，说明窗口中该字符过多</li>
          <li>窗口长度等于 p 长度时，必然是异位词（因为没有字符过多）</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3>为什么有效？</h3>
        <p className={styles.explanation}>
          内层循环结束后，窗口内每种字母的出现次数都小于等于 p 中的出现次数。
          如果窗口长度等于 p 的长度，说明每种字母的出现次数必然相等（否则长度会更短），
          因此窗口内的子串就是 p 的异位词。
        </p>
      </section>
    </>
  );
}
