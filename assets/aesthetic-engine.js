
(function(){
'use strict';
if(window.FSDAesthetic && window.FSDAesthetic.version)return;

const VERSION='2.5.1-rc12.1-identity-diversity-stable';
const $=id=>document.getElementById(id);
const root=$('lf194-root');
const input=$('quick-input');
const resultWrap=$('fsd-aesthetic-result');
if(!root||!input||!resultWrap){console.warn('[FSD Aesthetic] required UI not found');return;}

const fonts=Array.isArray(window.Fr)?window.Fr:[];
const symbolSource=Array.isArray(window.FSD_SYMBOLS_3418)?window.FSD_SYMBOLS_3418:[];
const bioCats=(typeof BIO_CATS!=='undefined'&&BIO_CATS&&typeof BIO_CATS==='object')?BIO_CATS:{};
if(!fonts.length){console.warn('[FSD Aesthetic] font engine unavailable');return;}

// ---------- Utilities -------------------------------------------------------
const arr=v=>Array.from(v||'');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const uniq=a=>Array.from(new Set(a));
const normalizeName=s=>(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const safeText=s=>String(s==null?'':s);
const rand=a=>a[Math.floor(Math.random()*a.length)];
const STORAGE_KEY='fsd-aesthetic-dna-prefs-v1';

function emit(name,detail){
  try{window.dispatchEvent(new CustomEvent('fsd:aesthetic',{detail:{event:name,...detail,version:VERSION}}));}catch(_){}
}
function fallbackCopyText(t){try{const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);const ok=document.execCommand('copy');ta.remove();return ok!==false;}catch(_){return false;}}
function selectResultText(){
  const out=$('fsd-aesthetic-output');if(!out)return false;
  try{
    const sel=window.getSelection&&window.getSelection();if(!sel)return false;
    const range=document.createRange();range.selectNodeContents(out);sel.removeAllRanges();sel.addRange(range);
    const main=$('fsd-result-click-copy');if(main){try{main.focus({preventScroll:true});}catch(_){try{main.focus();}catch(__){}}}
    return true;
  }catch(_){return false;}
}
async function copyText(t){
  let ok=false;
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(t);ok=true;}else ok=fallbackCopyText(t);}catch(_){ok=fallbackCopyText(t);}
  const main=$('fsd-result-click-copy');
  if(main){
    main.classList.remove('fsd-copy-flash');
    if(ok){void main.offsetWidth;main.classList.add('fsd-copy-flash');}
  }
  const btn=$('fsd-aesthetic-copy');
  if(btn){
    const old=btn.textContent;
    if(ok)btn.textContent='✓ Copiado';
    else{const selected=selectResultText();btn.textContent=selected?'Pressione Ctrl+C para copiar':'Não foi possível copiar';}
    setTimeout(()=>btn.textContent=old,ok?1100:1800);
  }
  if(ok)emit('copy',{vibe:state.current.vibeId,styleId:state.current.styleId,layout:state.current.layoutId,intensity:state.intensity});
  else emit('copy-failed',{vibe:state.current.vibeId,styleId:state.current.styleId,layout:state.current.layoutId,intensity:state.intensity});
  return ok;
}
function weightedPick(items,weightFn){
  if(!items||!items.length)return null;
  let total=0;const weighted=[];
  for(const item of items){const w=Math.max(0,Number(weightFn(item))||0);if(w>0){total+=w;weighted.push([item,w]);}}
  if(!weighted.length)return rand(items);
  let roll=Math.random()*total;
  for(const [item,w] of weighted){roll-=w;if(roll<=0)return item;}
  return weighted[weighted.length-1][0];
}
function tokenizeWords(s){return safeText(s).trim().split(/\s+/).filter(Boolean);}
function charLen(s){return arr(s).length;}
const unicodeLetterOrNumber=/[\p{L}\p{N}]/u;
const latinChar=/\p{Script=Latin}/u;
const cyrillicChar=/\p{Script=Cyrillic}/u;
const thaiChar=/\p{Script=Thai}/u;
const hanChar=/\p{Script=Han}/u;
const hiraChar=/\p{Script=Hiragana}/u;
const kataChar=/\p{Script=Katakana}/u;
function textProfile(text){
  const p={letters:0,latin:0,cyrillic:0,thai:0,cjk:0,other:0};
  for(const ch of arr(safeText(text))){
    if(!unicodeLetterOrNumber.test(ch))continue;
    p.letters++;
    if(latinChar.test(ch))p.latin++;
    else if(cyrillicChar.test(ch))p.cyrillic++;
    else if(thaiChar.test(ch))p.thai++;
    else if(hanChar.test(ch)||hiraChar.test(ch)||kataChar.test(ch))p.cjk++;
    else p.other++;
  }
  p.nonLatin=p.letters-p.latin;
  p.nonLatinRatio=p.letters?p.nonLatin/p.letters:0;
  return p;
}

// Code-point aware Levenshtein. Used ONLY for anti-repeat/novelty, never as a beauty objective.
function levenshtein(a,b){
  a=arr(a);b=arr(b);if(a.length>b.length)[a,b]=[b,a];
  let prev=Array.from({length:a.length+1},(_,i)=>i),cur=new Array(a.length+1);
  for(let j=1;j<=b.length;j++){
    cur[0]=j;
    for(let i=1;i<=a.length;i++)cur[i]=Math.min(cur[i-1]+1,prev[i]+1,prev[i-1]+(a[i-1]===b[j-1]?0:1));
    [prev,cur]=[cur,prev];
  }
  return prev[a.length];
}

// ---------- Font metadata ---------------------------------------------------
function inferFontMeta(font,index){
  const n=normalizeName(font.name);const tags=new Set(['unicode']);
  let readability=5,decorAffinity=3;
  const has=r=>r.test(n),add=(...xs)=>xs.forEach(x=>tags.add(x));
  if(has(/script/))add('script','elegant','romantic','soft');
  if(has(/fraktur|old english|medieval/))add('gothic','dark','classic','dramatic');
  if(has(/serif|italic/))add('elegant','classic');
  if(has(/sans/))add('modern','minimal','clean');
  if(has(/mono|typewriter/))add('monospace','minimal','cyber','retro');
  if(has(/fullwidth|wide/))add('wide','y2k','vaporwave','cyber');
  if(has(/circled|squared|bubble|parenthesized|cute|white squared|negative circled/)){add('playful','cute','kawaii','y2k');readability-=1;}
  if(has(/double struck/))add('luxury','academic','elegant');
  if(has(/bold/))add('bold','strong');
  if(has(/small caps/))add('compact','editorial','minimal');
  if(has(/superscript|subscript/)){add('compact','editorial');readability-=2;}
  if(has(/currency|cool|magic|wiry|curly/)){add('playful','experimental');readability-=1;}
  if(has(/greek|cyrillic/)){add('cross-script','experimental');readability-=2;}
  if(has(/upside|reversed|mirror/)){add('experimental','effect-heavy');readability-=2;}
  if(has(/underline/)){add('effect-heavy');readability-=1;decorAffinity-=1;}
  const plusCount=(font.name.match(/\+/g)||[]).length;
  if(plusCount>=1){add('hybrid');readability-=Math.min(2,plusCount);}
  if(has(/bold script/))add('coquette-friendly');
  if(has(/bold fraktur/))add('gamer-friendly');
  if(index<18)add('core');
  return {id:'style-'+index,index,name:font.name,tags,readability:clamp(readability,1,5),decorAffinity:clamp(decorAffinity,1,5),hybridDepth:plusCount,font};
}
const styleMeta=fonts.map(inferFontMeta);
const NATIVE_STYLE={id:'style-native',index:-1,name:'Texto original',tags:new Set(['native','clean','minimal']),readability:5,decorAffinity:5,hybridDepth:0,font:{fn:x=>x}};

// ---------- Symbol metadata -------------------------------------------------
const PAIRS=[
  ['꧁','꧂'],['༺','༻'],['『','』'],['「','」'],['【','】'],['〖','〗'],['〔','〕'],['《','》'],['〈','〉'],['⟦','⟧'],['⟨','⟩'],['❮','❯'],['❰','❱'],['❲','❳'],['𓆩','𓆪'],['꒰','꒱'],['⫷','⫸'],['（','）'],['(',')'],['[',']'],['{','}']
];
const OPEN_TO_CLOSE=new Map(PAIRS);const CLOSE_TO_OPEN=new Map(PAIRS.map(([a,b])=>[b,a]));
const TAG_SEEDS={
  romantic:['♡','♥','❤','❥','❣','💕','💞','💓','💗','💖','💘','💝','💟','💌'],
  coquette:['୨ৎ','🎀','♡','♥','𓆩','𓆪','˚','₊','‧','✧','✦','❀','✿'],
  cute:['♡','☆','✿','❀','🎀','🧸','🐰','🐇','🍓','🍒','🦋','🌸','☁','☁️','୨ৎ','꒰','꒱'],
  kawaii:['୨ৎ','♡','☆','✿','🎀','🧸','🐰','🍓','🌸','꒰','꒱','୨ৎ','♡','☆'],
  celestial:['☾','☽','☀','☼','✦','✧','★','☆','⋆','✨','⭐','🌟','💫','🌙','🌑','🌒','🌓','🌔','🌕','🌘'],
  nature:['✿','❀','❁','❃','❋','🌸','🌷','🌹','🌺','🌻','🌼','🌿','🍀','☘','🍃','🦋','🐚'],
  dark:['☠','☠️','⚰','⚰️','⚔','⚔️','🕯','🕯️','🖤','༒','†','‡','☾','♱'],
  gothic:['༒','†','‡','♱','☠','⚔','🖤','☾','✞','✟'],
  gamer:['亗','乂','ツ','ッ','乡','⚔','⚔️','🔥','⚡','👑','♛','✦','༒','࿐','×','メ','〆'],
  luxury:['♛','♕','👑','💎','✦','✧','◆','◇','❖','⚜','⚜️','𓆩','𓆪'],
  cyber:['⚡','⌁','⌬','⌘','⎔','⟟','⟡','◇','◈','▣','◉','⧉','⧖','⫷','⫸','💿','📀','✦'],
  y2k:['☆','★','✦','✧','♡','⚡','💿','📀','🪩','⊹','⋆','｡','･','ﾟ'],
  vaporwave:['☆','✦','✧','◇','◆','◈','▱','▰','░','▒','▓','⌁','⌬','･','｡','ﾟ'],
  minimal:['•','·','⋆','✦','✧','—','–','│','｜','∙','◦','○','◇','⌁'],
  dreamy:['🦋','☁','☁️','☾','✦','✧','⋆','✨','🌙','🌸','♡','💫','𓂃'],
  soft:['♡','✧','⋆','˚','₊','‧','🌸','🦋','☁','୨ৎ'],
  separator:['•','·','⋆','✦','✧','☆','★','♡','×','・','│','｜','—','~','⌁','❖']
};
const TAG_SETS=Object.fromEntries(Object.entries(TAG_SEEDS).map(([k,v])=>[k,new Set(v)]));
const CAT_SETS=Object.fromEntries(Object.entries(bioCats).filter(([k,v])=>k!=='all'&&Array.isArray(v)).map(([k,v])=>[k,new Set(v)]));
const CURATED_EXTRA=uniq(Object.values(TAG_SEEDS).flat().concat(PAIRS.flat()));
const allSymbols=uniq(symbolSource.concat(CURATED_EXTRA));

