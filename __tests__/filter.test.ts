import { filterContent, normalize } from '../src/filter';

// ─── Normalization ───────────────────────────────────────────────────────────

describe('normalize', () => {
  it('lowercases text', () => {
    expect(normalize('VIADO')).toContain('viado');
  });

  it('strips accents', () => {
    expect(normalize('inútil')).toContain('inutil');
  });

  it('replaces leetspeak', () => {
    expect(normalize('3stup0')).toContain('estupo');
  });

  it('removes zero-width characters', () => {
    expect(normalize('vi\u200Bado')).toContain('viado');
  });

  it('collapses repeated characters', () => {
    expect(normalize('viiaaado')).toContain('viado');
  });

  it('replaces cyrillic homoglyphs', () => {
    // Cyrillic а (U+0430) and о (U+043E)
    expect(normalize('vi\u0430d\u043E')).toContain('viado');
  });
});

// ─── Hard-blocked words ──────────────────────────────────────────────────────

describe('hard-blocked words', () => {
  const blocked = [
    'punheteiro',
    'estupro',
    'viado',
    'arrombado',
    'fdp',
    'buceta',
    'pedofilo',
  ];

  blocked.forEach(word => {
    it(`blocks "${word}"`, () => {
      const result = filterContent(`mensagem com ${word} aqui`);
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });
  });

  it('blocks multi-word phrases', () => {
    expect(filterContent('vou te matar agora').allowed).toBe(false);
    expect(filterContent('manda nude pra mim').allowed).toBe(false);
  });
});

// ─── Bypass attempts ─────────────────────────────────────────────────────────

describe('bypass prevention', () => {
  it('blocks leetspeak: 3stupr0', () => {
    expect(filterContent('3stupr0').allowed).toBe(false);
  });

  it('blocks with accents: viàdo', () => {
    expect(filterContent('viàdo').allowed).toBe(false);
  });

  it('blocks with zero-width chars', () => {
    expect(filterContent('vi\u200Bado').allowed).toBe(false);
  });

  it('blocks repeated chars: viiaaado', () => {
    expect(filterContent('viiaaado').allowed).toBe(false);
  });

  it('blocks mixed case: ViAdO', () => {
    expect(filterContent('ViAdO').allowed).toBe(false);
  });

  it('blocks cyrillic substitution', () => {
    expect(filterContent('vi\u0430d\u043E').allowed).toBe(false);
  });
});

// ─── Abbreviation blocking ──────────────────────────────────────────────────

describe('BR abbreviation blocking', () => {
  it('blocks ppk', () => expect(filterContent('ppk').allowed).toBe(false));
  it('blocks pqp', () => expect(filterContent('pqp').allowed).toBe(false));
  it('blocks krl', () => expect(filterContent('krl').allowed).toBe(false));
  it('blocks gzr', () => expect(filterContent('gzr').allowed).toBe(false));
  it('blocks bct', () => expect(filterContent('bct').allowed).toBe(false));
  it('blocks vsf', () => expect(filterContent('vsf').allowed).toBe(false));
  it('blocks vtnc', () => expect(filterContent('vtnc').allowed).toBe(false));
});

// ─── Dot-separated bypass ───────────────────────────────────────────────────

describe('dot-separated bypass prevention', () => {
  it('blocks p.u.t.a', () => expect(filterContent('p.u.t.a').allowed).toBe(false));
  it('blocks v.i.a.d.o', () => expect(filterContent('v.i.a.d.o').allowed).toBe(false));
  it('blocks p-u-t-a', () => expect(filterContent('p-u-t-a').allowed).toBe(false));
});

// ─── Context-sensitive moved words ──────────────────────────────────────────

describe('pau/rola/cacete as context-sensitive', () => {
  it('allows "rola de ir?"', () => expect(filterContent('rola de ir?').allowed).toBe(true));
  it('allows "rola um papo"', () => expect(filterContent('rola um papo').allowed).toBe(true));
  it('allows "pau mandado"', () => expect(filterContent('pau mandado').allowed).toBe(true));
  it('allows "pau de selfie"', () => expect(filterContent('pau de selfie').allowed).toBe(true));
  it('allows "cacete, que dia"', () => expect(filterContent('cacete, que dia').allowed).toBe(true));
  it('blocks "seu pau" (directed)', () => expect(filterContent('seu pau').allowed).toBe(false));
  it('blocks "toma no cu" (directed)', () => expect(filterContent('toma no cu').allowed).toBe(false));
  it('blocks "voce e um caralho" (directed)', () => expect(filterContent('voce e um caralho').allowed).toBe(false));
});

