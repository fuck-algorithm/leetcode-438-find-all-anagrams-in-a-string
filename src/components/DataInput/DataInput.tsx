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
      <div className={styles.algorithmSelector}>
        <span className={styles.label}>解法：</span>
        <button
          className={`${styles.algorithmBtn} ${algorithmType === 'fixed-window' ? styles.active : ''}`}
          onClick={() => handleAlgorithmChange('fixed-window')}
        >
          定长滑窗
        </button>
        <button
          className={`${styles.algorithmBtn} ${algorithmType === 'variable-window' ? styles.active : ''}`}
          onClick={() => handleAlgorithmChange('variable-window')}
        >
          不定长滑窗
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
