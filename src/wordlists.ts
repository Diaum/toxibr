// ─── Content Filter Wordlists ────────────────────────────────────────────────
// Separado do algoritmo para fácil manutenção.
// Todas as palavras devem estar em lowercase, sem acentos.
// Variantes com @ e leetspeak NAO precisam estar aqui — o normalizador cuida.

/** Abreviações comuns BR → palavra completa (para expansão na normalização). */
export const ABBREVIATION_MAP: Record<string, string> = {
  ppk: 'pepeca',
  pqp: 'puta que pariu',
  krl: 'caralho',
  gzr: 'gozar',
  bct: 'buceta',
  pnht: 'punheta',
  vsf: 'vai se fuder',
  vtnc: 'vai tomar no cu',
  tnc: 'tomar no cu',
  pnc: 'puta que no cariu',
  fdse: 'foda-se',
  mlk: 'moleque',
  arrombad: 'arrombado',
  crl: 'caralho',
  crh: 'caralho',
  pqputa: 'puta que pariu',
  btl: 'baitola',
  viad: 'viado',
  bqt: 'boquete',
  srrc: 'siririca',
  goz: 'gozar',
  dlç: 'delicia',
  gts: 'gostosa',
  gtso: 'gostoso',
  xvd: 'xvideos',
  prnhb: 'pornhub',
};

/** Palavras SEMPRE bloqueadas, independente do contexto. */
export const HARD_BLOCKED: string[] = [
  // ── Slurs / ofensas graves ──
  'viado', 'viadinho', 'viadao',
  'sapatao', 'sapatona',
  'traveco', 'travecos', 'travecas',
  'baitola', 'boiola', 'bichona',
  'putinha', 'putona', 'putaria', 'puta', 'putas',
  'vagabunda', 'vagabundo',
  'arrombado', 'arrombada', 'arrombadas',
  'cuzao', 'cuzona',
  'fdp', 'filho da puta',
  'desgraca', 'desgracado', 'desgracada',
  'retardado', 'retardada',
  'mongoloid', 'mongoloide',
  'vadia',
  'quenga',
  'rapariga', 'rameira', 'meretriz',
  'vacilao',
  'vacilao',
  'viadinho',
  

  // ── Abreviacoes BR comuns ──
  'ppk', 'pqp', 'krl', 'gzr', 'bct', 'pnht',
  'vsf', 'vtnc', 'tnc', 'pnc', 'fdse',
  'crl', 'crh', 'btl', 'bqt', 'srrc',
  'xvd', 'prnhb',
  'phnta', 'buct', 'pnheta', 'pheta', 'bqut',
  'mamad', 'gzd', 'gzada', 'sfada',
  'nfsw', '+18',
  'phub', 'pornh',
  'bronha', 'brnha', 'lisinha',
  'brasileirinhas',

  // ── Conteudo sexual explicito ──
  'punheteiro', 'punheteira', 'punheta', 'punhetao', 'punhetinha', 'punha',
  'batendo uma', 'bora bater uma', 'gozando',
  'anal', 'mamada', 'leitada',
  'culinho',
  'jogar um leite', 'esvaziar o saco',
  'camera prive', 'deposito de porra',
  'piranha', 'piranhas',
  'interesseira',
  'onlyf',
  'se aliviou', 'ja se aliviou', 'bate uma',
  'vou te mandar', 'te mandar uns videos',
  'pelada', 'peladinha', 'peladona',
  'nua', 'nuazinha',
  'descabelar o palhaco',
  'bater punheta', 'punhetar',
  'siriricar', 'dedar', 'dedada',
  'toque intimo', 'descarga',
  'peitinho', 'teta', 'milf', 'gilf',
  'pepeca', 'xibiu', 'grelo', 'brioco', 'toba',

  // ── Pedofilia / grooming ──
  'pedo', 'p3do', 'epstein',
  'menininha', 'garotinha',

  // ── Atrizes porno BR ──
  'bruna surfistinha', 'andressa urach', 'elisa sanches',
  'mia linz', 'rita cadillac', 'vivi fernandes',
  'fernanda campos', 'suzy cortez',

  // ── Atrizes porno internacionais ──
  'mia khalifa', 'lana rhoades', 'riley reid', 'sasha grey',
  'angela white', 'abella danger', 'adriana chechik',
  'brandi love', 'asa akira', 'alexis texas',

  // ── Plataformas de acompanhantes ──
  'cam girl', 'fatal model',

  // ── Termos em ingles ──
  'tits', 'fuck', 'jerk', 'jerk off', 'pussy', 'dick', 'cock', 'blowjob',
  'estupro', 'estuprar', 'estuprador',
  'estrupo', 'estrupador',  // misspellings comuns
  'pedofilo', 'pedofilia',
  'zoofilia', 'necrofilia',
  'pornografia infantil',
  'nude', 'nudes',
  'chupar pau', 'chupar pica',
  'gozar', 'gozada', 'gozadas',
  'foder', 'foda', 'fudendo', 'fudido',
  'transar', 'transando', 'transa',
  'piroca', 'pirocao', 'pirocas', 'pirocudo',
  'buceta', 'bucetao', 'bucetas', 'bucetasso', 'bucetinha', 'bucetinhas', 'bucetonas',
  'boceta',
  'xoxota', 'xoxotas', 'xoxotinha',
  'xereca', 'xexeca', 'xebreca', 'xerosa',
  'xana', 'xaninha',
  'xota', 'xotinha',
  'xoroca',
  'periquita', 'priquita', 'priquito',
  'prexeca', 'prencheca', 'pitrica',
  'checheca', 'chereca', 'brecheca', 'pechereca',
  'xavasca', 'xabasca', 'chavasca',
  'suruba', 'surubas',
  'menage', 'menages',
  'boquete', 'boquetes', 'boqueteira', 'boqueteiro',
  'chupada', 'chupador', 'chupadora', 'chupando', 'chupou',
  'encoxada',
  'enrabadas',
  'fornicada',
  'trepada', 'trepadas',
  'sirica', 'siririca',
  'bilau',
  'caralha', 'caralhudo',
  'porra',
  'merda', 'merdao',
  'bosta',
  'peitos', 'peituda', 'peitudas',
  'tesuda', 'tesudas', 'tesudo', 'tezao', 'tezuda', 'tezudo',
  'tarada',
  'safada', 'safadas', 'safado', 'safados',
  'rabuda', 'rabudas',
  'gostozudas', 'greludas',
  'piranhuda', 'piriguetes',
  'dadeira',

  // ── Violencia ──
  'vou te matar', 'vou matar voce',
  'se mata', 'se matar', 'vai se matar',
  'suicida-se',

  // ── Racismo ──
  'macaco', 'macaca',
  'crioulo', 'crioula', 'criolo',
  'neguinho', 'neguinha',
  'preto imundo', 'preta imunda',
  'bola gato',

  // ── Misoginia / red pill ──
  'feminazi',
  'hipergamia',
  'promiscua', 'rodada',
  'gold digger',
  'valor de mercado',
  'gloriosa',

  // ── Assedio direto ──
  'manda nude', 'manda foto',
  'quer transar', 'vamos transar',
  'te pego', 'te como',

  // ── Sites pornograficos ──
  'pornhub', 'xvideos', 'xvidius', 'xnxx', 'redtube', 'youporn',
  'tube8', 'spankbang', 'xhamster', 'beeg', 'tnaflix',
  'sunporno', 'porntrex', 'hqporner', 'drtuber', 'eporner',
  'motherless', 'fapdu', 'rule34', 'nhentai', 'hentaihaven',
  'hanime', 'brazzers', 'realitykings', 'bangbros', 'mofos',
  'fakehub', 'teamskeet', 'nubiles', 'onlyfans', 'fansly',
  'manyvids', 'chaturbate', 'stripchat', 'bongacams', 'cam4',
  'livejasmin', 'flirt4free', 'myfreecams', 'camsoda',
];

