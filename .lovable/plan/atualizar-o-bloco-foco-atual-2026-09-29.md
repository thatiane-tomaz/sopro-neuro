# Atualizar o bloco “Foco atual”

## O que será feito
- Adicionar `subtitulo_habito` à tabela `habitos_jornada`, mantendo os registros atuais sem subtítulo até serem preenchidos.
- Buscar e exibir esse texto logo abaixo do título do foco atual.
- Remodelar o bloco conforme a referência: identificação do foco, título/subtítulo, sequência visual Vídeo → Hipnose → Missão e resumo de atividades concluídas.
- Substituir os três cards de ação por um único botão principal que abre o próximo conteúdo ainda não concluído.
- Respeitar temas sem vídeo ou sem hipnose: o botão ignora conteúdos inexistentes e segue para o próximo disponível.
- Quando tudo estiver concluído, manter o estado visual concluído sem oferecer uma ação incorreta.

## Detalhes técnicos
- Criar uma migração aditiva e atualizar os tipos locais do banco.
- Reaproveitar as ações existentes de vídeo, hipnose e missão, sem alterar suas regras de acesso, acompanhamento ou desbloqueio.
- Preservar o cálculo dinâmico da quantidade de atividades por tema.
- Validar o resultado em 394×852 e conferir compilação e erros da prévia.
