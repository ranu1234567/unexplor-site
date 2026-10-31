const express=require('express'),fs=require('fs'),path=require('path');
const {site:S,cats,packages,destinations,taxi,posts}=require('./data');
const app=express();
app.disable('x-powered-by');app.set('trust proxy',1);
app.use(express.urlencoded({extended:false,limit:'20kb'}));
app.use(express.static(path.join(__dirname,'public'),{maxAge:'7d'}));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const abs=p=>S.url.replace(/\/$/,'')+p;
const ld=o=>`<script type="application/ld+json">${JSON.stringify(o).replace(/</g,'\\u003c')}</script>`;
const socials=Object.entries(S.social).filter(([,v])=>v);
const org={'@context':'https://schema.org','@type':'TravelAgency',name:S.name,url:abs('/'),logo:abs('/logo.jpg'),telephone:S.phone,email:S.email,
 address:{'@type':'PostalAddress',addressLocality:'Varanasi',addressRegion:'Uttar Pradesh',addressCountry:'IN'},areaServed:['Nepal','India'],sameAs:socials.map(([,v])=>v)};

const nav=[['/','Home'],['/packages/nepal','Nepal'],['/packages/buddhist-circuit','Buddhist Circuit'],['/packages/uttar-pradesh','Uttar Pradesh'],['/packages/bihar','Bihar'],
['#','Taxi Rental ▾',taxi.map(c=>[`/taxi-rental/${c}`,cap(c)+' Taxi Rental'])],
['#','Company ▾',[['/about','About Us'],['/blog','Blog'],['/terms','Terms & Conditions'],['/privacy','Privacy Policy'],['/cancellation-refund-policy','Cancellation / Refund']]],
['/destinations','Destinations'],['/gallery','Gallery'],['/contact','Contact']];
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
const navHtml=nav.map(([h,t,sub])=>sub?`<div class="dd"><a href="#" onclick="return false">${t}</a><div class="ddm">${sub.map(([u,n])=>`<a href="${u}">${n}</a>`).join('')}</div></div>`:`<a href="${h}">${t}</a>`).join('');

function layout(m,body){
 const url=abs(m.path||'/'),title=m.title.length>62?m.title.slice(0,59)+'…':m.title;
 const crumbs=[['Home','/'],...(m.crumbs||[])];
 const bc=crumbs.length>1?{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,name:c[0],item:abs(c[1])}))}:null;
 return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | ${S.name}</title><meta name="description" content="${esc((m.desc||'').slice(0,158))}">