/** Palavras bloqueadas APENAS quando dirigidas a outra pessoa.
 *  Permitidas em auto-expressão (ex: "eu me sinto um lixo"). */
export const CONTEXT_SENSITIVE: string[] = [
  'lixo',
  'inutil',
  'burro', 'burra',
  'idiota',
  'imbecil',
  'nojento', 'nojenta',
  'fracassado', 'fracassada',
  'patetico', 'patetica',
  'ridiculo', 'ridicula',
  'covarde',
  'fraco', 'fraca',
  'perdedor', 'perdedora',
  'otario', 'otaria',
  'troxa',
  'babaca',
  'moleque', 'moleca',
  'doente',
  'maluco', 'maluca',
  'taioba',
  'escravo', 'escrava',
  'submissa', 'submisso',
  'mulher moderna',
  'novinha',
  'inocente',
  'pequena',
  // Movidos de hard-block (falsos positivos comuns em PT-BR)
  'pau',         // "pau mandado", "pau de selfie", "pau pra toda obra"
  'rola',        // "rola de ir?", "rola um papo"
  'cacete',      // "cacete, que dia dificil"
  'cu',          // "recuar", contexto comum
  'pica',        // "pica-pau", "que pica" (que legal, regional)
  'caralho',     // "caralho!" como exclamacao de surpresa
];

/** Padrões que indicam fala dirigida a outra pessoa (2ª pessoa). */
export const DIRECTED_PATTERNS: RegExp[] = [
  /\bvoc[eê]s?\b/i,
  /\btu\b/i,
  /\bseu\b/i,
  /\bsua\b/i,
  /\b[eé]\s+um[a]?\b/i,
  /\bvai\s+se\b/i,
  /\bcala\s+a?\s*boca\b/i,
  /\bsome\s+daqui\b/i,
  /\bninguem\s+te\b/i,
  /\bningu[eé]m\s+gosta\b/i,
  /\btoma\s+no\b/i,
  /\benfia\b/i,
  /\bmete\s+no\b/i,
];

/** Padrões que indicam auto-expressão (1ª pessoa) — contexto seguro. */
export const SELF_EXPRESSION_PATTERNS: RegExp[] = [
  /\beu\s+(me\s+)?sinto\b/i,
  /\beu\s+sou\b/i,
  /\bme\s+sinto\b/i,
  /\beu\s+me\s+acho\b/i,
  /\bsou\s+um[a]?\b/i,
  /\bme\s+acho\b/i,
  /\beu\s+pareco\b/i,
  /\bestou\s+me\s+sentindo\b/i,
  /\bto\s+me\s+sentindo\b/i,
  // Padroes de uso inocente de palavras ambiguas
  /\brola\s+de\s+ir\b/i,
  /\brola\s+um\b/i,
  /\bpau\s+mandado\b/i,
  /\bpau\s+de\b/i,
  /\bpau\s+pra\b/i,
  /\bcacete[\s,!.]+\b/i,    // exclamacao isolada
  /\bque\s+pica\b/i,        // "que legal" regional
];
