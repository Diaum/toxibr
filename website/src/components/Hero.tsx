import './Hero.css';

interface HeroProps {
  onCopy: () => void;
  version: string;
}

export default function Hero({ onCopy, version }: HeroProps) {
  const copy = () => {
    navigator.clipboard.writeText('npm install toxibr');
    onCopy();
  };

  return (
    <section className="hero">
      <div className="hero-badges">
        <span className="hero-badge purple">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          v{version}
        </span>
        <span className="hero-badge pink">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Open Source
        </span>
        <span className="hero-badge green">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Zero Deps
        </span>
      </div>

      <h1 className="hero-title">
        <span className="hero-gradient">Lib de moderação</span>
        <br />
        para chats tóxicos 🇧🇷
      </h1>

      <p className="hero-highlight">
        <span className="hl-accent">Bloqueio por contexto.</span>{' '}
        <span className="hl-green">Anti-bypass.</span> <span className="hl-pink">&lt; 1ms.</span>
      </p>

      <p className="hero-desc">
        Filtro de conteudo toxico open source para chats e comunidades online. Bloqueie palavras e
        ofensas usando contexto e normalizacao.
      </p>

      <div className="hero-actions">
        <button className="install-btn" onClick={copy}>
          <span className="install-prompt">$</span>
          npm install toxibr
          <svg
            className="install-copy"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
        <a
          href="https://github.com/Diaum/toxibr"
          target="_blank"
          rel="noopener"
          className="hero-link-btn"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/toxibr"
          target="_blank"
          rel="noopener"
          className="hero-link-btn npm-btn"
        >
          npm
        </a>
      </div>
    </section>
  );
}
