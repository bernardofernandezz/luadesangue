export type Team = 'vila' | 'lobos' | 'solo'

export type RoleId =
  | 'aldeao' | 'vidente' | 'medico' | 'bruxa' | 'cacador' | 'cupido' | 'guarda_costas' | 'prefeito'
  | 'ferreiro' | 'rastreador' | 'herdeiro' | 'faroleiro' | 'sonambulo'
  | 'lobisomem' | 'lobo_alfa' | 'lobo_sombra' | 'lobo_uivante' | 'lobo_farejador'
  | 'tolo' | 'assassino' | 'mercador' | 'incendiario'

/** Abilities that can be used only once per game. */
export type Ability = 'cura' | 'veneno' | 'lamina' | 'farol' | 'sombra' | 'uivo' | 'fosforo'

interface RoleDef {
  id: RoleId
  name: string
  team: Team
  /** Positive helps the village, negative helps the others. Used by the balance meter. */
  weight: number
  multi?: boolean
  /** Original to this game (not a classic of the genre). */
  novo?: boolean
  tagline: string
  goal: string
  how: string[]
  tip: string
  /** Night turn texts. Which targets are allowed is decided by `nightAction` in game.ts. */
  prompt?: string
  promptHint?: string
  verb?: string
  /** Summary when an optional action is skipped. */
  skip?: string
  /** Once-per-game power offered on the night turn. `summary` describes it when switched on. */
  power?: { ability: Ability; title: string; text: string; summary: string }
  /** Traits the engine reads instead of checking role ids. */
  votes?: number
  hiddenFromSeer?: boolean
  breaksPackTies?: boolean
  shootsOnDeath?: boolean
  winsIfLynched?: boolean
  winsAlone?: boolean
  sharesVictory?: boolean
  winTitle?: string
}

const VILA_GOAL = 'Descobrir e eliminar todos os lobos (e o Assassino, se houver) nas votações do dia.'
const LOBO_GOAL = 'Atacar à noite e enganar de dia até que os lobos sejam pelo menos metade dos vivos.'
const LOBO_PROMPT = 'Quem a matilha vai atacar?'
const LOBO_HINT = 'Os números mostram os votos dos lobos que já jogaram.'
const LOBO_HOW = [
  'Você sabe quem são os outros lobos. Ninguém mais sabe.',
  'Toda noite, vote em quem a matilha vai atacar. O alvo mais votado é atacado.',
  'De dia, finja ser um aldeão comum e jogue a desconfiança em outras pessoas.',
]

