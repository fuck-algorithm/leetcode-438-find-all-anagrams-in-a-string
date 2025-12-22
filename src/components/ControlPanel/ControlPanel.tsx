import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import styles from './ControlPanel.module.css';

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function ControlPanel() {
  const {
    steps,
    currentStep,
    setCurrentStep,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
  } = useAppStore();

  const intervalRef = useRef<number | null>(null);
  const totalSteps = steps.length;

  // 播放逻辑
  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      intervalRef.current = window.setInterval(() => {
        setCurrentStep(currentStep + 1);
      }, 1000 / speed);
    } else if (currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentStep, totalSteps, speed, setCurrentStep, setIsPlaying]);

  // 键盘快捷键
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;

    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentStep > 0) setCurrentStep(currentStep - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
        break;
      case 'Space':
        e.preventDefault();
        setIsPlaying(!isPlaying);
        break;
      case 'KeyR':
        e.preventDefault();
        setCurrentStep(0);
        setIsPlaying(false);
        break;
    }
  }, [currentStep, totalSteps, isPlaying, setCurrentStep, setIsPlaying]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentStep(parseInt(e.target.value, 10));
  };

  const handleProgressMouseDown = () => {
    setIsPlaying(false);
  };

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={handlePrev} disabled={currentStep === 0}>
          ⏮ 上一步 <span className={styles.shortcut}>←</span>
        </button>

        <button className={styles.playBtn} onClick={handlePlayPause}>
          {isPlaying ? '⏸ 暂停' : '▶ 播放'} <span className={styles.shortcut}>Space</span>
        </button>

        <button className={styles.btn} onClick={handleNext} disabled={currentStep >= totalSteps - 1}>
          下一步 ⏭ <span className={styles.shortcut}>→</span>
        </button>

        <button className={styles.resetBtn} onClick={handleReset}>
          ↺ 重置 <span className={styles.shortcut}>R</span>
        </button>

        <div className={styles.speedControl}>
          <span className={styles.speedLabel}>速度:</span>
          <div className={styles.speedButtons}>
            {speedOptions.map((s) => (
              <button
                key={s}
                className={`${styles.speedBtn} ${speed === s ? styles.active : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className={styles.stepInfo}>
          步骤 {currentStep + 1} / {totalSteps}
        </div>
      </div>

      <div className={styles.progressContainer}>
        <input
          type="range"
          min="0"
          max={totalSteps - 1}
          value={currentStep}
          onChange={handleProgressChange}
          onMouseDown={handleProgressMouseDown}
          className={styles.progressInput}
          style={{
            background: `linear-gradient(to right, #48bb78 0%, #48bb78 ${progress}%, #4a5568 ${progress}%, #4a5568 100%)`,
          }}
        />
      </div>
    </div>
  );
}
