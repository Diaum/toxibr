import { useState } from 'react';
import './FalsePositivePanel.css';

export interface FPEntry {
  word: string;
  matched: string;
  reason: string;
  context: string; // full message where the word was detected
  type: 'false_positive' | 'not_caught'; // FP or missed word
}

interface FalsePositivePanelProps {
  entries: FPEntry[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

function extractContext(word: string, fullText: string): string {
  const lower = fullText.toLowerCase();
  const wordLower = word.toLowerCase();
  const idx = lower.indexOf(wordLower);
  if (idx === -1) return fullText.substring(0, 100);

  // Get ~5 words before and after
  const before = fullText.substring(0, idx);
  const after = fullText.substring(idx + word.length);

  const wordsBefore = before.split(/\s+/).filter(Boolean);
  const wordsAfter = after.split(/\s+/).filter(Boolean);

  const contextBefore = wordsBefore.slice(-5).join(' ');
  const contextAfter = wordsAfter.slice(0, 5).join(' ');

  const prefix = wordsBefore.length > 5 ? '...' : '';
  const suffix = wordsAfter.length > 5 ? '...' : '';

  return `${prefix}${contextBefore} **[${word}]** ${contextAfter}${suffix}`;
}

export default function FalsePositivePanel({
  entries,
  onRemove,
  onClear,
}: FalsePositivePanelProps) {
  const [minimized, setMinimized] = useState(false);

  if (entries.length === 0) return null;

  const fpEntries = entries.filter((e) => e.type === 'false_positive');
  const missedEntries = entries.filter((e) => e.type === 'not_caught');

  const handleSubmit = () => {
    const sections: string[] = [
      '## Relatorio de moderacao — ToxiBR Playground',
      '',
      `**Total de itens:** ${entries.length}`,
      '',
    ];

    if (fpEntries.length > 0) {
      sections.push('### Falsos positivos (palavras bloqueadas que NAO deveriam ser)');
      sections.push('');
      sections.push(
        'Essas palavras foram bloqueadas pelo filtro mas sao inocentes no contexto em que foram usadas.'
      );
      sections.push('');
      for (const e of fpEntries) {
        const ctx = extractContext(e.word, e.context);
        sections.push(`**Palavra:** \`${e.word}\``);
        sections.push(`**Detectada como:** \`${e.matched}\` (${e.reason})`);
        sections.push(`**Contexto:** ${ctx}`);
        sections.push('');
      }
      sections.push('');
      sections.push(
        '> **Acao esperada:** Revisar se a palavra deve ser adicionada na FUZZY_ALLOWLIST ou removida da wordlist.'
      );
      sections.push('');
    }

    if (missedEntries.length > 0) {
      sections.push('### Palavras/frases NAO capturadas (deveriam ser bloqueadas)');
      sections.push('');
      sections.push('Essas palavras ou frases passaram pelo filtro mas contem conteudo toxico.');
      sections.push('');
      for (const e of missedEntries) {
        const ctx = extractContext(e.word, e.context);
        sections.push(`**Palavra/frase:** \`${e.word}\``);
        sections.push(`**Contexto:** ${ctx}`);
        sections.push('');
      }
      sections.push('');
      sections.push(
        '> **Acao esperada:** Avaliar se a palavra/frase deve ser adicionada em HARD_BLOCKED, CONTEXT_SENSITIVE ou como frase composta.'
      );
      sections.push('');
    }

    sections.push('---');
    sections.push('*Enviado pelo Playground do site ToxiBR*');

    const hasFP = fpEntries.length > 0;
    const hasMissed = missedEntries.length > 0;
    let title = '';
    if (hasFP && hasMissed) {
      title = `[Moderacao] ${fpEntries.length} falso(s) positivo(s) + ${missedEntries.length} palavra(s) nao capturada(s)`;
    } else if (hasFP) {
      title = `[Falso positivo] ${fpEntries.length} palavra(s) reportada(s)`;
    } else {
      title = `[Nao capturado] ${missedEntries.length} palavra(s)/frase(s) reportada(s)`;
    }

    const labels = [hasFP ? 'false-positive' : '', hasMissed ? 'wordlist' : '']
      .filter(Boolean)
      .join(',');
    const url = `https://github.com/Diaum/toxibr/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(sections.join('\n'))}&labels=${encodeURIComponent(labels)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`fp-panel ${minimized ? 'minimized' : ''}`}>
      <div className="fp-header" onClick={() => setMinimized(!minimized)}>
        <span className="fp-title">
          <span className="fp-badge">{entries.length}</span>
          Relatorio
        </span>
        <button className="fp-toggle">{minimized ? '+' : '-'}</button>
      </div>

      {!minimized && (
        <>
          <div className="fp-list">
            {entries.map((e, i) => (
              <div key={i} className={`fp-item ${e.type === 'not_caught' ? 'missed' : ''}`}>
                <div className="fp-item-info">
                  <span className="fp-word">{e.word}</span>
                  <span className="fp-type">
                    {e.type === 'false_positive' ? 'Falso positivo' : 'Nao capturado'}
                  </span>
                  {e.type === 'false_positive' && (
                    <span className="fp-matched">detectou: {e.matched}</span>
                  )}
                </div>
                <button className="fp-remove" onClick={() => onRemove(i)}>
                  x
                </button>
              </div>
            ))}
          </div>

          <div className="fp-actions">
            <button className="fp-submit" onClick={handleSubmit}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Enviar issue no GitHub
            </button>
            <button className="fp-clear" onClick={onClear}>
              Limpar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