function inferSymbolMeta(symbol,index){
  const tags=new Set();const roles=new Set(['prefix','suffix']);
  for(const [tag,set] of Object.entries(TAG_SETS))if(set.has(symbol))tags.add(tag);
  for(const [cat,set] of Object.entries(CAT_SETS))if(set.has(symbol))tags.add('cat:'+cat);
  if(OPEN_TO_CLOSE.has(symbol)){roles.clear();roles.add('frame-open');tags.add('frame');}
  if(CLOSE_TO_OPEN.has(symbol)){roles.clear();roles.add('frame-close');tags.add('frame');}
  if(TAG_SETS.separator.has(symbol))roles.add('separator');
  try{if(/\p{Extended_Pictographic}/u.test(symbol))tags.add('emoji');}catch(_){}
  let intensity=2;
  if(tags.has('minimal')||['·','•','˚','₊','‧','⋆','✧'].includes(symbol))intensity=1;
  if(tags.has('dark')||tags.has('gamer'))intensity=4;
  if(['༒','☠','☠️','⚔','⚔️'].includes(symbol))intensity=5;
  if(!tags.size)tags.add('neutral');
  return {id:'sym-'+index,symbol,tags,roles,intensity,sourceIndex:index};
}
const symbolMeta=allSymbols.map(inferSymbolMeta);
const symbolIndex={};
for(const meta of symbolMeta){for(const tag of meta.tags){(symbolIndex[tag]||(symbolIndex[tag]=[])).push(meta);}}

// ---------- Vibe recipes ----------------------------------------------------
const VIBES={
  'coquette':{label:'Coquette',icon:'🎀',strict:true,style:{script:6,elegant:3,romantic:6,soft:5,'coquette-friendly':7},styleExact:{'Bold Script':1.20,'Script':1.15,'Bold Italic':1.0,'Italic':.95},patterns:[/^Bold Script$/i,/^Script$/i,/^Italic$/i,/^Bold Italic$/i],symbols:{coquette:12,romantic:3,soft:3,cute:1},forbid:['gamer','dark','gothic','cyber'],pairs:['𓆩','꒰','❰'],layouts:{plain:.5,prefix:2,suffix:1.5,symmetric:10,pair:4,layered:4},symmetry:.96,minRead:3},
  'soft-girl':{label:'Soft Girl',icon:'🌸',strict:true,style:{script:6,soft:7,elegant:3,romantic:2},styleExact:{'Script':1.20,'Bold Script':1.08,'Sans Italic':1.05,'Italic':1.0,'Bold Italic':.9},patterns:[/^Script$/i,/^Bold Script$/i,/^Italic$/i,/^Sans Italic$/i,/^Bold Italic$/i],symbols:{soft:11,cute:4,romantic:1,nature:6},forbid:['dark','gothic','gamer','cyber'],pairs:['꒰','𓆩','❰'],layouts:{plain:.5,prefix:2.5,suffix:3,symmetric:9,pair:2,layered:4},symmetry:.84,minRead:3},
  'kawaii':{label:'Kawaii',icon:'🧸',strict:true,style:{cute:8,kawaii:8,playful:6},styleExact:{'Cute':1.32,'Circled':1.16,'White Squared':1.10,'Negative Circled':1.02,'Squared':1.0,'Parenthesized':.94,'Double Circled':.94},patterns:[/^Cute$/i,/^Circled$/i,/^Squared$/i,/^Parenthesized$/i,/^Negative Circled$/i,/^White Squared$/i,/^Double Circled$/i],symbols:{kawaii:10,cute:8,soft:3},forbid:['dark','gothic','cyber'],pairs:['꒰','𓆩','❰'],layouts:{plain:.3,prefix:2,suffix:2,symmetric:9,pair:3,layered:5},symmetry:.86,minRead:2},
  'y2k':{label:'Y2K',icon:'💿',strict:true,style:{y2k:9,wide:7,modern:3,playful:4,cyber:3},styleExact:{'Fullwidth':1.16,'Squared':1.18,'Negative Circled':1.12,'Circled':1.08,'Monospace':.92,'Typewriter Bold':.9},patterns:[/^Fullwidth$/i,/^Monospace$/i,/^Circled$/i,/^Squared$/i,/^Negative Circled$/i,/^Typewriter Bold$/i],symbols:{y2k:10,cyber:3,minimal:1},forbid:['nature'],pairs:['『','【','⟦','⫷'],layouts:{plain:.5,prefix:1.5,suffix:1.5,symmetric:8,pair:3,layered:7},symmetry:.74,minRead:2},
  'vaporwave':{label:'Vaporwave',icon:'🌈',strict:true,style:{vaporwave:10,wide:9,monospace:4,cyber:4,retro:5},styleExact:{'Fullwidth':1.38,'Monospace':1.08,'Typewriter Bold':.9},patterns:[/^Fullwidth$/i,/^Monospace$/i,/^Typewriter Bold$/i],symbols:{vaporwave:10,y2k:4,cyber:3},forbid:['romantic','cute'],pairs:['『','【','⟦','⫷'],layouts:{plain:.7,prefix:1.5,suffix:1.5,symmetric:7,pair:3,layered:7},symmetry:.76,minRead:3},
  'dark-academia':{label:'Dark Academia',icon:'🌙',strict:true,style:{classic:7,gothic:3,elegant:7,academic:7,serif:7},styleExact:{'Italic':1.45,'Bold Italic':1.25,'Old English':1.12,'Medieval':1.08,'Small Caps':1.0,'Fraktur':.78,'Bold Fraktur':.62,'Double Struck':.68},patterns:[/^Italic$/i,/^Bold Italic$/i,/^Old English$/i,/^Medieval$/i,/^Small Caps$/i,/^Fraktur$/i,/^Bold Fraktur$/i,/^Double Struck$/i],symbols:{celestial:3,dark:1,minimal:7,luxury:2},forbid:['cute','kawaii','gamer','cyber'],pairs:['《','〈','「','『','❰'],layouts:{plain:3,prefix:3,suffix:2,symmetric:5,pair:4,layered:2},symmetry:.70,minRead:4},
  'gothic':{label:'Gothic',icon:'🖤',strict:true,style:{gothic:10,dark:9,dramatic:7,strong:4},styleExact:{'Bold Fraktur':1.35,'Fraktur':1.28,'Old English':1.05,'Medieval':.98},patterns:[/^Fraktur$/i,/^Bold Fraktur$/i,/^Old English$/i,/^Medieval$/i],symbols:{gothic:10,dark:9,celestial:1},forbid:['cute','kawaii','coquette','soft'],pairs:['꧁','༺','『','【','⫷'],layouts:{plain:.4,prefix:1.5,suffix:1.5,symmetric:8,pair:8,layered:6},symmetry:.92,minRead:2},
  'celestial':{label:'Celestial',icon:'✨',strict:true,style:{elegant:5,soft:4,script:5,minimal:2,classic:2},styleExact:{'Script':1.25,'Bold Script':1.12,'Italic':1.0,'Sans Italic':.9,'Double Struck':.72},patterns:[/^Script$/i,/^Bold Script$/i,/^Italic$/i,/^Double Struck$/i,/^Sans Italic$/i],symbols:{celestial:11,dreamy:4,minimal:2},forbid:['gamer','gothic','dark'],pairs:['𓆩','꒰','❰','〈'],layouts:{plain:.4,prefix:2,suffix:3,symmetric:9,pair:2,layered:7},symmetry:.92,minRead:3},
  'cottagecore':{label:'Cottagecore',icon:'🌿',strict:true,style:{soft:5,elegant:4,script:5,classic:2},styleExact:{'Script':1.22,'Italic':1.12,'Bold Script':1.02,'Sans Italic':.9},patterns:[/^Script$/i,/^Italic$/i,/^Bold Script$/i,/^Sans Italic$/i],symbols:{nature:12,soft:4,cute:1},forbid:['cyber','gamer','gothic','dark'],pairs:['꒰','𓆩','❰'],layouts:{plain:.5,prefix:2,suffix:3,symmetric:9,pair:2,layered:6},symmetry:.86,minRead:3},
  'romantic':{label:'Romantic',icon:'💕',strict:true,style:{romantic:10,script:8,elegant:6,soft:5},styleExact:{'Script':1.20,'Bold Script':1.16,'Italic':1.08,'Bold Italic':1.02},patterns:[/^Script$/i,/^Bold Script$/i,/^Italic$/i,/^Bold Italic$/i],symbols:{romantic:12,soft:3,coquette:1},forbid:['gamer','cyber','gothic','dark'],pairs:['❰','〈','《'],layouts:{plain:.4,prefix:2,suffix:2,symmetric:10,pair:3,layered:6},symmetry:.94,minRead:3},
  'minimal':{label:'Minimal',icon:'🤍',strict:true,style:{minimal:10,clean:9,modern:6,monospace:3,compact:3},styleExact:{'Sans':1.25,'Small Caps':1.18,'Sans Bold':1.1,'Sans Italic':1.05,'Monospace':1.0,'Sans Bold Italic':.9,'Typewriter Bold':.82},patterns:[/^Sans$/i,/^Sans Bold$/i,/^Sans Italic$/i,/^Sans Bold Italic$/i,/^Monospace$/i,/^Small Caps$/i,/^Typewriter Bold$/i],symbols:{minimal:12},forbid:['dark','gamer','cute','kawaii','coquette','romantic'],pairs:[],layouts:{plain:16,prefix:2,suffix:4,symmetric:.3,pair:0,layered:0},symmetry:.15,minRead:5},
  'luxury':{label:'Luxury',icon:'👑',strict:true,style:{luxury:10,elegant:9,classic:5,script:3,strong:2},styleExact:{'Double Struck':1.5,'Bold Italic':1.25,'Italic':1.15,'Script':.88,'Bold Script':.84},patterns:[/^Double Struck$/i,/^Bold Italic$/i,/^Italic$/i,/^Script$/i,/^Bold Script$/i],symbols:{luxury:12,minimal:2,celestial:1},forbid:['cute','kawaii','cyber','gothic','dark'],pairs:['《','〈','❰'],layouts:{plain:.7,prefix:1.5,suffix:1.5,symmetric:9,pair:5,layered:4},symmetry:.90,minRead:4},
  'gamer':{label:'Gamer',icon:'🎮',strict:true,style:{strong:9,'gamer-friendly':10,gothic:4,bold:7,cyber:4,experimental:2},styleExact:{'Bold Fraktur':1.15,'Sans Bold':1.28,'Bold':1.22,'Typewriter Bold':1.15,'Fraktur':.92,'Monospace':1.05,'Cool':.88,'Magic':.78},patterns:[/^Bold Fraktur$/i,/^Fraktur$/i,/^Sans Bold$/i,/^Monospace$/i,/^Cool$/i,/^Magic$/i,/^Bold$/i,/^Typewriter Bold$/i],symbols:{gamer:12,cyber:4,luxury:1},forbid:['coquette','soft','romantic','cute'],pairs:['꧁','༺','『','【','⫷'],layouts:{plain:.2,prefix:1.5,suffix:1.5,symmetric:7,pair:11,layered:8},symmetry:.94,minRead:2},
  'cyber':{label:'Cyber',icon:'⚡',strict:true,style:{cyber:10,monospace:8,modern:6,wide:4,strong:3},styleExact:{'Monospace':1.28,'Typewriter Bold':1.20,'Fullwidth':1.12,'Sans Bold':1.02,'Sans Bold Italic':.9},patterns:[/^Monospace$/i,/^Fullwidth$/i,/^Sans Bold$/i,/^Typewriter Bold$/i,/^Sans Bold Italic$/i],symbols:{cyber:12,y2k:3,minimal:2},forbid:['nature','coquette','romantic','cute'],pairs:['『','【','⟦','⟨','⫷'],layouts:{plain:.5,prefix:2,suffix:2,symmetric:7,pair:7,layered:7},symmetry:.78,minRead:3},
  'dreamy':{label:'Dreamy',icon:'🦋',strict:true,style:{soft:7,script:6,elegant:5},styleExact:{'Script':1.24,'Bold Script':1.10,'Italic':1.0,'Sans Italic':.92,'Double Struck':.62},patterns:[/^Script$/i,/^Bold Script$/i,/^Italic$/i,/^Double Struck$/i,/^Sans Italic$/i],symbols:{dreamy:14,celestial:3,soft:2,nature:1},forbid:['gamer','gothic','dark','cyber'],pairs:['꒰','𓆩','❰','〈'],layouts:{plain:.4,prefix:3,suffix:2,symmetric:9,pair:2,layered:7},symmetry:.90,minRead:3}
};
const VIBE_IDS=Object.keys(VIBES);
const SURPRISE_WEIGHTS={'coquette':1.1,'soft-girl':1.0,'kawaii':1.0,'y2k':1.0,'vaporwave':.75,'dark-academia':.8,'gothic':.85,'celestial':1.0,'cottagecore':.8,'romantic':.9,'minimal':1.05,'luxury':.95,'gamer':1.0,'cyber':.9,'dreamy':1.0};

