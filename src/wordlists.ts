// ─── Content Filter Wordlists ────────────────────────────────────────────────
// Separado do algoritmo para fácil manutenção.
// Todas as palavras devem estar em lowercase, sem acentos.
// Variantes com @ e leetspeak NAO precisam estar aqui — o normalizador cuida.

// Abreviações comuns BR → expansão na normalização.
// prettier-ignore
export const ABBREVIATION_MAP: Record<string, string> = {
  ppk: 'pepeca',
  pqp: 'puta que pariu',
  krl: 'caralho',
  gzr: 'gozar',
  gzar: 'gozar',
  gz: 'gozar',
  mmda: 'mamada',
  mda: 'mamada',
  bct: 'buceta',
  pnht: 'punheta',
  vsf: 'vai se fuder',
  vtnc: 'vai tomar no cu',
  tnc: 'tomar no cu',
  pnc: 'pau no cu',
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
  gts: 'gostosa',
  gtso: 'gostoso',
  xvd: 'xvideos',
  // xvi removido: numeral romano XVI usado em títulos de jogos (ex: Final Fantasy XVI)
  prnhb: 'pornhub',
  urac: 'urach',
  xxt: 'xoxota',
  sfd: 'safado',
  sfda: 'safada',
  vgb: 'vagabundo',
  crn: 'corno',
  fdd: 'fodido',
  bctuda: 'bucetuda',
  rabt: 'rabeta',
  fdnd: 'fodendo',
  kng: 'quenga',
  tzao: 'tesao',
  ptnh: 'putinha',
  piroq: 'piroca',
  prq: 'piroca',
  cuz: 'cuzao',
  cz: 'cuzao',
  gls: 'gulosa',
  chp: 'chupar',
  cnh: 'cunhete',
  dp: 'dupla penetracao',
  peit: 'peitos',
  peitd: 'peituda',
  raba: 'bunda',
  xrc: 'xereca',
  xib: 'xibiu',
  pz: 'pauzao',
  prn: 'porno',
  // sx removido: 'SSX' (jogo EA) normaliza ssx→sx causando falso positivo; 'sexo' já está em HARD_BLOCKED
  trd: 'tarado',
};