<link rel="canonical" href="${url}"><meta name="robots" content="${m.noindex?'noindex,follow':'index,follow,max-image-preview:large'}">
<meta property="og:type" content="${m.og||'website'}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(m.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${abs('/logo.jpg')}"><meta property="og:site_name" content="${S.name}">
<meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/logo.jpg"><link rel="stylesheet" href="/style.css">
${ld(org)}${bc?ld(bc):''}${(m.schema||[]).map(ld).join('')}</head><body>
<header><div class="wrap bar"><a class="brand" href="/"><img src="/logo.jpg" alt="${S.name} logo" width="42" height="42">UNEXPLOR</a><button class="mb" onclick="document.getElementById('nv').classList.toggle('open')" aria-label="Menu">☰</button>
<nav id="nv">${navHtml}<a class="btn" href="/contact">Book Now</a></nav></div></header>
<main>${crumbs.length>1?`<div class="wrap crumbs">${crumbs.map((c,i)=>i<crumbs.length-1?`<a href="${c[1]}">${esc(c[0])}</a> › `:`<span>${esc(c[0])}</span>`).join('')}</div>`:''}${body}</main>
<footer><div class="wrap fg"><div><img src="/logo.jpg" alt="" width="64" height="64" style="border-radius:50%"><p>${S.tagline}</p><p>📞 ${esc(S.phone)}<br>✉️ ${esc(S.email)}<br>📍 ${esc(S.address)}</p>
<p>${socials.map(([k,v])=>`<a href="${esc(v)}" rel="noopener me" target="_blank">${cap(k)}</a>`).join(' · ')}</p></div>
<div><h4>Packages</h4>${Object.entries(cats).map(([k,v])=>`<a href="/packages/${k}">${v} Packages</a>`).join('')}<a href="/packages">All Packages</a></div>
<div><h4>Destinations</h4>${destinations.map(d=>`<a href="/destination/${d.slug}">${d.name}</a>`).join('')}</div>
<div><h4>Taxi Rental</h4>${taxi.map(c=>`<a href="/taxi-rental/${c}">${cap(c)} Taxi</a>`).join('')}<h4>Company</h4><a href="/about">About</a><a href="/blog">Blog</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div>
<div class="wrap copy">© ${new Date().getFullYear()} ${S.name}. All rights reserved. · <a href="/sitemap.xml">Sitemap</a></div></footer>
<a class="wa" href="https://wa.me/${S.wa}" target="_blank" rel="noopener">💬 WhatsApp</a><script src="/chat.js" defer></script></body></html>`}

const card=p=>`<article class="card"><a href="/tour/${p.slug}" class="th">🏔️</a><div class="pad"><span class="pill">${cats[p.cat]} · ${p.nights}N/${p.nights+1}D</span><h3><a href="/tour/${p.slug}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p><a class="btn sm" href="/tour/${p.slug}">View Details</a></div></article>`;
const head=(h,p)=>`<div class="sec-h"><h2>${h}</h2>${p?`<p>${p}</p>`:''}</div>`;
const page=(m,body)=>(req,res)=>res.send(layout(m,body));
const form=(sub='')=>`<form method="post" action="/contact" class="form"><input type="text" name="website" class="hp" tabindex="-1" autocomplete="off"><input name="name" placeholder="Name / agency" required maxlength="80"><input name="phone" placeholder="Phone / WhatsApp" required maxlength="25"><input name="email" type="email" placeholder="Email" maxlength="80"><input name="pax" placeholder="Pax & travel dates" maxlength="80"><textarea name="msg" rows="3" placeholder="Your requirement" maxlength="800">${esc(sub)}</textarea><button class="btn" type="submit">Request Quote</button></form>`;

app.get('/',(q,r)=>r.send(layout({path:'/',title:'Nepal DMC | Hotels, Transport & Guides for Agents',desc:'Unexplor is a Varanasi-based DMC for Nepal, Buddhist Circuit, Uttar Pradesh and Bihar: hotels, transport, guides and ground handling for tour operators.',schema:[{'@context':'https://schema.org','@type':'WebSite',name:S.name,url:abs('/'),potentialAction:{'@type':'SearchAction',target:abs('/packages?q={q}'),'query-input':'required name=q'}}]},
`<section class="hero"><div class="wrap hg"><div><span class="tag">Nepal DMC · Varanasi</span><h1>Destination Management Company for Nepal, Buddhist Circuit, UP & Bihar</h1><p>Hotels, transport, guides and ground handling for tour operators and travel agents.</p>
<form action="/packages" class="sf"><input name="q" placeholder="Search packages or destination, e.g. Lumbini"><button class="btn">Search</button></form></div><img class="lg" src="/logo.jpg" alt="Unexplor – It’s a time to see the World" width="260" height="260"></div></section>
<section><div class="wrap">${head('Destinations We Cover','Explore our most requested destinations.')}<div class="grid">${destinations.map(d=>`<a class="card pad dl" href="/destination/${d.slug}"><h3>${d.name}</h3><p>${esc(d.text)}</p></a>`).join('')}</div></div></section>
<section class="alt"><div class="wrap">${head('Popular Tour Packages')}<div class="grid">${packages.slice(0,6).map(card).join('')}</div><p class="c"><a class="btn" href="/packages">View All Packages</a></p></div></section>
<section><div class="wrap">${head('Latest from our Blog')}<div class="grid">${posts.map(p=>`<a class="card pad dl" href="/blog/${p.slug}"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p></a>`).join('')}</div></div></section>
<section class="alt"><div class="wrap two">${'<div><h2>Partner with a trusted DMC</h2><p>Send group details and dates. We reply with a customised itinerary with the best quote.</p></div>'}${form()}</div></section>`)));

