/**
 * 滑动窗口算法 - 手动步骤验证
 * 测试用例: s="cbaebabacd", p="abc"
 */

console.log('============================================');
console.log('🧪 滑动窗口算法 - 完整步骤验证');
console.log('============================================\n');

// 测试数据
const s = "cbaebabacd";
const p = "abc";

console.log(`输入: s="${s}", p="${p}"`);
console.log(`预期结果: [0, 6]\n`);

// 辅助函数：比较两个频率对象
function isEqual(freq1, freq2) {
    const keys1 = Object.keys(freq1).sort();
    const keys2 = Object.keys(freq2).sort();
    
    if (keys1.length !== keys2.length) return false;
    
    for (let i = 0; i < keys1.length; i++) {
        if (keys1[i] !== keys2[i] || freq1[keys1[i]] !== freq2[keys2[i]]) {
            return false;
        }
    }
    return true;
}

// 辅助函数：格式化频率对象
function formatFreq(freq) {
    return JSON.stringify(freq);
}

// ========================================
// 第一步：统计p的频率
// ========================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 第一步：统计模式串p的字符频率');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const pFreq = {};
for (const char of p) {
    pFreq[char] = (pFreq[char] || 0) + 1;
}

console.log(`模式串p: "${p}"`);
console.log(`频率统计: ${formatFreq(pFreq)}`);
console.log('✅ 正确\n');

// ========================================
// 第二步：初始化第一个窗口
// ========================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🪟 第二步：创建第一个窗口');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const result = [];
const windowSize = p.length;
let sFreq = {};

for (let i = 0; i < windowSize; i++) {
    const char = s[i];
    sFreq[char] = (sFreq[char] || 0) + 1;
}

console.log(`窗口大小: ${windowSize}`);
console.log(`窗口位置: [0, ${windowSize - 1}]`);
console.log(`窗口内容: "${s.substring(0, windowSize)}"`);
console.log(`窗口频率: ${formatFreq(sFreq)}`);
console.log('✅ 正确\n');

// ========================================
// 第三步：检查第一个窗口
// ========================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 第三步：检查第一个窗口');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const firstMatch = isEqual(sFreq, pFreq);
if (firstMatch) result.push(0);

console.log(`窗口频率: ${formatFreq(sFreq)}`);
console.log(`模式频率: ${formatFreq(pFreq)}`);
console.log(`是否匹配: ${firstMatch ? '✅ YES' : '❌ NO'}`);
if (firstMatch) {
    console.log(`✅ 找到匹配！索引 0 加入结果`);
    console.log(`当前结果: [${result.join(', ')}]`);
}
console.log();

// ========================================
// 第四步：滑动窗口循环
// ========================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔄 第四步：开始滑动窗口');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let stepNumber = 1;

