/* Localização visual de interface — Português do Brasil.
   Preserva os atributos de dados, IDs, eventos e os algoritmos Unicode. */
(function(){
"use strict";
var list=[
["300 Text Styles","300 estilos de letras"],
["Select a section to style only that text","Selecione um trecho para estilizar apenas essa parte"],
["● Listening...","● Ouvindo..."],
["✏️ Type / Paste","✏️ Digitar / Colar"],
["📄 File","📄 Arquivo"],
["🎤 Voice Typing","🎤 Ditado por voz"],
["🧹 Clean","🧹 Limpar texto"],
["🗑️ Clear","🗑️ Limpar"],
["TEXT TOOLS","FERRAMENTAS DE TEXTO"],
["lowercase","minúsculas"],
["UPPERCASE","MAIÚSCULAS"],
["Title Case","Iniciais maiúsculas"],
["Aesthetic Spacing","Espaçamento estético"],
["Smart Quotes","Aspas inteligentes"],
["Normalize Unicode","Normalizar Unicode"],
["Choose File","Escolher arquivo"],
["Text Size","Tamanho do texto"],
["Line Spacing","Espaçamento entre linhas"],
["Alignment","Alinhamento"],
["Compact","Compacto"],
["Relaxed","Espaçado"],
["📋 Copy","📋 Copiar"],
["🖼️ Create Image","🖼️ Criar imagem"],
["Create Image","Criar imagem"],
["Popular","Populares"],
["Recent","Recentes"],
["Handwriting","Manuscrita"],
["Cursive","Cursiva"],
["Calligraphy","Caligrafia"],
["Bold","Negrito"],
["Italic","Itálico"],
["Bold Italic","Negrito itálico"],
["Cute","Fofo"],
["Decorative","Decorativo"],
["All","Todos"],
["✨ All 3418","✨ Todos os 3418"],
["♡ Hearts","♡ Corações"],
["★ Stars","★ Estrelas"],
["→ Arrows","→ Setas"],
["❀ Flowers","❀ Flores"],
["✦ Separators","✦ Separadores"],
["⬙ Decorative","⬙ Decorativos"],
["📱 Social","📱 Redes sociais"],
["White","Branco"],
["Lined","Pautado"],
["Black","Preto"],
["Blue","Azul"],
["📄 HandwritingPDF","📄 PDF manuscrito"],
["🎨 Styled PDF","🎨 PDF estilizado"],
["📝 Editable DOCX","📝 DOCX editável"],
["⬇️ Create & Save PNG","⬇️ Criar e salvar PNG"],
["↗ Share","↗ Compartilhar"],
["⬇️ Save This Image","⬇️ Salvar esta imagem"],
["⬇️ Save Individually","⬇️ Salvar individualmente"],
["Close","Fechar"],
["FANCY TEXT GENERATOR","GERADOR DE LETRAS DIFERENTES"],
["316 styles • type text to preview","316 estilos • digite para visualizar"],
["✨ AESTHETIC DNA • RANDOM WITH STYLE","✨ ESTILO ESTÉTICO • COMBINAÇÕES CRIATIVAS"],
["Style","Estilo"],
["✨ Surprise Me","✨ Surpreenda-me"],
["Decoration Level","Nível de decoração"],
["Light","Leve"],
["✨ Random Style","✨ Estilo aleatório"],
["↻ Another Style","↻ Outro estilo"],
["↗ Use in…","↗ Usar em…"],
["✍ Text / Image","✍ Texto / Imagem"],
["📸 Instagram Bio","📸 Bio do Instagram"],
["🎮 Game Names","🎮 Nomes para jogos"],
["Text Styles • TAP TO COPY","Estilos de letras • TOQUE PARA COPIAR"],
["INSTAGRAM BIO • ADD ICONS & PREVIEW","BIO DO INSTAGRAM • ÍCONES E PRÉVIA"],
["🔤 Choose Style ▼","🔤 Escolher estilo ▼"],
["🎨 3418 SYMBOLS & ICONS ▼","🎨 3418 SÍMBOLOS E ÍCONES ▼"],
["↩ New Line","↩ Nova linha"],
["➕ Blank Line","➕ Linha em branco"],
["+ Add Icon...","+ Adicionar ícone..."],
["📸 Copy Instagram Bio","📸 Copiar bio do Instagram"],
["BIO TEXT STYLES • TAP TO COPY","ESTILOS PARA BIO • TOQUE PARA COPIAR"],
["Preview • Font Styles","Prévia • Estilos de letras"],
["ENTER YOUR NAME","DIGITE SEU NOME"],
["🎲 Random","🎲 Aleatório"],
["␣ Invisible Space","␣ Espaço invisível"],
["📜 Create Certificate","📜 Criar certificado"],
["🎨 CHOOSE A SYMBOL OR SPACE • TAP TO ADD","🎨 ESCOLHA UM SÍMBOLO OU ESPAÇO • TOQUE PARA ADICIONAR"],
["View Levenshtein Matrix","Ver matriz de Levenshtein"],
["Levenshtein Preview","Prévia de Levenshtein"],
["300 Styles • Sorted by Levenshtein","300 estilos • Ordenados por Levenshtein"],
["None","Nenhum"],
["Sans","Sem serifa"],
["Sans Bold","Sem serifa negrito"],
["Sans Italic","Sem serifa itálico"],
["Sans Bold Italic","Sem serifa negrito itálico"],
["Monospace","Monoespaçado"],
["Script","Manuscrita"],
["Bold Script","Manuscrita negrito"],
["Fraktur","Gótica"],
["Bold Fraktur","Gótica negrito"],
["Double Struck","Traço duplo"],
["Small Caps","Versalete"],
["Circled","Circulado"],
["Fullwidth","Largura total"],
["Squared","Quadrado"],
["Parenthesized","Entre parênteses"],
["Wiry","Fino"],
["Curly Small","Curvo pequeno"],
["Upside Down","De cabeça para baixo"],
["Old English","Inglês antigo"],
["Greek","Estilo grego"],
["Cyrillic","Estilo cirílico"],
["Cool","Diferente"],
["Magic","Mágico"],
["White Squared","Quadrado branco"],
["Reversed","Invertido"],
["Subscript","Subscrito"],
["Superscript","Sobrescrito"],
["Medieval","Medieval"],
["Typewriter Bold","Máquina de escrever"],
["Currency","Moeda"],
["Double Circled","Círculo duplo"],
["Mirror","Espelhado"]
];
var dict=new Map(list), placeholders=new Map([
["Type your text...","Digite seu texto..."],
["Type or paste your text here...","Digite ou cole seu texto aqui..."],
["e.g. Alex, fancy text, game name...","Ex.: Ana, letras bonitas, nome para jogos..."],
["Search","Buscar"]
]);
function translated(str){
 var trimmed=str.trim(), v=dict.get(trimmed);
 if(v===undefined){
  var match=trimmed.match(/^(\d+)\s+characters$/i);
  if(match) v=match[1]+" caracteres";
  else {
   match=trimmed.match(/^(\d+)\s+lines$/i);
   if(match) v=match[1]+" linhas";
  }
 }
 if(v===undefined&&trimmed.indexOf("+")!==-1&&trimmed.length<75){
  var a=trimmed.split("+");
  if(a.length===2&&dict.has(a[0])&&dict.has(a[1]))v=dict.get(a[0])+" + "+dict.get(a[1]);
 }
 if(v===undefined) return null;
 return str.replace(trimmed,v);
}
function localize(root){
 if(!root) return;
 if(root.nodeType===3){
  var p=root.parentElement;
  if(!p||p.closest("script,style,noscript,textarea,svg,code,pre"))return;
  var v=translated(root.nodeValue||"");
  if(v!==null&&v!==root.nodeValue)root.nodeValue=v;
  return;
 }
 if(root.nodeType!==1)return;
 if(root.matches("script,style,noscript,svg,code,pre"))return;
 if(root.hasAttribute("placeholder")){
  var ph=root.getAttribute("placeholder"),t=placeholders.get(ph);
  if(t&&ph!==t)root.setAttribute("placeholder",t);
 }
 if(root.hasAttribute("aria-label")){
  var label=root.getAttribute("aria-label"),tr=translated(label);
  if(tr!==null&&tr!==label)root.setAttribute("aria-label",tr);
 }
 var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 var n;
 while(n=w.nextNode()){
  var p=n.parentElement;
  if(!p||p.closest("script,style,noscript,textarea,svg,code,pre"))continue;
  var r=translated(n.nodeValue||"");
  if(r!==null&&r!==n.nodeValue)n.nodeValue=r;
 }
 var nodes=root.querySelectorAll("[placeholder],[aria-label]");
 for(var i=0;i<nodes.length;i++){
  var e=nodes[i],ph=e.getAttribute("placeholder"),ap=e.getAttribute("aria-label");
  if(ph&&placeholders.has(ph))e.setAttribute("placeholder",placeholders.get(ph));
  if(ap){var av=translated(ap);if(av!==null&&ap!==av)e.setAttribute("aria-label",av)}
 }
}
function start(){
 document.documentElement.lang="pt-BR";
 var root=document.getElementById("lf194-root");
 if(!root)return;
 localize(root);
 var pending=new Set(),queued=false;
 function flush(){
  queued=false;
  if(pending.size>250){pending.clear();localize(root);return}
  pending.forEach(function(n){if(n.isConnected)localize(n)});pending.clear();
 }
 new MutationObserver(function(records){
  for(var i=0;i<records.length;i++){
   var m=records[i];
   if(m.type==="characterData"){pending.add(m.target)}
   else for(var j=0;j<m.addedNodes.length;j++)pending.add(m.addedNodes[j]);
  }
  if(!queued){queued=true;requestAnimationFrame(flush)}
 }).observe(root,{subtree:true,childList:true,characterData:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();