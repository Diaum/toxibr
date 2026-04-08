import { describe, it, expect } from '@jest/globals';
import {
  filterContent,
  normalize,
  createFilter,
  filterBatch,
  createFilterBatch,
  stem,
} from '../src/filter';

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

  it('replaces Latin Extended-A homoglyphs', () => {
    // ł → l, đ → d, ı → i
    expect(normalize('\u0142ixo')).toContain('lixo');
    expect(normalize('\u0111oente')).toContain('doente');
    expect(normalize('v\u0131ado')).toContain('viado');
  });

  it('replaces Latin Extended-B homoglyphs', () => {
    // ƒ → f, ƶ → z, ƙ → k
    expect(normalize('\u0192oda')).toContain('foda');
    expect(normalize('\u01B6oneira')).toContain('zoneira');
    expect(normalize('\u0199aralho')).toContain('karalho');
  });

  it('replaces IPA / Latin Extended letter forms used in bypass', () => {
    // ɑ → a, ɡ → g, ɵ → o, ɛ → e
    expect(normalize('vi\u0251do')).toContain('viado');
    expect(normalize('\u0261ato')).toContain('gato');
    expect(normalize('b\u0275ba')).toContain('boba');
    expect(normalize('m\u025Brda')).toContain('merda');
  });

  it('blocks bypass with Latin Extended homoglyphs', () => {
    // End-to-end: dotless i + Latin alpha should still be caught
    expect(filterContent('v\u0131\u0251do').allowed).toBe(false);
    // Script g + barred o
    expect(filterContent('ɡɵzar').allowed).toBe(false);
  });
});

// ─── Hard-blocked words ──────────────────────────────────────────────────────

