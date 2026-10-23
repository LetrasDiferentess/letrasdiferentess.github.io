# Plano de SEO — Letras Diferentes (Brasil, pt-BR)

Atualizado em 23/10/2026. URL principal: https://letrasdiferentess.github.io/

## Intenção principal de busca
Gerar letras diferentes, fontes de letras e letras bonitas para **copiar e colar**. O usuário deve acessar o gerador sem navegar por artigos ou telas secundárias.

## Pesquisa de palavras-chave
Dados estimados de ferramenta SEO fornecidos pelo proprietário em 23/10/2026, referentes a uma página concorrente (invertexto.com/letras-diferentes). Não são métricas do Google Search Console, nem tráfego ou volume do nosso site.

| Palavra-chave (BR) | Volume/mês estimado | KD |
|---|---:|---:|
| letras diferentes | 871.000 | 49 |
| fontes de letras | 291.000 | 9 |
| letras personalizadas | 122.000 | 12 |
| letras bonitas | 112.000 | 49 |
| fonte de letras | 75.000 | 9 |
| letra diferente | 50.000 | 16 |
| fontes diferentes | 30.000 | 10 |
| letras para instagram | 20.000 | 37 |

Os volumes não devem ser somados como pessoas únicas e incluem buscas com sobreposição de intenção. Há termos genéricos/ambíguos na planilha que não precisam virar páginas próprias.

## Arquitetura
- `/` — gerador principal, estilos Unicode, letra de mão, bio Instagram e nomes de jogos; canonizar esta URL.
- `/sobre/` — identidade e objetivo do projeto.
- `/privacidade/` — práticas técnicas e transparência.

Não publicar dezenas de páginas parecidas apenas para variar palavras-chave. Futuras páginas só se justificam com utilidade própria, conteúdo distinto e intenção comprovada.

## Implementado no repositório
- HTML pt-BR, title e descrição específica; canonical, robots index/follow, Open Graph.
- WebSite + WebPage + WebApplication com IDs ligados à home.
- H1 visível, headings organizados, FAQ legível e conteúdo estático crawlable.
- Gerador de letras selecionado ao abrir a página; somente quatro abas da ferramenta no topo. O conteúdo SEO explicativo fica **abaixo** da ferramenta (sem barra extra de navegação).
- Melhoria da primeira renderização: amostras estáticas redundantes removidas e texto inicial em português.
- Script complementar de localização `localizacao-ptbr.js`.
- `robots.txt`, sitemap com URLs canônicas e workflow GitHub Pages.
- Páginas Sobre e Privacidade com links na página principal.

## Auditoria técnica e melhorias realizadas em 23/10/2026

- Separação de cinco blocos JavaScript em arquivos sob `assets/`, preservando a ordem de execução. Tamanho aproximado do HTML-fonte reduzido de 1,40 milhão para 405 mil caracteres (redução de 71% de caracteres HTML; o JavaScript continua fazendo parte do site como arquivos externos).
- Google Fonts decorativas carregadas sem bloquear a apresentação inicial; verificar regressões visuais em navegadores reais antes de concluir benefício definitivo.
- Teste automatizado `tests/seo-smoke.mjs` para navegador mobile 390×844 e desktop 1366×900: valida título, H1, canonical, presença de conteúdo SEO, gerador com 316 opções, geração após digitação, quatro abas e ausência de overflow horizontal.
- Workflow `.github/workflows/seo-audit.yml` executa Playwright e Lighthouse para cada modificação relevante. Os relatórios e capturas são disponibilizados na aba Actions.
- Política de privacidade ampliada para esclarecer o uso opcional do reconhecimento de voz pelo navegador.
- Publicação nativa do GitHub Pages pelo branch `main`; o workflow de publicação manual fica disponível como contingência, evitando duas publicações automatizadas para o mesmo commit.

### Medições Lighthouse (mobile em GitHub Actions, não CrUX)

| Versão avaliada | Performance | LCP (lab) | FCP (lab) | CLS |
|---|---:|---:|---:|---:|
| Antes da refatoração | 56 | 9,4 s | 9,4 s | 0,039 |
| Scripts externos (uma execução) | 60 | 5,2 s | 5,2 s | 0,039 |
| Scripts externos (outra execução) | 75 | 3,6 s | 3,0 s | 0,039 |
| Scripts externos (outra execução) | 58 | 5,5 s | 5,2 s | 0,039 |

As execuções são amostras independentes e influenciadas pela máquina do GitHub e pelas condições de rede; não provam impacto exato nem representam a distribuição do público real. Continuar monitorando LCP, INP e CLS com dados de campo.

### Limitações atuais
- Não foi confirmado acesso aos dados de Search Console da propriedade nova no conector analítico; há acesso a outras propriedades, mas não a `https://letrasdiferentess.github.io/`.
- Ainda é preciso validar cópia para a área de transferência, importação de arquivos, ditado por voz e exportação de imagens em Android e iPhone reais. O smoke test atual valida geração e navegação.
- Nenhuma alegação de indexação, ranqueamento, tráfego ou aumento de CTR sem dados verificados.

## Checklist de validação e monitoramento (não presumir concluído)
1. No Google Search Console, adicione uma propriedade de **prefixo de URL** para `https://letrasdiferentess.github.io/`.
2. Verifique a propriedade por arquivo HTML ou tag de verificação. É preciso confirmar a posse da propriedade; GitHub não dá acesso ao DNS de `github.io`.
3. Envie `https://letrasdiferentess.github.io/sitemap.xml`.
4. Inspecione `/` com a ferramenta URL Inspection e solicite indexação se necessário.
5. Verifique `/sobre/` e `/privacidade/`; não presuma que aparecem no índice só por estarem no sitemap.
6. Execute testes de Core Web Vitals em **mobile real** e Lighthouse/PageSpeed Insights, principalmente LCP e INP, considerando que a página contém uma aplicação Unicode grande.
7. Faça testes de copiar, trocar abas e exportar imagens em Chrome/Android e Safari/iOS.
8. Acompanhe cliques, impressões, CTR e termos de pesquisa BR no Search Console, sem alterar tudo com base em poucos dias.
9. Com dados reais, avalie se há intenção independente para páginas novas de Instagram, letras cursivas ou nomes para jogos.
10. Revisite a política de privacidade se forem adicionados analytics, publicidade ou integrações de terceiros.

### Princípio
O objetivo não é parecer uma coleção de páginas para SEO, mas ser uma ferramenta útil, indexável e localizada para o público brasileiro. Resultados de ranqueamento e indexação não são garantidos.