export const ROLE_LIST: RoleDef[] = [
  {
    id: 'aldeao', name: 'Aldeão', team: 'vila', weight: 1, multi: true,
    tagline: 'Sem poderes, mas com voto.',
    goal: VILA_GOAL,
    how: ['À noite você não tem ação: só escolhe um suspeito para disfarçar.', 'De dia, preste atenção em quem acusa, quem defende e quem muda de ideia.', 'Use seu voto para linchar quem parece ser lobo.'],
    tip: 'Desconfie de quem fala pouco e de quem concorda com todo mundo.',
  },
  {
    id: 'vidente', name: 'Vidente', team: 'vila', weight: 4,
    tagline: 'Descobre quem é lobo, uma pessoa por noite.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha um jogador para investigar.', 'Na hora você vê se ele É ou NÃO É lobisomem.', 'De dia, use essa informação para guiar a vila, sem se expor cedo demais.'],
    tip: 'Se você se revelar, os lobos vão te atacar. Espere ter certeza de pelo menos um lobo.',
    verb: 'Investigar', prompt: 'Quem você quer investigar?', promptHint: 'Escolha alguém e toque em "Revelar". O Lobo Sombra aparece como inocente.',
  },
  {
    id: 'medico', name: 'Médico', team: 'vila', weight: 3,
    tagline: 'Protege uma vida por noite.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha alguém para proteger (pode ser você).', 'Se essa pessoa for atacada, ela sobrevive.', 'Você não fica sabendo se a proteção foi usada.'],
    tip: 'Proteja quem parece ser a Vidente ou quem está liderando a caça aos lobos.',
    verb: 'Proteger', prompt: 'Quem você vai proteger esta noite?', promptHint: 'Pode ser você mesmo. Ataques contra essa pessoa falham.',
  },
  {
    id: 'bruxa', name: 'Bruxa', team: 'vila', weight: 4,
    tagline: 'Uma poção para salvar, outra para matar.',
    goal: VILA_GOAL,
    how: ['Você tem 1 poção de cura: protege alguém de ataques por uma noite.', 'E 1 poção de veneno: mata alguém, sem proteção possível.', 'Cada poção só pode ser usada uma vez no jogo. Use quando quiser, ou nunca.'],
    tip: 'Guarde o veneno para quando tiver certeza de quem é lobo.',
    prompt: 'Suas poções', promptHint: 'As duas são opcionais. Toque de novo num jogador para desmarcar.',
  },
  {
    id: 'cacador', name: 'Caçador', team: 'vila', weight: 3, shootsOnDeath: true,
    tagline: 'Quando cai, leva alguém junto.',
    goal: VILA_GOAL,
    how: ['À noite você não tem ação.', 'Quando você morrer (de noite ou linchado), escolhe alguém para atirar.', 'Essa pessoa morre na hora.'],
    tip: 'Os lobos evitam te atacar se souberem quem você é. Às vezes vale se revelar.',
  },
  {
    id: 'cupido', name: 'Cupido', team: 'vila', weight: 1,
    tagline: 'Une dois corações na primeira noite.',
    goal: VILA_GOAL,
    how: ['Só na 1ª noite: escolha dois jogadores para serem amantes (pode incluir você).', 'Eles ficam sabendo um do outro. Se um morrer, o outro morre de tristeza.', 'Se os dois amantes forem os últimos vivos, eles vencem juntos, mesmo de times diferentes.'],
    tip: 'Unir um lobo e um aldeão cria um dilema divertido para os dois.',
    prompt: 'Quem vai se apaixonar?', promptHint: 'Escolha dois jogadores. Pode incluir você.',
  },
  {
    id: 'guarda_costas', name: 'Guarda-costas', team: 'vila', weight: 3,
    tagline: 'Leva o golpe no lugar de outro.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha outra pessoa para guardar.', 'Se ela for atacada, ela sobrevive e você morre no lugar.'],
    tip: 'Você é um escudo descartável: proteja quem vale mais que você para a vila.',
    verb: 'Guardar', prompt: 'Quem você vai guardar?', promptHint: 'Se essa pessoa for atacada, você morre no lugar dela.',
  },
  {
    id: 'prefeito', name: 'Prefeito', team: 'vila', weight: 2, votes: 2,
    tagline: 'Seu voto vale por dois.',
    goal: VILA_GOAL,
    how: ['À noite você não tem ação.', 'Na votação secreta, seu voto conta duas vezes.'],
    tip: 'Seu voto pode desempatar. Use isso para conduzir a vila.',
  },
  {
    id: 'ferreiro', name: 'Ferreiro', team: 'vila', weight: 3, novo: true,
    tagline: 'Forja uma lâmina de prata que mata lobos.',
    goal: VILA_GOAL,
    how: ['Uma vez por jogo, entregue a lâmina de prata a alguém (pode ser você).', 'Quem recebe fica sabendo que tem a lâmina.', 'Se os lobos atacarem o portador, ele sobrevive e um lobo aleatório morre.'],
    tip: 'Dê a lâmina para quem os lobos provavelmente vão atacar.',
    verb: 'Entregar a lâmina a', skip: 'Guardar a lâmina para outra noite', prompt: 'Quem recebe a lâmina de prata?', promptHint: 'Opcional e só uma vez. Sem escolher ninguém, você guarda para depois.',
  },
  {
    id: 'rastreador', name: 'Rastreador', team: 'vila', weight: 3, novo: true,
    tagline: 'Segue pegadas na escuridão.',
    goal: VILA_GOAL,
    how: [
      'Toda noite, siga alguém.',
      'Na sua próxima vez, você descobre em que casas essa pessoa entrou naquela noite.',
      'Usar poder em alguém é entrar na casa dele: lobos entram na casa da vítima.',
    ],
    tip: 'Se quem você seguiu entrou na casa de quem morreu, provavelmente é lobo.',
    verb: 'Seguir', prompt: 'Quem você vai seguir?', promptHint: 'Na sua próxima vez, você saberá em que casas essa pessoa entrou esta noite.',
  },
  {
    id: 'herdeiro', name: 'Herdeiro', team: 'vila', weight: 2, novo: true,
    tagline: 'Herda o poder de quem escolher.',
    goal: 'Começa na Vila. Se herdar um papel de outro time, passa a jogar por esse time.',
    how: ['Só na 1ª noite: escolha um mentor.', 'Quando ele morrer, você se torna o papel dele.', 'Se o mentor for um lobo, você vira lobo.'],
    tip: 'Escolher alguém com poder forte vale mais do que escolher alguém confiável.',
    verb: 'Escolher como mentor', prompt: 'Quem será seu mentor?', promptHint: 'Quando essa pessoa morrer, você herda o papel dela.',
  },
  {
    id: 'faroleiro', name: 'Faroleiro', team: 'vila', weight: 2, novo: true,
    tagline: 'Ilumina tudo o que aconteceu na noite.',
    goal: VILA_GOAL,
    how: ['Uma vez por jogo, acenda o farol.', 'Na manhã seguinte, a vila vê todas as ações daquela noite (quem foi alvo de quê), sem saber quem fez.'],
    tip: 'Acenda quando a vila estiver perdida: as pistas costumam desmascarar mentirosos.',
    skip: 'Deixar o farol apagado',
    power: { ability: 'farol', title: 'Acender o farol', text: 'Amanhã a vila verá todas as ações desta noite.', summary: 'O farol vai brilhar esta noite' },
    prompt: 'Acender o farol esta noite?', promptHint: 'Só uma vez no jogo. A vila verá as ações desta noite.',
  },
  {
    id: 'sonambulo', name: 'Sonâmbulo', team: 'vila', weight: 1, novo: true,
    tagline: 'Anda dormindo e às vezes vê demais.',
    goal: VILA_GOAL,
    how: ['Toda noite, você vai sozinho até a casa de alguém aleatório.', 'Se for um lobo, você descobre, mas o lobo também descobre você.', 'O resultado aparece na sua próxima vez.'],
    tip: 'Se descobrir um lobo, fale logo: ele já sabe de você.',
  },
  { id: 'lobisomem', name: 'Lobisomem', team: 'lobos', weight: -6, multi: true, verb: 'Atacar', tagline: 'Caça à noite, mente de dia.', goal: LOBO_GOAL, how: LOBO_HOW, tip: 'Não ataque sempre quem te acusa: fica óbvio.', prompt: LOBO_PROMPT, promptHint: LOBO_HINT },
  { id: 'lobo_alfa', name: 'Lobo Alfa', team: 'lobos', weight: -7, breaksPackTies: true, verb: 'Atacar', tagline: 'O líder da matilha decide os empates.', goal: LOBO_GOAL, how: [...LOBO_HOW.slice(0, 2), 'Se a matilha empatar, o seu voto decide o alvo.'], tip: 'Jogue por último entre os lobos para ver os votos e decidir.', prompt: LOBO_PROMPT, promptHint: 'Em caso de empate, seu voto decide.' },
  { id: 'lobo_sombra', name: 'Lobo Sombra', team: 'lobos', weight: -8, novo: true, hiddenFromSeer: true, verb: 'Atacar',
    power: { ability: 'sombra', title: 'Usar a sombra (1×)', text: 'Seu alvo vira o alvo da matilha, sem contar os votos.', summary: 'com a sombra' }, tagline: 'Invisível para a Vidente.', goal: LOBO_GOAL, how: [...LOBO_HOW.slice(0, 2), 'A Vidente te vê como inocente.', 'Uma vez por jogo, use a sombra para impor o alvo da matilha.'], tip: 'Você pode se fingir de investigado e "limpo" sem medo.', prompt: LOBO_PROMPT, promptHint: LOBO_HINT },
  { id: 'lobo_uivante', name: 'Lobo Uivante', team: 'lobos', weight: -7, novo: true, verb: 'Atacar',
    power: { ability: 'uivo', title: 'Uivar (1×)', text: 'A votação de amanhã será cancelada.', summary: 'e uivar' }, tagline: 'Um uivo que silencia a votação.', goal: LOBO_GOAL, how: [...LOBO_HOW.slice(0, 2), 'Uma vez por jogo, uive: a votação do dia seguinte é cancelada.'], tip: 'Uive quando um lobo estiver prestes a ser linchado.', prompt: LOBO_PROMPT, promptHint: LOBO_HINT },
  { id: 'lobo_farejador', name: 'Lobo Farejador', team: 'lobos', weight: -8, novo: true, verb: 'Atacar e farejar', tagline: 'Fareja o papel de quem ataca.', goal: LOBO_GOAL,
    how: [...LOBO_HOW.slice(0, 2), 'Você fareja quem escolher para o ataque: na próxima vez, descobre o papel dessa pessoa, mesmo que a matilha ataque outra.'],
    tip: 'Fareje quem parece ter poder. Conte à matilha e use isso de dia.', prompt: LOBO_PROMPT, promptHint: 'Quem você escolher também será farejado.' },
  {
    id: 'tolo', name: 'Tolo', team: 'solo', weight: -2, winsIfLynched: true, winTitle: 'O Tolo venceu',
    tagline: 'Quer ser linchado.',
    goal: 'Ser linchado pela vila. Se isso acontecer, só você vence.',
    how: ['À noite você não tem ação.', 'De dia, pareça suspeito sem ser óbvio demais.'],
    tip: 'Se exagerar, ninguém acredita. Faça os outros "descobrirem" você.',
  },
  {
    id: 'assassino', name: 'Assassino Solitário', team: 'solo', weight: -5, winsAlone: true, winTitle: 'O Assassino venceu', verb: 'Matar',
    tagline: 'Mata sozinho, contra todos.',
    goal: 'Ser o último vivo, ou sobrar só você e mais uma pessoa.',
    how: ['Toda noite, escolha alguém para matar.', 'Médico e Guarda-costas podem impedir.', 'Os lobos também são seus inimigos.'],
    tip: 'Deixe a vila e os lobos se destruírem e ataque quem estiver liderando.',
    prompt: 'Quem você vai matar?', promptHint: 'Proteções do Médico e do Guarda-costas podem impedir.',
  },
  {
    id: 'mercador', name: 'Mercador', team: 'solo', weight: -1, novo: true, sharesVictory: true, verb: 'Dar um amuleto a',
    tagline: 'Vence junto com quem ganhar, se os negócios forem bons.',
    goal: 'Terminar a partida vivo, com 3 amuletos entregues e os 3 portadores vivos. Você vence junto com o time vencedor.',
    how: ['Toda noite, entregue um amuleto a alguém diferente (até 3).', 'Os amuletos não têm poder: são só a sua aposta.', 'Depois, ajude a manter seus portadores vivos.'],
    tip: 'Entregue para quem parece que vai sobreviver até o fim.',
    prompt: 'Quem recebe um amuleto?', promptHint: 'Cada amuleto deve ir para uma pessoa diferente.',
  },
  {
    id: 'incendiario', name: 'Incendiário', team: 'solo', weight: -5, novo: true, winsAlone: true, winTitle: 'O Incendiário venceu', verb: 'Encharcar',
    skip: 'Não encharcar ninguém esta noite',
    power: { ability: 'fosforo', title: 'Riscar o fósforo (1×)', text: 'Todos os encharcados queimam esta noite. Nada protege.', summary: 'e riscar o fósforo' },
    tagline: 'Encharca a vila em silêncio e risca um fósforo.',
    goal: 'Ser o último vivo, ou sobrar só você e mais uma pessoa.',
    how: ['Toda noite, encharque alguém de querosene. Ninguém percebe.', 'Uma vez por jogo, risque o fósforo: todos os encharcados vivos morrem, sem proteção possível.', 'Os lobos e a vila são seus inimigos.'],
    tip: 'Encharque os mais fortes e espere a hora em que o fósforo vira o jogo.',
    prompt: 'Quem você vai encharcar?', promptHint: 'Os encharcados não sabem. O fósforo queima todos de uma vez.',
  },
]

export const ROLES = Object.fromEntries(ROLE_LIST.map((r) => [r.id, r])) as Record<RoleId, RoleDef>

export const isWolf = (id: RoleId) => ROLES[id].team === 'lobos'

