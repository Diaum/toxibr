import './Examples.css';

interface ExamplesProps {
  onSelect: (text: string) => void;
}

const examples = [
  // — Exemplos curtos —
  { text: 'eu me sinto um lixo', type: 'safe' as const },
  { text: 'voce e um lixo', type: 'toxic' as const },
  { text: '3stupr0', type: 'bypass' as const },
  { text: 'meu computador travou', type: 'safe' as const },
  { text: 'p.u.t.a', type: 'bypass' as const },
  { text: 'sua gostosa', type: 'toxic' as const },
  { text: 'comida gostosa', type: 'safe' as const },
  { text: '(21) 99470-9426', type: 'toxic' as const },
  { text: 'viiaaado', label: 'viiaaado (repetido)', type: 'bypass' as const },
  { text: 'preciso de ajuda', type: 'safe' as const },
  { text: 'ppk', type: 'bypass' as const },
  { text: 'pau de selfie', type: 'safe' as const },

  // — Exemplos longos (frases realistas) —
  {
    text: 'eu me sinto um lixo mas queria que voce me respeitasse',
    label: 'Context-aware (auto-expressão)',
    type: 'safe' as const,
  },
  {
    text: 'caralho tiozao tu ta de brincadeira, voce e um lixo cara',
    label: 'Insulto + exclamação misturados',
    type: 'toxic' as const,
  },
  {
    text: '3stupr0 v.i.a.d.o p*ta',
    label: 'Bypass (leetspeak + pontos + censura)',
    type: 'bypass' as const,
  },
];

export default function Examples({ onSelect }: ExamplesProps) {
  const handleClick = (text: string) => {
    const setter = (window as any).__scannerSetText;
    if (setter) setter(text);
    else onSelect(text);
  };

  return (
    <section className="examples-section">
      <div className="examples-inner">
        <h3 className="examples-title">Exemplos para testar</h3>
        <div className="examples-grid">
          {examples.map((ex, i) => (
            <button key={i} className="example-chip" onClick={() => handleClick(ex.text)}>
              <span className={`example-dot ${ex.type}`} />
              <span className="example-text">{ex.label || ex.text}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