// ─── Phone number blocking ───────────────────────────────────────────────────

describe('phone number blocking', () => {
  const phones = [
    '21994709426',
    '21 994709426',
    '(21) 99470-9426',
    '+55 21 99470-9426',
    '+5521994709426',
    '11 98765-4321',
    '(11)987654321',
    'Me liga 21 994709426',
    'Meu numero é 11987654321',
  ];

  phones.forEach(input => {
    it(`blocks phone: "${input}"`, () => {
      const result = filterContent(input);
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.matched).toBe('telefone');
    });
  });

  it('blocks split phone numbers (bypass attempt)', () => {
    expect(filterContent('21 9947 0942 6').allowed).toBe(false);
    expect(filterContent('meu zap 2 1 9 9 4 7 0 9 4 2 6').allowed).toBe(false);
    expect(filterContent('liga pra 21-99470-9426').allowed).toBe(false);
  });

  it('blocks messages that are only digits', () => {
    expect(filterContent('9').allowed).toBe(false);
    expect(filterContent('21').allowed).toBe(false);
    expect(filterContent('994709426').allowed).toBe(false);
    expect(filterContent('55').allowed).toBe(false);
  });

  it('does NOT block numbers inside text', () => {
    expect(filterContent('tenho 2 filhos').allowed).toBe(true);
    expect(filterContent('dia 5 de abril').allowed).toBe(true);
    expect(filterContent('3 dias limpo').allowed).toBe(true);
  });

  it('does NOT block short numbers like ages or dates', () => {
    expect(filterContent('tenho 25 anos').allowed).toBe(true);
    expect(filterContent('dia 15 de março').allowed).toBe(true);
    expect(filterContent('são 3 horas').allowed).toBe(true);
    expect(filterContent('120 dias de streak').allowed).toBe(true);
    expect(filterContent('faz 30 dias que parei').allowed).toBe(true);
    expect(filterContent('estou no dia 7').allowed).toBe(true);
  });
});

// ─── Link blocking ───────────────────────────────────────────────────────────

describe('link blocking', () => {
  it('blocks https URLs', () => {
    expect(filterContent('veja https://exemplo.com').allowed).toBe(false);
  });

  it('blocks http URLs', () => {
    expect(filterContent('http://site.com/page').allowed).toBe(false);
  });

  it('blocks www URLs', () => {
    expect(filterContent('entra em www.site.com').allowed).toBe(false);
  });

  it('blocks .com domains', () => {
    expect(filterContent('me acha no instagram.com').allowed).toBe(false);
  });

  it('blocks .br domains', () => {
    expect(filterContent('acessa meusite.com.br').allowed).toBe(false);
  });

  it('blocks various TLDs', () => {
    expect(filterContent('site.net').allowed).toBe(false);
    expect(filterContent('site.org').allowed).toBe(false);
    expect(filterContent('site.io').allowed).toBe(false);
    expect(filterContent('site.tv').allowed).toBe(false);
  });

  it('does NOT block normal text', () => {
    expect(filterContent('estou melhorando').allowed).toBe(true);
    expect(filterContent('obrigado pelo apoio').allowed).toBe(true);
  });
});

// ─── False positive prevention ───────────────────────────────────────────────

describe('false positives — must NEVER block', () => {
  const safe = [
    'Eu me sinto um lixo',
    'Me sinto inútil hoje',
    'Sou um fracassado',
    'Eu me acho patético',
    'Estou me sentindo fraco',
    'To me sentindo um idiota',
    'Tive uma recaída ontem',
    'Preciso de ajuda',
    'Estou com medo',
    'Me sinto perdido',
    'Não consigo parar',
    'Hoje foi um dia difícil',
    'Meu vício está forte',
    'Quero mudar minha vida',
    'Obrigado por me ouvir',
    'Estou tentando melhorar',
    'Cada dia é uma luta',
    'Me sinto envergonhado',
    'Computador está lento',
    'Vou disputar o jogo',
    'O deputado falou',
    'Reputação é importante',
    'Assassino no filme',
  ];

  safe.forEach(phrase => {
    it(`allows: "${phrase}"`, () => {
      expect(filterContent(phrase).allowed).toBe(true);
    });
  });
});

// ─── Context-sensitive: self-expression vs directed ──────────────────────────