const EXPLORE_CATS={
  'coquette':{heart:8,flower:4,star:2,decor:1,bio_color:1},
  'soft-girl':{flower:7,heart:6,emoji:2,star:2,bio_color:1},
  'kawaii':{smiley:7,emoji:6,animal:4,heart:3,star:3,bio_color:2},
  'y2k':{star:7,geometric:6,arrow:3,decor:2,math:1},
  'vaporwave':{geometric:8,math:5,decor:3,arrow:2,star:2},
  'dark-academia':{decor:5,geometric:4,star:2,math:1},
  'gothic':{decor:7,geometric:3,star:2,game_safe:1},
  'celestial':{star:10,geometric:3,decor:1},
  'cottagecore':{flower:10,animal:3,heart:2,emoji:1},
  'romantic':{heart:10,flower:3,star:1,bio_color:1},
  'minimal':{geometric:9,arrow:5,math:3,decor:1},
  'luxury':{geometric:6,star:4,decor:4,heart:1},
  'gamer':{game_safe:10,arrow:5,geometric:4,decor:3,star:2},
  'cyber':{geometric:9,math:7,arrow:6,decor:3,game_safe:1},
  'dreamy':{star:8,flower:4,heart:4,emoji:2,bio_color:1}
};
const PRIMARY_SYMBOLS={
  'coquette':['୨ৎ','🎀','♡','♥','✧','˚','₊','‧','꒰','꒱'],
  'soft-girl':['🌸','♡','✿','❀','☁','☁️','✧','˚','₊'],
  'kawaii':['🎀','🧸','🐰','🍓','🌸','♡','☆','✿','୨ৎ'],
  'y2k':['☆','★','✦','✧','♡','⚡','💿','📀','⊹','⋆'],
  'vaporwave':['☆','✦','✧','◇','◈','░','▒','▓','･','｡','ﾟ'],
  'dark-academia':['☾','🕯️','⋆','✧','⚜','◇','❦'],
  'gothic':['†','♱','༒','🖤','☾','⚔','✞','✟'],
  'celestial':['☾','☽','✦','✧','★','☆','⋆','✨','⭐','🌙','💫'],
  'cottagecore':['✿','❀','❁','🌸','🌷','🌿','🍀','☘','🍃','🦋'],
  'romantic':['♡','♥','❤','❥','💕','💞','💗','💖','💘','💌','🌹','❦','✧'],
  'minimal':['•','·','⋆','✧','—','│','∙','◦','○','◇'],
  'luxury':['♛','♕','👑','💎','⚜','✦','✧','◆','◇','❖'],
  'gamer':['亗','乂','ツ','乡','⚔','🔥','⚡','👑','♛','༒','࿐','〆'],
  'cyber':['⚡','⌁','⌬','⌘','⎔','⟡','◇','◈','▣','⧖','💿','📀','✦'],
  'dreamy':['🦋','☁','☁️','☾','✧','⋆','✨','🌙','💫','𓂃','⟡']
};


