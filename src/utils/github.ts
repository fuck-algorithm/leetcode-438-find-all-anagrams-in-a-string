import { getCache, saveCache, getExpiredCache } from './indexedDB';

const GITHUB_REPO = 'fuck-algorithm/438-find-all-anagrams-in-a-string';
const CACHE_KEY = 'github-stars';

export interface GitHubRepoInfo {
  stargazers_count: number;
}

export async function getGitHubStars(): Promise<number> {
  // 先尝试从缓存获取（1小时内有效）
  const cachedStars = await getCache<number>(CACHE_KEY);
  if (cachedStars !== null) {
    return cachedStars;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    const data: GitHubRepoInfo = await response.json();
    const stars = data.stargazers_count;
    
    // 保存到缓存
    await saveCache(CACHE_KEY, stars);
    return stars;
  } catch {
    // 获取失败，尝试读取过期缓存
    const expiredCache = await getExpiredCache<number>(CACHE_KEY);
    if (expiredCache !== null) {
      return expiredCache;
    }
    // 没有缓存，返回默认值0
    return 0;
  }
}

export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;
