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

  it('blocks with unusual accents: viàdo, vîado, pũta, etc.', () => {
    const words = [
      'viàdo',
      'pùta',
      'èstupro',
      'vîado',
      'pûta',
      'bûceta',
      'viãdo',
      'pũta',
      'raça ariana',
      'vïado',
      'vīado',
      'pūta',
    ];
    words.forEach((word) => {
      expect(filterContent(word).allowed).toBe(false);
    });
  });

  it('blocks with zero-width chars', () => {
    expect(filterContent('vi\u200Bado').allowed).toBe(false);
    expect(filterContent('v\u200Diado').allowed).toBe(false);
    expect(filterContent('vi\u200Dado').allowed).toBe(false);
    expect(filterContent('p\u200Du\u200Dt\u200Da').allowed).toBe(false);
  });

  it('blocks with Zalgo Text / heavy combining marks', () => {
    expect(filterContent('v̵i̵a̵d̵o̵').allowed).toBe(false);
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

  it('allows "dlc" (Downloadable Content — falso positivo para gamers)', () => {
    expect(filterContent('dlc').allowed).toBe(true);
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
describe('Falsos positivos com pipoca e pika', () => {
  it('deve permitir "pipoca" (falso positivo no fuzzy match)', () => {
    expect(filterContent('Eu amo comer pipoca assistindo filme').allowed).toBe(true);
  });

  it('deve bloquear "pika" (adicionado ao HARD_BLOCKED)', () => {
    expect(filterContent('Aquele cara é um pika').allowed).toBe(false);
    expect(filterContent('pika').allowed).toBe(false);
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
    // 'Assassino no filme' — removido: "assassino" agora é hard-blocked (v3)
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
    'Adriana',
    'Alessandra',
    'Alice',
    'Aline',
    'Alzira',
    'Amanda',
    'Ana',
    'Andrea',
    'Andreia',
    'Antonia',
    'Aparecida',
    'Beatriz',
    'Benedita',
    'Bianca',
    'Bruna',
    'Camila',
    'Carla',
    'Carolina',
    'Claudia',
    'Cristiane',
    'Cristina',
    'Daiane',
    'Daniela',
    'Debora',
    'Denise',
    'Eduarda',
    'Elaine',
    'Eliane',
    'Elisa',
    'Elza',
    'Evelyn',
    'Fabiana',
    'Fatima',
    'Fernanda',
    'Flavia',
    'Francisca',
    'Gabriela',
    'Geovana',
    'Helena',
    'Heloisa',
    'Isabel',
    'Isabela',
    'Jaqueline',
    'Jessica',
    'Joana',
    'Josefa',
    'Julia',
    'Juliana',
    'Janaína',
    'Karine',
    'Katia',
    'Larissa',
    'Laura',
    'Leticia',
    'Lidia',
    'Lilian',
    'Lorena',
    'Luana',
    'Lucia',
    'Luciana',
    'Luiza',
    'Luzia',
    'Marcia',
    'Maria',
    'Mariana',
    'Marina',
    'Marlene',
    'Marli',
    'Monica',
    'Nadia',
    'Nair',
    'Natalia',
    'Nilza',
    'Patricia',
    'Poliana',
    'Priscila',
    'Rafaela',
    'Raimunda',
    'Raquel',
    'Regina',
    'Renata',
    'Rita',
    'Roberta',
    'Rosa',
    'Rosana',
    'Rosangela',
    'Roseli',
    'Sandra',
    'Sara',
    'Sebastiana',
    'Selma',
    'Silvana',
    'Silvia',
    'Simone',
    'Solange',
    'Sonia',
    'Sueli',
    'Tamara',
    'Tamires',
    'Tania',
    'Tatiane',
    'Tatiana',
    'Tereza',
    'Terezinha',
    'Vanessa',
    'Vera',
    'Viviane',
    'Vitoria',
    'Yasmin',
    // Nomes com risco de colisão identificados
    'Ariane',
    'Assunção',
    'Conceição',
    'Mara',
    // ── Masculinos (fonte: API IBGE, todas as décadas + complementos) ─────────
    'Adriano',
    'Alexandre',
    'Anderson',
    'Andre',
    'Antonio',
    'Artur',
    'Augusto',
    'Benedito',
    'Bruno',
    'Caio',
    'Carlos',
    'Claudio',
    'Cristiano',
    'Daniel',
    'Diego',
    'Edilson',
    'Edson',
    'Eduardo',
    'Emerson',
    'Everton',
    'Ezequiel',
    'Fabio',
    'Felipe',
    'Fernando',
    'Flavio',
    'Francisco',
    'Gabriel',
    'Geraldo',
    'Gilberto',
    'Gilmar',
    'Gilson',
    'Giovanni',
    'Guilherme',
    'Gustavo',
    'Heitor',
    'Henrique',
    'Hugo',
    'Humberto',
    'Igor',
    'Ivan',
    'Jefferson',
    'Joao',
    'Joaquim',
    'Joel',
    'Jonas',
    'Jorge',
    'Jose',
    'Junior',
    'Leandro',
    'Leonardo',
    'Levi',
    'Lucas',
    'Luciano',
    'Luis',
    'Luiz',
    'Manoel',
    'Manuel',
    'Marcelo',
    'Marcio',
    'Marcos',
    'Mario',
    'Mateus',
    'Matheus',
    'Mauricio',
    'Mauro',
    'Miguel',
    'Milton',
    'Moises',
    'Murilo',
    'Natan',
    'Nelson',
    'Nilson',
    'Otavio',
    'Osvaldo',
    'Pablo',
    'Paulo',
    'Pedro',
    'Rafael',
    'Raimundo',
    'Renan',
    'Renato',
    'Ricardo',
    'Roberto',
    'Robson',
    'Rodrigo',
    'Ronaldo',
    'Ruan',
    'Rubens',
    'Samuel',
    'Sandro',
    'Sebastiao',
    'Sergio',
    'Severino',
    'Thiago',
    'Tiago',
    'Valdir',
    'Vanderlei',
    'Victor',
    'Vicente',
    'Vinicius',
    'Vitor',
    'Waldir',
    'Wanderlei',
    'Wellington',
    'William',
    'Wilson',
    // ── Sobrenomes top-78 (Censo 2022 IBGE) ──────────────────────────────────
    'Silva',
    'Santos',
    'Oliveira',
    'Souza',
    'Pereira',
    'Ferreira',
    'Lima',
    'Alves',
    'Rodrigues',
    'Costa',
    'Sousa',
    'Gomes',
    'Nascimento',
    'Araujo',
    'Ribeiro',
    'Almeida',
    'Jesus',
    'Barbosa',
    'Soares',
    'Carvalho',
    'Martins',
    'Lopes',
    'Vieira',
    'Rocha',
    'Dias',
    'Gonçalves',
    'Fernandes',
    'Santana',
    'Andrade',
    'Batista',
    'Campos',
    'Mendes',
    'Cardoso',
    'Teixeira',
    'Freitas',
    'Correia',
    'Pinto',
    'Cavalcanti',
    'Braga',
    'Medeiros',
    'Azevedo',
    'Castro',
    'Cunha',
    'Cruz',
    'Brito',
    'Nunes',
    'Miranda',
    'Morais',
    'Neto',
    'Monteiro',
    'Moreira',
    'Moura',
    'Machado',
    'Ramos',
    'Coelho',
    'Borges',
    'Melo',
    'Faria',
    'Rezende',
    'Guimarães',
    'Figueiredo',
    'Macedo',
    'Duarte',
    'Silveira',
    'Porto',
    'Amorim',
    'Leite',
    'Paiva',
    'Queiroz',
    'Vasconcelos',
    'Xavier',
    'Maia',
    'Lacerda',
    'Bastos',
    'Pires',
    'Tavares',
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

  it('does NOT block "computador" (contains "put")', () => {
    expect(filterContent('meu computador lento').allowed).toBe(true);
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

// ─── Bypass com números não-leet e emojis ────────────────────────────────────

describe('numeric bypass (digits 2, 6, 8, 9 as separators)', () => {
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

describe('emoji bypass (emojis como separadores dentro de palavras)', () => {
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

describe('leetspeak legítimo (0, 1, 3, 4, 5, 7) continua funcionando via Layer de tradução', () => {
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

describe('10 Termos Reportados', () => {
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

    it('allows "sx" isolado (removido de ABBREVIATION_MAP — SSX é jogo EA; "sexo" permanece bloqueado)', () => {
      // "sx" foi removido do mapa pois "SSX" (jogo EA Sports) colapsava ss→s→sx→sexo
      // A cobertura permanece via: "sexo" hard-blocked, s3x0 (leet), s*x (bypass)
      expect(filterContent('sx').allowed).toBe(true);
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

// ───  Bypass com símbolos especiais (€, ³, £, etc.) ──────────────

describe('Bypass com símbolos especiais (€, ³, £, ¢)', () => {
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

// ───  Bloqueio automático de palavras com 3+ dígitos ─────────────

describe('[  Bloqueio de palavras com 3+ dígitos (ofuscação)', () => {
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

// ─── Issue #27 — Stalking, perseguição e ameaças pessoais ────────────────────

describe('Stalking, perseguição e ameaças pessoais', () => {
  // ── Stalking: conhecimento de localização e rotina ────────────────────────
  describe('stalking — conhecimento de localização e rotina', () => {
    const cases = [
      'sei onde voce mora',
      'sei onde tu mora',
      'sei onde voce estuda',
      'sei onde tu estudas',
      'sei onde voce trabalha',
      'sei onde tu trabalha',
      'sei onde voce fica',
      'sei teu endereco',
      'sei seu endereco',
      'sei tua rua',
      'sei sua rua',
      'sei seus horarios',
      'sei teus horarios',
      'sei quando voce sai',
      'sei quando tu sai',
      'sei quando voce chega',
      'sei quando tu chega',
      'sei sua rotina',
      'sei tua rotina',
    ];

    cases.forEach((phrase) => {
      it(`blocks "${phrase}"`, () => {
        const result = filterContent(phrase);
        expect(result.allowed).toBe(false);
        if (!result.allowed) expect(result.reason).toBe('hard_block');
      });
    });
  });

  // ── Stalking: vigilância e perseguição física ─────────────────────────────
  describe('stalking — vigilância e perseguição', () => {
    const cases = [
      'vou te achar',
      'vou te rastrear',
      'te rastrear',
      'vou na tua casa',
      'vou na sua casa',
      'vou aparecer na tua porta',
      'vou aparecer na sua porta',
      'vou te seguir',
      'vou ficar te seguindo',
      'to de olho em voce',
      'to de olho em ti',
      'estou te vigiando',
      'to te vigiando',
      'nao tem pra onde correr',
      'nao tem como escapar',
      'voce nao vai escapar',
    ];

    cases.forEach((phrase) => {
      it(`blocks "${phrase}"`, () => {
        const result = filterContent(phrase);
        expect(result.allowed).toBe(false);
        if (!result.allowed) expect(result.reason).toBe('hard_block');
      });
    });
  });

  // ── Ameaças pessoais ──────────────────────────────────────────────────────
  describe('ameaças pessoais', () => {
    const cases = [
      'vou te pegar na saida',
      'vou te esperar na saida',
      'to te esperando',
      'vai se arrepender',
      'voce vai se arrepender',
      'vai se arrepender disso',
      'voce vai pagar',
      'voce vai pagar por isso',
      'voce vai pagar por tudo',
      'voce vai ver o que vai acontecer',
      'vou acabar com voce',
      'cuidado quando sair de casa',
      'sei quem voce e',
      'seus dias estao contados',
      'ta com os dias contados',
      'nao vai escapar de mim',
    ];

    cases.forEach((phrase) => {
      it(`blocks "${phrase}"`, () => {
        const result = filterContent(phrase);
        expect(result.allowed).toBe(false);
        if (!result.allowed) expect(result.reason).toBe('hard_block');
      });
    });
  });

  // ── Doxxing: exposição de dados pessoais ──────────────────────────────────
  describe('doxxing — exposição de dados pessoais', () => {
    const cases = [
      'vou vazar seus dados',
      'vou vazar teus dados',
      'vou vazar suas fotos',
      'vou vazar tuas fotos',
      'vou postar seu endereco',
      'vou postar teu endereco',
      'vou publicar seu endereco',
      'vou publicar teu endereco',
      'vou expor voce',
      'vou expor tua vida',
      'vou expor sua vida',
      'vou mostrar pra todo mundo',
      'vou mandar pra tua familia',
      'vou mandar pra sua familia',
      'vou passar seu numero',
      'vou passar teu numero',
      'sei seu cpf',
      'sei teu cpf',
      'tenho seus dados',
      'tenho teus dados',
      'achei seus dados',
      'vou revelar quem voce e',
    ];

    cases.forEach((phrase) => {
      it(`blocks "${phrase}"`, () => {
        const result = filterContent(phrase);
        expect(result.allowed).toBe(false);
        if (!result.allowed) expect(result.reason).toBe('hard_block');
      });
    });
  });

  // ── Normalização: acentos e variações devem ser capturados ───────────────
  describe('bypass com acentos — devem ser bloqueados', () => {
    it('blocks "sei onde você mora" (acento em você)', () => {
      expect(filterContent('sei onde você mora').allowed).toBe(false);
    });

    it('blocks "sei onde você trabalha" (acento em você)', () => {
      expect(filterContent('sei onde você trabalha').allowed).toBe(false);
    });

    it('blocks "sei teu endereço" (acento em endereço)', () => {
      expect(filterContent('sei teu endereço').allowed).toBe(false);
    });

    it('blocks "vou expor você" (acento em você)', () => {
      expect(filterContent('vou expor você').allowed).toBe(false);
    });

    it('blocks "vou mandar pra tua família" (acento em família)', () => {
      expect(filterContent('vou mandar pra tua família').allowed).toBe(false);
    });
  });

  // ── Falsos positivos — não devem ser bloqueados ───────────────────────────
  describe('falsos positivos — devem ser permitidos', () => {
    it('allows "sei onde fica o mercado"', () => {
      expect(filterContent('sei onde fica o mercado').allowed).toBe(true);
    });

    it('allows "sei onde eu moro"', () => {
      expect(filterContent('sei onde eu moro').allowed).toBe(true);
    });

    it('allows "sei que voce estuda muito"', () => {
      expect(filterContent('sei que voce estuda muito').allowed).toBe(true);
    });

    it('allows "to de olho no projeto"', () => {
      expect(filterContent('to de olho no projeto').allowed).toBe(true);
    });

    it('allows "nao tem como saber"', () => {
      expect(filterContent('nao tem como saber').allowed).toBe(true);
    });

    it('allows "sei seu nome completo"', () => {
      expect(filterContent('sei seu nome completo').allowed).toBe(true);
    });
  });
});

// ─── Times de futebol brasileiro — falsos positivos ──────────────────────────

describe('times de futebol brasileiro — falsos positivos (issue #62)', () => {
  // Apelidos/mascotes que ativavam fuzzy match indevido
  it('permite "preta" (Ponte Preta / adjetivo comum — dist 1 de "pheta")', () => {
    expect(filterContent('Ponte Preta').allowed).toBe(true);
    expect(filterContent('camisa preta do time').allowed).toBe(true);
    expect(filterContent('preta').allowed).toBe(true);
  });

  it('permite "porco" (apelido/mascote do Palmeiras — dist 1 de "porno")', () => {
    expect(filterContent('vai Palmeiras porco').allowed).toBe(true);
    expect(filterContent('o porco ta na area').allowed).toBe(true);
    expect(filterContent('porco').allowed).toBe(true);
  });

  it('permite "periquito" (mascote do Palmeiras/Goiás — dist 1 de "periquita"/"priquito")', () => {
    expect(filterContent('o periquito do Palmeiras e o mascote').allowed).toBe(true);
    expect(filterContent('periquito').allowed).toBe(true);
  });

  it('permite "periquitos" (plural do mascote — dist 2 de "periquita")', () => {
    expect(filterContent('os periquitos estao na arquibancada').allowed).toBe(true);
    expect(filterContent('periquitos').allowed).toBe(true);
  });

  // Nomes oficiais e apelidos comuns — devem passar normalmente
  it('permite nomes oficiais dos times da Serie A', () => {
    const times = [
      'Flamengo',
      'Palmeiras',
      'Corinthians',
      'Sao Paulo',
      'Gremio',
      'Internacional',
      'Atletico MG',
      'Cruzeiro',
      'Fluminense',
      'Botafogo',
      'Vasco',
      'Santos',
      'Bahia',
      'Fortaleza',
      'Athletico PR',
      'Bragantino',
      'Cuiaba',
      'Vitoria',
      'Chapecoense',
      'Mirassol',
    ];
    for (const time of times) {
      expect(filterContent(`o jogo do ${time} foi incrivel`).allowed).toBe(true);
    }
  });

  it('permite apelidos carinhosos comuns', () => {
    const apelidos = [
      'Mengao',
      'Timao',
      'Vascao',
      'Fogao',
      'Fluzao',
      'Peixao',
      'Coringao',
      'Papao',
      'Dogao',
    ];
    for (const apelido of apelidos) {
      expect(filterContent(`torcida do ${apelido} e a melhor`).allowed).toBe(true);
    }
  });

  it('permite apelidos de mascotes/animais usados no futebol', () => {
    const mascotes = [
      'Galo', // Atletico-MG
      'Raposa', // Cruzeiro
      'Urubu', // Flamengo
      'Coelho', // America-MG
      'Leao', // Sport / Fortaleza / varios
      'Tigre', // Criciuma / Vila Nova
      'Tubarao', // Londrina / Sampaio Correa
      'Baleia', // Santos
      'Galinha', // apelido de rival (Atletico-MG / Corinthians)
      'Porcada', // torcida do Palmeiras
      'Suino', // Palmeiras
      'Gambá', // Corinthians
      'Timbu', // Nautico
      'Pantera', // Botafogo-SP / Democrata
      'Dragao', // Atletico-GO / Atletico-CE
      'Coruja', // Operario-PR / Tirol
      'Gaviao', // Manaus / Tombense
      'Aguia', // varios
    ];
    for (const mascote of mascotes) {
      expect(filterContent(`${mascote} na area`).allowed).toBe(true);
    }
  });

  it('permite apelidos de identidade/cor usados no futebol', () => {
    const identidades = [
      'Rubro-Negro',
      'Tricolor',
      'Alviverde',
      'Alvinegro',
      'Colorado',
      'Verdao',
      'Celeste',
      'Cruzmaltino',
      'Esmeraldino',
    ];
    for (const id of identidades) {
      expect(filterContent(`${id} e o melhor`).allowed).toBe(true);
    }
  });

  it('permite apelidos pejorativos ressignificados pelos proprios torcedores', () => {
    const ressignificados = [
      'Porco', // Palmeiras
      'Urubu', // Flamengo
      'Gambá', // Corinthians
      'Coelho', // America-MG
      'Timbu', // Nautico
    ];
    for (const term of ressignificados) {
      expect(filterContent(`${term} nao para de ganhar`).allowed).toBe(true);
    }
  });

  it('permite apelidos e mascotes dos times da Serie A', () => {
    // Palmeiras
    expect(filterContent('Verdao e o apelido do Palmeiras').allowed).toBe(true);
    expect(filterContent('Alviverde e o apelido do Palmeiras').allowed).toBe(true);
    expect(filterContent('Academia e o apelido do Palmeiras').allowed).toBe(true);
    expect(filterContent('Porcada e a torcida do Palmeiras').allowed).toBe(true);
    expect(filterContent('Suino e o apelido do Palmeiras').allowed).toBe(true);
    expect(filterContent('Chiqueiro e o apelido de rival do Palmeiras').allowed).toBe(true);
    // Sao Paulo
    expect(filterContent('Tricolor Paulista e o apelido do Sao Paulo').allowed).toBe(true);
    expect(filterContent('Soberano e o apelido do Sao Paulo').allowed).toBe(true);
    expect(filterContent('Santo Paulo e o mascote do Sao Paulo').allowed).toBe(true);
    expect(filterContent('Bambi e o apelido do Sao Paulo').allowed).toBe(true);
    expect(filterContent('Piu-Piu e o apelido de rival do Sao Paulo').allowed).toBe(true);
    // Fluminense
    expect(filterContent('Flu e o apelido do Fluminense').allowed).toBe(true);
    expect(filterContent('Tricolor das Laranjeiras e o apelido do Fluminense').allowed).toBe(true);
    expect(filterContent('Fluzao e o apelido do Fluminense').allowed).toBe(true);
    expect(filterContent('Po de Arroz e o apelido do Fluminense').allowed).toBe(true);
    expect(filterContent('Nense e o apelido do Fluminense').allowed).toBe(true);
    expect(filterContent('Tricoflor e o apelido de rival do Fluminense').allowed).toBe(true);
    expect(filterContent('Guerreiro e o mascote do Fluminense').allowed).toBe(true);
    // Flamengo
    expect(filterContent('Mengao e o apelido do Flamengo').allowed).toBe(true);
    expect(filterContent('Mengo e o apelido do Flamengo').allowed).toBe(true);
    expect(filterContent('Rubro-Negro e o apelido do Flamengo').allowed).toBe(true);
    expect(filterContent('Nacao e a torcida do Flamengo').allowed).toBe(true);
    expect(filterContent('Flavelado e o apelido de rival do Flamengo').allowed).toBe(true);
    // Bahia
    expect(filterContent('Esquadrao de Aco e o apelido do Bahia').allowed).toBe(true);
    expect(filterContent('Tricolor de Aco e o apelido do Bahia').allowed).toBe(true);
    expect(filterContent('Bahea e o apelido do Bahia').allowed).toBe(true);
    // Athletico-PR
    expect(filterContent('Furacao e o apelido do Athletico PR').allowed).toBe(true);
    expect(filterContent('CAP e a sigla do Athletico PR').allowed).toBe(true);
    expect(filterContent('Fura-Cao e o mascote do Athletico PR').allowed).toBe(true);
    expect(filterContent('Poodle e o apelido de rival do Athletico PR').allowed).toBe(true);
    // Coritiba
    expect(filterContent('Coxa e o apelido do Coritiba').allowed).toBe(true);
    expect(filterContent('Coxa-Branca e o apelido do Coritiba').allowed).toBe(true);
    expect(filterContent('Vovo Coxa e o mascote do Coritiba').allowed).toBe(true);
    expect(filterContent('Coxinha e o apelido de rival do Coritiba').allowed).toBe(true);
    expect(filterContent('Broxa e o apelido de rival do Coritiba').allowed).toBe(true);
    // Atletico-MG
    expect(filterContent('Galo Forte e o apelido do Atletico MG').allowed).toBe(true);
    expect(filterContent('Galo Doido e o mascote do Atletico MG').allowed).toBe(true);
    expect(filterContent('Galinha e o apelido de rival do Atletico MG').allowed).toBe(true);
    // Bragantino
    expect(filterContent('Massa Bruta e o apelido do Bragantino').allowed).toBe(true);
    expect(filterContent('Braga e o apelido do Bragantino').allowed).toBe(true);
    expect(filterContent('Toro Loko e o mascote do Bragantino').allowed).toBe(true);
    // Botafogo
    expect(filterContent('Fogao e o apelido do Botafogo').allowed).toBe(true);
    expect(filterContent('Glorioso e o apelido do Botafogo').allowed).toBe(true);
    expect(filterContent('Manequinho e o mascote do Botafogo').allowed).toBe(true);
    expect(filterContent('Biriba e o mascote do Botafogo').allowed).toBe(true);
    expect(filterContent('Cachorrada e o apelido de rival do Botafogo').allowed).toBe(true);
    // Gremio
    expect(filterContent('Imortal e o apelido do Gremio').allowed).toBe(true);
    expect(filterContent('Tricolor Gaucho e o apelido do Gremio').allowed).toBe(true);
    expect(filterContent('Tricolor dos Pampas e o apelido do Gremio').allowed).toBe(true);
    expect(filterContent('Mosqueteiro e o mascote do Gremio').allowed).toBe(true);
    // Vasco
    expect(filterContent('Vascao e o apelido do Vasco').allowed).toBe(true);
    expect(filterContent('Gigante da Colina e o apelido do Vasco').allowed).toBe(true);
    expect(filterContent('Cruzmaltino e o apelido do Vasco').allowed).toBe(true);
    expect(filterContent('Almirante e o mascote do Vasco').allowed).toBe(true);
    expect(filterContent('Bacalhau e o apelido de rival do Vasco').allowed).toBe(true);
    expect(filterContent('Vice da Gama e o apelido de rival do Vasco').allowed).toBe(true);
    // Internacional
    expect(filterContent('Inter e o apelido do Internacional').allowed).toBe(true);
    expect(filterContent('Saci e o mascote do Internacional').allowed).toBe(true);
    // Vitoria
    expect(filterContent('Leao da Barra e o apelido do Vitoria').allowed).toBe(true);
    // Santos
    expect(filterContent('Peixe e o apelido do Santos').allowed).toBe(true);
    expect(filterContent('Peixao e o apelido do Santos').allowed).toBe(true);
    expect(filterContent('Alvinegro Praiano e o apelido do Santos').allowed).toBe(true);
    expect(filterContent('Baleia e o mascote do Santos').allowed).toBe(true);
    expect(filterContent('Sardinha e o apelido de rival do Santos').allowed).toBe(true);
    expect(filterContent('Sereia e o apelido do Santos').allowed).toBe(true);
    // Corinthians
    expect(filterContent('Timao e o apelido do Corinthians').allowed).toBe(true);
    expect(filterContent('Coringao e o apelido do Corinthians').allowed).toBe(true);
    expect(filterContent('Bando de Loucos e o apelido do Corinthians').allowed).toBe(true);
    expect(filterContent('Time do Povo e o apelido do Corinthians').allowed).toBe(true);
    expect(filterContent('Todo Poderoso e o apelido do Corinthians').allowed).toBe(true);
    expect(filterContent('Mosqueteiro e o mascote do Corinthians').allowed).toBe(true);
    // Chapecoense
    expect(filterContent('Chape e o apelido da Chapecoense').allowed).toBe(true);
    expect(filterContent('Verdao do Oeste e o apelido da Chapecoense').allowed).toBe(true);
    expect(filterContent('Indio Conda e o mascote da Chapecoense').allowed).toBe(true);
    // Remo
    expect(filterContent('Leao Azul e o apelido do Remo').allowed).toBe(true);
    // Cruzeiro
    expect(filterContent('Raposa e o apelido do Cruzeiro').allowed).toBe(true);
    expect(filterContent('Cabuloso e o apelido do Cruzeiro').allowed).toBe(true);
    expect(filterContent('Celeste e o apelido do Cruzeiro').allowed).toBe(true);
    expect(filterContent('Maria e o apelido de rival do Cruzeiro').allowed).toBe(true);
    // Mirassol
    expect(filterContent('Leao da Alta Araraquarense e o apelido do Mirassol').allowed).toBe(true);
  });

  it('permite apelidos e mascotes dos times da Serie B', () => {
    // Goias
    expect(filterContent('Esmeraldino e o apelido do Goias').allowed).toBe(true);
    // Avai
    expect(filterContent('Leao da Ilha e o apelido do Avai').allowed).toBe(true);
    // Operario-PR
    expect(filterContent('Fantasma e o apelido do Operario PR').allowed).toBe(true);
    // Botafogo-SP
    expect(filterContent('Pantera e o apelido do Botafogo SP').allowed).toBe(true);
    // Nautico
    expect(filterContent('Timbu e o apelido do Nautico').allowed).toBe(true);
    expect(filterContent('Barbie e o apelido de rival do Nautico').allowed).toBe(true);
    // Ceara
    expect(filterContent('Vozao e o apelido do Ceara').allowed).toBe(true);
    expect(filterContent('Vovo e o apelido do Ceara').allowed).toBe(true);
    expect(filterContent('Come-Ovo e o apelido de rival do Ceara').allowed).toBe(true);
    // Vila Nova
    expect(filterContent('Tigrao e o apelido do Vila Nova').allowed).toBe(true);
    // Athletic Club
    expect(filterContent('Esquadrao de Aco e o apelido do Athletic Club').allowed).toBe(true);
    expect(filterContent('Guerreiro e o mascote do Athletic Club').allowed).toBe(true);
    // Sport
    expect(filterContent('Leao da Ilha e o apelido do Sport').allowed).toBe(true);
    // Londrina
    expect(filterContent('Tubarao e o apelido do Londrina').allowed).toBe(true);
    // Sao Bernardo
    expect(filterContent('Berno e o apelido do Sao Bernardo').allowed).toBe(true);
    // Criciuma
    expect(filterContent('Tigresa e o apelido do Criciuma').allowed).toBe(true);
    // Fortaleza
    expect(filterContent('Leao do Pici e o apelido do Fortaleza').allowed).toBe(true);
    expect(filterContent('Tricolor de Aco e o apelido do Fortaleza').allowed).toBe(true);
    // CRB
    expect(filterContent('Galo de Campina e o apelido do CRB').allowed).toBe(true);
    expect(filterContent('Regatas e o apelido do CRB').allowed).toBe(true);
    // Novorizontino
    expect(filterContent('Tigre do Vale e o apelido do Novorizontino').allowed).toBe(true);
    // Cuiaba
    expect(filterContent('Dourado e o apelido do Cuiaba').allowed).toBe(true);
    expect(filterContent('Auriverde e o apelido do Cuiaba').allowed).toBe(true);
    expect(filterContent('Peixe Dourado e o mascote do Cuiaba').allowed).toBe(true);
    // Ponte Preta
    expect(filterContent('Gorila e o mascote da Ponte Preta').allowed).toBe(true);
    // America-MG
    expect(filterContent('Coelho e o apelido do America MG').allowed).toBe(true);
    expect(filterContent('Mecao e o apelido do America MG').allowed).toBe(true);
    // Juventude
    expect(filterContent('Papo e o apelido do Juventude').allowed).toBe(true);
    expect(filterContent('Papada e o apelido do Juventude').allowed).toBe(true);
    expect(filterContent('Ju e o apelido do Juventude').allowed).toBe(true);
    expect(filterContent('Polentude e o apelido de rival do Juventude').allowed).toBe(true);
    // Atletico-GO
    expect(filterContent('Dragao e o apelido do Atletico GO').allowed).toBe(true);
  });

  it('permite nomes de times tradicionais das Series B/C', () => {
    expect(filterContent('Sport subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Nautico subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Santa Cruz subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Guarani subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Ponte Preta subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Vitoria subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Remo subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Paysandu subiu para Serie A').allowed).toBe(true);
    expect(filterContent('ABC subiu para Serie A').allowed).toBe(true);
    expect(filterContent('CRB subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Vila Nova subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Londrina subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Operario subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Ituano subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Chapecoense subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Avai subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Criciuma subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Juventude subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Goias subiu para Serie A').allowed).toBe(true);
    expect(filterContent('Coritiba subiu para Serie A').allowed).toBe(true);
  });

  it('permite apelidos e mascotes dos times da Serie C', () => {
    // Ituano
    expect(filterContent('Galo de Itu e o apelido').allowed).toBe(true);
    // Maringa
    expect(filterContent('Dogao e o apelido do Maringa').allowed).toBe(true);
    // Brusque
    expect(filterContent('Marreco e o mascote do Brusque').allowed).toBe(true);
    // Floresta
    expect(filterContent('Lobo da Vila e o apelido').allowed).toBe(true);
    // Amazonas
    expect(filterContent('Onca-Pintada e o mascote do Amazonas').allowed).toBe(true);
    // Botafogo-PB
    expect(filterContent('Belo e o apelido do Botafogo PB').allowed).toBe(true);
    expect(filterContent('Xerife e o mascote').allowed).toBe(true);
    // Paysandu
    expect(filterContent('Papao da Curuzu e o apelido do Paysandu').allowed).toBe(true);
    // Santa Cruz
    expect(filterContent('Santinha e o apelido do Santa Cruz').allowed).toBe(true);
    expect(filterContent('Coral e o apelido do Santa Cruz').allowed).toBe(true);
    expect(filterContent('Cobra Coral e o mascote').allowed).toBe(true);
    // Figueirense
    expect(filterContent('Figueira e o apelido do Figueirense').allowed).toBe(true);
    expect(filterContent('Furacao e o mascote do Figueirense').allowed).toBe(true);
    // Guarani
    expect(filterContent('Bugre e o apelido do Guarani').allowed).toBe(true);
    // Maranhao
    expect(filterContent('Macao e o apelido do Maranhao').allowed).toBe(true);
    expect(filterContent('Bode Gregorio e o mascote').allowed).toBe(true);
    // Ypiranga-RS
    expect(filterContent('Canarinho e o apelido do Ypiranga').allowed).toBe(true);
    // Ferrroviaria
    expect(filterContent('Locomotiva e o apelido da Ferroviaria').allowed).toBe(true);
    expect(filterContent('Maquinista e o mascote').allowed).toBe(true);
    // Caxias
    expect(filterContent('Grena do Povo e o apelido do Caxias').allowed).toBe(true);
    // Barra-SC
    expect(filterContent('Pescador e o mascote do Barra SC').allowed).toBe(true);
    // Confianca
    expect(filterContent('Dragao do Bairro Industrial e o apelido').allowed).toBe(true);
    // Itabaiana
    expect(filterContent('Cebolinha e o mascote do Itabaiana').allowed).toBe(true);
    // Volta Redonda
    expect(filterContent('Voltaco e o apelido do Volta Redonda').allowed).toBe(true);
    expect(filterContent('Jaguatirica e o mascote').allowed).toBe(true);
    // Anapois
    expect(filterContent('Galo da Comarca e o apelido do Anapois').allowed).toBe(true);
  });

  it('permite apelidos e mascotes dos times da Serie D — Grupos 1 a 8', () => {
    // Grupo 1
    expect(filterContent('Gaviao do Norte e o apelido do Manaus').allowed).toBe(true);
    expect(filterContent('Leao da Vila Municipal e o apelido').allowed).toBe(true);
    expect(filterContent('Robo da Amazonia e o apelido do Manauara').allowed).toBe(true);
    expect(filterContent('Mundao e o apelido do Sao Raimundo RR').allowed).toBe(true);
    expect(filterContent('Leao Dourado e o apelido do GAS').allowed).toBe(true);
    expect(filterContent('Auriverde e o apelido do Monte Roraima').allowed).toBe(true);
    // Grupo 2
    expect(filterContent('Locomotiva e o apelido do Porto Velho').allowed).toBe(true);
    expect(filterContent('Tourao do Norte e o apelido do Araguaina').allowed).toBe(true);
    expect(filterContent('Imperador e o apelido do Galvez').allowed).toBe(true);
    expect(filterContent('Tricolor de Aco e o apelido').allowed).toBe(true);
    expect(filterContent('Tourao e o apelido do Humaita').allowed).toBe(true);
    // Grupo 3
    expect(filterContent('Periquito e o apelido do Gama').allowed).toBe(true);
    expect(filterContent('Verdao do Norte e o apelido do Luverdense').allowed).toBe(true);
    expect(filterContent('Jacare e o apelido do Brasiliense').allowed).toBe(true);
    expect(filterContent('Gigante da Vila e o apelido do Primavera MT').allowed).toBe(true);
    expect(filterContent('Fantasma e o mascote do Primavera MT').allowed).toBe(true);
    expect(filterContent('Pantera Avinhada e o apelido do Inhumas').allowed).toBe(true);
    expect(filterContent('Camaleao e o apelido do Aparecidense').allowed).toBe(true);
    // Grupo 4
    expect(filterContent('Coruja e o apelido do Capital DF').allowed).toBe(true);
    expect(filterContent('Azulao e o apelido do Goiatuba').allowed).toBe(true);
    expect(filterContent('Chicote da Fronteira e o apelido do Operario VG').allowed).toBe(true);
    expect(filterContent('Gato Preto e o apelido da Ceilandia').allowed).toBe(true);
    expect(filterContent('Tigre da Vargas e o apelido do Mixto MT').allowed).toBe(true);
    expect(filterContent('Colorado e o apelido do Uniao Rondonopolis').allowed).toBe(true);
    // Grupo 5
    expect(filterContent('Cavalo de Aco e o apelido do Imperatriz').allowed).toBe(true);
    expect(filterContent('Aguia do Souza e o apelido da Tuna Luso').allowed).toBe(true);
    expect(filterContent('Orca e o apelido do Oratorio').allowed).toBe(true);
    expect(filterContent('Verdao do Norte e o apelido do Tocantinopolis').allowed).toBe(true);
    // Grupo 6
    expect(filterContent('Canario da Ilha e o apelido do IAPE').allowed).toBe(true);
    expect(filterContent('Bicolor e o apelido do Maracana').allowed).toBe(true);
    expect(filterContent('Papao do Norte e o apelido do Moto Club').allowed).toBe(true);
    expect(filterContent('Bicho Papao e o mascote do Moto Club').allowed).toBe(true);
    expect(filterContent('Tubarao do Litoral e o apelido do Parnahyba').allowed).toBe(true);
    expect(filterContent('Bolivia Querida e o apelido do Sampaio Correa').allowed).toBe(true);
    // Grupo 7
    expect(filterContent('Enxuga Rato e o apelido do Piaui').allowed).toBe(true);
    expect(filterContent('Tubarao da Barra e o apelido do Ferroviario').allowed).toBe(true);
    expect(filterContent('Vaqueiro e o apelido do Fluminense PI').allowed).toBe(true);
    expect(filterContent('Aguia da Precabura e o apelido do Atletico CE').allowed).toBe(true);
    // Grupo 8
    expect(filterContent('Orgulho de Bonito e o apelido do Maguary').allowed).toBe(true);
    expect(filterContent('Mecao e o apelido do America RN').allowed).toBe(true);
    expect(filterContent('Patativa do Agreste e o apelido do Central').allowed).toBe(true);
    expect(filterContent('Dinossauro e o apelido do Sousa').allowed).toBe(true);
    expect(filterContent('Elefante e o mascote do ABC').allowed).toBe(true);
  });

  it('permite apelidos e mascotes dos times da Serie D — Grupos 9 a 16', () => {
    // Grupo 9
    expect(filterContent('Galo da Borborema e o apelido do Treze').allowed).toBe(true);
    expect(filterContent('Bode do Sertao e o apelido do Decisao').allowed).toBe(true);
    expect(filterContent('Verdao e o apelido do Lagarto').allowed).toBe(true);
    expect(filterContent('Diabo Rubro e o apelido do Sergipe').allowed).toBe(true);
    expect(filterContent('Carcara e o apelido do Serra Branca').allowed).toBe(true);
    expect(filterContent('Fenix e o apelido do Retro').allowed).toBe(true);
    // Grupo 10
    expect(filterContent('Azulao e o apelido do CSA').allowed).toBe(true);
    expect(filterContent('Cancao de Fogo e o apelido do Juazeirense').allowed).toBe(true);
    expect(filterContent('Fantasma das Alagoas e o apelido do ASA').allowed).toBe(true);
    expect(filterContent('Leao do Sisal e o apelido do Jacuipense').allowed).toBe(true);
    expect(filterContent('Tricolor Palmeirense e o apelido do CSE').allowed).toBe(true);
    expect(filterContent('Carcara e o apelido do Atletico BA').allowed).toBe(true);
    // Grupo 11
    expect(filterContent('Verdao e o apelido do Uberlandia').allowed).toBe(true);
    expect(filterContent('Leao do Sul e o apelido do CRAC').allowed).toBe(true);
    // Grupo 12
    expect(filterContent('Gaviao Carcara e o apelido do Tombense').allowed).toBe(true);
    expect(filterContent('Capa Preta e o apelido do Rio Branco ES').allowed).toBe(true);
    expect(filterContent('Merengue e o apelido do Real Noroeste').allowed).toBe(true);
    // Grupo 13
    expect(filterContent('Netuno e o mascote do Agua Santa').allowed).toBe(true);
    expect(filterContent('Pousao e o apelido do Pouso Alegre').allowed).toBe(true);
    expect(filterContent('Lusa e o apelido da Portuguesa').allowed).toBe(true);
    expect(filterContent('Lusa Carioca e o apelido da Portuguesa RJ').allowed).toBe(true);
    expect(filterContent('Ze Carioca e o mascote do Madureira').allowed).toBe(true);
    expect(filterContent('Mecao e o apelido do America RJ').allowed).toBe(true);
    // Grupo 14
    expect(filterContent('Nho Quim e o mascote do XV de Piracicaba').allowed).toBe(true);
    expect(filterContent('Caipira e o mascote').allowed).toBe(true);
    expect(filterContent('Tsunami e o apelido do Marica').allowed).toBe(true);
    expect(filterContent('Gaivota e o mascote do Marica').allowed).toBe(true);
    expect(filterContent('Galinho da Serra e o apelido do Sampaio Correa RJ').allowed).toBe(true);
    expect(filterContent('Galo Vermelho e o apelido do Velo Clube').allowed).toBe(true);
    expect(filterContent('Norusca e o apelido do Noroeste').allowed).toBe(true);
    expect(filterContent('Orgulho da Baixada e o apelido do Nova Iguacu').allowed).toBe(true);
    // Grupo 15
    expect(filterContent('Leao do Vale e o apelido do Cianorte').allowed).toBe(true);
    expect(filterContent('JEC e o apelido do Joinville').allowed).toBe(true);
    expect(filterContent('Serpente e o mascote do FC Cascavel').allowed).toBe(true);
    expect(filterContent('Aguia do Sul e o apelido do Santa Catarina').allowed).toBe(true);
    expect(filterContent('Zangao e o mascote do Sao Luiz').allowed).toBe(true);
    // Grupo 16
    expect(filterContent('Capivara e o mascote do Blumenau').allowed).toBe(true);
    expect(filterContent('Xavante e o apelido do Brasil de Pelotas').allowed).toBe(true);
    expect(filterContent('Marinheiro e o mascote do Marcilio Dias').allowed).toBe(true);
    expect(filterContent('Aviao e o mascote do Sao Joseense').allowed).toBe(true);
    expect(filterContent('Gralha Azul e o apelido do Azuriz').allowed).toBe(true);
    expect(filterContent('Zequinha e o mascote do Sao Jose RS').allowed).toBe(true);
  });

  it('permite nomes de times da Serie D — Grupos 1 a 8', () => {
    // Grupo 1
    expect(filterContent('Manaus joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Nacional AM joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Manauara joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Sao Raimundo RR joga pela Serie D').allowed).toBe(true);
    expect(filterContent('GAS joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Monte Roraima joga pela Serie D').allowed).toBe(true);
    // Grupo 2
    expect(filterContent('Porto Velho joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Araguaina joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Guapore joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Galvez joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Independencia AC joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Humaita joga pela Serie D').allowed).toBe(true);
    // Grupo 3
    expect(filterContent('Gama joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Luverdense joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Brasiliense joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Primavera MT joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Inhumas joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Aparecidense joga pela Serie D').allowed).toBe(true);
    // Grupo 4
    expect(filterContent('Capital DF joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Goiatuba joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Operario VG joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Ceilandia joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Mixto MT joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Uniao Rondonopolis joga pela Serie D').allowed).toBe(true);
    // Grupo 5
    expect(filterContent('Trem joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Aguia de Maraba joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Imperatriz joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Tuna Luso joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Oratorio joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Tocantinopolis joga pela Serie D').allowed).toBe(true);
    // Grupo 6
    expect(filterContent('IAPE joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Maracana joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Moto Club joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Parnahyba joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Iguatu joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Sampaio Correa joga pela Serie D').allowed).toBe(true);
    // Grupo 7
    expect(filterContent('Piaui joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Ferroviario joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Fluminense PI joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Altos joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Atletico CE joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Tirol joga pela Serie D').allowed).toBe(true);
    // Grupo 8
    expect(filterContent('Maguary joga pela Serie D').allowed).toBe(true);
    expect(filterContent('America RN joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Central joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Laguna joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Sousa joga pela Serie D').allowed).toBe(true);
    expect(filterContent('ABC joga pela Serie D').allowed).toBe(true);
  });

  it('permite nomes de times da Serie D — Grupos 9 a 16', () => {
    // Grupo 9
    expect(filterContent('Treze joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Decisao joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Lagarto joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Sergipe joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Serra Branca joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Retro joga pela Serie D').allowed).toBe(true);
    // Grupo 10
    expect(filterContent('CSA joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Juazeirense joga pela Serie D').allowed).toBe(true);
    expect(filterContent('ASA joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Jacuipense joga pela Serie D').allowed).toBe(true);
    expect(filterContent('CSE joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Atletico BA joga pela Serie D').allowed).toBe(true);
    // Grupo 11
    expect(filterContent('Ivinhema joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Uberlandia joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Betim joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Operario MS joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Abecat joga pela Serie D').allowed).toBe(true);
    expect(filterContent('CRAC joga pela Serie D').allowed).toBe(true);
    // Grupo 12
    expect(filterContent('Porto BA joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Democrata GV joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Tombense joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Rio Branco ES joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Real Noroeste joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Vitoria ES joga pela Serie D').allowed).toBe(true);
    // Grupo 13
    expect(filterContent('Agua Santa joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Pouso Alegre joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Portuguesa joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Portuguesa RJ joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Madureira joga pela Serie D').allowed).toBe(true);
    expect(filterContent('America RJ joga pela Serie D').allowed).toBe(true);
    // Grupo 14
    expect(filterContent('XV de Piracicaba joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Marica joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Sampaio Correa RJ joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Velo Clube joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Noroeste joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Nova Iguacu joga pela Serie D').allowed).toBe(true);
    // Grupo 15
    expect(filterContent('Cianorte joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Joinville joga pela Serie D').allowed).toBe(true);
    expect(filterContent('FC Cascavel joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Santa Catarina joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Guarany de Bage joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Sao Luiz joga pela Serie D').allowed).toBe(true);
    // Grupo 16
    expect(filterContent('Blumenau joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Brasil de Pelotas joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Marcilio Dias joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Sao Joseense joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Azuriz joga pela Serie D').allowed).toBe(true);
    expect(filterContent('Sao Jose RS joga pela Serie D').allowed).toBe(true);
  });
});
