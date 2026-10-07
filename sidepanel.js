const providers = {
  chatgpt: {name:'ChatGPT',url:'https://chatgpt.com/',mark:'◎',light:['#ffffff','#202123','#777777','#e9e9e9','#f4f4f4','#ffffff','#202123'],dark:['#212121','#ececec','#a1a1a1','#333333','#2f2f2f','#2f2f2f','#ececec']},
  claude: {name:'Claude',url:'https://claude.ai/',mark:'✳',light:['#faf9f5','#3d3929','#817b6d','#e8e5db','#f0eee6','#faf9f5','#b86f50'],dark:['#262624','#e8e6dc','#aaa79b','#3d3d38','#33332f','#30302d','#d99b7d']},
  gemini: {name:'Gemini',url:'https://gemini.google.com/app',mark:'✦',light:['#ffffff','#1f1f1f','#727775','#e5e7eb','#f0f4f9','#ffffff','#537bdc'],dark:['#131314','#e3e3e3','#9aa0a6','#2b2d32','#282a2c','#1e1f20','#a6bfff']},
  grok: {name:'Grok',url:'https://grok.com/',mark:'𝕏',light:['#ffffff','#171717','#777777','#e8e8e8','#f5f5f5','#ffffff','#171717'],dark:['#101010','#eeeeee','#999999','#292929','#232323','#191919','#eeeeee']}
};
const trigger=document.getElementById('provider');
const menu=document.getElementById('provider-menu');
const options=[...menu.querySelectorAll('[data-provider]')];
const frames=new Map();
const dark=matchMedia('(prefers-color-scheme: dark)');
let active='chatgpt';
try {const saved=localStorage.getItem('provider');if(Object.hasOwn(providers,saved))active=saved;}catch{}
function theme(){
  const colors=providers[active][dark.matches?'dark':'light'];
  ['bg','fg','muted','line','hover','menu','accent'].forEach((name,i)=>document.documentElement.style.setProperty('--'+name,colors[i]));
  document.documentElement.style.setProperty('--radius',active==='claude'?'8px':'12px');
}
function closeMenu(restoreFocus=false){menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(restoreFocus)trigger.focus();}
function openMenu(index=options.findIndex(o=>o.dataset.provider===active)){
  menu.hidden=false;trigger.setAttribute('aria-expanded','true');options[Math.max(0,index)].focus();
}
function show(key,reload=false){
  if(!Object.hasOwn(providers,key))return;
  active=key;const p=providers[key];theme();
  document.getElementById('provider-name').textContent=p.name;
  document.getElementById('provider-mark').textContent=p.mark;
  options.forEach(o=>o.setAttribute('aria-checked',String(o.dataset.provider===key)));
  document.title=p.name+' · Verity';
  try{localStorage.setItem('provider',key);}catch{}
  for(const [id,frame] of frames)frame.hidden=id!==key;
  let frame=frames.get(key);
  if(!frame){
    frame=document.createElement('iframe');frame.title=p.name;frame.referrerPolicy='strict-origin-when-cross-origin';
    frames.set(key,frame);frame.src=p.url;document.getElementById('frames').append(frame);
    frame.addEventListener('pointerdown',()=>closeMenu());
  }else if(reload)frame.src=p.url;
  frame.hidden=false;
}
trigger.addEventListener('click',()=>menu.hidden?openMenu():closeMenu());
trigger.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();openMenu(e.key==='ArrowUp'?options.length-1:undefined);}
  if(e.key==='Escape')closeMenu();
});
options.forEach(option=>option.addEventListener('click',()=>{show(option.dataset.provider);closeMenu(true);}));
menu.addEventListener('keydown',e=>{
  const index=options.indexOf(document.activeElement);
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?options.length-1:(index+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options[next].focus();
  }else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeMenu(true);}
  else if(e.key==='Tab'){closeMenu();trigger.focus();}
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.picker'))closeMenu();});
document.addEventListener('focusin',e=>{if(!e.target.closest('.picker'))closeMenu();});
window.addEventListener('blur',()=>closeMenu());
document.getElementById('reload').addEventListener('click',()=>show(active,true));
document.getElementById('open').addEventListener('click',()=>chrome.tabs.create({url:providers[active].url}));
dark.addEventListener('change',theme);
show(active);

const shareButton = document.getElementById('share');
function pasteIntoFrame(frame, origin, url) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    let retries;
    let timeout;
    function finish(error) {
      clearInterval(retries);
      clearTimeout(timeout);
      window.removeEventListener('message', receive);
      error ? reject(new Error(error)) : resolve();
    }
    function receive(event) {
      if (event.source !== frame.contentWindow || event.origin !== origin) return;
      const result = event.data;
      if (!result || result.type !== 'verity:paste-result' || result.id !== id) return;
      if (result.ok) finish();
      else if (!result.retry) finish(result.error || 'Could not paste the link.');
    }
    function send() {
      frame.contentWindow.postMessage({type: 'verity:paste-url', id, url}, origin);
    }
    window.addEventListener('message', receive);
    retries = setInterval(send, 500);
    timeout = setTimeout(() => finish('Open a chat, wait for its message box, and try again. After installing, close and reopen this panel.'), 8000);
    send();
  });
}
shareButton.addEventListener('click', async () => {
  closeMenu();
  shareButton.disabled = true;
  const key = active;
  try {
    const win = await chrome.windows.getCurrent();
    const [tab] = await chrome.tabs.query({active: true, windowId: win.id});
    if (!tab?.url || !['https:', 'http:'].includes(new URL(tab.url).protocol)) {
      throw new Error('Select a regular website tab to share its link.');
    }
    const frame = frames.get(key);
    if (!frame) throw new Error('Wait for the AI page to load first.');
    await pasteIntoFrame(frame, new URL(providers[key].url).origin, tab.url);
  } catch (error) {
    console.warn('Share tab:', error.message || 'Could not share this tab.');
  } finally {
    shareButton.disabled = false;
  }
});