// Palavras sempre bloqueadas, independente do contexto.
// prettier-ignore
export const HARD_BLOCKED: string[] = [
  // ── Slurs / ofensas graves ──
  'viado', 'viadinho', 'viadao',
  'sapatao', 'sapatona',
  'traveco', 'travecos', 'travecas',
  'baitola', 'boiola', 'bichona',
  'putinha', 'putona', 'puta', 'putas',
  'vagabunda', 'vagabundo',
  'arrombado', 'arrombada', 'arrombadas', 'arrombadinho', 'arrombadinha',
  'cuzao', 'cuzona',
  'lesbica', 'sapata',
  'gazela', 'tchola', 'biba', 'mona', 'bixa',
  'fdp', 'filho da puta',
  'desgraca', 'desgracado', 'desgracada',
  'retardado', 'retardada',
  'mongoloid', 'mongoloide',
  'vadia',
  'quenga',
  'rapariga', 'rameira', 'meretriz',
  'vacilao',

  // ── Abreviacoes BR comuns ──
  'ppk', 'pqp', 'gzr', 'bct', 'pnht',
  'vsf', 'vtnc', 'tnc', 'pnc',
  'btl', 'bqt', 'srrc',
  'xvd', 'prnhb',
  'phnta', 'buct', 'bctinha', 'pnheta', 'pheta', 'bqut',
  'mamad', 'gzd', 'gzada', 'sfada',
  'nfsw', '+18', '-18',
  'phub', 'pornh',
  'bronha', 'brnha', 'bronheiro', 'lisinha',
  'tirador de leite',
  'xxt', 'crn', 'fdd', 'rabt', 'pnt', 'gls', 'chp', 'cnh',
  'raba', 'pz',
  // 'dlc' removido: termo de gaming (Downloadable Content) — falso positivo para jogadores
  'brasileirinhas',

  // ── Conteudo sexual explicito ──
  'tarado', 'tarada',
  'cuzinho',
  'gozo', 'gozos',
  'sexo',
  'punheteiro', 'punheteira', 'punheteirinho', 'punheteirinha',
  'punheta', 'punhetao', 'punhetinha',
  'batendo uma', 'bora bater uma', 'bater uma', 'gozando',
  'anal', 'mamada', 'leitada',
  'culinho',
  'jogar um leite', 'esvaziar o saco', 'tirar um leite', 'tirar leite',
  'camera prive', 'deposito de porra',
  'piranha', 'piranhas',
  'interesseira',
  'onlyf',
  'curte um of', 'tem of', 'faz of', 'tem onlyfans',
  'se aliviou', 'ja se aliviou', 'bate uma', 'bateu uma',
  'bate quantas', 'bate quantas vezes',
  'tocar uma', 'toca uma', 'tocou uma', 'tocando uma',
  'pau pra cima', 'pau duro', 'pau duraco',
  'comer um cu', 'cu apertadinho', 'cu apertado',
  'arrombar ela', 'arrombei toda', 'arrombar toda',
  'arrombar esse', 'arrombar teu', 'arrombar seu', 'arrombar o teu', 'arrombar o seu',
  'vou arrombar', 'adoro arrombar', 'arrombar um',
  'pegar de 4', 'mulher de 4', 'colocar de 4',
  'entro com a pica', 'mete a pica', 'meter a pica',
  'enfia o meninao', 'meter o meninao', 'mete o meninao',
  'meninao pra cuspir', 'garoto pra cuspir', 'garotao pra cuspir',
  'botar pra cuspir', 'botou pra cuspir',
  'apertada no saco', 'aperta o saco', 'chute no saco',
  'sado', 'sadomasoquismo', 'bondage',
  'fez um 69', 'fazer um 69', 'um 69',
  'bombeia pra cabeca', 'bombeia tudo',
  'metecao', 'gangbang', 'orgia', 'orgias',
  'mamilos', 'mamilo',
  'pau na mao', 'pau na minha mao',
  'gemeu', 'gemendo', 'gemer', 'gemido', 'gemidos',
  'lambi', 'lambeu', 'lamber', 'lambida',
  'meti na boca', 'meti logo', 'meter na boca',
  'chupar as bolas', 'lamber as bolas',
  'tirar a calca', 'tirando a calca', 'tirou a calca',
  'calcinha', 'calcinhas', 'so de calcinha', 'puxei a calcinha',
  'de calcinha', 'sem calcinha', 'tirou a calcinha',
  'melado', 'melzinho', 'tadala',
  'jato na cara', 'jogava o jato', 'jogar o jato',
  'vazou na net', 'vazou nude', 'vazou nudes',
  'com o cu', 'no cu', 'no teu cu', 'no seu cu',
  'pegar de quatro', 'mulher de quatro', 'colocar de quatro',
  'vou te mandar', 'te mandar uns videos',
  'pelada', 'peladinha', 'peladona',
  'nua', 'nuazinha',
  'descabelar o palhaco',
  'bater punheta', 'punhetar',
  'siriricar', 'dedar', 'dedada',
  'toque intimo', 'descarga',
  'peitinho', 'teta', 'milf', 'gilf',
  'pepeca', 'xibiu', 'grelo', 'brioco', 'toba',
  'corno', 'cornudo', 'cornuda',
  'rabeta', 'gulosa', 'cunhete',
  'bunda', 'pauzao', 'fodido',
  //   expansões de abreviações sem entrada em HARD_BLOCKED
  'foda-se', 'puta que pariu', 'urach', 'bucetuda', 'fodendo', 'tesao',

  // ── Pedofilia / grooming ──
  'pedo', 'p3do', 'epstein',
  'menininha', 'garotinha',
  'tirar um cabaco', 'cabaco', 'cabacinho',
  'cabacinho de novinha',
  'pedem por ajuda', 'pede por ajuda', 'gritam e pedem',
  'quando elas gritam', 'quando ela grita',
  'novinha', 'novinhas',

  // ── Abreviacoes sexuais ──

  // ── Atrizes porno BR ──
  'bruna surfistinha', 'andressa urach', 'elisa sanches',
  'mia linz', 'rita cadillac', 'vivi fernandes',
  'fernanda campos', 'suzy cortez', 'marcia imperator',
  'kid bengala', 'kidbengala',
  'pamela pantera', 'martina oliveira', 'kinechan', 'aline faria',
  'emme white', 'amaya takayo', 'geovanna paes', 'fabiane thompson',

  // ── Atrizes porno internacionais ──
  'mia khalifa', 'lana rhoades', 'riley reid', 'sasha grey',
  'angela white', 'abella danger', 'adriana chechik',
  'brandi love', 'asa akira', 'alexis texas',

  // ── Plataformas de acompanhantes ──
  'cam girl', 'fatal model',

  // ── Termos em ingles ──
  'tits', 'fuck', 'jerk', 'jerk off', 'pussy', 'dick', 'cock', 'blowjob', 'nigga',
  'estupro', 'estuprar', 'estuprador',
  'estrupo', 'estrupador',  // misspellings comuns
  'pedofilo', 'pedofilia',
  'zoofilia', 'necrofilia',
  'pornografia infantil',
  'porno', 'pornozao', 'pornografia',
  'nude', 'nudes',
  'chupar pau', 'chupar pica', 'engole o pau', 'engolir o pau',
  'entra e sai', 'socar gostoso',
  'comedor', 'comedora', 'comedor de merda', 'comedor de bosta',
  'sentei no pau', 'sentando no pau', 'sentar no pau',
  'rebolei', 'rebolando', 'rebolar', 'rebolou',
  'quiquei', 'quicando', 'quicar', 'quicou',
  'kikando', 'kikando no pau', 'kikei', 'kikar',
  'dentro de mim', 'dentro dela', 'dentro dele',
  'mexendo nas bolas', 'mexer nas bolas',
  'no pau dele', 'no pau dela',
  'nas bolas dele',
  'bafo de pica',
  'boca cheia de leite', 'boca de leite', 'boca cheia de porra',
  'encheu a boca', 'encher a boca',
  'tacou dentro', 'tacar dentro', 'taquei dentro',
  'no pelo', 'sem camisinha',
  'botei ela pra trabalhar', 'botar ela pra trabalhar',
  'mamou muito', 'mamou gostoso',
  'leite na boca', 'joguei o leite', 'jogou o leite',
  // Narrativa sexual
  'comi uma gordinha', 'comi uma',
  'pernas bambas',
  'engolia tudo', 'engoliu tudo',
  'bolas na boca', 'colocar as bolas',
  'meteu tudo dentro', 'metendo nela', 'metendo nele',
  'continuei metendo', 'comendo com forca',
  'champanhe dentro', 'estourei a champanhe',
  'igual uma cachorra', 'igual cachorra',
  'toda arreganhada', 'arreganhada', 'arreganhado',
  'carne viva',
  'feita para usar', 'feita pra usar',
  'meter com mais forca', 'mete com forca',
  'coloquei fundo', 'meti fundo', 'meteu fundo',
  'sem do ate o saco',
  'squirt',
  'dar o cu',
  'gostam de dar',
  'pau gostoso', 'pau grosso', 'pau grande',
  'ta duro', 'ta dura', 'ficou duro', 'ficou dura',
  'deixar o oco', 'deixar um oco', 'ficar um oco',
  'da mais prazer', 'mais prazer', 'muito prazer',
  'pau na cara', 'pau na minha cara', 'pau na tua cara',
  'esfrega', 'esfregando', 'esfregar',
  'cheia de porra', 'cheio de porra', 'cara de porra',
  'saco cheio de porra', 'saco cheio',
  'sentir o leite', 'quer sentir o leite',
  'negao gostoso', 'negao',
  'botar para fora', 'botar pra fora',
  'gozar', 'gozada', 'gozadas', 'gozei', 'gozou', 'gozaram',
  'jorrar', 'jorrada', 'jorrou', 'jorro', 'jorradas',
  'foder', 'fudendo', 'fudido',
  'transar', 'transando', 'transa',
  'piroca', 'pirocao', 'pirocas', 'pirocudo',
  'pika',   // variante de pica (gíria sexual) — sem uso inocente em PT-BR
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
  'peitos', 'peituda', 'peitudas',
  'tesuda', 'tesudas', 'tesudo', 'tezao', 'tezuda', 'tezudo',
  'safada', 'safadas', 'safado', 'safados',
  'rabuda', 'rabudas',
  'gostozudas', 'greludas',
  'piranhuda', 'piriguetes',
  'dadeira',

  // ── Violencia / incitacao suicidio ──
  'vou te matar', 'vou matar voce',
  'se mata', 'se matar', 'vai se matar',
  'suicida-se',
  // Autolesão / suicídio — frases diretas; "atire-se" e "atire se" são entradas separadas.
  'se jogue da ponte', 'se jogue do predio',
  'pule da ponte', 'pule do predio',
  'atire-se da ponte', 'atire se da ponte',
  'atire-se do predio', 'atire se do predio',
  'suicidio', 'suicidar', 'autoexterminio',
  'tira sua vida', 'tirava minha vida', 'tira a vida',
  'tirar sua propria vida', 'tirar a propria vida',
  'tiro na propria cabeca', 'tiro na cabeca',
  'pensou em dar um tiro', 'pensou em tirar',
  'acaba com tua vida', 'acaba com sua vida', 'acabar com tua vida',
  'acaba logo com tua vida', 'acaba logo com sua vida',
  'desiste da tua vida', 'desiste da sua vida', 'desista da vida',
  'da um fim nisso', 'da um fim na sua vida',
  'da um tiro', 'da um tiro na cabeca', 'da um tiro na tua cabeca',
  'corta os pulsos', 'cortar os pulsos', 'corta os plsos',
  'se enforca', 'se enforcar', 'pega uma corda',
  'sangra ate a morte', 'sangre ate morrer', 'sangrar ate morrer',
  'corta o pulso', 'pontinhado no pulso',
  // ── Assassinato / homicidio ──
  'assassinato', 'assassinio',
  'assassina', 'assassinar', 'assassinado', 'assassino',
  'assassinando', 'assassinei', 'assassinaste',
  'assassinou', 'assassinava', 'assassinavas',
  'assassinarei', 'assassinaras', 'assassinara',
  'matador', 'homicida',
  'matei gente', 'ja matei gente', 'matar gente',
  'quero que tu sangre', 'quero que voce sangre',
  'deveria se matar', 'devia se matar',
  'ninguem ia sentir falta', 'ninguem sentiria falta',
  'faz um favor e some', 'faz o mundo um favor',
  'nasceu errado', 'voce nasceu errado',
  'desperdicio de esperma',
  'tomar alvejante', 'deveria tomar alvejante', 'toma alvejante',
  'beber alvejante',
  'sentem pena de voce', 'sentem pena de tu',
  'pais sentem pena',

  // ── Assedio / bullying / humilhacao ──
  'vergonha pra familia', 'vergonha pra tua familia', 'vergonha pra sua familia',
  'vergonha da familia', 'vergonha pro pai', 'vergonha pra mae',
  'vergonha para sua familia',
  'vergonha de voce', 'ter vergonha de voce',
  'mae chora', 'pai chora',
  'mae deve sentir vergonha', 'mae deve ter vergonha',
  'pai deve sentir vergonha',
  'mae sabe que voce', 'mae sabe que tu',
  'tenho pena de voce', 'tenho pena de tu', 'tenho do de voce',
  'voce e uma vergonha', 'tu e uma vergonha',
  'que vergonha voce', 'que vergonha tu',
  'virar homem de verdade', 'ser homem de verdade',
  'vira homem', 'seja homem',
  'dar o rabo', 'dando o rabo',
  'comer o rabo', 'comer o cu', 'comer seu rabo', 'comer teu rabo',
  'rabo sangrando', 'cu sangrando',
  'implorar para parar', 'implorar pra parar',
  'dizer chega', 'ate dizer chega',
  'pegando aids',
  'sente vergonha de tu', 'sente vergonha de voce',
  'chorar no banho',

  // ── Racismo ──
  'macaco', 'macaca',
  'crioulo', 'crioula', 'criolo',
  'neguinho', 'neguinha',
  'preto imundo', 'preta imunda',
  'bola gato',
  'mascote de petrolifera',
  'paquita do olodum',
  '🌊🌵',

  // ── Nazismo / fascismo / supremacia ──
  'nazi', 'nazista', 'nazismo', 'neonazi', 'neonazista', 'neonazismo',
  'nazistas', 'neonazistas',
  'hitler', 'adolf hitler', 'hitller', 'httler',
  'suastica', 'suasticas',
  'holocausto',
  'campo de concentracao', 'campos de concentracao',
  'heil hitler', 'sieg heil',
  'white power', 'supremacia branca', 'poder branco',
  'arianismo', 'raca ariana', 'ariano', 'arianos',
  'terceiro reich', 'reich',
  'gestapo', 'ss nazista',
  'skinhead', 'skinheads',
  'fascista', 'fascismo', 'fascistas',
  'ku klux klan',
  // Abreviacoes nazistas
  'nz', 'hh',
  'nazsimo', 'nazismu',

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

  // ── Stalking / perseguicao ──
  // Conhecimento de localizacao e rotina
  'sei onde voce mora', 'sei onde tu mora',
  'sei onde voce estuda', 'sei onde tu estudas',
  'sei onde voce trabalha', 'sei onde tu trabalha',
  'sei onde voce fica',
  'sei teu endereco', 'sei seu endereco',
  'sei tua rua', 'sei sua rua',
  'sei seus horarios', 'sei teus horarios',
  'sei quando voce sai', 'sei quando tu sai',
  'sei quando voce chega', 'sei quando tu chega',
  'sei sua rotina', 'sei tua rotina',
  // Vigilancia e perseguicao fisica
  'vou te achar', 'vou te rastrear', 'te rastrear',
  'vou na tua casa', 'vou na sua casa',
  'vou aparecer na tua porta', 'vou aparecer na sua porta',
  'vou te seguir', 'vou ficar te seguindo',
  'to de olho em voce', 'to de olho em ti',
  'estou te vigiando', 'to te vigiando',
  'nao tem pra onde correr', 'nao tem como escapar', 'voce nao vai escapar',

  // ── Ameacas pessoais ──
  'vou te pegar na saida', 'vou te esperar na saida',
  'to te esperando',
  'vai se arrepender', 'voce vai se arrepender', 'vai se arrepender disso',
  'voce vai pagar', 'voce vai pagar por isso', 'voce vai pagar por tudo',
  'voce vai ver o que vai acontecer',
  'vou acabar com voce',
  'cuidado quando sair de casa',
  'sei quem voce e',
  'seus dias estao contados', 'ta com os dias contados',
  'nao vai escapar de mim',

  // ── Doxxing — exposicao de dados pessoais ──
  'vou vazar seus dados', 'vou vazar teus dados',
  'vou vazar suas fotos', 'vou vazar tuas fotos',
  'vou postar seu endereco', 'vou postar teu endereco',
  'vou publicar seu endereco', 'vou publicar teu endereco',
  'vou expor voce', 'vou expor tua vida', 'vou expor sua vida',
  'vou mostrar pra todo mundo',
  'vou mandar pra tua familia', 'vou mandar pra sua familia',
  'vou passar seu numero', 'vou passar teu numero',
  'sei seu cpf', 'sei teu cpf',
  'tenho seus dados', 'tenho teus dados', 'achei seus dados',
  'vou revelar quem voce e',

  // ── Sites pornograficos ──
  'pornhub', 'xvideos', 'xvidius', 'xnxx', 'redtube', 'youporn',
  'tube8', 'spankbang', 'xhamster', 'beeg', 'tnaflix',
  'sunporno', 'porntrex', 'hqporner', 'drtuber', 'eporner',
  'motherless', 'fapdu', 'rule34', 'nhentai', 'hentaihaven',
  'hanime', 'brazzers', 'realitykings', 'bangbros', 'mofos',
  'fakehub', 'teamskeet', 'nubiles', 'onlyfans', 'fansly',
  'manyvids', 'chaturbate', 'stripchat', 'bongacams',
  'livejasmin', 'flirt4free', 'myfreecams', 'camsoda',
];

