import { FULL_DOCUMENT_TEXT } from "./full-document";
import { PROJECT_FULL_DOCUMENT } from "./project-full-document";
import { PHILOSOPHY_FULL_DOCUMENT } from "./philosophy-full-document";

export type ContentModule = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  body: string;
  scripture: string;
  practice: string;
  duration: string;
};

export const CONTENT_MODULES: ContentModule[] = [
  {
    id: "filosofia",
    eyebrow: "Fundamento",
    title: "Filosofia da Semente",
    summary: "Uma visão bíblico-missional de igreja que chama cada discípulo a viver enviado.",
    body: "A Filosofia da Semente compreende a igreja como comunidade enviada por Deus para semear o evangelho, cultivar pessoas em relacionamentos de amor e verdade, formar discípulos maduros e multiplicar testemunhas de Cristo. A semente é a Palavra de Deus; o campo é o mundo, a cidade, os lares e os círculos de relacionamento; o semeador é todo discípulo disponível. O crescimento pertence a Deus, mas a igreja recebe a responsabilidade de lançar, cultivar, acompanhar e formar.",
    scripture: "Lucas 8:11 · Mateus 13:38 · 1 Coríntios 3:6–9",
    practice: "Pergunte: em quais relações Deus já me colocou como presença de amor, verdade e esperança?",
    duration: "5 min",
  },
  {
    id: "distincao",
    eyebrow: "Clareza",
    title: "Filosofia e Projeto",
    summary: "A filosofia responde por quê; o projeto organiza como a igreja vive essa missão.",
    body: "A Filosofia da Semente é a visão teológica e ministerial: Cristo, Palavra, Espírito Santo, missão, discipulado e amor ao próximo. O Projeto Sementes é sua expressão prática: campanhas, estudos nos lares, grupos de apoio, treinamento, integração e multiplicação. Sem a filosofia, o projeto vira método ou ativismo; sem o projeto, a filosofia pode permanecer apenas discurso.",
    scripture: "Mateus 28:19–20 · Atos 2:42–47",
    practice: "Escolha uma rotina da igreja e identifique como ela pode formar pessoas para amar, servir e testemunhar.",
    duration: "6 min",
  },
  {
    id: "principios",
    eyebrow: "Cultura",
    title: "Os 10 princípios",
    summary: "Cristocentrismo, Palavra, oração, presença relacional e multiplicação saudável orientam cada decisão.",
    body: "A cultura da Semente é cristocêntrica, centrada na Palavra, dependente da oração, relacional e inclusiva: todos são enviados. Ela trata o discipulado como cultura, busca multiplicação saudável, sustenta continuidade do cuidado, pratica liderança servidora, integra a igreja e contextualiza formas sem abandonar o evangelho nem o propósito.",
    scripture: "João 15:1–8 · Atos 1:8 · 1 Pedro 4:10",
    practice: "Faça uma autoavaliação: qual princípio já é forte em sua igreja e qual precisa de atenção intencional?",
    duration: "8 min",
  },
  {
    id: "jornada",
    eyebrow: "Caminho",
    title: "A jornada do semeador",
    summary: "Contato, relacionamento, anúncio, estudo, decisão, integração, treinamento e multiplicação.",
    body: "O Projeto Sementes organiza um caminho simples e contínuo. Acolhemos e abrimos portas relacionais; cultivamos com oração e escuta; anunciamos e estudamos a Palavra; acompanhamos decisões; integramos pessoas à comunidade; treinamos servindo; e enviamos novos discípulos para semear. O ciclo não é uma escada rígida, mas um mapa para que ninguém seja esquecido e cada pessoa encontre um próximo passo claro.",
    scripture: "Marcos 1:17 · 2 Timóteo 2:2",
    practice: "Escolha uma pessoa e escreva apenas o próximo passo de cuidado que você pode oferecer nesta semana.",
    duration: "7 min",
  },
  {
    id: "igreja-viva",
    eyebrow: "Prática local",
    title: "Modo Missão e Igreja Viva",
    summary: "Uma comunidade que pensa, decide e organiza sua vida a partir do envio de Jesus.",
    body: "Igreja Viva não é um slogan separado: é a comunidade que demonstra o Modo Missão em relações, práticas, frutos, cuidado e testemunho. Plantação, foco nos dons, culto acolhedor, presença na cidade, ensino das Escrituras e estruturas que servem à missão formam um único movimento. Gestão, pessoas, recursos e agendas devem ser administrados com serviço, transparência, cuidado e formação de sucessores.",
    scripture: "Atos 13:2–3 · Mateus 9:35 · 1 Pedro 5:2–3",
    practice: "Reúna uma pequena equipe e responda: que dor da nossa cidade podemos conhecer melhor e servir com compaixão e verdade?",
    duration: "6 min",
  },
  {
    id: "lideranca",
    eyebrow: "Cuidado",
    title: "Liderança que equipa",
    summary: "Pastores e líderes cuidam, supervisionam, formam e transferem capacidade.",
    body: "Liderança na Filosofia da Semente não concentra a missão em especialistas. Pastores, presbíteros, diáconos e líderes equipam pessoas, oferecem mentoria, acompanham vínculos e ajudam a igreja a perceber cedo quando alguém está fragilizado. O cuidado não termina quando alguém chega, é batizado ou entra em uma equipe: permanência, maturidade e novos começos também fazem parte da missão.",
    scripture: "Efésios 4:11–12 · 1 Coríntios 12 · 2 Timóteo 2:2",
    practice: "Identifique uma pessoa fiel e disponível que possa ser acompanhada para assumir um próximo serviço com mentoria.",
    duration: "5 min",
  },
  {
    id: "filosofia-cristocentrismo",
    eyebrow: "Fundamento",
    title: "Cristo no centro da missão",
    summary: "Jesus é a fonte, o modelo e o conteúdo do envio da igreja.",
    body: "A Filosofia da Semente começa e termina em Jesus Cristo. A igreja não anuncia a si mesma, seus programas ou seus resultados, mas a pessoa e o caminho de Cristo. Toda prática missionária deve revelar seu caráter, sua graça, sua verdade e seu chamado ao discipulado.",
    scripture: "João 15:5 · Filipenses 2:5–11",
    practice: "Revise uma atividade da igreja e pergunte como ela pode tornar Cristo mais conhecido e amado.",
    duration: "5 min",
  },
  {
    id: "filosofia-palavra",
    eyebrow: "Fundamento",
    title: "A Palavra como semente",
    summary: "A missão nasce da Escritura recebida, compreendida e praticada.",
    body: "A Palavra de Deus é a semente que orienta a visão, corrige a comunidade e alimenta a esperança. A igreja ensina a Bíblia com fidelidade e a traduz em práticas de amor, santidade, serviço e testemunho, sem separar conhecimento bíblico da vida cotidiana.",
    scripture: "Lucas 8:11 · 2 Timóteo 3:16–17",
    practice: "Escolha um texto bíblico e escreva uma prática de cuidado que possa nascer dele nesta semana.",
    duration: "6 min",
  },
  {
    id: "filosofia-oracao",
    eyebrow: "Dependência",
    title: "Oração e discernimento",
    summary: "A igreja enviada aprende a agir com dependência e escuta diante de Deus.",
    body: "A oração não é uma etapa decorativa do trabalho missionário; é o ambiente de discernimento, consolo e coragem. Antes de escolher metas, equipes ou estratégias, a comunidade busca a direção do Espírito Santo e intercede pelas pessoas e pelo território.",
    scripture: "Atos 13:2–3 · Colossenses 4:2–4",
    practice: "Separe um momento de oração com a liderança por três pessoas e pelo principal desafio missionário local.",
    duration: "5 min",
  },
  {
    id: "filosofia-relacionamentos",
    eyebrow: "Presença",
    title: "Relacionamentos intencionais",
    summary: "A missão se desenvolve em presença, escuta, confiança e verdade.",
    body: "A Filosofia da Semente valoriza a presença paciente. Pessoas não são projetos; são próximas que carregam histórias, dores, perguntas e dons. Relacionamentos intencionais criam espaço para ouvir, servir, anunciar o evangelho e caminhar sem manipulação.",
    scripture: "1 Tessalonicenses 2:8 · Lucas 24:13–35",
    practice: "Marque uma conversa com alguém que você deseja conhecer melhor, priorizando escuta e acolhimento.",
    duration: "6 min",
  },
  {
    id: "filosofia-todos-enviados",
    eyebrow: "Vocação",
    title: "Todos são enviados",
    summary: "Cada discípulo pode participar da missão de acordo com seus dons e contexto.",
    body: "A missão não pertence apenas ao pastor ou a uma equipe especializada. Crianças, jovens, adultos, idosos, líderes e novos discípulos podem orar, acolher, testemunhar, servir e discipular. A liderança equipa a igreja para que cada pessoa encontre uma forma saudável de participar.",
    scripture: "João 20:21 · 1 Pedro 2:9",
    practice: "Identifique três pessoas com dons diferentes e convide cada uma a assumir um pequeno serviço acompanhado.",
    duration: "5 min",
  },
  {
    id: "filosofia-multiplicacao",
    eyebrow: "Fruto",
    title: "Multiplicação saudável",
    summary: "Maturidade gera novos discípulos, líderes e comunidades cuidadoras.",
    body: "Multiplicar não é acelerar pessoas nem perseguir números. É formar discípulos que permanecem em Cristo, servem com amor e ajudam outros a crescer. O fruto esperado é fidelidade, maturidade, cuidado, serviço e testemunho que se reproduzem de modo sustentável.",
    scripture: "2 Timóteo 2:2 · João 15:8",
    practice: "Escolha um processo de formação e defina qual capacidade você deseja transferir para outra pessoa.",
    duration: "6 min",
  },
  {
    id: "filosofia-contextualizacao",
    eyebrow: "Sabedoria",
    title: "Contextualização responsável",
    summary: "A mesma esperança do evangelho encontra pessoas e territórios concretos.",
    body: "Contextualizar é comunicar e praticar a fé de modo compreensível para pessoas reais, sem diluir o evangelho. A igreja observa a cultura, escuta o território, respeita histórias e escolhe formas de presença que preservem a verdade bíblica e expressem amor inteligível.",
    scripture: "1 Coríntios 9:19–23 · Atos 17:22–34",
    practice: "Converse com moradores do território e anote perguntas, necessidades e recursos que devem orientar a presença da igreja.",
    duration: "6 min",
  },
  {
    id: "documento-integral",
    eyebrow: "Documento-base",
    title: "Filosofia da Semente — documento integral revisado",
    summary: "Leia o documento teológico-ministerial completo, com identidade, distinção entre filosofia e projeto, base bíblica, princípios, liderança e avaliação.",
    body: PHILOSOPHY_FULL_DOCUMENT,
    scripture: "Documento revisado da Convenção Regional Sul-Mato-Grossense",
    practice: "Leia uma seção por vez, destaque uma convicção e converse com a liderança sobre como ela pode se tornar prática na igreja.",
    duration: "Leitura completa",
  },
  {
    id: "projeto-acolhimento",
    eyebrow: "Projeto Sementes",
    title: "Acolhimento e Campanha de Oração no Lar",
    summary: "Receber, ouvir, identificar pedidos de oração e cultivar relacionamentos com liberdade e cuidado.",
    body: "Acolher é abrir uma porta segura para que a pessoa seja recebida, ouvida e respeitada. A Campanha de Oração no Lar cria um primeiro ciclo de relacionamento, oração e anúncio, sem pressão ou promessa automática. O objetivo é reconhecer o próximo passo possível e conectar a pessoa a uma equipe preparada.",
    scripture: "Lucas 10:5–9 · Colossenses 4:5–6",
    practice: "Escolha uma família ou pessoa, ore por ela e ofereça uma visita ou conversa respeitosa.",
    duration: "5 min",
  },
  {
    id: "projeto-discipulados",
    eyebrow: "Projeto Sementes",
    title: "Discipulados Um, Dois e Três",
    summary: "Uma jornada progressiva de evangelho, fundamentos, integração, serviço e formação de liderança.",
    body: "Os discipulados organizam o acompanhamento sem transformar pessoas em números. O primeiro apresenta o evangelho e oferece apoio; o segundo aprofunda fé, doutrina e preparação para o batismo; o terceiro integra, treina e prepara novos líderes. Cada etapa deve respeitar o ritmo, a liberdade, a dignidade e as necessidades de cuidado da pessoa.",
    scripture: "Mateus 28:19–20 · 2 Timóteo 2:2",
    practice: "Mapeie uma pessoa em acompanhamento e registre apenas o próximo passo claro, voluntário e seguro.",
    duration: "7 min",
  },
  {
    id: "projeto-equipes",
    eyebrow: "Projeto Sementes",
    title: "Equipes, semáforo e cuidado",
    summary: "Papéis definidos, supervisão e sinais simples para que ninguém seja esquecido na jornada.",
    body: "O Projeto Sementes distribui responsabilidades entre pastor, presbíteros, diáconos, diaconisas, líderes, auxiliares e equipes de discipulado. Reuniões regulares, registros confidenciais e um semáforo de acompanhamento ajudam a identificar quem está avançando, quem precisa de atenção e quem necessita de reintegração ou cuidado especializado.",
    scripture: "Gálatas 6:1–2 · 1 Pedro 5:2–3",
    practice: "Reúna a equipe e revise os acompanhamentos com confidencialidade, encaminhando situações de risco à liderança adequada.",
    duration: "6 min",
  },
  {
    id: "projeto-cuidado",
    eyebrow: "Projeto Sementes",
    title: "Cuidado contínuo",
    summary: "Acompanhar pessoas depois do primeiro contato é parte essencial da missão.",
    body: "O Projeto Sementes organiza um cuidado que não termina na decisão, no batismo ou na entrada em uma equipe. Cada pessoa precisa de escuta, vínculos, ensino, oportunidades de serviço e caminhos de reintegração quando necessário.",
    scripture: "Gálatas 6:1–2 · 1 Tessalonicenses 5:14",
    practice: "Escolha um acompanhamento que perdeu ritmo e faça um contato respeitoso, oferecendo um próximo passo possível.",
    duration: "6 min",
  },
  {
    id: "projeto-integracao",
    eyebrow: "Projeto Sementes",
    title: "Integração à vida da igreja",
    summary: "Acolhimento se torna pertencimento quando a pessoa encontra vínculos e serviço.",
    body: "Integrar é ajudar a pessoa a reconhecer a igreja como uma comunidade segura, participativa e comprometida com Cristo. A integração conecta novos discípulos a pequenos grupos, ministérios, amizades, ensino e responsabilidades adequadas ao seu momento.",
    scripture: "Atos 2:42–47 · Romanos 12:4–8",
    practice: "Apresente uma pessoa a dois membros maduros e convide-a para uma atividade simples e acolhedora.",
    duration: "5 min",
  },
  {
    id: "projeto-formacao",
    eyebrow: "Projeto Sementes",
    title: "Formação de líderes",
    summary: "A liderança é desenvolvida por convivência, prática acompanhada e transferência.",
    body: "A formação de líderes combina caráter, Bíblia, serviço, responsabilidade e mentoria. O projeto não procura apenas preencher funções, mas formar pessoas que cuidem de outras, saibam trabalhar em equipe e transmitam a missão com humildade.",
    scripture: "Marcos 3:14 · 2 Timóteo 2:2",
    practice: "Convide um auxiliar para observar, praticar e depois conduzir uma pequena parte de uma atividade com acompanhamento.",
    duration: "7 min",
  },
  {
    id: "projeto-avaliacao",
    eyebrow: "Projeto Sementes",
    title: "Avaliação que gera cuidado",
    summary: "Avaliar serve para discernir, cuidar e melhorar, não para pressionar pessoas.",
    body: "A avaliação do Projeto Sementes considera fidelidade bíblica, qualidade dos vínculos, maturidade, cuidado, participação, formação de líderes e multiplicação saudável. Números podem informar, mas não substituem o discernimento pastoral nem a dignidade das pessoas.",
    scripture: "1 Coríntios 4:1–2 · João 15:5",
    practice: "Escolha três sinais de saúde espiritual e relacional para acompanhar no próximo ciclo, sem transformar pessoas em metas.",
    duration: "6 min",
  },
  {
    id: "projeto-multiplicacao",
    eyebrow: "Projeto Sementes",
    title: "Multiplicação de discípulos",
    summary: "Cada ciclo prepara pessoas para servir, discipular e semear novamente.",
    body: "A multiplicação acontece quando o cuidado recebido se transforma em disponibilidade para cuidar de outros. O projeto cria trilhos simples para que discípulos amadureçam, encontrem seus dons, sirvam com supervisão e formem novos discípulos.",
    scripture: "Mateus 28:19–20 · João 15:16",
    practice: "Desenhe uma jornada com três próximos passos: acolher, formar e enviar uma pessoa do seu círculo de relacionamento.",
    duration: "6 min",
  },
  {
    id: "projeto-territorio",
    eyebrow: "Projeto Sementes",
    title: "Leitura do território",
    summary: "A implantação começa conhecendo pessoas, dores, recursos e oportunidades locais.",
    body: "Antes de escolher atividades, a igreja observa seu território: famílias, bairros, escolas, necessidades, organizações, lideranças e histórias. Esse diagnóstico orienta uma presença missionária humilde, contextualizada e cooperativa.",
    scripture: "Jeremias 29:7 · Lucas 10:1–9",
    practice: "Faça uma caminhada de oração pelo entorno e registre cinco necessidades e cinco sinais de esperança encontrados.",
    duration: "6 min",
  },
  {
    id: "projeto-documento-integral",
    eyebrow: "Documento-base",
    title: "Projeto Sementes — documento integral revisado",
    summary: "Leia o documento revisado completo, com objetivos, princípios, estrutura, implantação, fases, equipes, programas e avaliação.",
    body: PROJECT_FULL_DOCUMENT,
    scripture: "Documento revisado da Convenção Regional Sul-Mato-Grossense",
    practice: "Use a leitura completa para montar um plano local e confirme decisões sensíveis com a liderança da igreja.",
    duration: "Leitura completa",
  },
];

