export function needsOnlineResearch(text: string) {
  return /\b(hoje|agora|atual|atualizado|notícia|noticias|lei|legislação|legislacao|estatuto vigente|pesquise|pesquisa na internet|internet|fonte externa)\b/i.test(text);
}

export function fallbackAnswer(text: string) {
  if (/diferença|diferenca|filosofia.*projeto|projeto.*filosofia/i.test(text)) {
    return "A Filosofia da Semente responde ao porquê: Cristo, a Palavra, a oração, o cuidado, o discipulado e a missão orientam a vida da igreja. O Projeto Sementes responde ao como: ele organiza essa visão em acolhimento, Campanha de Oração no Lar, discipulados, grupos de apoio, integração, formação de líderes e multiplicação. Em resumo: a filosofia dá direção; o projeto transforma essa direção em uma jornada prática, relacional e acompanhada. Um bom primeiro passo é reunir a liderança para orar, estudar a visão e escolher um ciclo pequeno e sustentável.";
  }
  if (/começar|comecar|iniciar|implant/i.test(text)) {
    return "Comece com oração e alinhamento da liderança. Depois, faça um diagnóstico simples da igreja, forme uma equipe local, escolha um primeiro público e planeje um ciclo possível. O Projeto Sementes recomenda acolher, relacionar-se, orar, anunciar, ensinar, acompanhar, integrar, treinar e avaliar — sem transformar pessoas em metas nem pressionar decisões.";
  }
  return "Posso ajudar a compreender e aplicar a Filosofia da Semente e o Projeto Sementes. Como orientação inicial, parta da Palavra e da oração, escute as pessoas, ofereça um próximo passo voluntário e acompanhe o caminho com cuidado. Se você me disser a realidade da sua igreja — tamanho, equipe e principal desafio — eu preparo um próximo passo mais específico.";
}
