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
