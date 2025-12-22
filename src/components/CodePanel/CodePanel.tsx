import { Highlight, themes } from 'prism-react-renderer';
import { useAppStore } from '../../stores/useAppStore';
import { fixedWindowCode, variableWindowCode } from '../../algorithms';
import type { ProgrammingLanguage } from '../../types';
import styles from './CodePanel.module.css';

const languageLabels: Record<ProgrammingLanguage, string> = {
  java: 'Java',
  python: 'Python',
  golang: 'Go',
  javascript: 'JavaScript',
};

const prismLanguages: Record<ProgrammingLanguage, string> = {
  java: 'java',
  python: 'python',
  golang: 'go',
  javascript: 'javascript',
};

export function CodePanel() {
  const { language, setLanguage, algorithmType, steps, currentStep } = useAppStore();
  
  const code = algorithmType === 'fixed-window' ? fixedWindowCode : variableWindowCode;
  const currentCode = code[language];
  const currentStepData = steps[currentStep];
  const highlightLines = currentStepData?.codeLines[language] || [];

  // 获取当前变量状态用于显示
  const variables = currentStepData?.variables || {};

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          {(Object.keys(languageLabels) as ProgrammingLanguage[]).map((lang) => (
            <button
              key={lang}
              className={`${styles.tab} ${language === lang ? styles.active : ''}`}
              onClick={() => setLanguage(lang)}
            >
              {languageLabels[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.codeContainer}>
        <Highlight
          theme={themes.nightOwl}
          code={currentCode}
          language={prismLanguages[language]}
        >
          {({ style, tokens, getLineProps, getTokenProps }: {
            style: React.CSSProperties;
            tokens: { content: string; types: string[] }[][];
            getLineProps: (input: { line: { content: string; types: string[] }[] }) => Record<string, unknown>;
            getTokenProps: (input: { token: { content: string; types: string[] } }) => Record<string, unknown>;
          }) => (
            <pre className={styles.pre} style={style}>
              {tokens.map((line: { content: string; types: string[] }[], i: number) => {
                const lineNumber = i + 1;
                const isHighlighted = highlightLines.includes(lineNumber);
                return (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className={`${styles.line} ${isHighlighted ? styles.highlighted : ''}`}
                  >
                    <span className={styles.lineNumber}>{lineNumber}</span>
                    <span className={styles.lineContent}>
                      {line.map((token: { content: string; types: string[] }, key: number) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                    {isHighlighted && renderVariableHint(lineNumber, variables, language)}
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

// 渲染变量提示
function renderVariableHint(
  lineNumber: number,
  variables: Record<string, unknown>,
  language: ProgrammingLanguage
): React.ReactNode {
  // 根据行号和语言决定显示哪些变量
  const hints: string[] = [];

  // 通用变量显示逻辑
  if (variables.right !== undefined) {
    hints.push(`right=${variables.right}`);
  }
  if (variables.left !== undefined) {
    hints.push(`left=${variables.left}`);
  }
  if (variables.c !== undefined) {
    hints.push(`c='${variables.c}'`);
  }
  if (variables.out !== undefined) {
    hints.push(`out='${variables.out}'`);
  }
  if (variables.isMatch !== undefined) {
    hints.push(`match=${variables.isMatch}`);
  }

  // 只在特定行显示
  const showOnLines: Record<ProgrammingLanguage, number[]> = {
    java: [11, 16, 17, 20],
    python: [6, 11, 12, 14],
    golang: [9, 15, 16, 19],
    javascript: [10, 15, 16, 19],
  };

  if (!showOnLines[language].includes(lineNumber) || hints.length === 0) {
    return null;
  }

  return (
    <span className={styles.variableHint}>
      {hints.slice(0, 3).join(', ')}
    </span>
  );
}
