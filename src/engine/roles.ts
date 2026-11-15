export type Team = 'vila' | 'lobos' | 'solo'

export type RoleId =
  | 'aldeao' | 'vidente' | 'medico' | 'bruxa' | 'cacador' | 'cupido' | 'guarda_costas' | 'prefeito'
  | 'ferreiro' | 'rastreador' | 'herdeiro' | 'faroleiro' | 'sonambulo'
  | 'lobisomem' | 'lobo_alfa' | 'lobo_sombra' | 'lobo_uivante'
  | 'tolo' | 'assassino' | 'mercador'

export interface RoleDef {
  id: RoleId
  name: string
  team: Team
  /** Positive helps the village, negative helps the others. Used by the balance meter. */
  weight: number
  /** Can appear more than once in a game. */
  multi?: boolean
  /** Original role created for this game. */
  novo?: boolean
  /** One line summary. */
  tagline: string
  /** How this role wins. */
  goal: string
  /** Step by step of what to do. */
  how: string[]
  tip: string
  /** Night action question and helper text. Absent = no night action. */
  prompt?: string
  promptHint?: string
}

const VILA_GOAL = 'Descobrir e eliminar todos os lobos (e o Assassino, se houver) nas votações do dia.'
const LOBO_GOAL = 'Atacar à noite e enganar de dia até que os lobos sejam pelo menos metade dos vivos.'
const LOBO_HOW = [
  'Você sabe quem são os outros lobos. Ninguém mais sabe.',
  'Toda noite, vote em quem a matilha vai atacar. O alvo mais votado é atacado.',
  'De dia, finja ser um aldeão comum e jogue a desconfiança em outras pessoas.',
]