// ---------- Signature motif layer -----------------------------------------
// A vibe is NOT just a font category. Each motif is a curated composition DNA
// that gives the vibe a recognisable visual signature. Generic symbol random
// remains available as controlled exploration, but signature motifs dominate.
const LAYOUT_LABELS={plain:'Simples',prefix:'Decoração inicial',suffix:'Decoração final',symmetric:'Simétrico',pair:'Moldura dupla',layered:'Em camadas'};
const INTENSITY_LEVEL={light:1,medium:2,wild:3};
const SIGNATURE_MOTIFS={
  'coquette':[
    {id:'ribbon',layout:'symmetric',level:1,w:10,prefix:'୨ৎ ',suffix:' ୨ৎ',parts:['୨ৎ']},
    {id:'heart',layout:'symmetric',level:1,w:8,prefix:'♡ ',suffix:' ♡',parts:['♡']},
    {id:'bow',layout:'prefix',level:1,w:5,prefix:'🎀 ',suffix:'',parts:['🎀']},
    {id:'soft-frame',layout:'pair',level:2,w:8,prefix:'꒰ ♡ ',suffix:' ♡ ꒱',parts:['꒰','♡','꒱']},
    {id:'ribbon-sparkle',layout:'layered',level:2,w:11,prefix:'˚₊‧୨ৎ ',suffix:' ୨ৎ‧₊˚',parts:['˚','₊','‧','୨ৎ']},
    {id:'winged-heart',layout:'layered',level:3,w:7,prefix:'𓆩♡𓆪 ',suffix:' 𓆩♡𓆪',parts:['𓆩','♡','𓆪']},
    {id:'bow-ribbon',layout:'layered',level:3,w:9,prefix:'🎀 ୨ৎ ',suffix:' ୨ৎ 🎀',parts:['🎀','୨ৎ']}
  ],
  'soft-girl':[
    {id:'blossom',layout:'symmetric',level:1,w:10,prefix:'✿ ',suffix:' ✿',parts:['✿']},
    {id:'soft-heart',layout:'suffix',level:1,w:6,prefix:'',suffix:' ♡',parts:['♡']},
    {id:'spring',layout:'symmetric',level:2,w:8,prefix:'🌸 ',suffix:' 🌸',parts:['🌸']},
    {id:'soft-spark',layout:'layered',level:2,w:10,prefix:'˚₊‧ ',suffix:' ‧₊˚',parts:['˚','₊','‧']},
    {id:'butterfly-soft',layout:'layered',level:3,w:6,prefix:'🦋 ✧ ',suffix:' ✧ 🦋',parts:['🦋','✧']},
    {id:'cloud-heart',layout:'layered',level:2,w:8,prefix:'☁︎ ♡ ',suffix:' ♡ ☁︎',parts:['☁︎','♡']}
  ],
  'kawaii':[
    {id:'kawaii-star',layout:'symmetric',level:1,w:8,prefix:'☆ ',suffix:' ☆',parts:['☆']},
    {id:'kawaii-heart',layout:'symmetric',level:1,w:7,prefix:'♡ ',suffix:' ♡',parts:['♡']},
    {id:'kawaii-cage',layout:'pair',level:2,w:10,prefix:'꒰ ♡ ',suffix:' ♡ ꒱',parts:['꒰','♡','꒱']},
    {id:'teddy',layout:'symmetric',level:2,w:6,prefix:'🧸 ',suffix:' 🧸',parts:['🧸']},
    {id:'strawberry',layout:'layered',level:3,w:6,prefix:'🍓 ୨ৎ ',suffix:' ୨ৎ 🍓',parts:['🍓','୨ৎ']},
    {id:'kawaii-face',layout:'layered',level:3,w:9,prefix:'૮₍ ˶ᵔ ᵕ ᵔ˶ ₎ა ',suffix:' ♡',parts:['♡']}
  ],
  'y2k':[
    {id:'y2k-star',layout:'symmetric',level:1,w:9,prefix:'✦ ',suffix:' ✦',parts:['✦']},
    {id:'disc',layout:'symmetric',level:1,w:7,prefix:'💿 ',suffix:' 💿',parts:['💿']},
    {id:'star-flick',layout:'pair',level:2,w:10,prefix:'★彡 ',suffix:' 彡★',parts:['★','彡']},
    {id:'retro-spark',layout:'layered',level:2,w:8,prefix:'｡･:* ',suffix:' *:･｡',parts:['｡','･','*',':']},
    {id:'y2k-electric',layout:'layered',level:3,w:8,prefix:'⚡ ✦ ',suffix:' ✦ ⚡',parts:['⚡','✦']},
    {id:'chrome-orbit',layout:'layered',level:3,w:9,prefix:'⊹₊⟡⋆ ',suffix:' ⋆⟡₊⊹',parts:['⊹','⟡','⋆']}
  ],
  'vaporwave':[
    {id:'wave-min',layout:'symmetric',level:1,w:7,prefix:'◇ ',suffix:' ◇',parts:['◇']},
    {id:'wave-box',layout:'pair',level:1,w:8,prefix:'【 ',suffix:' 】',parts:['【','】']},
    {id:'shade',layout:'layered',level:2,w:12,prefix:'░▒▓ ',suffix:' ▓▒░',parts:['░','▒','▓']},
    {id:'wave-grid',layout:'pair',level:2,w:8,prefix:'⟦ ',suffix:' ⟧',parts:['⟦','⟧']},
    {id:'wave-heavy',layout:'layered',level:3,w:7,prefix:'✧ ░▒ ',suffix:' ▒░ ✧',parts:['✧','░','▒']}
  ],
  'dark-academia':[
    {id:'academic-moon',layout:'prefix',level:1,w:6,prefix:'☾ ',suffix:'',parts:['☾']},
    {id:'academic-flourish',layout:'symmetric',level:1,w:9,prefix:'❦ ',suffix:' ❦',parts:['❦']},
    {id:'academic-frame',layout:'pair',level:2,w:10,prefix:'〈 ',suffix:' 〉',parts:['〈','〉']},
    {id:'candle',layout:'symmetric',level:2,w:8,prefix:'🕯️ ',suffix:' 🕯️',parts:['🕯️']},
    {id:'moon-star',layout:'layered',level:3,w:7,prefix:'☾ ✦ ',suffix:' ✦ ☽',parts:['☾','✦','☽']},
    {id:'old-library',layout:'layered',level:3,w:9,prefix:'❦ ☾ ',suffix:' ☽ ❦',parts:['❦','☾','☽']}
  ],
  'gothic':[
    {id:'cross',layout:'symmetric',level:1,w:8,prefix:'† ',suffix:' †',parts:['†']},
    {id:'black-heart',layout:'symmetric',level:1,w:5,prefix:'🖤 ',suffix:' 🖤',parts:['🖤']},
    {id:'gothic-frame',layout:'pair',level:2,w:10,prefix:'『 ',suffix:' 』',parts:['『','』']},
    {id:'gothic-mark',layout:'symmetric',level:2,w:10,prefix:'༒ ',suffix:' ༒',parts:['༒']},
    {id:'gothic-heavy',layout:'layered',level:3,w:8,prefix:'† ♱ ',suffix:' ♱ †',parts:['†','♱']},
    {id:'cathedral-cross',layout:'pair',level:3,w:9,prefix:'† 『',suffix:'』 †',parts:['†','『','』']}
  ],
  'celestial':[
    {id:'star',layout:'symmetric',level:1,w:8,prefix:'✦ ',suffix:' ✦',parts:['✦']},
    {id:'moon',layout:'suffix',level:1,w:5,prefix:'',suffix:' 🌙',parts:['🌙']},
    {id:'moon-stars',layout:'layered',level:2,w:12,prefix:'☾⋆ ',suffix:' ⋆☽',parts:['☾','⋆','☽']},
    {id:'celestial-frame',layout:'layered',level:3,w:9,prefix:'⋆｡°✩ ',suffix:' ✩°｡⋆',parts:['⋆','｡','°','✩']},
    {id:'lunar-orbit',layout:'layered',level:2,w:10,prefix:'☾ ⋆｡ ',suffix:' ｡⋆ ☽',parts:['☾','⋆','☽']},
    {id:'sparkle',layout:'symmetric',level:2,w:7,prefix:'✨ ',suffix:' ✨',parts:['✨']}
  ],
  'cottagecore':[
    {id:'flower',layout:'symmetric',level:1,w:10,prefix:'❀ ',suffix:' ❀',parts:['❀']},
    {id:'leaf',layout:'symmetric',level:1,w:8,prefix:'🌿 ',suffix:' 🌿',parts:['🌿']},
    {id:'garden',layout:'layered',level:2,w:10,prefix:'✿ 🌿 ',suffix:' 🌿 ✿',parts:['✿','🌿']},
    {id:'butterfly-garden',layout:'layered',level:3,w:7,prefix:'🦋 ❀ ',suffix:' ❀ 🦋',parts:['🦋','❀']},
    {id:'meadow',layout:'layered',level:3,w:9,prefix:'❀ 𓆸 ',suffix:' 𓆸 ❀',parts:['❀','𓆸']},
    {id:'sprig',layout:'suffix',level:1,w:5,prefix:'',suffix:' 🍃',parts:['🍃']}
  ],
  'romantic':[
    {id:'love-heart',layout:'symmetric',level:1,w:12,prefix:'♡ ',suffix:' ♡',parts:['♡']},
    {id:'love-arrow',layout:'symmetric',level:1,w:7,prefix:'❥ ',suffix:' ❥',parts:['❥']},
    {id:'love-ribbon',layout:'symmetric',level:2,w:9,prefix:'♡⋆ ',suffix:' ⋆♡',parts:['♡','⋆']},
    {id:'love-layer',layout:'layered',level:2,w:10,prefix:'♡ ˚₊ ',suffix:' ₊˚ ♡',parts:['♡','˚','₊']},
    {id:'love-heavy',layout:'layered',level:3,w:7,prefix:'💕 ✧ ',suffix:' ✧ 💕',parts:['💕','✧']},
    {id:'heart-ribbon',layout:'layered',level:3,w:9,prefix:'❥ ♡ ',suffix:' ♡ ❥',parts:['❥','♡']},
    {id:'rose-kiss',layout:'symmetric',level:3,w:7,prefix:'🌹 ',suffix:' 🌹',parts:['🌹']}
  ],
  'minimal':[
    {id:'min-plain',layout:'plain',level:1,w:14,prefix:'',suffix:'',parts:[]},
    {id:'min-dot',layout:'suffix',level:1,w:8,prefix:'',suffix:' ·',parts:['·']},
    {id:'min-dash',layout:'prefix',level:1,w:7,prefix:'— ',suffix:'',parts:['—']},
    {id:'min-spark',layout:'suffix',level:2,w:5,prefix:'',suffix:' ✦',parts:['✦']},
    {id:'min-frame',layout:'pair',level:2,w:3,prefix:'〈 ',suffix:' 〉',parts:['〈','〉']}
  ],
  'luxury':[
    {id:'crown',layout:'symmetric',level:1,w:9,prefix:'♛ ',suffix:' ♛',parts:['♛']},
    {id:'fleur',layout:'symmetric',level:1,w:10,prefix:'⚜ ',suffix:' ⚜',parts:['⚜']},
    {id:'diamond',layout:'symmetric',level:2,w:8,prefix:'◆ ',suffix:' ◆',parts:['◆']},
    {id:'lux-frame',layout:'pair',level:2,w:9,prefix:'《 ',suffix:' 》',parts:['《','》']},
    {id:'royal',layout:'layered',level:3,w:8,prefix:'♛ ✦ ',suffix:' ✦ ♛',parts:['♛','✦']},
    {id:'royal-diamond',layout:'layered',level:3,w:9,prefix:'♛ ◆ ',suffix:' ◆ ♛',parts:['♛','◆']}
  ],
  'gamer':[
    {id:'gamer-mark',layout:'symmetric',level:1,w:8,prefix:'亗 ',suffix:' 亗',parts:['亗']},
    {id:'gamer-cross',layout:'symmetric',level:1,w:7,prefix:'乂 ',suffix:' 乂',parts:['乂']},
    {id:'gamer-box',layout:'pair',level:2,w:9,prefix:'『',suffix:'』',parts:['『','』']},
    {id:'gamer-fire',layout:'layered',level:2,w:8,prefix:'⚡ ',suffix:' ⚡',parts:['⚡']},
    {id:'gamer-royal',layout:'layered',level:3,w:12,prefix:'꧁༒ ',suffix:' ༒꧂',parts:['꧁','༒','꧂']},
    {id:'gamer-boss',layout:'pair',level:3,w:10,prefix:'꧁亗 ',suffix:' 亗꧂',parts:['꧁','亗','꧂']}
  ],
  'cyber':[
    {id:'cyber-pulse',layout:'symmetric',level:1,w:7,prefix:'⌁ ',suffix:' ⌁',parts:['⌁']},
    {id:'cyber-frame',layout:'pair',level:1,w:9,prefix:'⫷ ',suffix:' ⫸',parts:['⫷','⫸']},
    {id:'cyber-box',layout:'pair',level:2,w:8,prefix:'【 ',suffix:' 】',parts:['【','】']},
    {id:'cyber-slash',layout:'layered',level:2,w:10,prefix:'⚡ // ',suffix:' // ⚡',parts:['⚡','/']},
    {id:'cyber-grid',layout:'layered',level:3,w:8,prefix:'◈ ⌬ ',suffix:' ⌬ ◈',parts:['◈','⌬']},
    {id:'cyber-terminal',layout:'pair',level:3,w:9,prefix:'[// ',suffix:' //]',parts:['[',']']}
  ],
  'dreamy':[
    {id:'dream-butterfly',layout:'prefix',level:1,w:11,prefix:'🦋 ',suffix:'',parts:['🦋']},
    {id:'dream-star',layout:'symmetric',level:1,w:4,prefix:'✧ ',suffix:' ✧',parts:['✧']},
    {id:'dream-cloud',layout:'layered',level:2,w:13,prefix:'☁︎⋆ ',suffix:' ⋆☁︎',parts:['☁︎','⋆']},
    {id:'dream-celestial',layout:'layered',level:2,w:7,prefix:'☾ 𓂃 ',suffix:' 𓂃 ☽',parts:['☾','𓂃','☽']},
    {id:'dream-frame',layout:'layered',level:3,w:9,prefix:'⋆｡°✩ ',suffix:' ✩°｡⋆',parts:['⋆','｡','°','✩']},
    {id:'dream-stardust',layout:'layered',level:3,w:11,prefix:'⋆˙⟡ ',suffix:' ⟡˙⋆',parts:['⋆','⟡']}
  ]
};
const LOOK_NAMES={
  'ribbon':'Ribbon Kiss','heart':'Sweet Heart','bow':'Bow Accent','soft-frame':'Lace Heart','ribbon-sparkle':'Coquette Glow','winged-heart':'Angel Ribbon',
  'blossom':'Soft Bloom','soft-heart':'Blush Heart','spring':'Pink Spring','soft-spark':'Pastel Glow','butterfly-soft':'Butterfly Blush',
  'kawaii-star':'Kawaii Star','kawaii-heart':'Mochi Heart','kawaii-cage':'Candy Frame','teddy':'Teddy Pop','strawberry':'Ichigo Pop',
  'y2k-star':'Chrome Star','disc':'Disc Pop','star-flick':'Star Flick','retro-spark':'Pixel Spark','y2k-electric':'Electric Y2K',
  'wave-min':'Neon Diamond','wave-box':'Tokyo Frame','shade':'Retro Scanline','wave-grid':'Vapor Grid','wave-heavy':'Neon Haze',
  'academic-moon':'Moonnote','academic-flourish':'Victorian Flourish','academic-frame':'Library Frame','candle':'Candlelight','moon-star':'Midnight Study',
  'cross':'Black Cross','black-heart':'Noir Heart','gothic-frame':'Cathedral Frame','gothic-mark':'Dark Sigil','gothic-heavy':'Midnight Cross',
  'star':'Starlight','moon':'Moon Kiss','moon-stars':'Lunar Orbit','celestial-frame':'Cosmic Halo','sparkle':'Star Glow',
  'flower':'Wildflower','leaf':'Forest Sprig','garden':'Garden Frame','butterfly-garden':'Butterfly Meadow','sprig':'Green Sprig',
  'love-heart':'Pure Heart','love-arrow':'Love Arrow','love-ribbon':'Love Note','love-layer':'Rosy Glow','love-heavy':'Love Spark',
  'min-plain':'Pure','min-dot':'Dot','min-dash':'Dash','min-spark':'One Spark','min-frame':'Quiet Frame',
  'crown':'Royal Crown','fleur':'Fleur de Lis','diamond':'Black Diamond','lux-frame':'Royal Frame','royal':'Crown Glow',
  'gamer-mark':'Pro Mark','gamer-cross':'Cross Edge','gamer-box':'Clan Frame','gamer-fire':'Volt','gamer-royal':'Boss Frame',
  'cyber-pulse':'Pulse','cyber-frame':'Matrix Gate','cyber-box':'Neon Box','cyber-slash':'Voltage Slash','cyber-grid':'Grid Core',
  'dream-butterfly':'Butterfly Dream','dream-star':'Dream Star','dream-cloud':'Cloud Drift','dream-celestial':'Moon Dream','dream-frame':'Cosmic Dream','dream-stardust':'Stardust',
  'bow-ribbon':'Ribbon Bow','cloud-heart':'Cloud Heart','kawaii-face':'Kawaii Face','chrome-orbit':'Chrome Orbit','old-library':'Old Library','cathedral-cross':'Cathedral Cross','lunar-orbit':'Lunar Orbit','meadow':'Meadow','heart-ribbon':'Heart Serenade','rose-kiss':'Rose Kiss','royal-diamond':'Royal Diamond','gamer-boss':'Boss Mark','cyber-terminal':'Terminal Frame'
};
const MOTIF_CHANCE={'coquette':.92,'soft-girl':.88,'kawaii':.90,'y2k':.86,'vaporwave':.90,'dark-academia':.88,'gothic':.90,'celestial':.92,'cottagecore':.90,'romantic':.92,'minimal':.82,'luxury':.90,'gamer':.92,'cyber':.90,'dreamy':.92};

