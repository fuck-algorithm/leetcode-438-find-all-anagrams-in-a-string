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
          <div>
            <span className={styles.dialogEyebrow}>当前动画对应的解法</span>
            <h2 className={styles.title}>
              {algorithmType === 'fixed-window' ? '定长滑窗' : '不定长滑窗'}
            </h2>
          </div>
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
      <section className={styles.methodSummary}>
        <span className={styles.summaryTag}>先理解这一种</span>
        <p>窗口长度固定为 <code>|p|</code>。每次移动只更新一个新进入和一个刚离开的字符，再比较两边频次；规则直观，适合先建立“滑窗”概念。</p>
      </section>
      <section className={styles.section}>
        <h3>为什么固定长度就够了？</h3>
        <p>
          异位词必须与 p 有相同的字符数量，所以候选窗口长度只能是 <code>p.length</code>。
          每次只需比较窗口和 p 的字符频次，不必重新排序字符。
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
        <h3>这段动画怎么看</h3>
        <ul className={styles.keyPoints}>
          <li>上方字符串是 s，移动的左右边界圈出当前候选窗口</li>
          <li>下方按字符比较窗口频次和目标频次；窗口未满时先不判断</li>
          <li>频次全部相等时记录左端索引，然后窗口继续向右滑动</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3>何时选它？</h3>
        <p>先用定长法理解题意和窗口移动，再看不定长法如何把“频次比较”改成“只在某个字符超量时收缩”，从而省去每个窗口都完整比较频次的步骤。</p>
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
      <section className={styles.methodSummary}>
        <span className={styles.summaryTag}>在理解窗口后学习</span>
        <p>把 <code>cnt[c] = 目标频次 − 窗口频次</code>。新字符进入时需求减一；若需求变负，说明它超量，再从左边移出字符直到恢复合法。</p>
      </section>
      <section className={styles.section}>
        <h3>为什么只检查超量字符？</h3>
        <p>
          每个字符的 <code>cnt</code> 都表示还缺多少个：正数是未满足需求，0 是刚好，负数是窗口里多了。
          移除左端字符直到没有负数；若此时窗口长度等于 p，字符频次就必然完全相同。
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
        <h3>这段动画怎么看</h3>
        <ul className={styles.keyPoints}>
          <li>目标频次作为初始 cnt；窗口字符进入，cnt 对应值减一</li>
          <li>负数代表当前窗口含有超额字符，左指针逐步右移并归还离开字符</li>
          <li>窗口合法且长度等于 p 时，记录窗口左端点</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3>相比定长法</h3>
        <p>定长法每个窗口都完整对照频次；不定长法维护频次差，只在字符超量时收缩。两种算法的窗口动作和代码行会在动画中分别展示，可来回切换对比。</p>
      </section>

      <section className={styles.section}>
        <h3>复杂度分析</h3>
        <ul className={styles.complexity}>
          <li><strong>时间复杂度：</strong>O(m·|Σ| + n)，其中 m 是 s 的长度，n 是 p 的长度，|Σ| 是字符集大小；当前实现每次滑动后检查字符集频次</li>
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
