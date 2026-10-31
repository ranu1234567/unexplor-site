(()=>{const b=document.createElement('button');b.className='cb';b.textContent='💬 Chat with us';
const p=document.createElement('div');p.className='cp';p.hidden=true;
p.innerHTML='<div class="ch"><b>Unexplor Assistant</b><button type="button" aria-label="Close">×</button></div><div class="cm" role="log" aria-live="polite"></div><form class="cf"><input maxlength="500" placeholder="Type your question…" required><button>Send</button></form>';
document.body.append(b,p);
const m=p.querySelector('.cm'),f=p.querySelector('form'),i=f.querySelector('input'),h=[];
const add=(t,c)=>{const d=document.createElement('div');d.className='cx '+c;d.textContent=t;m.append(d);m.scrollTop=m.scrollHeight;return d};
b.onclick=()=>{p.hidden=!p.hidden;if(!p.hidden){if(!m.children.length)add('Namaste! Main Unexplor ka assistant hoon. Nepal, Buddhist Circuit, UP ya Bihar tours ke baare mein puchiye.','bot');i.focus()}};
p.querySelector('.ch button').onclick=()=>{p.hidden=true};
f.onsubmit=async e=>{e.preventDefault();const t=i.value.trim();if(!t)return;i.value='';add(t,'me');h.push({role:'user',content:t});const w=add('…','bot');
 try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:h.slice(-10)})});const d=await r.json();w.textContent=d.reply||'Sorry, please try again.';h.push({role:'assistant',content:w.textContent})}
 catch{w.textContent='Network error. Please WhatsApp us.';h.pop()}}})();