const INTENSITY={
  light:{label:'Light',maxIntensity:2,maxDecor:1,layerChance:.05,frameChance:.15},
  medium:{label:'標準',maxIntensity:4,maxDecor:2,layerChance:.30,frameChance:.45},
  wild:{label:'Bold',maxIntensity:5,maxDecor:4,layerChance:.65,frameChance:.72}
};

let inputDebounce=null;
const state={
  selectedVibe:'surprise',intensity:'medium',
  locks:{style:false,decoration:false,layout:false},
  current:{vibeId:null,styleId:null,layoutId:null,decoration:null,output:'',signature:'',rawText:''},
  recentSignatures:[],recentOutputs:[],recentStyleIds:[]
};

function loadPrefs(){try{const p=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(p.vibe&&(p.vibe==='surprise'||VIBES[p.vibe]))state.selectedVibe=p.vibe;if(INTENSITY[p.intensity])state.intensity=p.intensity;}catch(_){}}
function savePrefs(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({vibe:state.selectedVibe,intensity:state.intensity}));}catch(_){}}

function hasForbidden(meta,vibe){
  for(const f of vibe.forbid||[])if(meta.tags&&meta.tags.has(f))return true;
  return false;
}
function matchesVibePattern(meta,vibe){
  if(meta.id==='style-native'||!(vibe.patterns||[]).length)return true;
  return vibe.patterns.some(r=>r.test(meta.name));
}
function styleAffinity(meta,vibe){
  if(meta.id==='style-native')return 1;
  if(hasForbidden(meta,vibe))return 0;
  let score=1;
  for(const tag of meta.tags)score+=vibe.style[tag]||0;
  const patternHit=matchesVibePattern(meta,vibe);
  if(patternHit)score+=12;else if((vibe.patterns||[]).length)score*=state.intensity==='wild'?.72:.52;
  // RC11 aesthetic curation: exact style weights let visually adjacent vibes diverge
  // without cloning the font engine or changing its transforms.
  if(vibe.styleExact&&Object.prototype.hasOwnProperty.call(vibe.styleExact,meta.name))score*=vibe.styleExact[meta.name];
  if(meta.tags.has('effect-heavy'))score*=.28;
  if(meta.hybridDepth){const hf=state.intensity==='light'?.04:state.intensity==='wild'?.48:.12;score*=Math.pow(hf,Math.min(2,meta.hybridDepth));}
  score*=.72+(meta.readability*.10);
  return score;
}
function transformCharUnicodeSafe(ch,meta){
  if(meta.id==='style-native')return ch;
  let direct=ch;
  try{direct=meta.font.fn(ch);}catch(_){}
  if(direct!==ch)return direct;
  // Most Mathematical Alphanumeric styles have no precomposed accented variants.
  // Decompose Latin letters (NFD), transform the base letter, then reattach combining marks.
  // Example: ễ -> e + ◌̂ + ◌̃ -> 𝓮 + ◌̂ + ◌̃. This preserves Vietnamese/French/Turkish text.
  if(latinChar.test(ch)){
    const nfd=ch.normalize('NFD'),parts=arr(nfd);
    if(parts.length>1){
      const base=parts.shift(),marks=parts.join('');let tb=base;
      try{tb=meta.font.fn(base);}catch(_){}
      if(tb!==base)return tb+marks;
    }
  }
  return ch;
}
function transformTextUnicodeSafe(text,meta){
  if(meta.id==='style-native')return safeText(text);
  return arr(safeText(text)).map(ch=>transformCharUnicodeSafe(ch,meta)).join('');
}
function compatibilityProbe(text,maxEligible=384){
  const chars=arr(safeText(text));
  // Short/normal inputs use the exact original text. Long inputs are sampled
  // evenly ONCE, rather than making all 300 style checks rescan thousands of chars.
  if(chars.length<=800)return safeText(text);
  const eligible=chars.filter(ch=>unicodeLetterOrNumber.test(ch));
  if(eligible.length<=maxEligible)return eligible.join('');
  const picked=[];
  const step=(eligible.length-1)/(maxEligible-1);
  for(let i=0;i<maxEligible;i++)picked.push(eligible[Math.round(i*step)]);
  return picked.join('');
}
function styleCompatibility(text,meta){
  if(meta.id==='style-native')return 1;
  let eligible=0,converted=0;
  for(const ch of arr(safeText(text))){
    if(!unicodeLetterOrNumber.test(ch))continue;
    eligible++;
    try{if(transformCharUnicodeSafe(ch,meta)!==ch)converted++;}catch(_){}
  }
  return eligible?converted/eligible:1;
}
function chooseVibe(){
  if(state.selectedVibe!=='surprise')return state.selectedVibe;
  return weightedPick(VIBE_IDS,id=>SURPRISE_WEIGHTS[id]||1);
}
const PURE_STYLE_VIBES=new Set(['coquette','soft-girl','kawaii','dark-academia','gothic','celestial','cottagecore','romantic','minimal','luxury','dreamy']);
function prepareGeneration(text,vibeId){
  const vibe=VIBES[vibeId],profile=textProfile(text),wordCount=tokenizeWords(text).length,compactMode=charLen(text)>44||wordCount>6,longMode=charLen(text)>70||wordCount>9;
  const probe=compatibilityProbe(text),compat=new Map();let maxCompat=0;
  for(const m of styleMeta){
    const c=styleCompatibility(probe,m);compat.set(m.id,c);
    if(!hasForbidden(m,vibe))maxCompat=Math.max(maxCompat,c);
  }
  // For Thai/CJK/Cyrillic or other scripts where our mathematical alphabets do not transform the text,
  // preserve the native script and let Aesthetic DNA work as a composition/decor engine instead of faking coverage.
  const nativeFallback=profile.nonLatinRatio>.55&&maxCompat<.25;
  let pool=nativeFallback?[NATIVE_STYLE]:styleMeta.filter(m=>
    !hasForbidden(m,vibe) &&
    (!vibe.strict||matchesVibePattern(m,vibe)) &&
    (!PURE_STYLE_VIBES.has(vibeId)||m.hybridDepth===0) &&
    m.hybridDepth<=1 &&
    m.readability>=(longMode?4:vibe.minRead)
  );
  if(!pool.length)pool=[NATIVE_STYLE];
  const weighted=pool.map(m=>{
    const c=m.id==='style-native'?1:(compat.get(m.id)||0);
    let w=styleAffinity(m,vibe)*(0.20+c*1.15);
    if(m.id!=='style-native'&&c<.35)w*=.05;
    if(state.current.styleId===m.id)w*=.25;
    if(!state.locks.style&&state.recentStyleIds&&state.recentStyleIds.length){
      const rev=state.recentStyleIds.slice().reverse(),pos=rev.indexOf(m.id);
      if(pos===0)w*=.18;else if(pos===1)w*=.42;else if(pos===2)w*=.66;else if(pos>=0)w*=.84;
    }
    return {m,c,w};
  }).filter(x=>x.w>0);
  return {vibe,profile,compactMode,longMode,compat,maxCompat,nativeFallback,weighted};
}
function chooseStyle(ctx){
  if(state.locks.style&&state.current.styleId){
    if(state.current.styleId==='style-native')return NATIVE_STYLE;
    const locked=styleMeta.find(x=>x.id===state.current.styleId);
    if(locked&&!hasForbidden(locked,ctx.vibe))return locked;
  }
  return weightedPick(ctx.weighted,x=>x.w)?.m||NATIVE_STYLE;
}
function symbolCandidates(vibeId,maxIntensity){
  const vibe=VIBES[vibeId];const map=new Map();
  for(const [tag,tagWeight] of Object.entries(vibe.symbols)){
    for(const s of symbolIndex[tag]||[]){
      if(s.intensity>maxIntensity)continue;
      let forbidden=false;for(const ft of vibe.forbid||[])if(s.tags.has(ft)){forbidden=true;break;}
      if(forbidden)continue;
      const old=map.get(s.symbol)||{meta:s,w:0};old.w+=tagWeight;map.set(s.symbol,old);
    }
  }
  return Array.from(map.values());
}
function safeTaxonomyMeta(meta){
  if(!meta||!meta.symbol)return false;
  const sym=meta.symbol, cps=arr(sym);
  if(cps.length>5)return false;
  if(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/u.test(sym))return false;
  try{
    if(/^\p{M}+$/u.test(sym))return false;
    if(/^\p{L}+$/u.test(sym)||/^\p{N}+$/u.test(sym))return false;
    if(/[\p{Cc}\p{Cs}]/u.test(sym))return false;
  }catch(_){}
  return true;
}
function pickTaxonomySymbol(vibeId,maxIntensity){
  const vibe=VIBES[vibeId], spec=EXPLORE_CATS[vibeId]||{};
  const cats=Object.keys(spec).filter(cat=>CAT_SETS[cat]&&CAT_SETS[cat].size);
  if(!cats.length)return null;
  // Pick the semantic category FIRST so a huge category (e.g. decor) cannot win merely by size.
  for(let attempt=0;attempt<5;attempt++){
    const cat=weightedPick(cats,c=>spec[c]||1);
    const pool=[];
    for(const sym of CAT_SETS[cat]||[]){
      const meta=symbolMeta.find(x=>x.symbol===sym);
      if(!meta||meta.intensity>maxIntensity||!safeTaxonomyMeta(meta))continue;
      let bad=false;for(const ft of vibe.forbid||[])if(meta.tags.has(ft)){bad=true;break;}
      if(!bad)pool.push(meta);
    }
    if(pool.length)return weightedPick(pool,m=>1+(6-m.intensity)*.12);
  }
  return null;
}
function pickSymbol(vibeId,maxIntensity,role){
  const valid=x=>{const isFrame=x.meta.roles.has('frame-open')||x.meta.roles.has('frame-close');if(isFrame)return false;return x.meta.intensity<=maxIntensity&&(!role||x.meta.roles.has(role)||(['prefix','suffix'].includes(role)));};
  // Default stays polished. The full 3418 taxonomy is explored progressively: Light 0%, Medium 6%, Wild 22%.
  const exploreChance=state.intensity==='wild'?.18:state.intensity==='medium'?.02:0;
  if(Math.random()>=exploreChance){
    const primary=(PRIMARY_SYMBOLS[vibeId]||[]).map(sym=>{const m=symbolMeta.find(x=>x.symbol===sym);return m?{meta:m,w:10}:null;}).filter(Boolean).filter(valid);
    if(primary.length)return weightedPick(primary,x=>x.w*(1+(6-x.meta.intensity)*.05));
  }else{
    const tax=pickTaxonomySymbol(vibeId,maxIntensity);
    if(tax)return {meta:tax,w:1,taxonomy:true};
  }
  const candidates=symbolCandidates(vibeId,maxIntensity).filter(x=>valid(x));
  return weightedPick(candidates,x=>x.w*(1+(6-x.meta.intensity)*.05));
}
function pickPair(vibeId,maxIntensity){
  const vibe=VIBES[vibeId];
  const allowed=(vibe.pairs||[]);
  const candidates=PAIRS.filter(([open])=>!allowed.length||allowed.includes(open)).map(([open,close])=>{
    const om=symbolMeta.find(s=>s.symbol===open),cm=symbolMeta.find(s=>s.symbol===close);
    let w=1;
    for(const tag of (om?om.tags:[]))w+=vibe.symbols[tag]||0;
    if(['꧁','꧂'].includes(open)||['꧁','꧂'].includes(close))w+=vibeId==='gamer'?7:vibeId==='luxury'?2:0;
    if(['𓆩','𓆪'].includes(open)||['𓆩','𓆪'].includes(close))w+=['coquette','romantic','luxury'].includes(vibeId)?6:0;
    return {open,close,w,intensity:Math.max(om?.intensity||2,cm?.intensity||2)};
  }).filter(p=>p.intensity<=maxIntensity);
  return weightedPick(candidates,p=>p.w);
}
function chooseLayout(text,vibeId,ctx){
  // Decoration and layout form one visual unit. Locking decoration implicitly preserves its layout.
  if((state.locks.layout||state.locks.decoration)&&state.current.layoutId)return state.current.layoutId;
  const vibe=VIBES[vibeId],cfg=INTENSITY[state.intensity];
  const longMode=ctx?ctx.longMode:(charLen(text)>70||tokenizeWords(text).length>9);
  if(charLen(text)>160)return 'plain';
  const weights={...vibe.layouts};
  if(longMode){weights.plain=(weights.plain||0)+10;weights.prefix=(weights.prefix||0)+3;weights.suffix=(weights.suffix||0)+3;weights.symmetric=.2;weights.pair=.05;weights.layered=0;}
  if(state.intensity==='light'){weights.plain=(weights.plain||0)*2.2;weights.layered=(weights.layered||0)*.1;weights.pair=(weights.pair||0)*.4;}
  if(state.intensity==='wild'){weights.layered=(weights.layered||0)*1.8;weights.pair=(weights.pair||0)*1.35;}
  // Prefer layouts that have a named signature motif at the current intensity.
  const level=INTENSITY_LEVEL[state.intensity]||2;
  const motifLayouts=new Set((SIGNATURE_MOTIFS[vibeId]||[]).filter(m=>m.level<=level).map(m=>m.layout));
  const signatureBias=state.intensity==='medium'?4.0:state.intensity==='wild'?3.1:2.7;
  const nonSignatureFactor=state.intensity==='medium'?.38:state.intensity==='wild'?.58:.62;
  for(const id of Object.keys(weights)){
    if(motifLayouts.has(id))weights[id]=(weights[id]||0)*signatureBias;
    else weights[id]=(weights[id]||0)*nonSignatureFactor;
  }
  // Mid-length phrases need room to breathe. Keep the DNA, but stop decorative frames
  // from swallowing a 45–70 character sentence or profile line.
  if(ctx&&ctx.compactMode&&!ctx.longMode){
    weights.plain=(weights.plain||0)*3.4;
    weights.prefix=(weights.prefix||0)*1.35;
    weights.suffix=(weights.suffix||0)*1.35;
    weights.symmetric=(weights.symmetric||0)*.62;
    // Frames/layers look excellent on names, but become visual noise on profile-length phrases.
    // For 45–70 character inputs keep only plain/prefix/suffix/simple symmetry.
    weights.pair=0;
    weights.layered=0;
  }
  if(ctx&&ctx.longMode){
    // Long text keeps the selected DNA mostly through the font. Decoration becomes an accent,
    // not a frame around an entire sentence or paragraph.
    weights.plain=(weights.plain||0)*4.0;
    weights.prefix=(weights.prefix||0)*1.2;
    weights.suffix=(weights.suffix||0)*1.2;
    weights.symmetric=(weights.symmetric||0)*.12;
    weights.pair=0;
    weights.layered=0;
  }
  // For short native-script fallback (Thai/Japanese/Cyrillic/Arabic/etc.), a plain
  // layout would return the exact same string and make Random appear broken.
  if(ctx&&ctx.nativeFallback&&!ctx.longMode){
    weights.plain=0;
    if(!Object.entries(weights).some(([id,w])=>id!=='plain'&&w>0))weights.suffix=1;
  }
  const ids=Object.keys(weights);
  return weightedPick(ids,id=>weights[id]||0);
}
function chooseSignatureMotif(vibeId,layoutId){
  const level=INTENSITY_LEVEL[state.intensity]||2;
  const motifs=(SIGNATURE_MOTIFS[vibeId]||[]).filter(m=>m.layout===layoutId&&m.level<=level);
  if(!motifs.length)return null;
  const chance=(MOTIF_CHANCE[vibeId]||.80)*(state.intensity==='light'?.92:state.intensity==='wild'?1.03:1);
  if(Math.random()>Math.min(.97,chance))return null;
  const m=weightedPick(motifs,x=>x.w||1);
  return m?{prefix:m.prefix||'',suffix:m.suffix||'',parts:(m.parts||[]).slice(),motifId:m.id,lookName:LOOK_NAMES[m.id]||m.id,signature:true}:null;
}
function chooseDecoration(vibeId,layoutId){
  if(state.locks.decoration&&state.current.decoration)return JSON.parse(JSON.stringify(state.current.decoration));
  const motif=chooseSignatureMotif(vibeId,layoutId);
  if(motif)return motif;
  const cfg=INTENSITY[state.intensity];
  const one=()=>pickSymbol(vibeId,cfg.maxIntensity,null)?.meta?.symbol||'✦';
  if(layoutId==='plain')return {prefix:'',suffix:'',parts:[],motifId:null,lookName:'Free Mix',signature:false};
  if(layoutId==='prefix'){const s=one();return {prefix:s+' ',suffix:'',parts:[s],motifId:null,lookName:'Free Mix',signature:false};}
  if(layoutId==='suffix'){const s=one();return {prefix:'',suffix:' '+s,parts:[s],motifId:null,lookName:'Free Mix',signature:false};}
  if(layoutId==='symmetric'){const s=one();return {prefix:s+' ',suffix:' '+s,parts:[s],motifId:null,lookName:'Free Mix',signature:false};}
  if(layoutId==='pair'){const p=pickPair(vibeId,cfg.maxIntensity)||{open:'𓆩',close:'𓆪'};return {prefix:p.open+' ',suffix:' '+p.close,parts:[p.open,p.close],motifId:null,lookName:'Free Mix',signature:false};}
  if(layoutId==='layered'){
    const a=one();let b=one();for(let tries=0;tries<5&&b===a;tries++)b=one();
    if(state.intensity==='light')return {prefix:a+' ',suffix:' '+a,parts:[a],motifId:null,lookName:'Free Mix',signature:false};
    return {prefix:a+' '+b+' ',suffix:' '+b+' '+a,parts:[a,b],motifId:null,lookName:'Free Mix',signature:false};
  }
  return {prefix:'',suffix:'',parts:[],motifId:null,lookName:'Free Mix',signature:false};
}
function applySpacing(styled,vibeId,rawText){
  if(!styled)return styled;
  const words=tokenizeWords(rawText).length,longMode=charLen(rawText)>70||words>9;
  if(longMode||charLen(rawText)>36||words>5)return styled;
  if(['y2k','vaporwave','cyber'].includes(vibeId)&&state.intensity!=='light'&&Math.random()<.38){
    return styled.replace(/\s+/g,'  ');
  }
  return styled;
}
function compose(text,style,vibeId,layoutId,decoration){
  let styled='';
  try{styled=transformTextUnicodeSafe(text,style);}catch(_){styled=text;}
  styled=applySpacing(styled,vibeId,text);
  return (decoration.prefix||'')+styled+(decoration.suffix||'');
}
function signatureOf(c){return [c.vibeId,c.style.id,c.layoutId,(c.decoration.parts||[]).join('|'),c.output].join('::');}
function isForbiddenDecoration(vibeId,decoration){
  const vibe=VIBES[vibeId];
  for(const sym of decoration.parts||[]){
    const m=symbolMeta.find(x=>x.symbol===sym);if(!m)continue;
    for(const f of vibe.forbid||[])if(m.tags.has(f))return true;
  }
  return false;
}
function noveltyBonus(output){
  const last=state.recentOutputs[state.recentOutputs.length-1];if(!last)return 0;
  const a=arr(output),b=arr(last);
  if(Math.max(a.length,b.length)>160)return output===last?-8:1;
  const d=levenshtein(output,last),den=Math.max(1,a.length,b.length);return (d/den)*3.5;
}
function qualityScore(c,text,ctx){
  const vibe=ctx.vibe;let score=0;
  score+=styleAffinity(c.style,vibe)*1.25;
  score+=c.style.readability*1.8;
  score+=(c.style.id==='style-native'?1:(ctx.compat.get(c.style.id)||0))*9;
  if(hasForbidden(c.style,vibe)||isForbiddenDecoration(c.vibeId,c.decoration))score-=120;
  if(state.recentSignatures.includes(c.signature))score-=50;
  score+=noveltyBonus(c.output);
  if(c.layoutId==='symmetric'||c.layoutId==='pair')score+=vibe.symmetry*2.2;
  if(c.decoration&&c.decoration.signature)score+=13.0;
  else if(state.intensity==='medium')score-=2.5;
  if(ctx.longMode&&['pair','layered','symmetric'].includes(c.layoutId))score-=15;
  else if(ctx.compactMode){
    if(c.layoutId==='layered')score-=16;
    if(c.layoutId==='pair')score-=14;
    if(c.layoutId==='symmetric')score-=3;
    if(c.layoutId==='plain')score+=4;
  }
  if((c.decoration.parts||[]).length>INTENSITY[state.intensity].maxDecor)score-=7;
  return score;
}
function buildCandidate(text,vibeId,ctx){
  const style=chooseStyle(ctx),layoutId=chooseLayout(text,vibeId,ctx),decoration=chooseDecoration(vibeId,layoutId);
  const output=compose(text,style,vibeId,layoutId,decoration);
  const c={vibeId,style,layoutId,decoration,output};c.signature=signatureOf(c);c.score=qualityScore(c,text,ctx);return c;
}
function clearAestheticResult({resetLocks=true}={}){
  if(inputDebounce){clearTimeout(inputDebounce);inputDebounce=null;}
  state.current={vibeId:null,styleId:null,layoutId:null,decoration:null,output:'',signature:'',rawText:''};
  if(resetLocks)state.locks={style:false,decoration:false,layout:false};
  resultWrap.hidden=true;updateLocks();
}
function generate(){
  const started=performance.now();
  if(inputDebounce){clearTimeout(inputDebounce);inputDebounce=null;}
  const raw=safeText(input.value).trim();
  if(!raw){clearAestheticResult();return null;}
  const lockedVibe=(state.locks.style||state.locks.decoration||state.locks.layout)&&state.current.vibeId?state.current.vibeId:null;
  const vibeId=lockedVibe||chooseVibe(),ctx=prepareGeneration(raw,vibeId);
  const count=ctx.longMode?12:ctx.compactMode?20:28,candidates=[];
  for(let i=0;i<count;i++){const c=buildCandidate(raw,vibeId,ctx);if(c.output&&c.output!==raw)candidates.push(c);}
  if(!candidates.length){
    // Long native text may intentionally stay plain for readability. Short text should
    // always receive a visible accent; retry a bounded number of times before fallback.
    let fallback=null;
    for(let i=0;i<10;i++){const c=buildCandidate(raw,vibeId,ctx);fallback=c;if(c.output&&c.output!==raw)break;}
    if(fallback)candidates.push(fallback);
  }
  candidates.sort((a,b)=>b.score-a.score);
  const shortlist=candidates.slice(0,Math.min(7,candidates.length)),floor=shortlist[shortlist.length-1]?.score||0;
  const best=weightedPick(shortlist,c=>Math.max(.1,c.score-floor+1))||shortlist[0];
  state.current={vibeId:best.vibeId,styleId:best.style.id,layoutId:best.layoutId,decoration:best.decoration,output:best.output,signature:best.signature,rawText:raw};
  state.recentSignatures.push(best.signature);if(state.recentSignatures.length>36)state.recentSignatures.shift();
  state.recentOutputs.push(best.output);if(state.recentOutputs.length>18)state.recentOutputs.shift();
  state.recentStyleIds.push(best.style.id);if(state.recentStyleIds.length>8)state.recentStyleIds.shift();
  renderResult(best,raw,ctx);
  const ms=performance.now()-started;
  emit('generate',{vibe:best.vibeId,styleId:best.style.id,styleName:best.style.name,layout:best.layoutId,intensity:state.intensity,textLength:charLen(raw),nativeFallback:ctx.nativeFallback,durationMs:Math.round(ms*10)/10});
  return best;
}
function renderResult(c,raw,ctx){
  const vibe=VIBES[c.vibeId];
  $('fsd-aesthetic-output').textContent=c.output;
  const comp=c.style.id==='style-native'?100:Math.round((ctx.compat.get(c.style.id)||0)*100),styleLabel=c.style.id==='style-native'?'Texto original + decoração':c.style.name;
  $('fsd-aesthetic-meta').innerHTML='<span>'+vibe.icon+' '+vibe.label+'</span>'+(c.decoration&&c.decoration.lookName?'<span>• '+c.decoration.lookName+'</span>':'')+'<span>• '+styleLabel+'</span><span>• '+INTENSITY[state.intensity].label+'</span><span>• '+(LAYOUT_LABELS[c.layoutId]||c.layoutId)+'</span>'+(c.style.id==='style-native'?'<span>• Otimizado para o texto original</span>':'<span>• Compatibilidade '+comp+'%</span>')+(ctx.longMode?'<span>• Decoração reduzida automaticamente em textos longos</span>':ctx.compactMode?'<span>• Layout ajustado automaticamente para frases longas</span>':'');
  resultWrap.hidden=false;updateLocks();
}
function updateLocks(){
  for(const [key,id,label] of [['style','fsd-lock-font','Fonte'],['decoration','fsd-lock-decor','Decoração'],['layout','fsd-lock-layout','Layout']]){
    const b=$(id);if(!b)continue;const on=!!state.locks[key];b.setAttribute('aria-pressed',String(on));b.textContent=(on?'🔒 ':'🔓 ')+label;
  }
}
function toggleLock(key){state.locks[key]=!state.locks[key];updateLocks();emit('lock',{lock:key,enabled:state.locks[key]});}

