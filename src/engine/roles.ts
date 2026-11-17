export type Team = 'vila' | 'lobos' | 'solo'

export type RoleId =
  | 'aldeao' | 'vidente' | 'medico' | 'bruxa' | 'cacador' | 'cupido' | 'guarda_costas' | 'prefeito'
  | 'ferreiro' | 'rastreador' | 'herdeiro' | 'faroleiro' | 'sonambulo' | 'atirador' | 'detetive' | 'medium'
  | 'vingador' | 'sacerdote' | 'vidente_aura' | 'dama_vermelho' | 'amaldicoado'
  | 'lobisomem' | 'lobo_alfa' | 'lobo_sombra' | 'lobo_uivante' | 'lobo_farejador' | 'lobo_vidente' | 'lobo_junior'
  | 'tolo' | 'assassino' | 'mercador' | 'incendiario' | 'cacador_cabecas'

/** Abilities with limited uses per game (1 unless the role's `power.uses` says otherwise). */
export type Ability = 'cura' | 'veneno' | 'lamina' | 'farol' | 'sombra' | 'uivo' | 'fosforo' | 'bala' | 'escudo' | 'reviver' | 'renuncia' | 'agua'

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
  /** First one is the main tip; the rest clear up what players tend to get wrong. */
  tips: string[]
  /** Night turn texts. Which targets are allowed is decided by `nightAction` in game.ts. */
  prompt?: string
  promptHint?: string
  verb?: string
  /** Summary when an optional action is skipped. */
  skip?: string
  /** Limited power (`uses` times per game, default 1). `summary` describes it when switched on. */
  power?: { ability: Ability; title: string; text: string; summary: string; uses?: number }
  /** Traits the engine reads instead of checking role ids. */
  hiddenFromSeer?: boolean
  /** Weight of this wolf's vote in the pack's attack. */
  packVotes?: number
  immuneToWolves?: boolean
  shootsOnDeath?: boolean
  winsIfLynched?: boolean
  winsAlone?: boolean
  sharesVictory?: boolean
  winTitle?: string
}

