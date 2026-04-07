import { filterContent, normalize, createFilter } from '../src/filter';
import { ptBRLocale, ptPTLocale, esLocale } from '../src/locales/index';

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

// ─── New slurs added in v2 ───────────────────────────────────────────────────

describe('hard-blocked — new slurs (v2)', () => {
  const newSlurs = [
    'lesbica', 'sapata',
    'gazela', 'tchola', 'biba', 'mona', 'bixa',
  ];

  newSlurs.forEach(word => {
    it(`blocks "${word}"`, () => {
      const result = filterContent(`mensagem com ${word} aqui`);
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });
  });
});

// ─── New BR actresses added in v2 ───────────────────────────────────────────

describe('hard-blocked — new BR actresses (v2)', () => {
  const newActresses = [
    'marcia imperator',
    'pamela pantera',
    'martina oliveira',
    'kinechan',
    'aline faria',
    'emme white',
    'amaya takayo',
    'geovanna paes',
    'fabiane thompson',
  ];

  newActresses.forEach(name => {
    it(`blocks "${name}"`, () => {
      const result = filterContent(`quero ver ${name} agora`);
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });
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

// ─── New abbreviation blocking (v2) ─────────────────────────────────────────

describe('BR abbreviation blocking — new (v2)', () => {
  const newAbbrevs = [
    'xxt', 'sfd', 'sfda', 'vgb', 'crn', 'fdd', 'bctuda', 'rabt',
    'fdnd', 'kng', 'tzao', 'ptnh', 'piroq', 'prq', 'pnt',
    'cuz', 'cz', 'gls', 'chp', 'cnh',
    'peit', 'peitd', 'raba',
    'xrc', 'xib', 'pz',
  ];

  newAbbrevs.forEach(abbrev => {
    it(`blocks "${abbrev}"`, () => {
      expect(filterContent(abbrev).allowed).toBe(false);
    });
  });
});

// ─── Abbreviation fixes (v2) ────────────────────────────────────────────────

describe('abbreviation fixes (v2)', () => {
  it('blocks "pnc" (fixed expansion: pau no cu)', () => {
    expect(filterContent('pnc').allowed).toBe(false);
  });

  it('blocks "dlc" (fixed key: was dlç)', () => {
    expect(filterContent('dlc').allowed).toBe(false);
  });
});

// ─── pinto/dp as context-sensitive (v2.1 fix) ───────────────────────────────
//
// "pinto" foi REMOVIDO de todas as listas para evitar que o fuzzy matcher
// (Levenshtein dist 1) confundisse "sinto" com "pinto", bloqueando todas
// as frases de auto-expressão ("me sinto um lixo", etc).
//
// Tradeoff aceito: "seu pinto" não é mais bloqueado pelo context-sensitive.
// Apenas a abreviação "pnt" permanece em HARD_BLOCKED.
//
// "dp" foi movido de HARD_BLOCKED → CONTEXT_SENSITIVE porque 2 letras
// geram falso positivo em contexto inocente ("o dp do prédio").

describe('pinto/dp as context-sensitive (v2.1)', () => {
  // pnt abbreviation stays hard-blocked
  it('blocks "pnt" abbreviation (hard-blocked)', () => {
    expect(filterContent('pnt').allowed).toBe(false);
  });

  // pinto — innocent usage allowed (not in any list)
  it('allows "pinto de ovo"', () => {
    expect(filterContent('pinto de ovo').allowed).toBe(true);
  });

  it('allows "eu pinto paredes"', () => {
    expect(filterContent('eu pinto paredes').allowed).toBe(true);
  });

  // pinto — NOT blocked even when directed (tradeoff v2.1:
  // removido de todas as listas para proteger "me sinto")
  it('allows "seu pinto" (tradeoff v2.1 — not in any list)', () => {
    expect(filterContent('seu pinto').allowed).toBe(true);
  });

  it('allows "voce quer ver meu pinto" (tradeoff v2.1 — not in any list)', () => {
    expect(filterContent('voce quer ver meu pinto').allowed).toBe(true);
  });

  // dp — innocent usage allowed
  it('allows "o dp do predio avisou"', () => {
    expect(filterContent('o dp do predio avisou').allowed).toBe(true);
  });

  // dp — directed usage blocked
  it('blocks "voce quer dp" (directed)', () => {
    expect(filterContent('voce quer dp').allowed).toBe(false);
  });
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

describe('gostosa/gostoso/delicia as context-sensitive', () => {
  it('allows "comida gostosa"', () => expect(filterContent('comida gostosa').allowed).toBe(true));
  it('allows "dia gostoso"', () => expect(filterContent('dia gostoso').allowed).toBe(true));
  it('allows "que delicia de bolo"', () => expect(filterContent('que delicia de bolo').allowed).toBe(true));
  it('blocks "sua gostosa" (directed)', () => expect(filterContent('sua gostosa').allowed).toBe(false));
  it('blocks "voce e uma delicia" (directed)', () => expect(filterContent('voce e uma delicia').allowed).toBe(false));
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

// ─── False positives — new v2 additions ─────────────────────────────────────

describe('false positives — new v2 additions must not break', () => {
  const safe = [
    'vou comprar pneus',
    'o cromo é bonito',
    'ela é elegante',
    'preciso de um pente',
    'vou ao departamento',
    'tenho 25 anos',
    'o dp do predio avisou',
    'pinto de ovo caipira',
    'eu pinto a parede amanha',
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

// ─── Fuzzy matching (Levenshtein) ────────────────────────────────────────────

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
    expect(filterContent('putra').allowed).toBe(true);
  });

  it('does NOT fuzzy match exact matches (dist 0 skipped)', () => {
    const result = filterContent('estupro');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('hard_block');
  });

  it('blocks long word typos with dist 2: "arrombadoo" → arrombado', () => {
    const result = filterContent('arrombadk');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('fuzzy_match');
  });

  it('does NOT fuzzy match "sinto" against "pinto" (v2.1 fix)', () => {
    // "pinto" foi removido de todas as listas, então fuzzy não tem
    // alvo para matchear contra "sinto"
    expect(filterContent('me sinto bem').allowed).toBe(true);
  });
});

describe('fuzzy match — performance', () => {
  it('fuzzy match adds < 10ms per 2000-char message', () => {
    const longText = 'palavras normais do dia a dia sem nenhum conteudo toxico '.repeat(35);
    filterContent(longText);
    const start = Date.now();
    for (let i = 0; i < 50; i++) filterContent(longText);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});

// ─── Offensive emoji detection ───────────────────────────────────────────────

describe('offensive emoji detection', () => {
  describe('always-blocked emojis', () => {
    it('blocks middle finger 🖕', () => {
      const result = filterContent('🖕');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });

    it('blocks middle finger with skin tone 🖕🏽', () => {
      const result = filterContent('🖕🏽');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });

    it('blocks middle finger in text', () => {
      const result = filterContent('toma isso 🖕 otário');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });
  });

  describe('offensive emoji sequences', () => {
    it('blocks 🍆💦 (sexual)', () => {
      const result = filterContent('🍆💦');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });

    it('blocks 🍆🍑 (sexual)', () => {
      const result = filterContent('🍆🍑');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });

    it('blocks 🍑💦 (sexual)', () => {
      const result = filterContent('🍑💦');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });

    it('blocks 🐵🐒 (racial)', () => {
      const result = filterContent('🐵🐒');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });

    it('blocks 🍌🐒 (racial)', () => {
      const result = filterContent('🍌🐒');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });

    it('blocks sequences embedded in text', () => {
      const result = filterContent('olha isso 🍆💦 haha');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });
  });

  describe('context-sensitive emojis', () => {
    it('blocks 🐵 when directed at someone', () => {
      const result = filterContent('você é um 🐵');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });

    it('allows 🐵 in neutral context', () => {
      expect(filterContent('vi um 🐵 no zoologico').allowed).toBe(true);
    });

    it('allows 🐒 in neutral context', () => {
      expect(filterContent('o 🐒 é fofo').allowed).toBe(true);
    });

    it('blocks 🐒 when directed at someone', () => {
      const result = filterContent('seu 🐒');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('offensive_emoji');
    });
  });

  describe('false positives — safe emoji usage', () => {
    it('allows single 🍆 (eggplant in food context)', () => {
      expect(filterContent('fiz uma receita com 🍆').allowed).toBe(true);
    });

    it('allows single 🍑 (peach in food context)', () => {
      expect(filterContent('comi um 🍑 hoje').allowed).toBe(true);
    });

    it('allows 💦 alone (water/sweat)', () => {
      expect(filterContent('que calor 💦').allowed).toBe(true);
    });

    it('allows common friendly emojis', () => {
      expect(filterContent('oi! 😊👋').allowed).toBe(true);
      expect(filterContent('parabéns! 🎉🎂').allowed).toBe(true);
      expect(filterContent('boa noite 🌙❤️').allowed).toBe(true);
    });

    it('allows animal emojis in neutral context', () => {
      expect(filterContent('gosto de 🐶 e 🐱').allowed).toBe(true);
    });
  });

  describe('blockEmojis option', () => {
    it('disabling blockEmojis allows offensive emojis', () => {
      const filter = createFilter({ blockEmojis: false });
      expect(filter('🖕').allowed).toBe(true);
      expect(filter('🍆💦').allowed).toBe(true);
    });
  });
});

// ─── Performance ─────────────────────────────────────────────────────────────

describe('performance', () => {
  it('filters a 2000-char message in under 10ms', () => {
    const longText = 'a'.repeat(2000);
    const start = Date.now();
    for (let i = 0; i < 100; i++) filterContent(longText);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});

// ─── Multi-locale support ─────────────────────────────────────────────────────

describe('locale: pt-PT', () => {
  const filter = createFilter({ locale: 'pt-PT' });

  describe('PT-PT specific slurs (hard-blocked)', () => {
    const ptPTSlurs = ['paneleiro', 'maricas', 'cabrao', 'cona', 'picha'];
    ptPTSlurs.forEach(word => {
      it(`blocks "${word}"`, () => {
        const result = filter(`mensagem com ${word} aqui`);
        expect(result.allowed).toBe(false);
        if (!result.allowed) expect(result.reason).toBe('hard_block');
      });
    });
  });

  describe('PT-PT context-sensitive insults', () => {
    it('blocks "parvo" when directed', () => {
      const result = filter('tu és um parvo');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('directed_insult');
    });

    it('allows "parvo" in self-expression', () => {
      expect(filter('sou um parvo às vezes').allowed).toBe(true);
    });

    it('blocks "tolo" when directed', () => {
      const result = filter('és um tolo');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('directed_insult');
    });

    it('allows "tolo" in self-expression', () => {
      expect(filter('eu sinto-me tolo').allowed).toBe(true);
    });

    it('recognizes "sinto-me" as self-expression (PT-PT reflexive, normalized to "sintome")', () => {
      expect(filter('sinto-me um idiota').allowed).toBe(true);
    });
  });

  describe('PT-PT does NOT inherit BR-specific slurs', () => {
    // "rapariga" means "girl" in PT-PT — must NOT be blocked
    it('allows "rapariga" (means girl in PT-PT)', () => {
      expect(filter('a rapariga foi ao mercado').allowed).toBe(true);
    });

    // "puto" means "boy/kid" in PT-PT — must NOT be blocked
    it('allows "puto" (means boy/kid in PT-PT)', () => {
      expect(filter('o puto foi brincar').allowed).toBe(true);
    });
  });

  describe('PT-PT directed patterns', () => {
    it('blocks "cala-te" pattern', () => {
      const result = filter('cala-te idiota');
      expect(result.allowed).toBe(false);
    });

    it('blocks "vai-te" pattern', () => {
      const result = filter('vai-te embora burro');
      expect(result.allowed).toBe(false);
    });
  });

  describe('PT-PT abbreviations', () => {
    it('expands "fdp" and blocks', () => {
      const result = filter('seu fdp');
      expect(result.allowed).toBe(false);
    });
  });
});

describe('locale: es', () => {
  const filter = createFilter({ locale: 'es' });

  describe('ES specific slurs (hard-blocked)', () => {
    const esSlurs = ['gilipollas', 'maricon', 'bollera', 'tortillera', 'subnormal'];
    esSlurs.forEach(word => {
      it(`blocks "${word}"`, () => {
        const result = filter(`mensaje con ${word} aqui`);
        expect(result.allowed).toBe(false);
        if (!result.allowed) expect(result.reason).toBe('hard_block');
      });
    });
  });

  describe('ES context-sensitive words (exclamaciones comunes)', () => {
    it('allows "joder" as standalone exclamation', () => {
      expect(filter('¡joder! que dia tan duro').allowed).toBe(true);
    });

    it('allows "mierda" as standalone exclamation', () => {
      expect(filter('qué mierda de día').allowed).toBe(true);
    });

    it('blocks "mierda" when directed', () => {
      const result = filter('eres una mierda tío');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('directed_insult');
    });

    it('blocks "idiota" when directed', () => {
      const result = filter('eres un idiota');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('directed_insult');
    });

    it('allows "idiota" in self-expression', () => {
      expect(filter('me siento un idiota').allowed).toBe(true);
    });

    it('blocks "estupido" when directed', () => {
      const result = filter('tu eres un estupido');
      expect(result.allowed).toBe(false);
    });

    it('allows "estupido" in self-expression', () => {
      expect(filter('soy un estupido').allowed).toBe(true);
    });
  });

  describe('ES directed patterns', () => {
    it('recognizes "callate" as directed', () => {
      const result = filter('callate idiota');
      expect(result.allowed).toBe(false);
    });

    it('recognizes "vete" as directed', () => {
      const result = filter('vete de aqui estupido');
      expect(result.allowed).toBe(false);
    });
  });

  describe('ES abbreviations', () => {
    it('expands "hdp" and blocks', () => {
      const result = filter('eres un hdp');
      expect(result.allowed).toBe(false);
    });

    it('expands "ptm" and blocks', () => {
      const result = filter('ptm que rabia');
      expect(result.allowed).toBe(false);
    });
  });
});

describe('multi-locale: pt-BR + pt-PT', () => {
  const filter = createFilter({ locale: ['pt-BR', 'pt-PT'] });

  it('blocks PT-BR specific slurs', () => {
    expect(filter('viado').allowed).toBe(false);
  });

  it('blocks PT-PT specific slurs', () => {
    expect(filter('paneleiro').allowed).toBe(false);
  });

  it('blocks PT-BR context words when directed', () => {
    const result = filter('você é um lixo');
    expect(result.allowed).toBe(false);
  });

  it('blocks PT-PT context words when directed', () => {
    const result = filter('és um parvo');
    expect(result.allowed).toBe(false);
  });

  it('recognizes both PT-BR and PT-PT self-expression patterns', () => {
    expect(filter('me sinto um idiota').allowed).toBe(true);
    expect(filter('sinto-me um parvo').allowed).toBe(true);
  });
});

describe('multi-locale: pt-BR + es', () => {
  const filter = createFilter({ locale: ['pt-BR', 'es'] });

  it('blocks PT-BR slur', () => {
    expect(filter('viado').allowed).toBe(false);
  });

  it('blocks ES slur', () => {
    expect(filter('gilipollas').allowed).toBe(false);
  });

  it('blocks ES directed insult', () => {
    expect(filter('eres un idiota').allowed).toBe(false);
  });

  it('blocks PT-BR directed insult', () => {
    expect(filter('você é um lixo').allowed).toBe(false);
  });
});

describe('tree-shakeable locale API (locales: [data])', () => {
  it('creates pt-BR filter from locale object', () => {
    const filter = createFilter({ locales: [ptBRLocale] });
    expect(filter('viado').allowed).toBe(false);
    expect(filter('oi tudo bem').allowed).toBe(true);
  });

  it('creates pt-PT filter from locale object', () => {
    const filter = createFilter({ locales: [ptPTLocale] });
    expect(filter('paneleiro').allowed).toBe(false);
    // "rapariga" should NOT be blocked (means girl in PT-PT)
    expect(filter('a rapariga foi ao mercado').allowed).toBe(true);
  });

  it('creates es filter from locale object', () => {
    const filter = createFilter({ locales: [esLocale] });
    expect(filter('gilipollas').allowed).toBe(false);
    expect(filter('hola que tal').allowed).toBe(true);
  });

  it('merges two locales from objects', () => {
    const filter = createFilter({ locales: [ptBRLocale, ptPTLocale] });
    expect(filter('viado').allowed).toBe(false);
    expect(filter('paneleiro').allowed).toBe(false);
  });
});

describe('locale: default is still pt-BR', () => {
  it('createFilter() with no options defaults to pt-BR', () => {
    const filter = createFilter();
    expect(filter('viado').allowed).toBe(false);
    expect(filter('buceta').allowed).toBe(false);
    // pt-PT specific slurs are NOT blocked by default pt-BR filter (by design)
    expect(filter('paneleiro').allowed).toBe(true);
  });

  it('invalid locale throws a helpful error', () => {
    expect(() => createFilter({ locale: 'fr' as any })).toThrow(/unknown locale/i);
  });
});