// ---------- Context bridge --------------------------------------------------
// The bridge never reimplements Writer/Bio/Game behavior. It only hands the
// chosen composition to the existing input, then dispatches that module's
// canonical `input` event so its private state, counters and previews update.
function activateExistingTab(tabId){
  const btn=root.querySelector('.lf-tab[data-tab="'+tabId+'"]');
  if(btn){btn.click();return true;}
  return false;
}
function setNativeInputValue(el,value,{focus=false}={}){
  if(!el)return false;
  const v=safeText(value);
  // Use the native value setter when available. This remains compatible with
  // vanilla listeners and is safer if the host later wraps a textarea/input.
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const desc=Object.getOwnPropertyDescriptor(proto,'value');
  if(desc&&desc.set)desc.set.call(el,v);else el.value=v;
  el.dispatchEvent(new Event('input',{bubbles:true,composed:true}));
  if(focus){try{el.focus({preventScroll:true});}catch(_){try{el.focus();}catch(__){}}}
  return true;}
function handoffTo(target){
  const styled=state.current.output||safeText(input.value);
  const raw=state.current.rawText||safeText(input.value);
  if(!styled)return false;
  let ok=false;
  if(target==='writer'){
    ok=activateExistingTab('writer');
    const el=$('tw-editor');
    if(el){
      el.dispatchEvent(new CustomEvent('fsd:writer-handoff',{bubbles:true,detail:{raw,styled}}));
      try{el.focus({preventScroll:true});}catch(_){try{el.focus();}catch(__){}}
      ok=ok&&el.value===styled;
    }
  }else if(target==='bio'){
    ok=activateExistingTab('bio');
    const el=$('bio-input');
    if(el){
      el.dispatchEvent(new CustomEvent('fsd:bio-handoff',{bubbles:true,detail:{raw,styled}}));
      try{el.focus({preventScroll:true});}catch(_){try{el.focus();}catch(__){}}
      ok=ok&&el.value===styled;
    }
  }else if(target==='game'){
    ok=activateExistingTab('pro');
    const el=$('lf194-input');
    if(el){
      // Game owns two concepts at once: the visible styled nickname and the
      // undecorated seed used by its own Random engine. A dedicated local
      // event lets the existing Game closure update both atomically without
      // exposing or duplicating its private variables.
      el.dispatchEvent(new CustomEvent('fsd:aesthetic-handoff',{bubbles:true,detail:{raw,styled}}));
      try{el.focus({preventScroll:true});}catch(_){try{el.focus();}catch(__){}}
      ok=ok&&el.value===styled;
    }
  }
  emit('handoff',{
    target,
    vibe:state.current.vibeId,
    styleId:state.current.styleId,
    intensity:state.intensity,
    ok:!!ok,
    textLength:charLen(styled)
  });
  return !!ok;
}

