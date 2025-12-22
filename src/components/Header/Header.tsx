import { useEffect, useState } from 'react';
import { getGitHubStars, GITHUB_REPO_URL } from '../../utils/github';
import styles from './Header.module.css';

interface HeaderProps {
  onShowThoughts: () => void;
}

export function Header({ onShowThoughts }: HeaderProps) {
  const [stars, setStars] = useState<number>(0);

  useEffect(() => {
    getGitHubStars().then(setStars);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <a
          href="https://fuck-algorithm.github.io/leetcode-hot-100/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.backLink}
        >
          ← 返回 Leetcode Hot 100
        </a>
      </div>

      <div className={styles.centerSection}>
        <a
          href="https://leetcode.cn/problems/find-all-anagrams-in-a-string/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.titleLink}
        >
          <h1 className={styles.title}>438. 找到字符串中所有字母异位词</h1>
        </a>
      </div>

      <div className={styles.rightSection}>
        <button className={styles.thoughtsBtn} onClick={onShowThoughts}>
          💡 算法思路
        </button>
        
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
          title="点击去 GitHub 仓库 Star 支持一下"
        >
          <svg className={styles.githubIcon} viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className={styles.starCount}>⭐ {stars}</span>
        </a>
      </div>
    </header>
  );
}