app.get('/packages',(q,r)=>{const s=String(q.query.q||'').toLowerCase().slice(0,60);const l=s?packages.filter(p=>(p.title+p.summary+cats[p.cat]).toLowerCase().includes(s)):packages;
 r.send(layout({path:'/packages',title:s?`Search: ${s}`:'All Tour Packages',desc:'Tour packages for Nepal, Buddhist Circuit, Uttar Pradesh and Bihar by Unexplor DMC.',noindex:!!s,crumbs:[['Packages','/packages']]},`<section><div class="wrap">${head(s?`Results for “${esc(s)}”`:'All Tour Packages')}<div class="grid">${l.map(card).join('')||'<p>No package found. <a href="/contact">Ask us for a custom itinerary</a>.</p>'}</div></div></section>`))});
app.get('/packages/:cat',(q,r,n)=>{const c=q.params.cat,N=cats[c];if(!N)return n();
 r.send(layout({path:'/packages/'+c,title:`${N} Tour Packages & DMC`,desc:`${N} tour packages for agents and travellers: hotels, private transport and local guides by Unexplor DMC.`,crumbs:[['Packages','/packages'],[N,'/packages/'+c]]},
 `<section><div class="wrap">${head(`${N} Tour Packages`,`Customisable ${N} itineraries with hotels, transport and guides.`)}<div class="grid">${packages.filter(p=>p.cat===c).map(card).join('')}</div>
 <h3 style="margin-top:34px">${N} destinations</h3><p>${destinations.filter(d=>d.cat===c).map(d=>`<a class="pill" href="/destination/${d.slug}">${d.name}</a>`).join(' ')||'—'}</p></div></section>`))});
app.get('/tour/:slug',(q,r,n)=>{const p=packages.find(x=>x.slug===q.params.slug);if(!p)return n();const N=cats[p.cat];
 const rel=packages.filter(x=>x.cat===p.cat&&x!==p).slice(0,3);
 r.send(layout({path:'/tour/'+p.slug,title:p.title,desc:p.summary,og:'article',crumbs:[['Packages','/packages'],[N,'/packages/'+p.cat],[p.title,'/tour/'+p.slug]],
 schema:[{'@context':'https://schema.org','@type':'TouristTrip',name:p.title,description:p.summary,url:abs('/tour/'+p.slug),provider:{'@type':'TravelAgency',name:S.name,url:abs('/')},itinerary:{'@type':'ItemList',itemListElement:p.days.map((d,i)=>({'@type':'ListItem',position:i+1,name:`Day ${i+1}: ${d}`}))}}]},
 `<section><div class="wrap two"><div><h1>${esc(p.title)}</h1><p><span class="pill">${N}</span> <span class="pill">${p.nights} Nights / ${p.nights+1} Days</span> <span class="pill">Code ${p.code}</span></p><p>${esc(p.summary)}</p>
 <h2>Itinerary</h2>${p.days.map((d,i)=>`<div class="day"><b>Day ${i+1}</b> ${esc(d)}</div>`).join('')}
 <h3>Inclusions</h3><ul><li>Hotel accommodation as per plan</li><li>Private AC vehicle for transfers and sightseeing</li><li>Daily breakfast</li><li>Local guide where mentioned</li></ul>
 <h3>Exclusions</h3><ul><li>Flights / train tickets</li><li>Entry fees and personal expenses</li><li>Anything not listed in inclusions</li></ul></div>
 <aside><h3>Get a quote</h3>${form('Package: '+p.title+' ('+p.code+')')}</aside></div></section>
 <section class="alt"><div class="wrap">${head('Related Packages')}<div class="grid">${rel.map(card).join('')}</div></div></section>`))});