describe('hard-blocked words', () => {
  const blocked = ['punheteiro', 'estupro', 'viado', 'arrombado', 'fdp', 'buceta', 'pedofilo'];

  blocked.forEach((word) => {
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

// ─── Racismo ─────────────────────────────────────────────────────────────────

describe('hard-blocked — racism terms', () => {
  it('blocks "mascote de petrolífera"', () => {
    const result = filterContent('aquele cara é mascote de petrolífera');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('hard_block');
  });
});

// ─── New slurs added in v2 ───────────────────────────────────────────────────

describe('hard-blocked — new slurs (v2)', () => {
  const newSlurs = ['lesbica', 'sapata', 'gazela', 'tchola', 'biba', 'mona', 'bixa'];

  newSlurs.forEach((word) => {
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

  newActresses.forEach((name) => {
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
  it('allows krl (context-sensitive, expands to caralho)', () =>
    expect(filterContent('krl').allowed).toBe(true));
  it('blocks "seu krl" (directed)', () => expect(filterContent('seu krl').allowed).toBe(false));
  it('blocks gzr', () => expect(filterContent('gzr').allowed).toBe(false));
  it('blocks bct', () => expect(filterContent('bct').allowed).toBe(false));
  it('blocks vsf', () => expect(filterContent('vsf').allowed).toBe(false));
  it('blocks vtnc', () => expect(filterContent('vtnc').allowed).toBe(false));
});

// ─── New abbreviation blocking (v2) ─────────────────────────────────────────

describe('BR abbreviation blocking — new (v2)', () => {
  const newAbbrevs = [
    'xxt',
    'sfd',
    'sfda',
    'vgb',
    'crn',
    'fdd',
    'bctuda',
    'rabt',
    'fdnd',
    'kng',
    'tzao',
    'ptnh',
    'piroq',
    'prq',
    'pnt',
    'cuz',
    'cz',
    'gls',
    'chp',
    'cnh',
    'peit',
    'peitd',
    'raba',
    'xrc',
    'xib',
    'pz',
  ];

  newAbbrevs.forEach((abbrev) => {
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
  it('blocks "toma no cu" (directed)', () =>
    expect(filterContent('toma no cu').allowed).toBe(false));
  it('blocks "voce e um caralho" (directed)', () =>
    expect(filterContent('voce e um caralho').allowed).toBe(false));
});

describe('gostosa/gostoso/delicia as context-sensitive', () => {
  it('allows "comida gostosa"', () => expect(filterContent('comida gostosa').allowed).toBe(true));
  it('allows "dia gostoso"', () => expect(filterContent('dia gostoso').allowed).toBe(true));
  it('allows "que delicia de bolo"', () =>
    expect(filterContent('que delicia de bolo').allowed).toBe(true));
  it('blocks "sua gostosa" (directed)', () =>
    expect(filterContent('sua gostosa').allowed).toBe(false));
  it('blocks "voce e uma delicia" (directed)', () =>
    expect(filterContent('voce e uma delicia').allowed).toBe(false));
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

  phones.forEach((input) => {
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

  safe.forEach((phrase) => {
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
    'Bloqueie palavras e ofensas usando contexto',
    'nada de SDK pesado, roda em qualquer lugar',
  ];

  safe.forEach((phrase) => {
    it(`allows: "${phrase}"`, () => {
      expect(filterContent(phrase).allowed).toBe(true);
    });
  });
});

// ─── False positives — Brazilian proper names ────────────────────────────────

describe('false positives — Brazilian proper names must NEVER block', () => {
  const names = [
    // ── Femininos (fonte: API IBGE, todas as décadas + complementos) ──────────
    'Adriana', 'Alessandra', 'Alice', 'Aline', 'Alzira', 'Amanda', 'Ana',
    'Andrea', 'Andreia', 'Antonia', 'Aparecida', 'Beatriz', 'Benedita',
    'Bianca', 'Bruna', 'Camila', 'Carla', 'Carolina', 'Claudia', 'Cristiane',
    'Cristina', 'Daiane', 'Daniela', 'Debora', 'Denise', 'Eduarda', 'Elaine',
    'Eliane', 'Elisa', 'Elza', 'Evelyn', 'Fabiana', 'Fatima', 'Fernanda',
    'Flavia', 'Francisca', 'Gabriela', 'Geovana', 'Helena', 'Heloisa',
    'Isabel', 'Isabela', 'Jaqueline', 'Jessica', 'Joana', 'Josefa', 'Julia',
    'Juliana', 'Janaína', 'Karine', 'Katia', 'Larissa', 'Laura', 'Leticia',
    'Lidia', 'Lilian', 'Lorena', 'Luana', 'Lucia', 'Luciana', 'Luiza',
    'Luzia', 'Marcia', 'Maria', 'Mariana', 'Marina', 'Marlene', 'Marli',
    'Monica', 'Nadia', 'Nair', 'Natalia', 'Nilza', 'Patricia', 'Poliana',
    'Priscila', 'Rafaela', 'Raimunda', 'Raquel', 'Regina', 'Renata', 'Rita',
    'Roberta', 'Rosa', 'Rosana', 'Rosangela', 'Roseli', 'Sandra', 'Sara',
    'Sebastiana', 'Selma', 'Silvana', 'Silvia', 'Simone', 'Solange', 'Sonia',
    'Sueli', 'Tamara', 'Tamires', 'Tania', 'Tatiane', 'Tatiana', 'Tereza',
    'Terezinha', 'Vanessa', 'Vera', 'Viviane', 'Vitoria', 'Yasmin',
    // Nomes com risco de colisão identificados
    'Ariane', 'Assunção', 'Conceição', 'Mara',
    // ── Masculinos (fonte: API IBGE, todas as décadas + complementos) ─────────
    'Adriano', 'Alexandre', 'Anderson', 'Andre', 'Antonio', 'Artur',
    'Augusto', 'Benedito', 'Bruno', 'Caio', 'Carlos', 'Claudio', 'Cristiano',
    'Daniel', 'Diego', 'Edilson', 'Edson', 'Eduardo', 'Emerson', 'Everton',
    'Ezequiel', 'Fabio', 'Felipe', 'Fernando', 'Flavio', 'Francisco',
    'Gabriel', 'Geraldo', 'Gilberto', 'Gilmar', 'Gilson', 'Giovanni',
    'Guilherme', 'Gustavo', 'Heitor', 'Henrique', 'Hugo', 'Humberto',
    'Igor', 'Ivan', 'Jefferson', 'Joao', 'Joaquim', 'Joel', 'Jonas',
    'Jorge', 'Jose', 'Junior', 'Leandro', 'Leonardo', 'Levi', 'Lucas',
    'Luciano', 'Luis', 'Luiz', 'Manoel', 'Manuel', 'Marcelo', 'Marcio',
    'Marcos', 'Mario', 'Mateus', 'Matheus', 'Mauricio', 'Mauro', 'Miguel',
    'Milton', 'Moises', 'Murilo', 'Natan', 'Nelson', 'Nilson', 'Otavio',
    'Osvaldo', 'Pablo', 'Paulo', 'Pedro', 'Rafael', 'Raimundo', 'Renan',
    'Renato', 'Ricardo', 'Roberto', 'Robson', 'Rodrigo', 'Ronaldo', 'Ruan',
    'Rubens', 'Samuel', 'Sandro', 'Sebastiao', 'Sergio', 'Severino',
    'Thiago', 'Tiago', 'Valdir', 'Vanderlei', 'Victor', 'Vicente', 'Vinicius',
    'Vitor', 'Waldir', 'Wanderlei', 'Wellington', 'William', 'Wilson',
    // ── Sobrenomes top-78 (Censo 2022 IBGE) ──────────────────────────────────
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Ferreira', 'Lima',
    'Alves', 'Rodrigues', 'Costa', 'Sousa', 'Gomes', 'Nascimento', 'Araujo',
    'Ribeiro', 'Almeida', 'Jesus', 'Barbosa', 'Soares', 'Carvalho', 'Martins',
    'Lopes', 'Vieira', 'Rocha', 'Dias', 'Gonçalves', 'Fernandes', 'Santana',
    'Andrade', 'Batista', 'Campos', 'Mendes', 'Cardoso', 'Teixeira', 'Freitas',
    'Correia', 'Pinto', 'Cavalcanti', 'Braga', 'Medeiros', 'Azevedo', 'Castro',
    'Cunha', 'Cruz', 'Brito', 'Nunes', 'Miranda', 'Morais', 'Neto', 'Monteiro',
    'Moreira', 'Moura', 'Machado', 'Ramos', 'Coelho', 'Borges', 'Melo',
    'Faria', 'Rezende', 'Guimarães', 'Figueiredo', 'Macedo', 'Duarte',
    'Silveira', 'Porto', 'Amorim', 'Leite', 'Paiva', 'Queiroz',
    'Vasconcelos', 'Xavier', 'Maia', 'Lacerda', 'Bastos', 'Pires', 'Tavares',
  ];

  names.forEach((name) => {
    it(`allows name: "${name}"`, () => {
      expect(filterContent(name).allowed).toBe(true);
    });

    it(`allows in phrase: "mensagem de ${name}"`, () => {
      expect(filterContent(`mensagem de ${name}`).allowed).toBe(true);
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

    it('blocks 💦 (offensive emoji)', () => {
      expect(filterContent('que calor 💦').allowed).toBe(false);
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

// ─── Severity levels ─────────────────────────────────────────────────────────

describe('severity levels', () => {
  it('defaults to severity "block" for all reasons', () => {
    const result = filterContent('viado');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.severity).toBe('block');
    }
  });

  it('returns severity "block" for default filter on all reason types', () => {
    // hard_block
    const r1 = filterContent('viado');
    if (!r1.allowed) expect(r1.severity).toBe('block');

    // directed_insult
    const r2 = filterContent('você é um lixo');
    if (!r2.allowed) expect(r2.severity).toBe('block');

    // fuzzy_match
    const r3 = filterContent('viadro');
    if (!r3.allowed) expect(r3.severity).toBe('block');

    // link
    const r4 = filterContent('https://example.com');
    if (!r4.allowed) expect(r4.severity).toBe('block');

    // phone
    const r5 = filterContent('21994709426');
    if (!r5.allowed) expect(r5.severity).toBe('block');

    // digits_only
    const r6 = filterContent('55');
    if (!r6.allowed) expect(r6.severity).toBe('block');

    // offensive_emoji
    const r7 = filterContent('🖕');
    if (!r7.allowed) expect(r7.severity).toBe('block');
  });

  it('respects custom severity per reason', () => {
    const filter = createFilter({
      severity: {
        hard_block: 'block',
        directed_insult: 'warn',
        fuzzy_match: 'flag',
      },
    });

    const r1 = filter('viado');
    expect(r1.allowed).toBe(false);
    if (!r1.allowed) expect(r1.severity).toBe('block');

    const r2 = filter('você é um lixo');
    expect(r2.allowed).toBe(false);
    if (!r2.allowed) expect(r2.severity).toBe('warn');

    const r3 = filter('viadro');
    expect(r3.allowed).toBe(false);
    if (!r3.allowed) expect(r3.severity).toBe('flag');
  });

  it('uses "block" as default for unconfigured reasons', () => {
    const filter = createFilter({
      severity: { directed_insult: 'warn' },
    });

    // hard_block not configured → defaults to 'block'
    const r1 = filter('viado');
    if (!r1.allowed) expect(r1.severity).toBe('block');

    // directed_insult configured → 'warn'
    const r2 = filter('seu idiota');
    if (!r2.allowed) expect(r2.severity).toBe('warn');
  });

  it('allowed results have no severity field', () => {
    const filter = createFilter({ severity: { hard_block: 'warn' } });
    const result = filter('oi tudo bem');
    expect(result.allowed).toBe(true);
    expect('severity' in result).toBe(false);
  });

  it('severity works with link/phone/digits/emoji reasons', () => {
    const filter = createFilter({
      severity: {
        link: 'flag',
        phone: 'warn',
        digits_only: 'flag',
        offensive_emoji: 'warn',
      },
    });

    const r1 = filter('https://example.com');
    if (!r1.allowed) expect(r1.severity).toBe('flag');

    const r2 = filter('21994709426');
    if (!r2.allowed) expect(r2.severity).toBe('warn');

    const r3 = filter('55');
    if (!r3.allowed) expect(r3.severity).toBe('flag');

    const r4 = filter('🖕');
    if (!r4.allowed) expect(r4.severity).toBe('warn');
  });

  it('severity works with suspicious_content reason', () => {
    const filter = createFilter({
      severity: { suspicious_content: 'flag' },
    });

    const r = filter('bola leite molhada duro jato');
    if (!r.allowed) {
      expect(r.reason).toBe('suspicious_content');
      expect(r.severity).toBe('flag');
    }
  });
});

// ─── Batch filtering ─────────────────────────────────────────────────────────

describe('filterBatch', () => {
  it('returns one result per message', () => {
    const results = filterBatch(['oi', 'tudo bem', 'hello']);
    expect(results).toHaveLength(3);
    results.forEach((r) => expect(r.allowed).toBe(true));
  });

  it('correctly filters mixed allowed/blocked messages', () => {
    const results = filterBatch(['bom dia', 'seu idiota', 'tudo certo']);
    expect(results).toHaveLength(3);
    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(false);
    if (!results[1].allowed) {
      expect(results[1].reason).toBe('directed_insult');
    }
    expect(results[2].allowed).toBe(true);
  });

  it('returns empty array for empty input', () => {
    const results = filterBatch([]);
    expect(results).toEqual([]);
  });

  it('produces same results as individual filterContent calls', () => {
    const messages = ['oi amigo', 'vai tomar no cu', 'boa tarde', 'fdp'];
    const batchResults = filterBatch(messages);
    const individualResults = messages.map(filterContent);
    expect(batchResults).toEqual(individualResults);
  });

  it('works with createFilterBatch and custom options', () => {
    const batch = createFilterBatch({ blockLinks: false });
    const results = batch(['http://example.com', 'seu idiota']);
    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(false);
  });
});

// ─── onBlock callback ─────────────────────────────────────────────────────────

describe('onBlock callback', () => {
  it('calls onBlock when a message is blocked', () => {
    const blocked: Array<{ reason: string; matched: string }> = [];
    const filter = createFilter({
      onBlock: (result) => {
        blocked.push({ reason: result.reason, matched: result.matched });
      },
    });

    filter('bom dia');
    expect(blocked).toHaveLength(0);

    filter('seu arrombado');
    expect(blocked).toHaveLength(1);
    expect(blocked[0].reason).toBe('hard_block');
  });

  it('does not call onBlock for allowed messages', () => {
    const spy = jest.fn();
    const filter = createFilter({ onBlock: spy });

    filter('bom dia');
    filter('tudo bem');
    expect(spy).not.toHaveBeenCalled();
  });

  it('works without onBlock (no error)', () => {
    const filter = createFilter();
    expect(() => filter('seu arrombado')).not.toThrow();
  });
});

// ─── Stats tracking ───────────────────────────────────────────────────────────

describe('Stats tracking', () => {
  it('tracks stats when trackStats is true', () => {
    const filter = createFilter({ trackStats: true });

    filter('bom dia');
    filter('tudo bem');
    filter('seu idiota');

    const stats = filter.getStats();
    expect(stats.total).toBe(3);
    expect(stats.allowed).toBe(2);
    expect(stats.blocked).toBe(1);
    expect(stats.byReason.directed_insult).toBe(1);
    expect(stats.topMatched).toEqual(
      expect.arrayContaining([expect.objectContaining({ word: 'idiota', count: 1 })])
    );
    expect(stats.avgTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('does not track stats when trackStats is false (default)', () => {
    const filter = createFilter();

    filter('bom dia');
    filter('fdp');

    const stats = filter.getStats();
    expect(stats.total).toBe(0);
    expect(stats.allowed).toBe(0);
    expect(stats.blocked).toBe(0);
  });

  it('resets stats correctly', () => {
    const filter = createFilter({ trackStats: true });

    filter('fdp');
    filter('bom dia');
    expect(filter.getStats().total).toBe(2);

    filter.resetStats();
    const stats = filter.getStats();
    expect(stats.total).toBe(0);
    expect(stats.allowed).toBe(0);
    expect(stats.blocked).toBe(0);
    expect(stats.byReason).toEqual({});
    expect(stats.topMatched).toEqual([]);
    expect(stats.avgTimeMs).toBe(0);
  });

  it('exports stats as JSON string', () => {
    const filter = createFilter({ trackStats: true });

    filter('bom dia');
    filter('fdp');

    const json = filter.exportStats();
    const parsed = JSON.parse(json);
    expect(parsed.total).toBe(2);
    expect(parsed.allowed).toBe(1);
    expect(parsed.blocked).toBe(1);
  });

  it('accumulates byReason counts', () => {
    const filter = createFilter({ trackStats: true });

    filter('fdp');
    filter('puta');
    filter('http://example.com');

    const stats = filter.getStats();
    expect(stats.byReason.hard_block).toBe(2);
    expect(stats.byReason.link).toBe(1);
  });

  it('sorts topMatched by count descending', () => {
    const filter = createFilter({ trackStats: true });

    filter('fdp');
    filter('fdp');
    filter('fdp');
    filter('puta');

    const stats = filter.getStats();
    expect(stats.topMatched[0].word).toBe('fdp');
    expect(stats.topMatched[0].count).toBe(3);
    expect(stats.topMatched[1].word).toBe('puta');
    expect(stats.topMatched[1].count).toBe(1);
  });

  it('stats are local to each filter instance', () => {
    const filter1 = createFilter({ trackStats: true });
    const filter2 = createFilter({ trackStats: true });

    filter1('fdp');
    filter1('fdp');
    filter2('puta');

    expect(filter1.getStats().total).toBe(2);
    expect(filter2.getStats().total).toBe(1);
  });

  it('works with onBlock and trackStats together', () => {
    const blocked: string[] = [];
    const filter = createFilter({
      trackStats: true,
      onBlock: (result) => blocked.push(result.matched),
    });

    filter('bom dia');
    filter('fdp');
    filter('puta');

    expect(blocked).toEqual(['fdp', 'puta']);
    expect(filter.getStats().blocked).toBe(2);
  });
});

// ─── Issue #37 — Bypass com números não-leet e emojis ────────────────────────

describe('Issue #37 — numeric bypass (digits 2, 6, 8, 9 as separators)', () => {
  describe('bypass bloqueado', () => {
    it('blocks v2ado (viado com 2)', () => {
      const result = filterContent('v2ado');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks vi6do (viado com 6)', () => {
      const result = filterContent('vi6do');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks pu9a (puta com 9)', () => {
      const result = filterContent('pu9a');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks bu6eta (buceta com 6)', () => {
      const result = filterContent('bu6eta');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks vi8do (viado com 8)', () => {
      const result = filterContent('vi8do');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks pu2ta (puta com 2)', () => {
      const result = filterContent('pu2ta');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });
  });

  describe('falsos positivos numéricos — devem passar (CONTENT CLEAN)', () => {
    it('allows ps5 (console)', () => {
      expect(filterContent('comprei um ps5').allowed).toBe(true);
    });

    it('allows b2b (business to business)', () => {
      expect(filterContent('estrategia b2b').allowed).toBe(true);
    });

    it('allows 2x1 (promoção)', () => {
      expect(filterContent('oferta 2x1').allowed).toBe(true);
    });

    it('allows h2o (química)', () => {
      expect(filterContent('beba h2o').allowed).toBe(true);
    });

    it('allows co2 (dióxido de carbono)', () => {
      expect(filterContent('emissoes de co2').allowed).toBe(true);
    });
  });
});

describe('Issue #37 — emoji bypass (emojis como separadores dentro de palavras)', () => {
  describe('bypass bloqueado', () => {
    it('blocks v🍑ado (viado com emoji pêssego)', () => {
      const result = filterContent('v🍑ado');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks pu🍑ta (puta com emoji pêssego)', () => {
      const result = filterContent('pu🍑ta');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks vi🍆do (viado com emoji berinjela)', () => {
      const result = filterContent('vi🍆do');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks bu🌸eta (buceta com emoji flor)', () => {
      const result = filterContent('bu🌸eta');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks ar💢ombado (arrombado com emoji)', () => {
      const result = filterContent('ar💢ombado');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });
  });

  describe('falsos positivos com emojis — devem passar (CONTENT CLEAN)', () => {
    it('allows "valeu! 😊" (emoji no final da frase)', () => {
      expect(filterContent('valeu! 😊').allowed).toBe(true);
    });

    it('allows "boa noite 🌙" (emoji separado do texto)', () => {
      expect(filterContent('boa noite 🌙').allowed).toBe(true);
    });

    it('allows "oi! 😊👋" (emojis após pontuação)', () => {
      expect(filterContent('oi! 😊👋').allowed).toBe(true);
    });

    it('allows "parabéns! 🎉🎂" (emojis festivos)', () => {
      expect(filterContent('parabéns! 🎉🎂').allowed).toBe(true);
    });

    it('allows emoji with only 1 letter on each side (a😊b — não é bypass)', () => {
      // Apenas 1 letra em cada lado do emoji — não atinge o limite de 2 letras
      expect(filterContent('a😊b').allowed).toBe(true);
    });
  });
});

describe('Issue #37 — leetspeak legítimo (0, 1, 3, 4, 5, 7) continua funcionando via Layer de tradução', () => {
  it('blocks 3stupr0 (estupro com leet 3→e, 0→o)', () => {
    const result = filterContent('3stupr0');
    expect(result.allowed).toBe(false);
  });

  it('blocks v14do (viado com leet 1→i, 4→a)', () => {
    const result = filterContent('v14do');
    expect(result.allowed).toBe(false);
  });

  it('blocks 3stup4dor (estuprador com leet)', () => {
    const result = filterContent('3stup4dor');
    expect(result.allowed).toBe(false);
  });

  it('blocks bu53t4 (buceta com leet 5→s, 3→e, 4→a)', () => {
    const result = filterContent('bu53t4');
    expect(result.allowed).toBe(false);
  });

  it('normalize translates leet digits correctly', () => {
    expect(normalize('v14do')).toContain('viado');
    expect(normalize('3stupr0')).toContain('estupr');
    expect(normalize('bu53t4')).toContain('buseta');
  });
});

// ─── Issue #42 — 10 Termos Não Capturados ────────────────────────────────────

describe('[Issue #42] - 10 Termos Reportados', () => {
  // ── pornografia ────────────────────────────────────────────────────────────

  describe('pornografia — variantes de bypass', () => {
    it('blocks p0rn0gr4f14 (leet: 0→o, 4→a)', () => {
      const result = filterContent('p0rn0gr4f14');
      expect(result.allowed).toBe(false);
    });

    it('blocks p*rn*gr*f** (Layer 0: * entre letras)', () => {
      const result = filterContent('p*rn*gr*f**');
      expect(result.allowed).toBe(false);
    });

    it('blocks p0rn0gr@f14 (@ → a via leet + 0→o, 1→i, 4→a)', () => {
      const result = filterContent('p0rn0gr@f14');
      expect(result.allowed).toBe(false);
    });

    it('normalize converte p0rn0gr4f14 para pornografia', () => {
      expect(normalize('p0rn0gr4f14')).toContain('pornografia');
    });
  });

  // ── tarado ─────────────────────────────────────────────────────────────────

  describe('tarado — variantes de bypass', () => {
    it('blocks t4r4d0 (leet: 4→a, 0→o)', () => {
      const result = filterContent('t4r4d0');
      expect(result.allowed).toBe(false);
    });

    it('blocks t@r@d0 (Layer 0: @ como separador)', () => {
      const result = filterContent('t@r@d0');
      expect(result.allowed).toBe(false);
    });

    it('blocks t*r*d* (Layer 0: * entre letras)', () => {
      const result = filterContent('t*r*d*');
      expect(result.allowed).toBe(false);
    });

    it('normalize converte t4r4d0 para tarado', () => {
      expect(normalize('t4r4d0')).toBe('tarado');
    });
  });

  // ── adulto (context-sensitive) ─────────────────────────────────────────────

  describe('adulto — variantes de bypass (context-sensitive)', () => {
    it('blocks seu 4dult0 (leet 4→a, 0→o + contexto dirigido "seu")', () => {
      const result = filterContent('seu 4dult0');
      expect(result.allowed).toBe(false);
    });

    it('blocks seu @dult0 (@ → a via leet + contexto dirigido)', () => {
      const result = filterContent('seu @dult0');
      expect(result.allowed).toBe(false);
    });

    it('blocks "seu a*dult*o" (Layer 0: * entre letras)', () => {
      // a*d → letra + * + letra → capturado pelo Layer 0
      expect(filterContent('seu a*dult*o').allowed).toBe(false);
    });

    it('normalize converte 4dult0 para adulto', () => {
      expect(normalize('4dult0')).toBe('adulto');
    });

    it('allows "adulto responsavel" (sem contexto dirigido — falso positivo prevenido)', () => {
      expect(filterContent('adulto responsavel').allowed).toBe(true);
    });
  });

  // ── cuzinho ────────────────────────────────────────────────────────────────

  describe('cuzinho — variantes de bypass', () => {
    it('blocks cuz1nh0 (leet: 1→i, 0→o)', () => {
      const result = filterContent('cuz1nh0');
      expect(result.allowed).toBe(false);
    });

    it('blocks cuz!nh0 (! → i entre word chars, 0→o)', () => {
      const result = filterContent('cuz!nh0');
      expect(result.allowed).toBe(false);
    });

    it('blocks cuz*nh* (Layer 0: * entre letras)', () => {
      const result = filterContent('cuz*nh*');
      expect(result.allowed).toBe(false);
    });

    it('normalize converte cuz!nh0 para cuzinho', () => {
      expect(normalize('cuz!nh0')).toBe('cuzinho');
    });

    it('normalize converte cuz1nh0 para cuzinho', () => {
      expect(normalize('cuz1nh0')).toBe('cuzinho');
    });

    it('does NOT affect trailing ! in normal phrases (falso positivo prevenido)', () => {
      // "valeu!" — o ! está no final, sem letra depois → não é convertido
      expect(filterContent('valeu!').allowed).toBe(true);
    });
  });

  // ── gozo ───────────────────────────────────────────────────────────────────

  describe('gozo — variantes de bypass', () => {
    it('blocks g0z0 (leet: 0→o)', () => {
      const result = filterContent('g0z0');
      expect(result.allowed).toBe(false);
    });

    it('blocks g@z0 (Layer 0: @ como separador entre g e z)', () => {
      // @ entre duas letras é detectado no Layer 0 como bypass
      const result = filterContent('g@z0');
      expect(result.allowed).toBe(false);
    });

    it('blocks g*z* (Layer 0: * entre letras)', () => {
      const result = filterContent('g*z*');
      expect(result.allowed).toBe(false);
    });

    it('normalize converte g0z0 para gozo', () => {
      expect(normalize('g0z0')).toBe('gozo');
    });
  });

  // ── punheteirinha / punheteirinho ──────────────────────────────────────────

  describe('punheteirinha/punheteirinho — variantes de bypass', () => {
    it('blocks punh3t31r1nh4 (leet para punheteirinha)', () => {
      const result = filterContent('punh3t31r1nh4');
      expect(result.allowed).toBe(false);
    });

    it('blocks punh3t31r1nh0 (leet para punheteirinho)', () => {
      const result = filterContent('punh3t31r1nh0');
      expect(result.allowed).toBe(false);
    });

    it('normalize converte punh3t31r1nh4 para punheteirinha', () => {
      expect(normalize('punh3t31r1nh4')).toBe('punheteirinha');
    });
  });

  // ── sexo ───────────────────────────────────────────────────────────────────

  describe('sexo — variantes de bypass', () => {
    it('blocks s3x0 (leet: 3→e, 0→o)', () => {
      const result = filterContent('s3x0');
      expect(result.allowed).toBe(false);
    });

    it('blocks "sx" (abreviação via ABBREVIATION_MAP)', () => {
      const result = filterContent('sx');
      expect(result.allowed).toBe(false);
    });

    it('normalize converte s3x0 para sexo', () => {
      expect(normalize('s3x0')).toBe('sexo');
    });
  });

  // ── abreviações novas (prn, sx, trd) ──────────────────────────────────────

  describe('novas abreviações (Issue #42)', () => {
    it('blocks "prn" (→ porno via ABBREVIATION_MAP)', () => {
      expect(filterContent('prn').allowed).toBe(false);
    });

    it('blocks "trd" (→ tarado via ABBREVIATION_MAP)', () => {
      expect(filterContent('trd').allowed).toBe(false);
    });
  });

  // ── combinação: jogar um leite ─────────────────────────────────────────────

  describe('"jogar um leite" — combinação deve ser capturada', () => {
    it('blocks "jogar um leite" (frase hard-blocked)', () => {
      const result = filterContent('jogar um leite');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks "vou jogar um leite" (frase com contexto)', () => {
      expect(filterContent('vou jogar um leite').allowed).toBe(false);
    });
  });

  // ── integridade: falsos positivos existentes não regridem ─────────────────

  describe('regressao — falsos positivos nao devem ser quebrados', () => {
    it('allows "oi! 😊" (! trailing — nao e bypass de i)', () => {
      expect(filterContent('oi! 😊').allowed).toBe(true);
    });

    it('allows "valeu! 😊" (emoji apos pontuacao)', () => {
      expect(filterContent('valeu! 😊').allowed).toBe(true);
    });

    it('allows "parabens! 🎉" (exclamacao no final)', () => {
      expect(filterContent('parabens! 🎉').allowed).toBe(true);
    });

    it('allows "adulto responsavel" (adulto sem contexto dirigido)', () => {
      expect(filterContent('adulto responsavel').allowed).toBe(true);
    });

    it('allows "jogar bola" (jogar sem conotacao sexual)', () => {
      expect(filterContent('jogar bola').allowed).toBe(true);
    });

    it('allows "copo de leite" (leite em contexto inocente)', () => {
      expect(filterContent('copo de leite').allowed).toBe(true);
    });
  });
});

// ─── Stemmer ──────────────────────────────────────────────────────────────────

describe('stem', () => {
  it('reduces verb infinitives to radical', () => {
    expect(stem('estuprar')).toBe('estupr');
    expect(stem('gozar')).toBe('goz');
    expect(stem('chupar')).toBe('chup');
    expect(stem('foder')).toBe('fod');
    expect(stem('transar')).toBe('trans');
  });

  it('reduces gerund forms', () => {
    expect(stem('estuprando')).toBe('estupr');
    expect(stem('gozando')).toBe('goz');
    expect(stem('chupando')).toBe('chup');
    expect(stem('fodendo')).toBe('fod');
  });

  it('reduces past tense (ei/ou/eu)', () => {
    expect(stem('estuprou')).toBe('estupr');
    expect(stem('gozei')).toBe('goz');
    expect(stem('chupou')).toBe('chup');
    expect(stem('fodeu')).toBe('fod');
  });

  it('reduces plural past (aram/eram/iram)', () => {
    expect(stem('estupraram')).toBe('estupr');
    expect(stem('gozaram')).toBe('goz');
    expect(stem('foderam')).toBe('fod');
  });

  it('reduces imperfect (ava/iam)', () => {
    expect(stem('gozavam')).toBe('goz');
    expect(stem('fodiam')).toBe('fod');
  });

  it('reduces conditional (aria/eria/iria)', () => {
    expect(stem('gozaria')).toBe('goz');
    expect(stem('foderia')).toBe('fod');
  });

  it('reduces subjunctive (asse/esse/isse)', () => {
    expect(stem('gozasse')).toBe('goz');
    expect(stem('fodesse')).toBe('fod');
  });

  it('reduces diminutives (inho/inha)', () => {
    expect(stem('putinha')).toBe('put');
    expect(stem('cuzinho')).toBe('cuz');
  });

  it('reduces augmentatives (ao/ona)', () => {
    expect(stem('putona')).toBe('put');
  });

  it('reduces agent suffixes (eiro/eira)', () => {
    expect(stem('punheteiro')).toBe('punhet');
    expect(stem('punheteira')).toBe('punhet');
  });

  it('does not stem words that would become too short', () => {
    expect(stem('cu')).toBe('cu');
    expect(stem('pau')).toBe('pau');
  });

  it('returns word unchanged when no suffix matches', () => {
    expect(stem('nazi')).toBe('nazi');
    expect(stem('fdp')).toBe('fdp');
  });
});

// ─── Stem match (filter integration) ─────────────────────────────────────────

describe('stem_match', () => {
  it('blocks verb conjugations not in wordlist via stem match', () => {
    // These conjugations are NOT in HARD_BLOCKED, but the radical matches
    const conjugations = [
      'estuprei', // estuprar → estupr
      'estupraria', // conditional
      'estuprasse', // subjunctive
      'estupravam', // imperfect
    ];
    for (const word of conjugations) {
      const result = filterContent(word);
      expect(result.allowed).toBe(false);
    }
  });

  it('blocks conjugations of "chupar"', () => {
    const forms = ['chupei', 'chuparam', 'chuparia', 'chupasse'];
    for (const word of forms) {
      const result = filterContent(word);
      expect(result.allowed).toBe(false);
    }
  });

  it('blocks conjugations of "foder"', () => {
    const forms = ['fodi', 'foderam', 'foderia', 'fodesse'];
    for (const word of forms) {
      const result = filterContent(word);
      expect(result.allowed).toBe(false);
    }
  });

  it('blocks conjugations of "gozar" via stem', () => {
    const forms = ['gozavam', 'gozaria', 'gozasse', 'gozariam'];
    for (const word of forms) {
      const result = filterContent(word);
      expect(result.allowed).toBe(false);
    }
  });

  it('blocks conjugations of "transar"', () => {
    const forms = ['transei', 'transou', 'transaram', 'transaria'];
    for (const word of forms) {
      const result = filterContent(word);
      expect(result.allowed).toBe(false);
    }
  });

  it('does not false-positive on innocent words with short stems', () => {
    // These should NOT be blocked by stem match
    expect(filterContent('computador').allowed).toBe(true);
    expect(filterContent('metodo').allowed).toBe(true);
    expect(filterContent('comunidade').allowed).toBe(true);
  });

  it('returns reason stem_match for stem-matched words', () => {
    const result = filterContent('estupraria');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe('stem_match');
    }
  });
});

// ─── Issue #46 — Bypass com símbolos especiais (€, ³, £, etc.) ──────────────

describe('[Issue #46] - Bypass com símbolos especiais (€, ³, £, ¢)', () => {
  describe('normalização de símbolos especiais', () => {
    it('normalizes € → e (m€rda → merda)', () => {
      expect(normalize('m€rda')).toBe('merda');
    });

    it('normalizes ³ → 3 → e (m³rda → merda)', () => {
      expect(normalize('m³rda')).toBe('merda');
    });

    it('normalizes £ → l (£ixo → lixo)', () => {
      expect(normalize('£ixo')).toBe('lixo');
    });

    it('normalizes ¢ → c (¢uzao → cuzao)', () => {
      expect(normalize('¢uzao')).toBe('cuzao');
    });

    it('normalizes ² → 2 (superscript)', () => {
      expect(normalize('a²b')).toBe('a2b');
    });

    it('normalizes ¹ → 1 → i (v¹ado → viado)', () => {
      expect(normalize('v¹ado')).toBe('viado');
    });
  });

  describe('bloqueio de bypass com € e ³', () => {
    it('blocks m€rda (€ → e → merda)', () => {
      const result = filterContent('seu m€rda');
      expect(result.allowed).toBe(false);
    });

    it('blocks m³rda (³ → 3 → e → merda)', () => {
      const result = filterContent('seu m³rda');
      expect(result.allowed).toBe(false);
    });

    it('blocks ¢uzao (¢ → c → cuzao)', () => {
      const result = filterContent('¢uzao');
      expect(result.allowed).toBe(false);
    });

    it('blocks v¹ado (¹ → 1 → i → viado)', () => {
      const result = filterContent('v¹ado');
      expect(result.allowed).toBe(false);
    });

    it('blocks put⁴ (⁴ → 4 → a → puta)', () => {
      const result = filterContent('put⁴');
      expect(result.allowed).toBe(false);
    });
  });
});

// ─── Issue #47 — Bloqueio automático de palavras com 3+ dígitos ─────────────

describe('[Issue #47] - Bloqueio de palavras com 3+ dígitos (ofuscação)', () => {
  describe('bypass bloqueado (3+ dígitos em palavra com letras)', () => {
    it('blocks v14d0 (viado com 3 dígitos)', () => {
      const result = filterContent('v14d0');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks p0rn0gr4f14 (pornografia com muitos dígitos)', () => {
      const result = filterContent('p0rn0gr4f14');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks c4r4lh0 (caralho com 3 dígitos)', () => {
      const result = filterContent('c4r4lh0');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks 3stup4d0r (estuprador com 3 dígitos)', () => {
      const result = filterContent('3stup4d0r');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });

    it('blocks bu53t4 (buceta com 3 dígitos)', () => {
      const result = filterContent('bu53t4');
      expect(result.allowed).toBe(false);
      if (!result.allowed) expect(result.reason).toBe('hard_block');
    });
  });

  describe('falsos positivos — devem passar (CONTENT CLEAN)', () => {
    it('allows ps5 (apenas 1 dígito)', () => {
      expect(filterContent('comprei um ps5').allowed).toBe(true);
    });

    it('allows b2b (apenas 1 dígito)', () => {
      expect(filterContent('estrategia b2b').allowed).toBe(true);
    });

    it('allows h2o (apenas 1 dígito)', () => {
      expect(filterContent('beba h2o').allowed).toBe(true);
    });

    it('allows co2 (apenas 1 dígito)', () => {
      expect(filterContent('emissoes de co2').allowed).toBe(true);
    });

    it('allows 2x1 (apenas 1 letra)', () => {
      expect(filterContent('oferta 2x1').allowed).toBe(true);
    });

    it('allows mp3 (apenas 1 dígito)', () => {
      expect(filterContent('arquivo mp3').allowed).toBe(true);
    });

    it('allows w10 (apenas 2 dígitos)', () => {
      expect(filterContent('windows w10').allowed).toBe(true);
    });
  });
});
