import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { validateInput, generateRandomInput } from '../../utils/validation';
import type { SampleData, AlgorithmType } from '../../types';
import styles from './DataInput.module.css';

const sampleData: SampleData[] = [
  { name: '示例1', s: 'cbaebabacd', p: 'abc' },
  { name: '示例2', s: 'abab', p: 'ab' },
  { name: '长字符串', s: 'abaacbabc', p: 'abc' },
];

export function DataInput() {
  const { inputData, setInputData, algorithmType, setAlgorithmType } = useAppStore();
  const [tempS, setTempS] = useState(inputData.s);
  const [tempP, setTempP] = useState(inputData.p);
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    const validation = validateInput(tempS, tempP);
    if (!validation.valid) {
      setError(validation.error || '输入无效');
      return;
    }
    setError(null);
    setInputData({ s: tempS, p: tempP });
  };

  const handleSampleClick = (sample: SampleData) => {
    setTempS(sample.s);
    setTempP(sample.p);
    setError(null);
    setInputData({ s: sample.s, p: sample.p });
  };

  const handleRandom = () => {
    const { s, p } = generateRandomInput();
    setTempS(s);
    setTempP(p);
    setError(null);
    setInputData({ s, p });
  };

  const handleAlgorithmChange = (type: AlgorithmType) => {
    setAlgorithmType(type);
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.algorithmSelector}>
          <span className={styles.label}>解法</span>
          <button
            className={`${styles.algorithmBtn} ${algorithmType === 'fixed-window' ? styles.active : ''}`}
            onClick={() => handleAlgorithmChange('fixed-window')}
          >
            定长
          </button>
          <button
            className={`${styles.algorithmBtn} ${algorithmType === 'variable-window' ? styles.active : ''}`}
            onClick={() => handleAlgorithmChange('variable-window')}
          >
            不定长
          </button>
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>s =</label>
            <input
              type="text"
              value={tempS}
              onChange={(e) => setTempS(e.target.value)}
              className={styles.input}
              placeholder="输入字符串 s"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>p =</label>
            <input
              type="text"
              value={tempP}
              onChange={(e) => setTempP(e.target.value)}
              className={styles.input}
              placeholder="输入字符串 p"
            />
          </div>
          <button className={styles.applyBtn} onClick={handleApply}>
            应用
          </button>
        </div>
      </div>

      <div className={styles.methodHint} aria-live="polite">
        <span className={styles.methodTag}>{algorithmType === 'fixed-window' ? '适合先理解' : '进一步优化'}</span>
        {algorithmType === 'fixed-window'
          ? '窗口始终等于 p 的长度；每一步直接对照字符频次，思路直观。'
          : '用“目标 − 窗口”记录剩余需求；发现字符超量时才移动左边界，单次扫描即可。'}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.samplesRow}>
        <span className={styles.label}>样例：</span>
        {sampleData.map((sample) => (
          <button
            key={sample.name}
            className={styles.sampleBtn}
            onClick={() => handleSampleClick(sample)}
          >
            {sample.name}
          </button>
        ))}
        <button className={styles.randomBtn} onClick={handleRandom}>
          🎲 随机生成
        </button>
      </div>
    </div>
  );
}