app.get('/destinations',page({path:'/destinations',title:'Destinations',desc:'Destinations covered by Unexplor DMC across Nepal, Uttar Pradesh and Bihar.',crumbs:[['Destinations','/destinations']]},`<section><div class="wrap">${head('Destinations')}<div class="grid">${destinations.map(d=>`<a class="card pad dl" href="/destination/${d.slug}"><h3>${d.name}</h3><p>${esc(d.text)}</p></a>`).join('')}</div></div></section>`));
app.get('/destination/:slug',(q,r,n)=>{const d=destinations.find(x=>x.slug===q.params.slug);if(!d)return n();
 r.send(layout({path:'/destination/'+d.slug,title:`${d.name} Tour Packages & DMC Services`,desc:d.text,crumbs:[['Destinations','/destinations'],[d.name,'/destination/'+d.slug]],schema:[{'@context':'https://schema.org','@type':'TouristDestination',name:d.name,description:d.text,url:abs('/destination/'+d.slug)}]},
 `<section><div class="wrap"><h1>${d.name} Tour Packages</h1><p>${esc(d.text)} Unexplor arranges hotels, private transport and guides in ${d.name}.</p><h2>Packages including ${d.name}</h2><div class="grid">${packages.filter(p=>p.cat===d.cat||p.title.includes(d.name)).slice(0,6).map(card).join('')}</div>
 <h2>Plan your ${d.name} trip</h2>${form(`Destination: ${d.name}`)}</div></section>`))});
app.get('/taxi-rental/:city',(q,r,n)=>{const c=q.params.city;if(!taxi.includes(c))return n();const C=cap(c);
 r.send(layout({path:'/taxi-rental/'+c,title:`${C} Taxi Rental | Cabs & Tempo Traveller`,desc:`Book ${C} taxi rental: private AC cars, tempo travellers and outstation cabs for tourists and agents.`,crumbs:[['Taxi Rental','/contact'],[C,'/taxi-rental/'+c]],
 schema:[{'@context':'https://schema.org','@type':'Service',name:`${C} Taxi Rental`,provider:{'@type':'TravelAgency',name:S.name},areaServed:C}]},
 `<section><div class="wrap two"><div><h1>${C} Taxi Rental</h1><p>Sedans, SUVs and tempo travellers with experienced drivers for airport transfers, local sightseeing and outstation trips from ${C}.</p><ul><li>Airport and railway station pickup</li><li>Local and outstation packages</li><li>Group vehicles up to 17 seater on request</li></ul><p>${taxi.filter(x=>x!==c).map(x=>`<a class="pill" href="/taxi-rental/${x}">${cap(x)} Taxi</a>`).join(' ')}</p></div><aside>${form(`Taxi in ${C}: `)}</aside></div></section>`))});
app.get('/blog',page({path:'/blog',title:'Travel Blog',desc:'Travel guides for Nepal, Buddhist Circuit and Uttar Pradesh from Unexplor.',crumbs:[['Blog','/blog']]},`<section><div class="wrap">${head('Travel Blog')}<div class="grid">${posts.map(p=>`<a class="card pad dl" href="/blog/${p.slug}"><h3>${esc(p.title)}</h3><p>${p.date}</p><p>${esc(p.desc)}</p></a>`).join('')}</div></div></section>`));
app.get('/blog/:slug',(q,r,n)=>{const p=posts.find(x=>x.slug===q.params.slug);if(!p)return n();
 r.send(layout({path:'/blog/'+p.slug,title:p.title,desc:p.desc,og:'article',crumbs:[['Blog','/blog'],[p.title,'/blog/'+p.slug]],schema:[{'@context':'https://schema.org','@type':'BlogPosting',headline:p.title,datePublished:p.date,dateModified:p.date,description:p.desc,image:abs('/logo.jpg'),author:{'@type':'Organization',name:S.name},publisher:{'@type':'Organization',name:S.name,logo:{'@type':'ImageObject',url:abs('/logo.jpg')}},mainEntityOfPage:abs('/blog/'+p.slug)}]},
 `<section><div class="wrap narrow"><h1>${esc(p.title)}</h1><p class="mute">${p.date}</p>${p.body.map(x=>`<p>${esc(x)}</p>`).join('')}<p><a class="btn" href="/packages/nepal">See Nepal Packages</a></p></div></section>`))});