for (let i = windowSize; i < s.length; i++) {
    console.log(`┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`);
    console.log(`┃  步骤 ${stepNumber} - 索引 i=${i} (窗口移动)      ┃`);
    console.log(`┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
    
    const leftPointer = i - windowSize + 1;
    const rightPointer = i;
    const leftChar = s[i - windowSize];
    const rightChar = s[i];
    
    console.log(`\n📍 窗口位置: [${leftPointer}, ${rightPointer}]`);
    console.log(`   目标窗口内容: "${s.substring(leftPointer, rightPointer + 1)}"`);
    
    // 步骤1: 移除左边字符
    console.log(`\n⬅️  步骤 ${stepNumber}.1 - 移除左边字符`);
    console.log(`   ├─ 要移除的字符: s[${i - windowSize}] = '${leftChar}'`);
    console.log(`   ├─ 移除前频率: ${formatFreq(sFreq)}`);
    
    const oldLeftCount = sFreq[leftChar];
    sFreq[leftChar]--;
    if (sFreq[leftChar] === 0) delete sFreq[leftChar];
    
    console.log(`   ├─ '${leftChar}' 的频率: ${oldLeftCount} → ${sFreq[leftChar] || 0}`);
    console.log(`   └─ 移除后频率: ${formatFreq(sFreq)}`);
    console.log(`   ⚠️  此时窗口过渡状态: "${s.substring(leftPointer, rightPointer)}" (还缺右边的字符)`);
    
    // 步骤2: 添加右边字符
    console.log(`\n➡️  步骤 ${stepNumber}.2 - 添加右边字符`);
    console.log(`   ├─ 要添加的字符: s[${i}] = '${rightChar}'`);
    console.log(`   ├─ 添加前频率: ${formatFreq(sFreq)}`);
    
    const oldRightCount = sFreq[rightChar] || 0;
    sFreq[rightChar] = (sFreq[rightChar] || 0) + 1;
    
    console.log(`   ├─ '${rightChar}' 的频率: ${oldRightCount} → ${sFreq[rightChar]}`);
    console.log(`   └─ 添加后频率: ${formatFreq(sFreq)}`);
    console.log(`   ✅ 窗口完整: "${s.substring(leftPointer, rightPointer + 1)}"`);
    
    // 步骤3: 比较
    console.log(`\n🔍 步骤 ${stepNumber}.3 - 比较频率`);
    console.log(`   ├─ 窗口频率: ${formatFreq(sFreq)}`);
    console.log(`   ├─ 模式频率: ${formatFreq(pFreq)}`);
    
    const isMatch = isEqual(sFreq, pFreq);
    if (isMatch) {
        result.push(leftPointer);
        console.log(`   └─ 结果: ✅ 匹配！索引 ${leftPointer} 加入结果`);
        console.log(`\n   🎉 找到异位词: "${s.substring(leftPointer, rightPointer + 1)}"`);
    } else {
        console.log(`   └─ 结果: ❌ 不匹配`);
        
        // 详细说明为什么不匹配
        const sKeys = new Set(Object.keys(sFreq));
        const pKeys = new Set(Object.keys(pFreq));
        const allKeys = new Set([...sKeys, ...pKeys]);
        
        const diffs = [];
        for (const key of allKeys) {
            const sCount = sFreq[key] || 0;
            const pCount = pFreq[key] || 0;
            if (sCount !== pCount) {
                diffs.push(`'${key}': 窗口${sCount} vs 模式${pCount}`);
            }
        }
        console.log(`   📝 差异: ${diffs.join(', ')}`);
    }
    
    console.log(`\n   📊 当前结果数组: [${result.join(', ')}]`);
    console.log(`\n${'─'.repeat(50)}\n`);
    
    stepNumber++;
}

// ========================================
// 最终结果
// ========================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 最终结果');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n返回数组: [${result.join(', ')}]`);
console.log(`\n验证:`);
result.forEach(idx => {
    const substr = s.substring(idx, idx + p.length);
    console.log(`  索引 ${idx}: "${substr}" ✅`);
});

const expected = [0, 6];
const isCorrect = JSON.stringify(result) === JSON.stringify(expected);

console.log(`\n预期结果: [${expected.join(', ')}]`);
console.log(`算法结果: [${result.join(', ')}]`);
console.log(`\n${isCorrect ? '✅✅✅ 算法完全正确！' : '❌❌❌ 算法有误！'}`);
console.log('\n============================================');
console.log('测试完成');
console.log('============================================\n');

// 输出性能分析
console.log('📈 性能分析:');
console.log(`  - 字符串长度: ${s.length}`);
console.log(`  - 窗口大小: ${windowSize}`);
console.log(`  - 总步骤数: ${s.length - windowSize + 1} 次窗口检查`);
console.log(`  - 每步操作: 移除1个字符 + 添加1个字符 + 比较频率`);
console.log(`  - 时间复杂度: O(n) - 只遍历一次`);
console.log(`  - 空间复杂度: O(1) - 字典最多26个字母\n`);