// Palavras bloqueadas apenas quando dirigidas — permitidas em auto-expressão.
// prettier-ignore
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
  'inocente',
  'pequena',
  'pau', 'rola', 'cacete', 'cu', 'pica', 'caralho', 'foda',
  'rabo', 'merda', 'merdao', 'bosta', 'putaria', 'porra',
  'caralha', 'caralhudo',
  'gostosa', 'gostoso', 'delicia',
  'dp', 'dupla penetracao',
  'adulto', 'leite', 'jogar',
];

// Emojis sempre bloqueados.
// prettier-ignore
export const OFFENSIVE_EMOJIS: string[] = [
  '🖕',     // dedo do meio
  '🖕🏻', '🖕🏼', '🖕🏽', '🖕🏾', '🖕🏿', // variantes de tom de pele
  '💦',     // ejaculacao
];

// Sequências de emojis ofensivos.
// prettier-ignore
export const OFFENSIVE_EMOJI_SEQUENCES: string[] = [
  // ── Conotação sexual explícita ──
  '🍌',
  '🍆🍌',
  '🍆💦',    // pênis + ejaculação
  '🍆🍑',    // pênis + bunda
  '🍑💦',    // bunda + ejaculação
  '🍆👅',    // pênis + oral
  '👅💦',    // oral + ejaculação
  '🍑🍆',    // bunda + pênis
  '💦🍆',    // ejaculação + pênis
  '🍆😮',    // pênis + boca aberta
  '🍆🤤',    // pênis + babando
  '🍑👋',    // bunda + tapa
  '🍑🤤',    // bunda + babando
  '🍆🍆',    // pênis repetido
  '🍑🍑',    // bunda repetida
  '💦💦',    // ejaculação repetida
  // ── Racismo ──
  '🐵🐒',    // macaco duplo (insulto racial)
  '🐒🐵',
  '🦍🐒',
  '🦍🐵',
  '🍌🐒',    // banana + macaco
  '🍌🐵',
];