// ---------- UI wiring -------------------------------------------------------
function syncIntensityUI(){
  root.querySelectorAll('#fsd-intensity button[data-intensity]').forEach(b=>{
    const on=b.dataset.intensity===state.intensity;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));
  });
}
function regenerateVisibleResult(){
  if(resultWrap.hidden||!safeText(input.value).trim())return;
  generate();
}
loadPrefs();
const vibeSel=$('fsd-vibe-select');if(vibeSel)vibeSel.value=state.selectedVibe;
syncIntensityUI();
for(const b of root.querySelectorAll('#fsd-intensity button[data-intensity]')){
  b.addEventListener('click',()=>{
    if(!INTENSITY[b.dataset.intensity]||state.intensity===b.dataset.intensity){syncIntensityUI();return;}
    state.intensity=b.dataset.intensity;syncIntensityUI();savePrefs();emit('intensity',{intensity:state.intensity});regenerateVisibleResult();
  });
}
if(vibeSel)vibeSel.addEventListener('change',()=>{
  state.selectedVibe=vibeSel.value;
  // Style rotation belongs to one aesthetic DNA session. A deliberate vibe switch
  // starts from that vibe's canonical fingerprint instead of inheriting bias from the previous DNA.
  state.recentStyleIds=[];
  state.locks={style:false,decoration:false,layout:false};updateLocks();savePrefs();emit('vibe',{vibe:state.selectedVibe});regenerateVisibleResult();
});
$('fsd-aesthetic-generate')?.addEventListener('click',generate);
$('fsd-aesthetic-again')?.addEventListener('click',generate);
$('fsd-aesthetic-copy')?.addEventListener('click',()=>state.current.output&&copyText(state.current.output));
$('fsd-result-click-copy')?.addEventListener('click',e=>{if(e.target.closest('button,select'))return;if(state.current.output)copyText(state.current.output);});
$('fsd-result-click-copy')?.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&state.current.output){e.preventDefault();copyText(state.current.output);}});
$('fsd-lock-font')?.addEventListener('click',()=>toggleLock('style'));
$('fsd-lock-decor')?.addEventListener('click',()=>toggleLock('decoration'));
$('fsd-lock-layout')?.addEventListener('click',()=>toggleLock('layout'));
const handoffSel=$('fsd-aesthetic-handoff');if(handoffSel)handoffSel.addEventListener('change',()=>{const target=handoffSel.value;handoffSel.value='';if(target)handoffTo(target);});
input.addEventListener('input',()=>{
  if(!safeText(input.value).trim()){clearAestheticResult();return;}
  if(resultWrap.hidden)return;
  clearTimeout(inputDebounce);inputDebounce=setTimeout(()=>{inputDebounce=null;generate();},140);
});

