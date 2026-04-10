import './WhyContext.css';

interface Example {
  text: string;
  traditional: { status: 'FLAGGED' | 'ALLOWED'; reason: string };
  toxibr: { status: 'FLAGGED' | 'ALLOWED'; reason: string };
}

const examples: Example[] = [
  {
    text: '"Esse filme e incrivel!"',
    traditional: { status: 'FLAGGED', reason: "Contem substring 'crivel'" },
    toxibr: { status: 'ALLOWED', reason: 'Sentimento positivo detectado' },
  },
  {
    text: '"Aquele boss fight e insano!"',
    traditional: { status: 'FLAGGED', reason: "Contem substring 'insano'" },
    toxibr: { status: 'ALLOWED', reason: 'Contexto de gaming detectado' },
  },
  {
    text: '"Me sinto um lixo"',
    traditional: { status: 'FLAGGED', reason: "Contem substring 'lixo'" },
    toxibr: { status: 'ALLOWED', reason: 'Auto-expressao detectada' },
  },
];

export default function WhyContext() {
  return (
    <section className="why-context-section">
      <h2 className="why-context-title">Por que contexto importa</h2>
      <p className="why-context-subtitle">
        Filtros tradicionais bloqueiam palavras inocentes. ToxiBR entende a diferenca.
      </p>

      <div className="why-context-grid">
        <div className="why-context-column">
          <div className="why-context-header bad">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
            Filtro Tradicional
          </div>
          <div className="why-context-card bad">
            {examples.map((ex, i) => (
              <div key={i} className="why-context-example">
                <div className="why-context-row">
                  <span className="why-context-text">{ex.text}</span>
                  <span className={`why-context-badge ${ex.traditional.status.toLowerCase()}`}>
                    {ex.traditional.status}
                  </span>
                </div>
                <span className="why-context-reason bad">{ex.traditional.reason}</span>
                {i < examples.length - 1 && <div className="why-context-divider" />}
              </div>
            ))}
            <div className="why-context-footer bad">75% de falsos positivos</div>
          </div>
        </div>

        <div className="why-context-column">
          <div className="why-context-header good">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            ToxiBR Context-Aware
          </div>
          <div className="why-context-card good">
            {examples.map((ex, i) => (
              <div key={i} className="why-context-example">
                <div className="why-context-row">
                  <span className="why-context-text">{ex.text}</span>
                  <span className={`why-context-badge ${ex.toxibr.status.toLowerCase()}`}>
                    {ex.toxibr.status}
                  </span>
                </div>
                <span className="why-context-reason good">{ex.toxibr.reason}</span>
                {i < examples.length - 1 && <div className="why-context-divider" />}
              </div>
            ))}
            <div className="why-context-footer good">~10% de falsos positivos — 85% de melhoria!</div>
          </div>
        </div>
      </div>
    </section>
  );
}