app.get('/gallery',page({path:'/gallery',title:'Tour Photo Gallery',desc:'Photos from Unexplor tours in Nepal and India.',crumbs:[['Gallery','/gallery']]},`<section><div class="wrap">${head('Gallery','Add your tour photos in /public/gallery and list them in data.js.')}<div class="grid">${['🏔️','🛕','🚙','🛶','🐘','☸️'].map(e=>`<div class="card th" style="height:160px">${e}</div>`).join('')}</div></div></section>`));
app.get('/about',page({path:'/about',title:'About Us',desc:'Unexplor is a Varanasi-based destination management company for Nepal and India.',crumbs:[['About Us','/about']]},`<section><div class="wrap narrow"><h1>About Unexplor</h1><p>${S.tagline}. Unexplor is a Varanasi-based DMC serving tour operators and travel agents with hotels, transport, guides and ground handling across Nepal, the Buddhist Circuit, Uttar Pradesh and Bihar.</p><p><a href="/contact">Contact our team</a> for a custom quote.</p></div></section>`));
app.get('/contact',page({path:'/contact',title:'Contact Us',desc:'Contact Unexplor DMC in Varanasi for quotes and customised itineraries.',crumbs:[['Contact','/contact']]},`<section><div class="wrap two"><div><h1>Contact Us</h1><p>📞 ${esc(S.phone)}<br>✉️ ${esc(S.email)}<br>📍 ${esc(S.address)}</p></div>${form()}</div></section>`));
app.post('/contact',(q,r)=>{const b=q.body||{};if(!b.website&&b.name&&b.phone){const c=k=>String(b[k]||'').slice(0,800);
 try{fs.appendFileSync(path.join(__dirname,'enquiries.jsonl'),JSON.stringify({at:new Date().toISOString(),name:c('name'),phone:c('phone'),email:c('email'),pax:c('pax'),msg:c('msg')})+'\n')}catch(e){console.error(e)}}
 r.send(layout({path:'/thank-you',title:'Thank You',desc:'Enquiry received.',noindex:true},`<section><div class="wrap narrow"><h1>Thank you!</h1><p>We received your enquiry and will contact you shortly.</p><p><a class="btn" href="https://wa.me/${S.wa}" target="_blank" rel="noopener">Chat on WhatsApp</a></p></div></section>`))});
const legal=(p,t,x)=>app.get(p,page({path:p,title:t,desc:`${t} of ${S.name}.`,crumbs:[[t,p]]},`<section><div class="wrap narrow"><h1>${t}</h1>${x.map(a=>`<p>${a}</p>`).join('')}</div></section>`));
legal('/terms','Terms & Conditions',['Replace this text with your booking terms, payment schedule and liability clauses.']);
legal('/privacy','Privacy Policy',['We collect the details you submit in enquiry forms only to respond to your request. Replace with your final policy.']);
legal('/cancellation-refund-policy','Cancellation & Refund Policy',['Replace this text with your cancellation slabs and refund timelines.']);

require('./chat-api')(app);
app.get('/robots.txt',(q,r)=>r.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${abs('/sitemap.xml')}\n`));
app.get('/sitemap.xml',(q,r)=>{const d=new Date().toISOString().slice(0,10);
 const u=['/','/packages','/destinations','/blog','/gallery','/about','/contact','/terms','/privacy','/cancellation-refund-policy',...Object.keys(cats).map(c=>'/packages/'+c),...packages.map(p=>'/tour/'+p.slug),...destinations.map(x=>'/destination/'+x.slug),...taxi.map(c=>'/taxi-rental/'+c),...posts.map(p=>'/blog/'+p.slug)];
 r.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u.map(x=>`<url><loc>${abs(x)}</loc><lastmod>${d}</lastmod></url>`).join('')}</urlset>`)});
app.use((q,r)=>r.status(404).send(layout({path:q.path,title:'Page Not Found',desc:'Page not found.',noindex:true},`<section><div class="wrap narrow"><h1>404 – Page not found</h1><p><a href="/">Go home</a> or <a href="/packages">see packages</a>.</p></div></section>`)));
app.listen(process.env.PORT||3000,()=>console.log('Unexplor site running'));
