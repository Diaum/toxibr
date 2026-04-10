import { useState, useCallback } from 'react';
import { filterContent, normalize, HARD_BLOCKED, CONTEXT_SENSITIVE } from 'toxibr';
import pkgJson from '../../package.json';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Terminal from './components/Terminal';
import Scanner from './components/Scanner';
import Examples from './components/Examples';
import Stats from './components/Stats';
import WhyContext from './components/WhyContext';
import HowToUse from './components/HowToUse';
import Glossary from './components/Glossary';
import SubmitWord from './components/SubmitWord';
import FalsePositivePanel from './components/FalsePositivePanel';
import type { FPEntry } from './components/FalsePositivePanel';
import Footer from './components/Footer';
import Toast from './components/Toast';

export type Page = 'home' | 'como-usar';

export interface ScanResult {
  input: string;
  normalized: string;
  allowed: boolean;
  reason?: string;
  matched?: string;
  time: number;
}

function App() {
  const [page, setPage] = useState<Page>('home');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [fpEntries, setFpEntries] = useState<FPEntry[]>([]);

  const handleScan = useCallback((text: string) => {
    if (!text.trim()) {
      setResult(null);
      return;
    }
    const start = performance.now();
    const res = filterContent(text);
    const elapsed = performance.now() - start;
    setResult({
      input: text,
      normalized: normalize(text),
      allowed: res.allowed,
      reason: res.allowed ? undefined : res.reason,
      matched: res.allowed ? undefined : res.matched,
      time: elapsed,
    });
  }, []);

  const showToast = useCallback(() => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1500);
  }, []);

  const handleReportFP = useCallback(
    (word: string, matched: string, reason: string, context: string) => {
      setFpEntries((prev) => {
        if (
          prev.some((e) => e.word === word && e.matched === matched && e.type === 'false_positive')
        )
          return prev;
        return [...prev, { word, matched, reason, context, type: 'false_positive' }];
      });
    },
    []
  );

  const handleReportMissed = useCallback((word: string, context: string) => {
    setFpEntries((prev) => {
      if (prev.some((e) => e.word === word && e.type === 'not_caught')) return prev;
      return [...prev, { word, matched: '', reason: '', context, type: 'not_caught' }];
    });
  }, []);

  const handleRemoveFP = useCallback((index: number) => {
    setFpEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <>
      <div className="glow-orb" />
      <Navbar currentPage={page} onNavigate={setPage} />

      {page === 'home' ? (
        <>
          <Hero onCopy={showToast} version={pkgJson.version} />
          <section className="playground-section">
            <div className="playground-container">
              <Terminal
                result={result}
                version={pkgJson.version}
                onReportFP={handleReportFP}
                onReportMissed={handleReportMissed}
              />
              <Scanner onScan={handleScan} onReset={() => setResult(null)} />
            </div>
          </section>
          <Examples onSelect={handleScan} />
          <WhyContext />
          <Stats totalTerms={HARD_BLOCKED.length + CONTEXT_SENSITIVE.length} />
          <Glossary />
          <SubmitWord />
        </>
      ) : (
        <HowToUse />
      )}

      <Footer />
      <Toast visible={toastVisible} />
      <FalsePositivePanel
        entries={fpEntries}
        onRemove={handleRemoveFP}
        onClear={() => setFpEntries([])}
      />
    </>
  );
}

export default App;
