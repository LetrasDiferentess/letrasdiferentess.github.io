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
- Gerador de letras selecionado ao abrir a página; links de salto entre ferramenta e explicação.
- Melhoria da primeira renderização: amostras estáticas redundantes removidas e texto inicial em português.
- Script complementar de localização `localizacao-ptbr.js`.
- `robots.txt`, sitemap com URLs canônicas e workflow GitHub Pages.
- Páginas Sobre e Privacidade com links na página principal.

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