// Emojis bloqueados apenas quando dirigidos a outra pessoa.
// prettier-ignore
export const CONTEXT_SENSITIVE_EMOJIS: string[] = [
  '🐵',     // macaco
  '🐒',     // macaco
  '🦍',     // gorila
];

// Palavras-semente: inocentes sozinhas, suspeitas quando 3+ aparecem em janela de 10 palavras.
// prettier-ignore
export const SEXUAL_SEED_WORDS: string[] = [
  // Corpo / anatomia
  'pau', 'pica', 'rola', 'cu', 'rabo', 'bola', 'bolas', 'saco',
  'peito', 'peitos', 'bunda', 'teta', 'mamilo', 'mamilos',
  // Fluidos / acao
  'leite', 'porra', 'pora', 'gozar', 'gozei', 'gozou', 'jato',
  'molhada', 'molhado', 'duro', 'dura', 'durinho',
  // Verbos sexuais
  'chupar', 'lamber', 'mamar', 'mamou', 'mamando', 'meter', 'enfiar', 'socar',
  'sentar', 'rebolar', 'quicar', 'cavalgar',
  'gemer', 'gritar', 'arregacar',
  'tacar', 'tacou', 'jogar', 'jogou',
  // Contexto
  'gostoso', 'gostosa', 'delicia', 'tesao',
  'pelado', 'pelada', 'nu', 'nua',
  'camisinha', 'calcinha', 'cueca',
  'explodir', 'lotado', 'cheio', 'cheia',
  'veiudo', 'grosso', 'enorme', 'grande',
  'cuspir', 'engolir',
  // Partes do corpo / contexto adicional
  'boca', 'dentro', 'pelo', 'gordinha',
  'bafo', 'bambas', 'fundo', 'forca',
  'cachorra', 'arreganhada', 'esfolado',
  'squirt', 'melam', 'melou',
  'pornografia', 'tarado', 'sexo',
];