describe('context-sensitive filtering', () => {
  describe('self-expression (allowed)', () => {
    it('allows "eu me sinto um lixo"', () => {
      expect(filterContent('eu me sinto um lixo').allowed).toBe(true);
    });

    it('allows "me sinto idiota"', () => {
      expect(filterContent('me sinto idiota').allowed).toBe(true);
    });

    it('allows "sou um burro"', () => {
      expect(filterContent('sou um burro').allowed).toBe(true);
    });

    it('allows "estou me sentindo ridículo"', () => {
      expect(filterContent('estou me sentindo ridículo').allowed).toBe(true);
    });
  });

  describe('directed insults (blocked)', () => {
    it('blocks "você é um lixo"', () => {
      const result = filterContent('você é um lixo');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('directed_insult');
    });

    it('blocks "seu idiota"', () => {
      const result = filterContent('seu idiota');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('directed_insult');
    });

    it('blocks "tu é burro"', () => {
      const result = filterContent('tu é burro');
      expect(result.allowed).toBe(false);
    });

    it('blocks "sua nojenta"', () => {
      const result = filterContent('sua nojenta');
      expect(result.allowed).toBe(false);
    });

    it('blocks "cala a boca idiota"', () => {
      const result = filterContent('cala a boca idiota');
      expect(result.allowed).toBe(false);
    });
  });

  describe('ambiguous context (allowed — benefit of the doubt)', () => {
    it('allows "sou um lixo" without self-expression pattern', () => {
      // "sou um" IS a self-expression pattern, so this should be allowed
      expect(filterContent('sou um lixo').allowed).toBe(true);
    });

    it('allows "me sinto nojento"', () => {
      expect(filterContent('me sinto nojento').allowed).toBe(true);
    });
  });
});

// ─── Word boundary — substring safety ────────────────────────────────────────

describe('word boundary safety', () => {
  it('does NOT block "computador" (contains "puta")', () => {
    expect(filterContent('meu computador').allowed).toBe(true);
  });

  it('does NOT block "disputa" (contains "puta")', () => {
    expect(filterContent('vou disputar').allowed).toBe(true);
  });

  it('does NOT block "deputado" (contains "puta")', () => {
    expect(filterContent('o deputado').allowed).toBe(true);
  });

  it('does NOT block "reputação" (contains "puta")', () => {
    expect(filterContent('minha reputação').allowed).toBe(true);
  });

  it('does NOT block "assassino" (contains "ass")', () => {
    expect(filterContent('o assassino').allowed).toBe(true);
  });
});

// ─── Fuzzy matching (Levenshtein) ────────────────────────────────────────

describe('fuzzy matching — typo variants', () => {
  it('blocks "viadro" (typo for viado, dist 1)', () => {
    const result = filterContent('viadro');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('fuzzy_match');
  });

  it('blocks "bucetra" (typo for buceta, dist 1)', () => {
    const result = filterContent('bucetra');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('fuzzy_match');
  });

  it('blocks "estupeo" (typo for estupro, dist 1)', () => {
    const result = filterContent('estupeo');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('fuzzy_match');
  });

  it('does NOT fuzzy match short words (< 5 chars)', () => {
    // "putra" is 5 chars but the target "puta" is 4 chars — threshold for 5-char word is 1
    // but we only fuzzy match against words with length >= 5 in the wordlist
    expect(filterContent('putra').allowed).toBe(true);
  });

  it('does NOT fuzzy match exact matches (dist 0 skipped)', () => {
    // Exact matches are handled by Layer 1 regex, not fuzzy
    const result = filterContent('estupro');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('hard_block');
  });

  it('blocks long word typos with dist 2: "arrombadoo" → arrombado', () => {
    // After normalization collapse, "arrombadoo" → "arrombado" (exact)
    // Use a different variant: "arrombadk" (8+ chars, dist 1)
    const result = filterContent('arrombadk');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('fuzzy_match');
  });
});

describe('fuzzy match — performance', () => {
  it('fuzzy match adds < 10ms per 2000-char message', () => {
    const longText = 'palavras normais do dia a dia sem nenhum conteudo toxico '.repeat(35);
    // warm up JIT
    filterContent(longText);
    const start = Date.now();
    for (let i = 0; i < 50; i++) filterContent(longText);
    const elapsed = Date.now() - start;
    // 50 runs < 500ms = avg < 10ms each (accounts for CI/WSL overhead)
    expect(elapsed).toBeLessThan(500);
  });
});

// ─── Performance ─────────────────────────────────────────────────────────────

describe('performance', () => {
  it('filters a 2000-char message in under 10ms', () => {
    const longText = 'a'.repeat(2000);
    const start = Date.now();
    for (let i = 0; i < 100; i++) filterContent(longText);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000); // 100 runs < 1s = avg < 10ms each
  });
});
