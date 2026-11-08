export function needsOnlineResearch(text: string) {
  return /\b(hoje|agora|atual|atualizado|notícia|noticias|lei|legislação|legislacao|estatuto vigente|pesquise|pesquisa na internet|internet|fonte externa)\b/i.test(text);
}

export function fallbackAnswer(text: string) {
  if (/fruto.*espírito|fruto.*espirito|espírito.*fruto|espirito.*fruto|frutifica|frutificar/i.test(text)) {
    return "Sim. Há uma ligação direta, mas é importante distingui-la corretamente. O Espírito Santo habita e transforma o discípulo que permanece em Cristo; por isso, o fruto do Espírito — amor, alegria, paz, paciência, benignidade, bondade, fidelidade, mansidão e domínio próprio — é caráter formado pela graça, conforme Gálatas 5:22-23, e não simples esforço humano nem contagem de resultados. Jesus relaciona permanência nele e frutificação em João 15:4-5, e a Filosofia da Semente expressa essa mesma dinâmica: a Palavra é a semente, Cristo é o centro, o Espírito Santo capacita o crescimento e o discípulo passa a frutificar em amor, santidade, serviço, cuidado e testemunho. O Projeto Sementes organiza isso na prática por meio de relacionamentos, discipulado, acompanhamento e multiplicação saudável. Assim, frutificar não significa apenas fazer mais atividades; significa tornar-se semelhante a Cristo e, a partir dessa transformação, servir e ajudar outras pessoas a crescerem.\n\nLeia também Gálatas 5:16-25 e João 15:1-8 em oração e pergunte: que fruto do Espírito precisa amadurecer em mim para que minha presença missionária seja mais fiel a Cristo?";
  }
  if (/diferença|diferenca|filosofia.*projeto|projeto.*filosofia/i.test(text)) {
    return "A Filosofia da Semente responde ao porquê: Cristo, a Palavra, a oração, o cuidado, o discipulado e a missão orientam a vida da igreja. O Projeto Sementes responde ao como: ele organiza essa visão em acolhimento, Campanha de Oração no Lar, discipulados, grupos de apoio, integração, formação de líderes e multiplicação. Em resumo: a filosofia dá direção; o projeto transforma essa direção em uma jornada prática, relacional e acompanhada. Um bom primeiro passo é reunir a liderança para orar, estudar a visão e escolher um ciclo pequeno e sustentável.";
  }
  if (/começar|comecar|iniciar|implant/i.test(text)) {
    return "Comece com oração e alinhamento da liderança. Depois, faça um diagnóstico simples da igreja, forme uma equipe local, escolha um primeiro público e planeje um ciclo possível. O Projeto Sementes recomenda acolher, relacionar-se, orar, anunciar, ensinar, acompanhar, integrar, treinar e avaliar — sem transformar pessoas em metas nem pressionar decisões.";
  }
  return "Posso ajudar a compreender e aplicar a Filosofia da Semente e o Projeto Sementes. Como orientação inicial, parta da Palavra e da oração, escute as pessoas, ofereça um próximo passo voluntário e acompanhe o caminho com cuidado. Se você me disser a realidade da sua igreja — tamanho, equipe e principal desafio — eu preparo um próximo passo mais específico.";
}
