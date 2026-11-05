# PromessaMS — versão Android 19

## Alterações

Login web: retorno OAuth com identificador aleatório no caminho, sem query preexistente; responseType=code explícito. State ausente só é recuperado quando o nonce no caminho corresponde ao cookie HttpOnly da tentativa. Tokens nunca são incluídos em URLs. Falhas e expiração retornam à Conta com mensagem clara; timeout da tentativa de login é de 30 minutos. Login Android estável da versão 18 foi preservado.

Rádio: player único na Home; Android carrega expo-audio 1.1.1 somente depois de Play. Reprodução interna com controle Play/Stop, volume e MediaSession acionada pelo usuário. Stop cancela reconexões e remove player/notificação. Plugin playback-only remove AudioRecordingService e permissões de gravação/microfone; nenhum receiver de boot da rádio é registrado. Reprodução em segundo plano requer teste no aparelho Android 15 e declaração de mídia na Play Console.

Pedir música: snapshot real de 543 músicas incluído no bundle do backend, cache HTTP e atualização não bloqueante do provedor. AsyncStorage e lista virtualizada permitem reabertura rápida. Nenhum pedido real foi enviado durante os testes.

Home: jornada clicável ao Guia com seta; botão antigo removido; bloco verde compacto; textos Todos são enviados e Cuidado contínuo retirados. Player após Pão Diário; central com destaque. Contato Fale Com A Convenção com ícone WhatsApp real e texto para a secretaria regional. Entrar ou Criar Conta vem abaixo do contato.

Conta: Voltar à Home; RELATÓRIOS no topo somente após login. Página online /relatorios inicia sem conteúdo e possui API protegida. Android abre Relatórios, Programação, Igrejas e Pedir música em WebView interna. A sessão de relatórios é estabelecida por Authorization Bearer e cookie host-only, não por parâmetros de URL. Conteúdo futuro dessas páginas pode ser publicado na web sem novo binário Android, desde que o domínio e os contratos sejam preservados.

## Verificações

TypeScript e ESLint aprovados; 95 testes internos aprovados, 1 teste ignorado e teste externo de token Expo excluído. Exportações web e Android concluídas. Manifesto introspect confirma remoção de microfone e de AudioRecordingService. O manifesto final do AAB ainda deve ser verificado após o build EAS.

Login real no preview confirmado em 05/11/2026: callback terminou com login=success, /api/auth/me respondeu 200, Conta exibiu histórico e RELATÓRIOS. Produção ainda precisa de confirmação após o deploy. Player Android, fundo/tela bloqueada e WebView autenticada precisam de teste em dispositivo físico.

Domínio, pacote br.convencaosulmatogrossense.promessams, projeto EAS e assinatura configurada permanecem os mesmos. Build EAS solicitado: a0acf1a4-3260-47c6-a73b-5d14f47df9b1.