const list: RoleDef[] = [
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
    prompt: 'Quem você quer investigar?', promptHint: 'Escolha alguém e toque em "Revelar". O Lobo Sombra aparece como inocente.',
  },
  {
    id: 'medico', name: 'Médico', team: 'vila', weight: 3,
    tagline: 'Protege uma vida por noite.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha alguém para proteger (pode ser você).', 'Se essa pessoa for atacada, ela sobrevive.', 'Você não fica sabendo se a proteção foi usada.'],
    tip: 'Proteja quem parece ser a Vidente ou quem está liderando a caça aos lobos.',
    prompt: 'Quem você vai proteger esta noite?', promptHint: 'Pode ser você mesmo. Ataques contra essa pessoa falham.',
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
    id: 'cacador', name: 'Caçador', team: 'vila', weight: 3,
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
    prompt: 'Quem você vai guardar?', promptHint: 'Se essa pessoa for atacada, você morre no lugar dela.',
  },
  {
    id: 'prefeito', name: 'Prefeito', team: 'vila', weight: 2,
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
    prompt: 'Quem recebe a lâmina de prata?', promptHint: 'Opcional e só uma vez. Sem escolher ninguém, você guarda para depois.',
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
    prompt: 'Quem você vai seguir?', promptHint: 'Na sua próxima vez, você saberá em que casas essa pessoa entrou esta noite.',
  },
  {
    id: 'herdeiro', name: 'Herdeiro', team: 'vila', weight: 2, novo: true,
    tagline: 'Herda o poder de quem escolher.',
    goal: 'Começa na Vila. Se herdar um papel de outro time, passa a jogar por esse time.',
    how: ['Só na 1ª noite: escolha um mentor.', 'Quando ele morrer, você se torna o papel dele.', 'Se o mentor for um lobo, você vira lobo.'],
    tip: 'Escolher alguém com poder forte vale mais do que escolher alguém confiável.',
    prompt: 'Quem será seu mentor?', promptHint: 'Quando essa pessoa morrer, você herda o papel dela.',
  },
  {
    id: 'faroleiro', name: 'Faroleiro', team: 'vila', weight: 2, novo: true,
    tagline: 'Ilumina tudo o que aconteceu na noite.',
    goal: VILA_GOAL,
    how: ['Uma vez por jogo, acenda o farol.', 'Na manhã seguinte, a vila vê todas as ações daquela noite (quem foi alvo de quê), sem saber quem fez.'],
    tip: 'Acenda quando a vila estiver perdida: as pistas costumam desmascarar mentirosos.',
    prompt: 'Acender o farol esta noite?', promptHint: 'Só uma vez no jogo. A vila verá as ações desta noite.',
  },
  {
    id: 'sonambulo', name: 'Sonâmbulo', team: 'vila', weight: 1, novo: true,
    tagline: 'Anda dormindo e às vezes vê demais.',
    goal: VILA_GOAL,
    how: ['Toda noite, você vai sozinho até a casa de alguém aleatório.', 'Se for um lobo, você descobre, mas o lobo também descobre você.', 'O resultado aparece na sua próxima vez.'],
    tip: 'Se descobrir um lobo, fale logo: ele já sabe de você.',
  },
  { id: 'lobisomem', name: 'Lobisomem', team: 'lobos', weight: -6, multi: true, tagline: 'Caça à noite, mente de dia.', goal: LOBO_GOAL, how: LOBO_HOW, tip: 'Não ataque sempre quem te acusa: fica óbvio.', prompt: 'Quem a matilha vai atacar?', promptHint: 'Os números mostram os votos dos lobos que já jogaram.' },
  { id: 'lobo_alfa', name: 'Lobo Alfa', team: 'lobos', weight: -7, tagline: 'O líder da matilha decide os empates.', goal: LOBO_GOAL, how: [...LOBO_HOW.slice(0, 2), 'Se a matilha empatar, o seu voto decide o alvo.'], tip: 'Jogue por último entre os lobos para ver os votos e decidir.', prompt: 'Quem a matilha vai atacar?', promptHint: 'Em caso de empate, seu voto decide.' },
  { id: 'lobo_sombra', name: 'Lobo Sombra', team: 'lobos', weight: -8, novo: true, tagline: 'Invisível para a Vidente.', goal: LOBO_GOAL, how: [...LOBO_HOW.slice(0, 2), 'A Vidente te vê como inocente.', 'Uma vez por jogo, use a sombra para impor o alvo da matilha.'], tip: 'Você pode se fingir de investigado e "limpo" sem medo.', prompt: 'Quem a matilha vai atacar?', promptHint: 'Os números mostram os votos dos lobos que já jogaram.' },
  { id: 'lobo_uivante', name: 'Lobo Uivante', team: 'lobos', weight: -7, novo: true, tagline: 'Um uivo que silencia a votação.', goal: LOBO_GOAL, how: [...LOBO_HOW.slice(0, 2), 'Uma vez por jogo, uive: a votação do dia seguinte é cancelada.'], tip: 'Uive quando um lobo estiver prestes a ser linchado.', prompt: 'Quem a matilha vai atacar?', promptHint: 'Os números mostram os votos dos lobos que já jogaram.' },
  {
    id: 'tolo', name: 'Tolo', team: 'solo', weight: -2,
    tagline: 'Quer ser linchado.',
    goal: 'Ser linchado pela vila. Se isso acontecer, só você vence.',
    how: ['À noite você não tem ação.', 'De dia, pareça suspeito sem ser óbvio demais.'],
    tip: 'Se exagerar, ninguém acredita. Faça os outros "descobrirem" você.',
  },
  {
    id: 'assassino', name: 'Assassino Solitário', team: 'solo', weight: -5,
    tagline: 'Mata sozinho, contra todos.',
    goal: 'Ser o último vivo, ou sobrar só você e mais uma pessoa.',
    how: ['Toda noite, escolha alguém para matar.', 'Médico e Guarda-costas podem impedir.', 'Os lobos também são seus inimigos.'],
    tip: 'Deixe a vila e os lobos se destruírem e ataque quem estiver liderando.',
    prompt: 'Quem você vai matar?', promptHint: 'Proteções do Médico e do Guarda-costas podem impedir.',
  },
  {
    id: 'mercador', name: 'Mercador', team: 'solo', weight: -1, novo: true,
    tagline: 'Vence junto com quem ganhar, se os negócios forem bons.',
    goal: 'Terminar a partida vivo, com 3 amuletos entregues e os 3 portadores vivos. Você vence junto com o time vencedor.',
    how: ['Toda noite, entregue um amuleto a alguém diferente (até 3).', 'Os amuletos não têm poder: são só a sua aposta.', 'Depois, ajude a manter seus portadores vivos.'],
    tip: 'Entregue para quem parece que vai sobreviver até o fim.',
    prompt: 'Quem recebe um amuleto?', promptHint: 'Cada amuleto deve ir para uma pessoa diferente.',
  },
]

export const ROLES = Object.fromEntries(list.map((r) => [r.id, r])) as Record<RoleId, RoleDef>
export const ROLE_LIST = list

export const isWolf = (id: RoleId) => ROLES[id].team === 'lobos'

export const TEAM_LABEL: Record<Team, string> = { vila: 'Vila', lobos: 'Lobos', solo: 'Solo' }

export function balance(roles: RoleId[]): number {
  return roles.reduce((sum, r) => sum + ROLES[r].weight, 0)
}

/** Suggested role set for n players: ~1 wolf per 4 players, mostly special villagers. */
export function preset(n: number): RoleId[] {
  const wolfCount = Math.max(1, Math.round(n / 4))
  const wolves: RoleId[] = ['lobisomem', 'lobo_alfa', 'lobo_sombra', 'lobo_uivante']
  const solos: RoleId[] = n >= 12 ? ['tolo', 'assassino'] : n >= 9 ? ['tolo'] : []
  const specials: RoleId[] = ['vidente', 'medico', 'cacador', 'bruxa', 'cupido', 'ferreiro', 'rastreador', 'guarda_costas', 'herdeiro', 'prefeito', 'faroleiro', 'sonambulo']
  const out: RoleId[] = []
  for (let i = 0; i < wolfCount; i++) out.push(wolves[i] ?? 'lobisomem')
  out.push(...solos)
  const villageSlots = n - out.length
  out.push(...specials.slice(0, Math.ceil(villageSlots * 0.66)))
  while (out.length < n) out.push('aldeao')
  return out.slice(0, n)
}
