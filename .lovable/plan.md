# Jornadas unificadas, indicação do dia e Progresso por ritual

## O que muda para a pessoa

**Aba Jornada**
- Sai o título "Sua jornada de Redução/Liberdade" e qualquer botão de trocar jornada.
- A aba mostra duas faixas, uma embaixo da outra: primeiro **Jornada de Redução**, depois **Jornada de Liberdade**.
- Em cada faixa os temas aparecem como cards que rolam para o lado (imagem, título, status concluído). Tocar abre o mesmo popup de hoje (Transforme / Treine / Compartilhe).
- Em cada jornada aparecem primeiro os temas fixos e os gatilhos escolhidos no onboarding, depois os demais temas daquela jornada.
- A seção "Extras – Hipnoses de Apoio" deixa de existir, porque as hipnoses da Redução já estarão visíveis para todos.
- O progresso feito até hoje é mantido (cada jornada continua com seu próprio registro de concluído).

**Tema indicado no Dash**
- No começo: primeiro tema não concluído da jornada indicada no onboarding.
- Quando a pessoa abre um tema da outra jornada, essa vira a "última jornada escolhida"; o Dash passa a indicar o primeiro tema ainda não concluído dela.
- "Visto" = tema concluído (hipnose + missão), a mesma regra de hoje.

**Dash**
- Layout fixo no estilo da Liberdade, com o botão SOS sempre visível para todos.
- O botão/fluxo "Pronto para parar de fumar?" que trocava de jornada sai do Dash (passa a ser a entrada no Progresso, abaixo).

**Aba Progresso**
- Quem marcou "estou reduzindo" no onboarding: vê o layout atual de Redução, com um novo card "Me sinto preparado para parar" que pede a data do ritual do último cigarro.
  - Ao salvar a data: o layout vira o de Liberdade (dias sem fumar) e os dias a partir dela entram como 0 no gráfico automaticamente.
  - Sem data, mas registrou 0 cigarros em algum dia: aparece a contagem de dias sem fumar (a partir desse dia), sem preencher 0 automaticamente no gráfico.
- Quem marcou "abstinência" no onboarding: layout de Liberdade, gráfico com 0 automático, pergunta a data do último cigarro e conta os dias. Registrar que fumou não muda o layout (só reinicia a contagem, como hoje).

**Popup de cigarros de ontem**
- Só aparece para quem ainda não tem data do ritual do último cigarro. Quem tem a data recebe 0 automático para ontem.

## Detalhes técnicos
- Nova regra pura em `src/lib/journeyFocus.ts` (testada em `tests/`): dado temas das duas jornadas, conclusões, jornada do onboarding e última jornada escolhida, devolve o tema indicado. Outra regra pura `src/lib/progressMode.ts`: modo do Progresso (reducao / liberdade), se mostra contagem, se preenche 0 automático.
- "Última jornada escolhida": gravada ao abrir conteúdo de um tema, em uma tabela nova `ultima_jornada_usuario` (user_id, jornada, updated_at) com RLS só do próprio usuário — funciona em qualquer aparelho. `historico_jornada_usuario` deixa de receber trocas, para não zerar o progresso (o filtro por data de início da jornada em `useJourneyTracking` é removido).
- A data do ritual continua em `onboarding_responses.last_cigarette_date`. O 0 automático no gráfico passa a valer a partir dessa data (em vez dos períodos de "abstinência" do histórico).
- `useJourneyFocos` passa a carregar as duas jornadas; Dash usa prefixo `abst_` / sem prefixo conforme a jornada do tema indicado.
- Neo (prompt do chat) atualizado para descrever as duas jornadas na mesma aba.
- Novo build das lojas necessário para os apps nativos.
