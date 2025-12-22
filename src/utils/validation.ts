// 验证输入数据是否合法
export function validateInput(s: string, p: string): { valid: boolean; error?: string } {
  // 检查是否为空
  if (!s || s.length === 0) {
    return { valid: false, error: '字符串 s 不能为空' };
  }
  if (!p || p.length === 0) {
    return { valid: false, error: '字符串 p 不能为空' };
  }

  // 检查长度限制
  if (s.length > 30000) {
    return { valid: false, error: '字符串 s 长度不能超过 30000' };
  }
  if (p.length > 30000) {
    return { valid: false, error: '字符串 p 长度不能超过 30000' };
  }

  // 检查是否只包含小写字母
  const lowercaseRegex = /^[a-z]+$/;
  if (!lowercaseRegex.test(s)) {
    return { valid: false, error: '字符串 s 只能包含小写字母' };
  }
  if (!lowercaseRegex.test(p)) {
    return { valid: false, error: '字符串 p 只能包含小写字母' };
  }

  // p 的长度不能大于 s
  if (p.length > s.length) {
    return { valid: false, error: '字符串 p 的长度不能大于字符串 s' };
  }

  return { valid: true };
}

// 生成随机合法数据
export function generateRandomInput(): { s: string; p: string } {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  
  // 随机生成 p 的长度 (2-5)
  const pLength = Math.floor(Math.random() * 4) + 2;
  
  // 随机生成 s 的长度 (p长度的2-5倍)
  const sLength = pLength * (Math.floor(Math.random() * 4) + 2);
  
  // 生成 p
  let p = '';
  for (let i = 0; i < pLength; i++) {
    p += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // 生成 s，确保包含一些 p 的异位词
  let s = '';
  const numAnagrams = Math.floor(Math.random() * 3) + 1; // 1-3个异位词
  
  // 先填充一些随机字符
  const remainingLength = sLength - numAnagrams * pLength;
  for (let i = 0; i < remainingLength; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // 在随机位置插入 p 的异位词
  for (let i = 0; i < numAnagrams; i++) {
    const anagram = shuffleString(p);
    const insertPos = Math.floor(Math.random() * (s.length + 1));
    s = s.slice(0, insertPos) + anagram + s.slice(insertPos);
  }
  
  return { s, p };
}

// 打乱字符串
function shuffleString(str: string): string {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