// Padrões que indicam fala dirigida (2ª pessoa).
export const DIRECTED_PATTERNS: RegExp[] = [
  /\bvoc[eê]s?\b/i,
  /\bvc\b/i,
  /\btu\b/i,
  /\btua\b/i,
  /\bteu\b/i,
  /\bseu\b/i,
  /\bsua\b/i,
  /\bvoc[eê]s?\s+[eé]\s+um[a]?\b/i, // "voce e um/uma" (requer pronome antes)
  /\btu\s+[eé]\s+um[a]?\b/i, // "tu e um/uma"
  /\bvai\s+se\b/i,
  /\bcala\s+a?\s*boca\b/i,
  /\bsome\s+daqui\b/i,
  /\bninguem\s+te\b/i,
  /\bningu[eé]m\s+gosta\b/i,
  /\btoma\s+no\b/i,
  /\benfia\b/i,
  /\bmete\s+no\b/i,
];

// Padrões de auto-expressão (1ª pessoa) — contexto seguro.
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
  /\bcacete[\s,!.]+\b/i, // exclamacao isolada
  /\bcaralho[\s,!.]+/i, // "caralho, tu ta de brincadeira"
  /\bque\s+pica\b/i, // "que legal" regional
  // Padroes inocentes para pinto/dp (v2.1)
  /\bpinto\s+de\b/i, // "pinto de ovo"
  /\beu\s+pinto\b/i, // "eu pinto paredes"
  /\bdp\s+d[oe]\b/i, // "dp do prédio"
  // Padroes de exclamacao com palavroes (nao dirigido)
  /\bque\s+bosta\b/i, // "que bosta"
  /\bque\s+merda\b/i, // "que merda"
  /\bdia\s+de\s+merda\b/i, // "dia de merda"
  /\bisso\s+e\s+uma\s+(merda|bosta|putaria|porra)\b/i, // "isso e uma merda/putaria"
  /\bque\s+porra\b/i, // "que porra e essa"
  /\bque\s+putaria\b/i, // "que putaria"
  /\bta\s+foda\b/i, // "ta foda"
  /\be\s+foda\b/i, // "e foda"
  // Contexto de gaming — "jogar" é context-sensitive mas é inocente quando seguido de preposição de jogo
  /\bjogar\s+(?:com|no|na|contra|de|o|a)\b/i, // "jogar com voce", "jogar contra voce", "jogar no PC"
];
// Regex parciais testadas no texto normalizado — bloqueiam pelo fragmento, ignoram o complemento.
export const PARTIAL_BLOCK_PATTERNS: RegExp[] = [
  // Cobre "se joga/jogue/jogar + do/da/de <qualquer coisa>" (ex: "se jogue da janela").
  /\bse jog(?:a|ue|ar) d[oae]\b/,
];

// Palavras que nunca devem ser bloqueadas.
export const WHITELIST: string[] = [
  'pipoca',
  'picar',
  'picada',
  'picante',
  // Bandas — previnem falsos positivos (prefixo, fuzzy e Layer 0e de dígitos).
  'Cher',
  'Queen',
  'Green Day',
  'The Offspring',
  'Blink-182',
  'Linkin Park',
  'Evanescence',
  'System of a Down',
];
