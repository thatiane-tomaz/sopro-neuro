---
name: Text wrapping (orphans)
description: Avoid ugly line breaks with one or few words orphaned on the last line
type: design
---
Nunca deixar 1 ou 2 palavras órfãs na última linha de títulos, subtítulos, descrições de diálogos, botões e cards.

Como aplicar:
- Usar `text-balance` (Tailwind v3.4+) em títulos e subtítulos curtos (h1..h3, DialogTitle, DialogDescription, card headings).
- Em copy de 2 linhas, reescrever/encurtar para caber em 1, ou balancear manualmente para que a última linha tenha pelo menos ~35% da largura.
- Em botões, usar `whitespace-nowrap` quando couber, ou reescrever para caber em 1 linha.
- Em parágrafos longos, usar `text-pretty`.
- Revisar sempre no viewport mobile 390px.