const VILA_GOAL = 'Descobrir e eliminar todos os lobos (e os solos assassinos, se houver) nas votações do dia.'
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
    tips: ['Desconfie de quem fala pouco e de quem concorda com todo mundo.', 'Na noite, escolher um suspeito não faz nada: serve só para ninguém perceber que você não tem poder.', 'Você pode fingir ter um papel forte para atrair o ataque dos lobos e proteger o verdadeiro.'],
  },
  {
    id: 'vidente', name: 'Vidente', team: 'vila', weight: 5,
    tagline: 'Descobre o papel de uma pessoa por noite.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha um jogador para investigar.', 'Na hora você vê o papel exato dele, seja lobo, da vila ou solo.', 'De dia, use essa informação para guiar a vila, sem se expor cedo demais.'],
    tips: ['Se você se revelar, os lobos vão te atacar. Espere ter certeza de pelo menos um lobo.', 'Quem aparece como Aldeão pode ser o Lobo Sombra.', 'Anote o que viu: depois de algumas noites, uma lista de confirmados vale muito para a vila.'],
    verb: 'Investigar', prompt: 'Quem você quer investigar?', promptHint: 'Escolha alguém e toque em "Revelar". O Lobo Sombra aparece como Aldeão.',
  },
  {
    id: 'medico', name: 'Médico', team: 'vila', weight: 3,
    tagline: 'Protege uma vida por noite.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha outra pessoa para proteger (você não pode se proteger).', 'Se essa pessoa for atacada, ela sobrevive.', 'Você não fica sabendo se a proteção foi usada.'],
    tips: ['Proteja quem parece ser a Vidente ou quem está liderando a caça aos lobos.', 'Se ninguém morreu de manhã, talvez você tenha salvado alguém. Não conte logo quem, ou os lobos mudam de alvo.', 'Sua proteção não segura o veneno da Bruxa, o tiro do Atirador nem o fogo do Incendiário.'],
    verb: 'Proteger', prompt: 'Quem você vai proteger esta noite?', promptHint: 'Você não pode se proteger. Ataques contra essa pessoa falham.',
  },
  {
    id: 'bruxa', name: 'Bruxa', team: 'vila', weight: 4,
    tagline: 'Uma poção para salvar, outra para matar.',
    goal: VILA_GOAL,
    how: ['Você tem 1 poção de cura: protege alguém de ataques por uma noite. Ela só é gasta se a pessoa for mesmo atacada.', 'E 1 poção de veneno: mata alguém, sem proteção possível. Não pode ser usada na 1ª noite.', 'Cada poção só pode ser usada uma vez no jogo. Você fica sabendo quando a cura salvar alguém.'],
    tips: ['Guarde o veneno para quando tiver certeza de quem é lobo.', 'Usar a cura numa noite calma não desperdiça: ela só é gasta se salvar alguém.', 'O veneno passa por cima do Médico e do Guarda-costas.'],
    prompt: 'Suas poções', promptHint: 'As duas são opcionais. Toque de novo num jogador para desmarcar.',
  },
  {
    id: 'cacador', name: 'Caçador', team: 'vila', weight: 3, shootsOnDeath: true,
    tagline: 'Quando cai, leva alguém junto.',
    goal: VILA_GOAL,
    how: ['À noite você não tem ação.', 'Quando você morrer (de noite ou linchado), escolhe alguém para atirar.', 'Essa pessoa morre na hora.'],
    tips: ['Os lobos evitam te atacar se souberem quem você é. Às vezes vale se revelar.', 'Mesmo linchado você atira. Um tiro num aldeão ajuda os lobos, então pense antes.'],
  },
  {
    id: 'cupido', name: 'Cupido', team: 'vila', weight: 1,
    tagline: 'Une dois corações na primeira noite.',
    goal: VILA_GOAL,
    how: ['Só na 1ª noite: escolha dois jogadores para serem amantes (pode incluir você).', 'Eles ficam sabendo um do outro, inclusive o papel. Se um morrer, o outro morre de tristeza.', 'Se os dois amantes forem os últimos vivos, eles vencem juntos, mesmo de times diferentes.'],
    tips: ['Unir um lobo e um aldeão cria um dilema divertido para os dois.', 'Você pode se colocar como um dos amantes.', 'Amantes de times diferentes ficam num dilema: para vencer juntos, precisam ser os últimos vivos.'],
    prompt: 'Quem vai se apaixonar?', promptHint: 'Escolha dois jogadores. Pode incluir você.',
  },
  {
    id: 'guarda_costas', name: 'Guarda-costas', team: 'vila', weight: 3,
    tagline: 'Leva o golpe no lugar de outro, e aguenta o primeiro.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha alguém para guardar. Sem escolher, você guarda só a si mesmo.', 'Se a pessoa guardada for atacada, você leva o ataque no lugar dela.', 'Você sobrevive ao primeiro ataque que levar. O segundo é fatal.'],
    tips: ['Sua vida extra é preciosa: proteja quem vale mais para a vila.', 'Não escolher ninguém não é desperdício: você se guarda e ainda conta com a vida extra.', 'Quando aparecer o aviso de que você sobreviveu a um ataque, sua vida extra acabou. O próximo mata.'],
    verb: 'Guardar', skip: 'Guardar só a mim', prompt: 'Quem você vai guardar?', promptHint: 'Você aguenta um ataque. No segundo, morre.',
  },
  {
    id: 'prefeito', name: 'Prefeito', team: 'vila', weight: 2,
    tagline: 'Se revela e passa a votar por dois.',
    goal: VILA_GOAL,
    how: ['À noite você não tem ação.', 'Durante a discussão, você pode se revelar em "Usar poder do dia".', 'Depois de revelado, seu voto vale 2 pelo resto do jogo. Mas os lobos também sabem quem você é.'],
    tips: ['Se revele quando seu voto puder decidir, não antes: Prefeito revelado vira alvo.', 'Revelar não tem volta e aparece para todos.', 'Um lobo pode dizer que é Prefeito, mas só o verdadeiro consegue se revelar pelo app. Desafie quem disser e não revelar.'],
  },
  {
    id: 'ferreiro', name: 'Ferreiro', team: 'vila', weight: 3, novo: true,
    tagline: 'Forja uma lâmina de prata que mata lobos.',
    goal: VILA_GOAL,
    how: ['Uma vez por jogo, entregue a lâmina de prata a alguém (pode ser você).', 'Quem recebe fica sabendo que tem a lâmina.', 'Se os lobos atacarem o portador, ele sobrevive e um lobo aleatório morre.'],
    tips: ['Dê a lâmina para quem os lobos provavelmente vão atacar.', 'A lâmina só funciona contra o ataque dos lobos: não salva do veneno, do Assassino nem do fogo.', 'Peça ao portador para não contar. Se os lobos souberem, mudam de alvo.', 'Você pode guardar a lâmina para você mesmo.'],
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
    tips: ['Se quem você seguiu entrou na casa de quem morreu, provavelmente é lobo.', 'Você descobre aonde a pessoa foi, não o que ela fez lá. Cruze com o que ela diz ser.', 'Quem não entrou em casa nenhuma pode ser Aldeão, ou alguém que pulou a vez.', 'O resultado chega na sua próxima vez, não na hora.'],
    verb: 'Seguir', prompt: 'Quem você vai seguir?', promptHint: 'Na sua próxima vez, você saberá em que casas essa pessoa entrou esta noite.',
  },
  {
    id: 'herdeiro', name: 'Herdeiro', team: 'vila', weight: 2, novo: true,
    tagline: 'Herda o poder de quem escolher.',
    goal: 'Começa na Vila. Se herdar um papel de outro time, passa a jogar por esse time.',
    how: ['Só na 1ª noite: escolha um mentor.', 'Quando ele morrer, você se torna o papel dele.', 'Se o mentor for um lobo, você vira lobo.'],
    tips: ['Escolher alguém com poder forte vale mais do que escolher alguém confiável.', 'Até o mentor morrer, você é um aldeão sem poder.', 'Se o mentor for lobo, você vira lobo: sua vitória passa a ser a da matilha.', 'Quando herdar, sua próxima vez mostra o novo papel. Leia com calma.'],
    verb: 'Escolher como mentor', prompt: 'Quem será seu mentor?', promptHint: 'Quando essa pessoa morrer, você herda o papel dela.',
  },
  {
    id: 'faroleiro', name: 'Faroleiro', team: 'vila', weight: 2, novo: true,
    tagline: 'Ilumina tudo o que aconteceu na noite.',
    goal: VILA_GOAL,
    how: ['Uma vez por jogo, acenda o farol.', 'Na manhã seguinte, a vila vê todas as ações daquela noite (quem foi alvo de quê), sem saber quem fez.'],
    tips: ['Acenda quando a vila estiver perdida: as pistas costumam desmascarar mentirosos.', 'O farol mostra as ações, não quem fez. Compare com o que cada um diz ser.', 'Na sua vez, se não quiser acender, só confirme: o farol continua guardado.'],
    skip: 'Deixar o farol apagado',
    power: { ability: 'farol', title: 'Acender o farol', text: 'Amanhã a vila verá todas as ações desta noite.', summary: 'O farol vai brilhar esta noite' },
    prompt: 'Acender o farol esta noite?', promptHint: 'Só uma vez no jogo. A vila verá as ações desta noite.',
  },
  {
    id: 'sonambulo', name: 'Sonâmbulo', team: 'vila', weight: 1, novo: true,
    tagline: 'Anda dormindo e às vezes vê demais.',
    goal: VILA_GOAL,
    how: ['Toda noite, você vai sozinho até a casa de alguém aleatório.', 'Se for um lobo, você descobre, mas o lobo também descobre você.', 'O resultado aparece na sua próxima vez.'],
    tips: ['Se descobrir um lobo, fale logo: ele já sabe de você.', 'Você não escolhe para onde vai: na sua vez, é só confirmar.', '"Nada de estranho" quer dizer que a pessoa não é lobo, mas ela ainda pode ser solo.'],
  },
  {
    id: 'atirador', name: 'Atirador', team: 'vila', weight: 3,
    power: { ability: 'bala', title: 'Atirar', text: 'Quem você escolher morre na hora.', summary: '', uses: 2 },
    tagline: 'Duas balas de dia. O primeiro tiro te revela.',
    goal: VILA_GOAL,
    how: ['À noite você não tem ação.', 'Durante a discussão, atire em alguém em "Usar poder do dia". O alvo morre na hora.', 'Você tem 2 balas, no máximo 1 por dia, e não pode atirar no 1º dia. No primeiro tiro, todos descobrem que você é o Atirador.'],
    tips: ['Depois do primeiro tiro os lobos sabem quem você é. Faça a segunda bala valer.', 'O tiro mata na hora, mesmo com Médico ou Guarda-costas.', 'Para atirar, na discussão toque em "Usar poder do dia" e escolha seu nome.'],
  },
  {
    id: 'detetive', name: 'Detetive', team: 'vila', weight: 3,
    tagline: 'Descobre se duas pessoas são do mesmo time.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha duas pessoas para comparar.', 'Na hora você vê se elas são do mesmo time ou de times diferentes.', 'O Lobo Sombra parece ser da Vila.'],
    tips: ['Compare alguém de confiança com um suspeito: se forem de times diferentes, achou um.', '"Mesmo time" entre dois desconhecidos não prova nada: os dois podem ser lobos.', 'Todos os solos (Bobo, Assassino, Incendiário, Mercador) contam como o mesmo time.', 'O Lobo Sombra aparece como Vila também para você.'],
    prompt: 'Quem você vai comparar?', promptHint: 'Escolha duas pessoas e toque em "Comparar".',
  },
  {
    id: 'medium', name: 'Médium', team: 'vila', weight: 2,
    power: { ability: 'reviver', title: 'Ressuscitar (1×)', text: 'Essa pessoa volta à vida ao amanhecer.', summary: 'e ressuscitar' },
    tagline: 'Fala com os mortos e pode trazer um de volta.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha alguém que já morreu e veja o papel verdadeiro dessa pessoa.', 'Uma vez por jogo, ressuscite um morto da Vila: ele volta ao amanhecer.', 'Enquanto ninguém morrer, você não tem ação.'],
    tips: ['Fica muito mais forte quando o papel não é revelado na morte.', 'Só dá para ressuscitar quem era da Vila. O botão de reviver só aparece quando você escolhe um morto da Vila.', 'Quem volta continua com o mesmo papel.', 'Guarde a ressurreição para a Vidente ou para quem a vila confiava.'],
    verb: 'Consultar', prompt: 'Com qual morto você quer falar?', promptHint: 'Escolha alguém morto e toque em "Revelar".',
  },
  {
    id: 'vingador', name: 'Vingador', team: 'vila', weight: 2,
    tagline: 'Marca alguém. Se morrer, leva essa pessoa junto.',
    goal: VILA_GOAL,
    how: ['Toda noite, você pode marcar alguém (ou manter a marca de antes).', 'Quando você morrer, de noite ou linchado, quem estiver marcado morre junto.', 'Diferente do Caçador, você escolhe antes, em segredo, e não na hora da morte.'],
    tips: ['Marque seu maior suspeito e troque a marca quando mudar de ideia.', 'Sem marca, sua morte não leva ninguém. Marque já na 1ª noite.', 'A marca vale mesmo se os lobos te matarem: assim, matar você custa caro para eles.', 'Cuidado: se marcar um aldeão e for linchado, você ajuda os lobos.'],
    verb: 'Marcar', skip: 'Manter a marca como está', prompt: 'Quem você vai marcar?', promptHint: 'Se você morrer, essa pessoa morre junto. Sem escolher, a marca de antes continua.',
  },
  {
    id: 'sacerdote', name: 'Sacerdote', team: 'vila', weight: 3,
    power: { ability: 'agua', title: 'Água benta', text: 'Joga água benta em alguém. Se for lobo, ele morre; senão, quem morre é você.', summary: 'com água benta' },
    tagline: 'Uma água benta que queima lobos.',
    goal: VILA_GOAL,
    how: ['À noite você não tem ação.', 'Uma vez por jogo, durante a discussão, toque em "Usar poder do dia" e jogue água benta em alguém.', 'Se a pessoa for lobo, ela morre na hora. Se não for, quem morre é você. Todos ficam sabendo.'],
    tips: ['Só jogue quando tiver certeza: errar custa a sua vida.', 'Combine com a Vidente: ela descobre, você executa sem precisar de votação.', 'O Lobo Sombra engana a Vidente, mas não a água benta: ele é lobo e morre.', 'Depois de jogar, todos sabem quem você é.'],
  },
  {
    id: 'vidente_aura', name: 'Vidente da Aura', team: 'vila', weight: 3,
    tagline: 'Vê se a aura de alguém é boa, má ou desconhecida.',
    goal: VILA_GOAL,
    how: ['Toda noite, escolha alguém para ver a aura.', 'Boa: é da Vila. Má: é lobo. Desconhecida: é um papel solo.', 'Você não vê o papel exato, só a aura.'],
    tips: ['Aura boa não quer dizer papel forte: pode ser só um Aldeão.', 'O Lobo Sombra tem aura boa. Uma aura boa não é prova absoluta.', 'Aura desconhecida pode ser o Bobo, que quer ser linchado. Pense antes de pedir a votação.'],
    verb: 'Ver a aura de', prompt: 'De quem você quer ver a aura?', promptHint: 'Escolha alguém e toque em "Revelar".',
  },
  {
    id: 'dama_vermelho', name: 'Dama de Vermelho', team: 'vila', weight: 1,
    tagline: 'Dorme fora de casa e escapa dos ataques.',
    goal: VILA_GOAL,
    how: ['Toda noite, você pode passar a noite na casa de alguém.', 'Se te atacarem enquanto você está fora, o ataque erra: você não estava em casa.', 'Mas se a casa for de um lobo ou de um assassino solo, ou se essa pessoa morrer naquela noite, você morre junto.'],
    tips: ['Visite quem você confia: na casa de um lobo, você morre.', 'Se ficar em casa (sem escolher), você fica vulnerável como qualquer um.', 'Visitar quem os lobos vão atacar é perigoso: se a pessoa morrer, você morre junto.'],
    verb: 'Passar a noite com', skip: 'Ficar em casa esta noite', prompt: 'Onde você vai passar a noite?', promptHint: 'Ataques a você erram. Mas se a casa for de um lobo ou o dono morrer, você morre.',
  },
  {
    id: 'amaldicoado', name: 'Amaldiçoado', team: 'vila', weight: -1,
    tagline: 'Da vila, até ser mordido.',
    goal: 'Começa na Vila. Se os lobos te atacarem, você vira lobo e passa a jogar com a matilha.',
    how: ['À noite você não tem ação.', 'Se os lobos te atacarem (e ninguém te proteger), você não morre: vira Lobisomem.', 'Você e a matilha ficam sabendo. A partir da noite seguinte, você ataca com eles.'],
    tips: ['Enquanto é da Vila, jogue para a Vila: a Vidente te vê como Amaldiçoado.', 'Se virar lobo, seu objetivo muda de vez: agora você vence com a matilha.', 'Depois de virar, continue agindo como antes para ninguém perceber.'],
  },
  { id: 'lobisomem', name: 'Lobisomem', team: 'lobos', weight: -6, multi: true, verb: 'Atacar', tagline: 'Caça à noite, mente de dia.', goal: LOBO_GOAL, how: LOBO_HOW, tips: ['Não ataque sempre quem te acusa: fica óbvio.', 'Os números na tela mostram os votos dos lobos que já jogaram. Siga o mais votado para não dividir a matilha.', 'Empate entre os lobos é sorteado.'], prompt: LOBO_PROMPT, promptHint: LOBO_HINT },
  { id: 'lobo_alfa', name: 'Lobo Alfa', team: 'lobos', weight: -7, packVotes: 2, verb: 'Atacar', tagline: 'O voto dele na matilha vale por dois.', goal: LOBO_GOAL, how: [...LOBO_HOW.slice(0, 2), 'No ataque da matilha, o seu voto conta duas vezes.'], tips: ['Jogue por último entre os lobos para ver os votos e decidir.', 'Seu voto duplo quase sempre decide o alvo, então combine com a matilha de dia.'], prompt: LOBO_PROMPT, promptHint: 'Seu voto conta duas vezes.' },
  { id: 'lobo_sombra', name: 'Lobo Sombra', team: 'lobos', weight: -8, novo: true, hiddenFromSeer: true, verb: 'Atacar',
    power: { ability: 'sombra', title: 'Usar a sombra (1×)', text: 'Seu alvo vira o alvo da matilha, sem contar os votos.', summary: 'com a sombra' }, tagline: 'Invisível para a Vidente.', goal: LOBO_GOAL, how: [...LOBO_HOW.slice(0, 2), 'A Vidente te vê como Aldeão.', 'Uma vez por jogo, use a sombra para impor o alvo da matilha.'], tips: ['Se a Vidente te investigar, ela vai jurar que você é Aldeão.', 'Use a sombra quando a matilha estiver dividida: seu alvo vale, não importa os votos.', 'O Detetive também te vê como Vila.'], prompt: LOBO_PROMPT, promptHint: LOBO_HINT },
  { id: 'lobo_uivante', name: 'Lobo Uivante', team: 'lobos', weight: -7, novo: true, verb: 'Atacar',
    power: { ability: 'uivo', title: 'Uivar (1×)', text: 'A votação de amanhã será cancelada.', summary: 'e uivar' }, tagline: 'Um uivo que silencia a votação.', goal: LOBO_GOAL, how: [...LOBO_HOW.slice(0, 2), 'Uma vez por jogo, uive: a votação do dia seguinte é cancelada.'], tips: ['Uive quando um lobo estiver prestes a ser linchado.', 'O uivo cancela a votação de amanhã, não a de hoje: use na noite anterior.', 'Depois de um dia sem votação, a vila vai desconfiar. Prepare uma desculpa.'], prompt: LOBO_PROMPT, promptHint: LOBO_HINT },
  { id: 'lobo_farejador', name: 'Lobo Farejador', team: 'lobos', weight: -8, novo: true, verb: 'Atacar e farejar', tagline: 'Fareja o papel de quem ataca.', goal: LOBO_GOAL,
    how: [...LOBO_HOW.slice(0, 2), 'Você fareja quem escolher para o ataque: na próxima vez, descobre o papel dessa pessoa, mesmo que a matilha ataque outra.'],
    tips: ['Fareje quem parece ter poder. Conte à matilha e use isso de dia.', 'O resultado chega na sua próxima vez, não na hora.', 'Você fareja quem escolheu, mesmo que a matilha ataque outra pessoa.'], prompt: LOBO_PROMPT, promptHint: 'Quem você escolher também será farejado.' },
  { id: 'lobo_vidente', name: 'Lobo Vidente', team: 'lobos', weight: -7, verb: 'Investigar',
    power: { ability: 'renuncia', title: 'Renunciar à visão', text: 'A partir da próxima noite você ataca com a matilha e não investiga mais.', summary: 'e renunciar à visão' }, tagline: 'Vê o papel das presas, mas não ataca.', goal: LOBO_GOAL,
    how: ['Você sabe quem são os outros lobos.', 'Toda noite, investigue alguém e veja o papel exato dele.', 'Você não vota no ataque da matilha. Pode renunciar à visão para atacar junto, e se for o último lobo vivo passa a atacar.'],
    tips: ['Conte à matilha quem é a Vidente ou o Médico: eles viram o alvo perfeito.', 'Enquanto tiver a visão, sua vez é de investigar, não de atacar.', 'Renunciar não tem volta e só vale a partir da próxima noite.', 'Se sobrar só você de lobo, passa a atacar sem precisar renunciar.'], prompt: 'Quem você quer investigar?', promptHint: 'Escolha alguém e toque em "Revelar".' },
  { id: 'lobo_junior', name: 'Lobo Júnior', team: 'lobos', weight: -7, shootsOnDeath: true, verb: 'Atacar', tagline: 'Se cair, leva alguém junto.', goal: LOBO_GOAL,
    how: [...LOBO_HOW.slice(0, 2), 'Quando você morrer (de noite ou linchado), escolhe alguém para levar junto.'],
    tips: ['A vila pensa duas vezes antes de te linchar. Use isso para ganhar tempo.', 'Morrer de noite também conta: você ainda leva alguém.', 'Leve quem mais ameaça a matilha, como a Vidente ou quem te acusou.'], prompt: LOBO_PROMPT, promptHint: LOBO_HINT },
  {
    id: 'tolo', name: 'Bobo', team: 'solo', weight: -2, winsIfLynched: true, winTitle: 'O Bobo venceu',
    tagline: 'Quer ser linchado.',
    goal: 'Ser linchado pela vila. Se isso acontecer, só você vence.',
    how: ['À noite você não tem ação.', 'De dia, pareça suspeito sem ser óbvio demais.'],
    tips: ['Se exagerar, ninguém acredita. Faça os outros "descobrirem" você.', 'Morrer à noite não conta: só o linchamento te faz vencer.', 'A Vidente vê que você é o Bobo. Se ela falar, a vila pode desistir de te linchar.'],
  },
  {
    id: 'assassino', name: 'Assassino em Série', team: 'solo', weight: -6, winsAlone: true, immuneToWolves: true, winTitle: 'O Assassino em Série venceu', verb: 'Matar',
    tagline: 'Mata sozinho, contra todos.',
    goal: 'Ser o último vivo, ou sobrar só você e mais uma pessoa.',
    how: ['Toda noite, escolha alguém para matar.', 'Médico e Guarda-costas podem impedir.', 'Os lobos não conseguem te matar à noite. Só a votação, a Bruxa e outros assassinos.'],
    tips: ['Deixe a vila e os lobos se destruírem e ataque quem estiver liderando.', 'Os lobos não te matam, mas a votação sim. De dia, finja ser da vila.', 'Médico e Guarda-costas podem salvar seu alvo. Varie os alvos.'],
    prompt: 'Quem você vai matar?', promptHint: 'Proteções do Médico e do Guarda-costas podem impedir.',
  },
  {
    id: 'mercador', name: 'Mercador', team: 'solo', weight: -1, novo: true, sharesVictory: true, verb: 'Dar um amuleto a',
    tagline: 'Vence junto com quem ganhar, se os negócios forem bons.',
    goal: 'Terminar a partida vivo, com 3 amuletos entregues e os 3 portadores vivos. Você vence junto com o time vencedor.',
    how: ['Toda noite, entregue um amuleto a alguém diferente (até 3).', 'Os amuletos não têm poder: são só a sua aposta.', 'Depois, ajude a manter seus portadores vivos.'],
    tips: ['Entregue para quem parece que vai sobreviver até o fim.', 'Os amuletos não protegem ninguém: você aposta em quem vai sobreviver.', 'Você vence com qualquer time, desde que você e seus 3 portadores estejam vivos no fim.'],
    prompt: 'Quem recebe um amuleto?', promptHint: 'Cada amuleto deve ir para uma pessoa diferente.',
  },
  {
    id: 'incendiario', name: 'Incendiário', team: 'solo', weight: -5, winsAlone: true, winTitle: 'O Incendiário venceu', verb: 'Encharcar',
    skip: 'Não encharcar ninguém esta noite',
    power: { ability: 'fosforo', title: 'Riscar o fósforo', text: 'Em vez de encharcar, queime todos os encharcados. Nada protege.', summary: 'Riscar o fósforo', uses: Infinity },
    tagline: 'Encharca a vila em silêncio e risca um fósforo.',
    goal: 'Ser o último vivo, ou sobrar só você e mais uma pessoa.',
    how: ['Toda noite, encharque até 2 pessoas de querosene. Ninguém percebe.', 'Ou, em vez disso, risque o fósforo: todos os encharcados vivos morrem, sem proteção possível. Pode fazer isso quantas vezes quiser.', 'Os lobos e a vila são seus inimigos.'],
    tips: ['Encharque os mais fortes e espere a hora em que o fósforo vira o jogo.', 'Na noite em que risca o fósforo, você não encharca ninguém.', 'Os encharcados não ficam sabendo. Nada salva do fogo, nem Médico.', 'Os lobos podem te matar: não se exponha de dia.'],
    prompt: 'Quem você vai encharcar?', promptHint: 'Escolha até 2. Os encharcados não sabem. O fósforo queima todos de uma vez.',
  },
  {
    id: 'cacador_cabecas', name: 'Caçador de Cabeças', team: 'solo', weight: -2, winTitle: 'O Caçador de Cabeças venceu',
    tagline: 'Precisa ver o alvo dele linchado.',
    goal: 'Fazer a vila linchar o seu alvo. Se conseguir, só você vence.',
    how: ['No começo, você recebe um alvo secreto, sempre alguém da Vila.', 'Convença a vila a linchar essa pessoa. Se ela for linchada, você vence na hora.', 'Se o alvo morrer de outro jeito (à noite, baleado…), você vira Aldeão e passa a jogar pela Vila.'],
    tips: ['Não acuse o alvo logo no 1º dia: fica óbvio. Plante dúvidas aos poucos.', 'Seu alvo é sempre da Vila, então os lobos também ganham se ele cair. Às vezes eles te ajudam sem saber.', 'Se o alvo for protegido demais, talvez ele seja um papel importante. Use isso no discurso.'],
  },
]

export const ROLES = Object.fromEntries(ROLE_LIST.map((r) => [r.id, r])) as Record<RoleId, RoleDef>

export const isWolf = (id: RoleId) => ROLES[id].team === 'lobos'
