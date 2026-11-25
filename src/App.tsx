import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { DataInput } from './components/DataInput';
import { CodePanel } from './components/CodePanel';
import { Canvas } from './components/Canvas';
import { ControlPanel } from './components/ControlPanel';
import { AlgorithmThoughts } from './components/AlgorithmThoughts';
import { ProblemDescription } from './components/ProblemDescription';
import { WeChatFloat } from './components/WeChatFloat';
import { useAppStore } from './stores/useAppStore';
import './App.css';

function App() {
  const [showThoughts, setShowThoughts] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const initialize = useAppStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="app">
      <Header onShowProblem={() => setShowProblem(true)} onShowThoughts={() => setShowThoughts(true)} />
      <DataInput />
      
      <div className="main-content">
        <div className="canvas-section">
          <Canvas />
        </div>
        <div className="code-section">
          <CodePanel />
        </div>
      </div>

      <ControlPanel />
      
      <AlgorithmThoughts
        isOpen={showThoughts}
        onClose={() => setShowThoughts(false)}
      />
      <ProblemDescription isOpen={showProblem} onClose={() => setShowProblem(false)} />
      
      <WeChatFloat />
    </div>
  );
}

export default App;
