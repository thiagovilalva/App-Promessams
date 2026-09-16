# Projeto Sementes — acompanhamento

## Concluído

- [x] Corrigir o servidor para entregar o site Expo na raiz do domínio.
- [x] Fixar a paleta visual e oferecer alternância persistente entre modo claro e escuro.
- [x] Corrigir a leitura de respostas longas com rolagem interna dentro da caixa do assistente.
- [x] Fazer as sugestões desaparecerem após o início da conversa.
- [x] Permitir anexar imagens e arquivos de texto/PDF no navegador e em Android/iOS.
- [x] Enviar imagens ao modelo para análise multimodal e texto extraído como contexto.
- [x] Adicionar login/criação de conta Manus pelo OAuth oficial existente.
- [x] Criar tabela e rota protegida para histórico de conversas autenticadas.
- [x] Exibir conversas sincronizadas na tela Conta e histórico.
- [x] Manter fallback contextual quando o serviço de IA estiver indisponível.
- [x] Rodar TypeScript, 10 testes, build de produção e exportação web.

## Observação sobre convites

Não foi encontrado um endpoint oficial exposto para gerar automaticamente links de indicação Manus com créditos. O app usa o fluxo oficial de login e deixa o ponto preparado para receber um URL oficial de convite, sem inventar um link ou prometer créditos.

## Próximos incrementos

- [ ] Vincular a lista de conversas salvas a uma tela que reabra o conteúdo completo.
- [ ] Adicionar botão de tentar novamente para respostas que falharem.
- [ ] Adicionar pré-visualização de imagens antes do envio e suporte dedicado a PDF com extração no servidor.
- [ ] Configurar um URL oficial de convite Manus quando ele for fornecido pela Manus.

## Correção atual

- [x] Permitir apagar toda a conversa local sem login, com confirmação explícita.
- [x] Remover o scroll interno e o limite fixo de 260 px que cortavam respostas longas.
- [x] Fazer somente a lista geral do chat rolar e acompanhar automaticamente a última mensagem.
- [ ] Validar a experiência final em um dispositivo Android físico com resposta de várias telas.

## Correção atual — validada

- [x] Permitir apagar toda a conversa local sem login, com confirmação explícita.
- [x] Remover o scroll interno e o limite fixo de 260 px que cortavam respostas longas.
- [x] Fazer somente a lista geral do chat rolar e acompanhar automaticamente a última mensagem.
- [x] Validar TypeScript, build, 12 testes automatizados e exportação web.
- [x] Inspecionar a tela do chat em viewport móvel após a alteração.

## Acessibilidade e compartilhamento — concluído

- [x] Adicionar botão oficial de convite Manus com créditos.
- [x] Adicionar botão de contato pelo WhatsApp para +55 67 99913-2610.
- [x] Aumentar títulos, textos de leitura, rótulos e navegação inferior.
- [x] Substituir a confirmação nativa de apagar por diálogo próprio compatível com web e celular.
- [x] Adicionar copiar e compartilhar para respostas do chat e conteúdos.
- [x] Adicionar leitura em voz alta em português do Brasil para respostas.
- [x] Adicionar tela de acessibilidade com texto padrão, grande e muito grande, persistente.
- [x] Adicionar rótulos para leitor de tela e orientação para usuários surdos.
- [x] Validar 15 testes, TypeScript, build e exportação web.

## Governança, áudio e Libras — concluído

- [x] Novos materiais entram como rascunho, nunca são publicados automaticamente.
- [x] Apenas a conta proprietária identificada por OWNER_OPEN_ID pode autorizar a publicação.
- [x] Administradores não proprietários podem enviar materiais para revisão, mas não publicá-los.
- [x] Adicionar velocidade de leitura calma, natural e normal, persistente no dispositivo.
- [x] Ajustar voz para português do Brasil com pitch levemente naturalizado.
- [x] Adicionar acesso ao serviço oficial VLibras para apoio à tradução em Libras.
- [x] Validar 17 testes, TypeScript, build e exportação web.

## Respostas completas e biblioteca por seção — concluído

- [x] Aumentar o limite inicial de geração para 2200 tokens.
- [x] Orientar o agente a concluir frases, listas e etapas com marcador de término.
- [x] Adicionar continuação automática múltipla quando a resposta terminar em fragmento ou limite de geração.
- [x] Confirmar por chamada real que uma resposta longa chega completa, com 25.879 caracteres e final pontuado.
- [x] Separar a aba Conteúdos em “Filosofia da Semente” e “Projeto Sementes”.
- [x] Manter leitura, copiar e compartilhar disponíveis dentro de cada conteúdo escolhido.
- [x] Validar 19 testes, TypeScript, build e exportação web.

## Atualização de 16/09 — concluída

- [x] Entrada PIX trata os dígitos como centavos e mostra exemplos de conversão.
- [x] Remover convite Manus da aba Ofertas.
- [x] Mover WhatsApp para a tela inicial.
- [x] Separar login e criação de conta Manus na tela Conta; criação abre o convite oficial em página externa.
- [x] Mover Área da equipe para a tela de conta autenticada.
- [x] Ouvir resposta alterna entre Ouvir, Pausar e Continuar no mesmo botão.
- [x] Colocar acessibilidade ao lado do botão claro/escuro na capa.
- [x] Adicionar plano de leitura bíblica com hermenêutica e aplicação missional.
- [x] Importar o PDF revisado como documento integral do Projeto Sementes e criar módulos passo a passo.
- [x] Manter a Filosofia da Semente separada, pronta para receber o documento específico pendente.
- [x] Validar 22 testes, TypeScript, build e exportação web.