export const SEMENTES_KNOWLEDGE = `${PHILOSOPHY_FULL_DOCUMENT}

DOCUMENTO COMPLETO DO PROJETO SEMENTES:
${PROJECT_FULL_DOCUMENT}

RESUMO ORIENTADOR DO AGENTE
BASE DE CONHECIMENTO — FILOSOFIA DA SEMENTE E PROJETO SEMENTES

A Filosofia da Semente é uma visão bíblico-missional de igreja: chama todo discípulo a viver enviado, cultivar relacionamentos intencionais, proclamar e ensinar a Palavra, cuidar de pessoas e multiplicar discípulos. Seu lema é “Multiplicando vidas para o Reino de Deus”. A igreja não existe para preservar sua própria rotina; existe para participar da missão de Deus, fazendo discípulos de Jesus que fazem discípulos.

A semente é a Palavra de Deus (Lc 8:11), o campo é o mundo e os lugares concretos onde Deus nos colocou (Mt 13:38), e o semeador é todo discípulo disponível. O crescimento pertence a Deus, mas a igreja lança, cultiva, acompanha e forma (1Co 3:6-9). Jesus Cristo é o centro, modelo e conteúdo da missão. A Grande Comissão integra ir, fazer discípulos, batizar e ensinar a guardar tudo o que Jesus ordenou (Mt 28:19-20). O Espírito Santo capacita e conduz (At 1:8; 13:2-3), e a igreja é uma comunidade enviada, cuidadora e sacerdotal.

Filosofia e Projeto são inseparáveis, mas distintos. A filosofia responde por que a igreja existe e como deve ser: Cristo, Palavra, Espírito Santo, missão, discipulado e amor. O Projeto Sementes responde como a igreja organiza ações, equipes e acompanhamentos: acolhimento, oração no lar, estudos, grupos de apoio, treinamento, integração e multiplicação. Sem filosofia, o projeto pode virar ativismo, burocracia ou busca numérica sem profundidade; sem projeto, a filosofia pode virar discurso sem prática.

Princípios: cristocentrismo; centralidade da Palavra; oração e dependência; presença relacional; todos são enviados; discipulado como cultura; multiplicação saudável; continuidade do cuidado; liderança servidora; igreja integral; contextualização responsável. O cuidado inclui quem chega e quem já está na igreja, sem fazer um crescer às custas do outro.

A jornada do semeador é um ciclo: contato e acolhimento, relacionamento, oração, anúncio, estudo, decisão, batismo, integração, treinamento, serviço e multiplicação. O projeto não cria uma missão paralela nem compete com ministérios: conecta forças que já pertencem à igreja e ajuda cada pessoa a encontrar um próximo passo claro.

Modo Missão é a postura permanente de uma igreja que pensa, decide e organiza sua vida a partir do envio de Jesus. Igreja Viva é a comunidade que demonstra essa postura em relações, práticas, frutos, cuidado e testemunho. Avaliação deve observar fidelidade bíblica, maturidade, amor, santidade, serviço, cuidado contínuo, liderança treinada, próximos passos claros e multiplicação saudável — nunca apenas números.

Ao responder, seja acolhedor, claro, bíblico e prático. Diferencie o que vem diretamente da base acima de uma sugestão pastoral geral. Evite manipulação, promessas financeiras, aconselhamento médico/jurídico ou substituir o discernimento pastoral local. Quando a pergunta depender de informação atual fora da base, use a pesquisa online disponível e sinalize as fontes e limites.
`;