const api={version:VERSION,state,VIBES,INTENSITY,styleMeta,symbolMeta,SIGNATURE_MOTIFS,LOOK_NAMES,generate,levenshtein,textProfile,styleCompatibility,transformTextUnicodeSafe,handoffTo,getDiagnostics(){return {version:VERSION,fonts:fonts.length,pureStyles:styleMeta.filter(x=>x.hybridDepth===0).length,hybridStyles:styleMeta.filter(x=>x.hybridDepth>0).length,symbolSource:symbolSource.length,symbolMeta:symbolMeta.length,vibes:VIBE_IDS.length,motifs:Object.values(SIGNATURE_MOTIFS).reduce((n,a)=>n+a.length,0),strictVibes:VIBE_IDS.filter(id=>VIBES[id].strict).length,qualityPolicy:{compactAt:45,longAt:71,mediumTaxonomyExplore:.02,wildTaxonomyExplore:.18,compatibilityProbeMax:384,fontPreviewMax:360,emptyInput:'clear',nativeShortMustChange:true,instantControlRegenerate:true,accessibleIntensity:true,copyFailureSelect:true,reducedMotion:true,curatedStyleWeights:true,vibeIdentitySeparation:true,recentStyleDiversity:true},taxonomyCategories:Object.keys(CAT_SETS).length,taxonomyCovered:symbolSource.filter(sym=>Object.values(CAT_SETS).some(set=>set.has(sym))).length,state:JSON.parse(JSON.stringify(state))};}};
window.FSDAesthetic=Object.freeze(api);
const sourceEl=$('fsd-aesthetic-source');if(sourceEl)sourceEl.textContent=fonts.length+' estilos × '+symbolSource.length+' símbolos';
console.log('[FSD Aesthetic DNA]',api.getDiagnostics());
})();
