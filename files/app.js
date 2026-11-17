const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],app=$('#app');
const NN=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],SC={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10]};
const P={pop:[[0,0],[7,0],[9,1],[5,0]],sad:[[0,1],[8,0],[3,0],[10,0]],rnb:[[2,1,1],[7,0,1],[0,0,1],[9,1,1]],chill:[[0,0,1],[9,1,1],[2,1,1],[7,0,1]]};
const DR={trap:[[0,6,10],[4,12],[0,2,4,6,8,10,11,12,14]],lofi:[[0,7,10],[4,12],[0,2,4,6,8,10,12,14]],pop:[[0,4,8,12],[4,12],[2,6,10,14]],rnb:[[0,3,10],[4,12],[0,2,4,6,8,10,12,14]]};
const GL={trap:'Trap',lofi:'Lo-fi',rnb:'R&B',pop:'Pop'};
const cn=(c,k)=>NN[(k+c[0])%12]+(c[2]?(c[1]?'m7':c[0]?'7':'maj7'):c[1]?'m':'');
const cs=(c,k)=>{const r=48+k+c[0];return[r,r+(c[1]?3:4),r+7].concat(c[2]?[r+(c[1]||c[0]?10:11)]:[])};
const rnd=s=>()=>(s=s*16807%2147483647)/2147483647;
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const vnd=n=>Math.round(n).toLocaleString('vi-VN')+'đ';
function genMel(S,r=Math.random){S.mel=Array.from({length:8},()=>Array(16).fill(0));let d=2;for(let i=0;i<16;i+=2)if(r()<.7){d=Math.max(0,Math.min(7,d+Math.floor(r()*5)-2));S.mel[d][i]=1}}
function mkState(o){const S={bpm:o.bpm,key:o.key,mode:o.mode,prog:P[o.prog],drums:DR[o.dr].map(a=>{const x=Array(16).fill(0);a.forEach(i=>x[i]=1);return x}),mel:[],mx:{}};genMel(S,rnd(o.seed||7));return S}
const T=(t,a,g,m,p,h,s)=>({t,a,g,m,p,h,s,st:mkState(s)}),grad=t=>`linear-gradient(135deg,hsl(${t.h} 62% 42%),hsl(${t.h+40} 62% 28%))`;
const TR=[T('Midnight Dreams','Unknown Beats','R&B','Buồn',500000,260,{bpm:90,key:9,mode:'min',prog:'sad',dr:'rnb',seed:3}),T('Neon Rain','Kaito','Trap','Năng lượng',650000,320,{bpm:140,key:6,mode:'min',prog:'sad',dr:'trap',seed:8}),T('Study Café','Lofi Minh','Lo-fi','Chill',300000,160,{bpm:78,key:0,mode:'maj',prog:'chill',dr:'lofi',seed:5}),T('Sunrise Drive','Hana','Pop','Vui',450000,30,{bpm:116,key:7,mode:'maj',prog:'pop',dr:'pop',seed:11}),T('2AM Highway','Nightowl','Lo-fi','Buồn',350000,215,{bpm:84,key:2,mode:'min',prog:'sad',dr:'lofi',seed:21}),T('Golden Hour','Mai Linh','R&B','Chill',550000,45,{bpm:96,key:5,mode:'maj',prog:'rnb',dr:'rnb',seed:14})];
let ST=mkState({bpm:90,key:0,mode:'maj',prog:'pop',dr:'lofi',seed:5});

/* ===== Tải file: dùng trình duyệt (a[download]) ===== */
async function dlSave(name,blob){const d=window.claude?await claude.use('downloads'):null;if(d)return d.save({filename:name,data:blob});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
/* ===== Audio engine ===== */
let AC,master;
const ctx=()=>{if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.7;master.connect(AC.destination)}if(AC.state=='suspended')AC.resume();return AC};
function note(m,t,d,type='triangle',v=.2){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=440*2**((m-69)/12);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.05)}
function drum(k,t){const g=AC.createGain();g.connect(master);if(k==0){const o=AC.createOscillator();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+.15);g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);o.start(t);o.stop(t+.3)}else{const b=AC.createBuffer(1,AC.sampleRate*.2,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=AC.createBufferSource(),f=AC.createBiquadFilter();s.buffer=b;f.type='highpass';f.frequency.value=k==1?1200:7000;g.gain.setValueAtTime(k==1?.5:.2,t);g.gain.exponentialRampToValueAtTime(.001,t+(k==1?.18:.05));s.connect(f);f.connect(g);s.start(t)}}
const Eng={gen:0,tm:0,own:null,
play(st,own,cb){ctx();this.stop();this.st=st;this.own=own;this.cb=cb;this.step=0;this.loop=0;this.nt=AC.currentTime+.08;this.tm=setInterval(()=>this.tick(),25);cb('start')},
stop(){if(!this.tm)return;clearInterval(this.tm);this.tm=0;this.gen++;const c=this.cb;this.cb=0;this.own=null;c&&c('stop')},
tick(){const s=this.st;while(this.nt<AC.currentTime+.12){this.sched(this.nt,this.step,this.loop,this.gen);this.nt+=60/s.bpm/4;if(++this.step==16){this.step=0;this.loop++}}},
sched(t,i,L,g,st){const s=st||this.st,d=60/s.bpm/4,sc=SC[s.mode],c=cs(s.prog[L%4],s.key);
if(i==0)c.forEach(m=>note(m+12,t,d*15,'sine',.08));
if(i%8==0||(i==10&&s.bpm>120))note(c[0]-12,t,d*3,'sine',.35);
s.drums.forEach((r,k)=>r[i]&&drum(k,t));
INS.forEach(I=>{const gd=I.id=='piano'?s.mel:(s.mx||{})[I.id];if(gd)for(let q=0;q<8;q++)if(gd[q][i])ins(I,60+s.key+sc[q%7]+12*(q/7|0),t,d)});
g>=0&&setTimeout(()=>{g==this.gen&&this.cb&&this.cb('step',i,L)},Math.max(0,(t-AC.currentTime)*1000))}};

/* ===== Persistent player ===== */
const LOOPS=16;let cur=-1,shuf=false;
const setPl=on=>$('#pp').textContent=on?'⏸':'▶';
function playT(i){cur=(i+TR.length)%TR.length;const t=TR[cur];$('#pt').textContent=t.t;$('#pa').textContent=t.a+' · '+t.g+' · '+t.s.bpm+' BPM';$('#pc').style.background=grad(t);
Eng.play(t.st,'p',(e,i,l)=>{if(e=='start')setPl(true);if(e=='stop')setPl(false);if(e=='step'){$('#bar i').style.width=Math.min(100,(l*16+i)/(LOOPS*16)*100)+'%';if(l>=LOOPS&&i==0)nextT()}})}
const nextT=()=>playT(shuf?cur+1+Math.floor(Math.random()*(TR.length-1)):cur+1);

/* ===== Router & events ===== */
const A={},I={};
const NAV=[['discover','🏠','Khám phá'],['studio','🎹','Studio'],['academy','🎓','Academy'],['arena','⚔️','Đấu trường'],['market','🛒','Chợ nhạc'],['published','📦','Published']];
$('#nav').innerHTML='<div class="lg">SONORA<small>Create. Discover. Own. Share.</small></div>'+NAV.map(n=>`<a href="#${n[0]}" data-n="${n[0]}"><span>${n[1]}</span>${n[2]}</a>`).join('');
function route(){clearInterval(G.iv);const[p,a]=(location.hash.slice(1)||'discover').split('/'),V={discover:vDiscover,studio:vStudio,academy:vAcademy,arena:vArena,published:vPub,market:vMarket};if(Eng.own&&Eng.own!='p')Eng.stop();$$('#nav a').forEach(x=>x.classList.toggle('on',x.dataset.n==p));(V[p]||vDiscover)(a);window.scrollTo(0,0)}
addEventListener('hashchange',route);
document.addEventListener('click',e=>{const t=e.target,k=t.closest('.k'),b=t.closest('[data-a]');
if(t.classList.contains('c'))return cellTap(t);
if(k&&k.dataset.s!=null){ctx();note(60+ +k.dataset.s,AC.currentTime,.8,'triangle',.3);if(k.dataset.p=='ex')k.classList.toggle('sel');return}
if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset,b)});
document.addEventListener('input',e=>{const f=e.target.dataset.in;if(f)I[f](e.target.value)});
document.addEventListener('keydown',e=>{if(e.key=='Enter'&&e.target.id=='aq')A.askIn()});
A.tog=()=>{if(Eng.own=='p'&&Eng.tm)Eng.stop();else playT(cur<0?0:cur)};A.next=()=>nextT();A.prev=()=>playT(cur-1);
A.shuf=()=>{shuf=!shuf;$('#sh').classList.toggle('pri',shuf)};A.play=d=>playT(+d.i);

/* ===== Discover ===== */
let mood='Tất cả';
A.mood=d=>{mood=d.m;vDiscover()};
function vDiscover(){const card=(t,i)=>`<div class="card tc"><div class="cov" style="background:${grad(t)}">♪</div><b>${t.t}</b><div class="mut">${t.a}</div><div><span class="tag">${t.g}</span><span class="tag">${t.m}</span><span class="tag">${t.s.bpm} BPM</span></div><button class="btn pri" data-a="play" data-i="${i}" style="margin-top:6px">▶ Phát</button></div>`;
app.innerHTML=`<div class="hero"><h1>Create. Discover. Own. Share.</h1><p>SONORA kết nối nghe nhạc, sáng tác và mua bán trong một nơi. Học nhạc lý ở Academy, thực hành ngay trong Studio với trợ lý AI, rồi bán thành phẩm ở Chợ nhạc.</p><div class="bar2"><button class="btn pri" data-a="play" data-i="0">▶ Nghe ngay</button><a class="btn" href="#studio">🎹 Vào Studio</a><a class="btn" href="#academy">🎓 Học nhạc lý</a></div></div>
<div class="cards"><div class="card"><h3>🎧 Listen</h3><p class="mut">Trình phát liên tục, không dừng khi chuyển trang.</p></div><div class="card"><h3>🎓 Learn</h3><p class="mut">Nhạc lý từ cơ bản đến nâng cao, có bài tập.</p></div><div class="card"><h3>🎹 Create</h3><p class="mut">Beat Maker, Piano Roll và AI Music Assistant.</p></div><div class="card"><h3>🛒 Trade</h3><p class="mut">Bán beat với giấy phép rõ ràng.</p></div></div>
<h2>Dành cho bạn</h2><div class="chips">${['Tất cả','Buồn','Chill','Năng lượng','Vui'].map(m=>`<button class="chip${m==mood?' on':''}" data-a="mood" data-m="${m}">${m}</button>`).join('')}</div>
<div class="cards">${TR.map((t,i)=>({t,i})).filter(x=>mood=='Tất cả'||x.t.m==mood).map(x=>card(x.t,x.i)).join('')}</div>
<h2>Thịnh hành</h2><div class="card">${TR.map((t,i)=>`<div class="row" style="padding:6px 0"><b>${i+1}</b><span style="flex:1">${t.t} <span class="mut">– ${t.a}</span></span><button class="btn" data-a="play" data-i="${i}" aria-label="Phát ${t.t}">▶</button></div>`).join('')}</div>`}

/* ===== Studio + AI Assistant ===== */
let chat=[{r:'a',h:'Xin chào! Hãy mô tả bản nhạc bạn muốn (thể loại, tâm trạng, BPM, nhạc cụ). Mình sẽ gợi ý hợp âm, giai điệu, BPM, cấu trúc bài hát và áp dụng thẳng vào Studio.'}];
const cell=(k,r,i,x)=>`<i class="c${x?' on':''}${i%4?'':' b4'}" data-k="${k}" data-r="${r}" data-i="${i}"></i>`;
function cellTap(t){const r=+t.dataset.r,i=+t.dataset.i,m=t.dataset.k=='m',a=m?cg():ST.drums;a[r][i]^=1;t.classList.toggle('on');if(a[r][i]){ctx();m?ins(cI(),60+ST.key+SC[ST.mode][r%7]+12*(r/7|0),AC.currentTime,.25):drum(r,AC.currentTime)}}
function vStudio(){const n=ST.note,pl=Eng.own=='s'&&Eng.tm,sc=SC[ST.mode];
const dr=[['Kick',0],['Snare',1],['Hi-hat',2]].map(([l,r])=>`<div class="gr"><span>${l}</span>${ST.drums[r].map((x,i)=>cell('d',r,i,x)).join('')}</div>`).join('');
const roll=[7,6,5,4,3,2,1,0].map(d=>`<div class="gr"><span>${NN[(ST.key+sc[d%7])%12]}${d>6?'↑':''}</span>${cg()[d].map((x,i)=>cell('m',d,i,x)).join('')}</div>`).join('');
app.innerHTML=`<h1>Studio</h1><p class="mut">Bấm vào ô để thêm nốt hoặc nhịp, rồi nhấn Phát. Mỗi vòng lặp chạy một hợp âm.</p>${n?`<div class="note">🎓 ${n.t} <a href="#academy/${n.l}">Mở lại bài học</a></div>`:''}
<div class="g2"><section class="card"><div class="bar2"><button class="btn pri" id="sp" data-a="sp">${pl?'⏹ Dừng':'▶ Phát'}</button><label>BPM <input type="range" min="60" max="180" value="${ST.bpm}" data-in="bpm"> <b id="bv">${ST.bpm}</b></label>
<select data-in="key" aria-label="Tông">${NN.map((k,i)=>`<option value="${i}"${i==ST.key?' selected':''}>${k}</option>`).join('')}</select><select data-in="mode" aria-label="Điệu thức"><option value="maj"${ST.mode=='maj'?' selected':''}>Trưởng</option><option value="min"${ST.mode=='min'?' selected':''}>Thứ</option></select></div>
<h2>Hợp âm</h2><div class="bar2" id="chs">${ST.prog.map(c=>`<span class="cp">${cn(c,ST.key)}</span>`).join('')}</div>
<h2>Trống (Beat Maker)</h2><div class="sc">${dr}</div><h2>Piano Roll – ${cI().e} ${cI().n}</h2><div class="chips">${INS.map(I=>`<button class="chip${I.id==cI().id?' on':''}" data-a="ins" data-i="${I.id}">${I.e} ${I.n}${has(I)?' ●':''}</button>`).join('')}</div><div class="sc">${roll}</div>
<div class="bar2" style="margin-top:12px"><button class="btn" data-a="rm">🎲 Giai điệu mới</button><button class="btn" data-a="cl">🧹 Xoá giai điệu</button><a class="btn" href="#academy">🎓 Học nhạc lý</a></div><h2>Xuất bản nhạc</h2><div class="bar2"><input type="text" placeholder="Tên bản nhạc" value="${esc(X.t)}" data-in="xt"><select data-in="xb" aria-label="Số ô nhịp">${[4,8,16].map(b=>`<option value="${b}"${b==X.b?' selected':''}>${b} ô nhịp</option>`).join('')}</select><button class="btn pri" data-a="exp">⬇ Tải về (.zip: WAV + project)</button><a class="btn" href="#published">🛒 Đăng bán bản này</a></div><p class="fb" id="xs">Tải file về máy để đăng bán sau ở Chợ nhạc. Chỉ nên bán nhạc do chính bạn sáng tác và có đủ quyền sử dụng.</p></section>
<section class="card"><h2 style="margin-top:0">🤖 AI Music Assistant</h2><div id="chat"></div><div class="chips">${['Beat R&B buồn 90 BPM có piano','Lo-fi chill để học bài','Trap năng lượng 140 BPM','Pop vui tươi 116 BPM có guitar'].map(q=>`<button class="chip" data-a="ask" data-q="${q}">${q}</button>`).join('')}</div>
<div class="row"><input type="text" id="aq" placeholder="Mô tả bản nhạc bạn muốn…"><button class="btn pri" data-a="askIn">Gửi</button></div></section></div>`;renderChat()}
I.bpm=v=>{ST.bpm=+v;$('#bv').textContent=v};I.key=v=>{ST.key=+v;vStudio()};I.mode=v=>{ST.mode=v;vStudio()};
A.sp=()=>{if(Eng.own=='s'&&Eng.tm)Eng.stop();else Eng.play(ST,'s',sCb)};
A.rm=()=>{setG(rg());vStudio()};A.cl=()=>{cg().forEach(r=>r.fill(0));vStudio()};A.ins=d=>{ST.sel=d.i;vStudio()};
function sCb(e,i,l){const b=$('#sp');if(e=='start'&&b)b.textContent='⏹ Dừng';if(e=='stop'){b&&(b.textContent='▶ Phát');$$('.ph').forEach(x=>x.classList.remove('ph'));$$('#chs .on').forEach(x=>x.classList.remove('on'))}
if(e=='step'&&$('#chs')){$$('.ph').forEach(x=>x.classList.remove('ph'));$$(`.c[data-i="${i}"]`).forEach(x=>x.classList.add('ph'));$$('#chs .cp').forEach((x,k)=>x.classList.toggle('on',k==l%4))}}
function ai(q){const l=q.toLowerCase(),has=r=>r.test(l),sad=has(/buồn|sad|cô đơn|u sầu|2 giờ|mưa/),hap=has(/vui|happy|tươi|nắng|hạnh phúc/),chill=has(/chill|thư giãn|học|lo-?fi|yên/);
const g=has(/trap|rap|drill/)?'trap':has(/lo-?fi|học|chill/)?'lofi':has(/r&b|rnb|soul/)?'rnb':has(/pop|dance/)||hap?'pop':'rnb';
const prog=sad||g=='trap'?'sad':chill||g=='lofi'?'chill':g=='pop'?'pop':'rnb',mode=prog=='sad'?'min':'maj',m=l.match(/(\d{2,3})\s*bpm/);
const bpm=m?Math.max(50,Math.min(200,+m[1])):{trap:140,lofi:78,rnb:90,pop:116}[g],ks=mode=='min'?[9,2,4,6]:[0,7,5,2];
const ins=[[/piano/,'piano'],[/guitar/,'guitar'],[/bass/,'bass'],[/strings|dây/,'strings']].filter(x=>has(x[0])).map(x=>x[1]);
return{g,prog,mode,bpm,ins,key:ks[Math.floor(Math.random()*4)],lesson:'prog'}}
const STRUCT={trap:'Intro 4 → Hook 8 → Verse 16 → Hook 8 → Outro 4',lofi:'Intro 4 → A 16 → B 16 → A 16 → Outro 4',rnb:'Intro 4 → Verse 8 → Pre 4 → Hook 8 → Verse 2 8 → Hook 8 → Bridge 4 → Outro 4',pop:'Intro 4 → Verse 8 → Pre-chorus 4 → Chorus 8 → Verse 2 8 → Chorus 8 → Bridge 4 → Chorus 8'};
function aiCard(r,id){return`<b>${NN[r.key]} ${r.mode=='min'?'thứ':'trưởng'} · ${r.bpm} BPM · ${GL[r.g]}</b><p>Hợp âm: <b>${P[r.prog].map(c=>cn(c,r.key)).join(' – ')}</b></p><p>Giai điệu: ${r.mode=='min'?'dùng gam thứ tự nhiên, nhấn nốt chủ, ♭3 và 5 ở phách mạnh; kết câu về nốt chủ.':'dùng gam trưởng, nhấn bậc 1-3-5 ở phách mạnh; kết câu ở bậc 1 hoặc 5.'}</p><p>Cấu trúc (ô nhịp): ${STRUCT[r.g]}</p><p>Nhạc cụ gợi ý: ${r.ins.length?r.ins.join(', '):'piano, bass, trống nhẹ'}.</p><div class="bar2"><button class="btn pri" data-a="apply" data-n="${id}">Áp dụng vào Studio</button><a class="btn" href="#academy/prog">📚 Học: Tiến trình hợp âm</a></div>`}
function renderChat(){const c=$('#chat');c.innerHTML=chat.map(m=>`<div class="m ${m.r}">${m.h}</div>`).join('');c.scrollTop=c.scrollHeight}
function doAsk(q){const r=ai(q);chat.push({r:'u',h:esc(q)},{r:'a',h:aiCard(r,chat.length+1),res:r});renderChat();const a=$('#aq');if(a)a.value=''}
A.ask=d=>doAsk(d.q);A.askIn=()=>{const v=($('#aq').value||'').trim();if(v)doAsk(v)};
A.apply=d=>{const r=chat[+d.n].res;Object.assign(ST,mkState({bpm:r.bpm,key:r.key,mode:r.mode,prog:r.prog,dr:r.g,seed:Date.now()%998+1}));ST.note={t:'Áp dụng từ AI Music Assistant.',l:r.lesson};r.ins.forEach(x=>{const k={guitar:'gtr',bass:'bass',strings:'strings'}[x];if(k)setG(rg(),k)});vStudio()};

/* ===== Music Academy ===== */
const LS=[
{id:'notes',lv:'Cơ bản',t:'Nốt nhạc & quãng tám',b:['Có 7 nốt tự nhiên: C (Đô), D (Rê), E (Mi), F (Fa), G (Sol), A (La), B (Si). Sau B lại quay về C – đó là một quãng tám.','Một quãng tám có 12 nửa cung (tính cả phím đen). Hai nốt cạnh nhau thường cách một cung (2 nửa cung), riêng E–F và B–C chỉ cách nửa cung.'],hl:[0,2,4,5,7,9,11,12],pm:'s',ex:{q:'Bấm nốt E (Mi) trên đàn bên dưới.',a:[4]},qz:[{q:'Một quãng tám có bao nhiêu nửa cung?',o:['7','12','8'],a:1,e:'12 nửa cung, tính cả phím đen.'},{q:'Cặp nốt nào chỉ cách nhau nửa cung?',o:['C–D','E–F','G–A'],a:1,e:'E–F và B–C không có phím đen ở giữa.'}],st:{bpm:80,key:0,mode:'maj',prog:'pop',dr:'lofi',mel:'scale'},sn:'Thực hành: giai điệu đi lên qua 8 nốt của gam C trưởng.'},
{id:'scale',lv:'Cơ bản',t:'Gam trưởng & gam thứ',b:['Gam là dãy 7 nốt theo một công thức khoảng cách. Gam trưởng: cung–cung–nửa–cung–cung–cung–nửa, nghe sáng và vui (C trưởng: C D E F G A B).','Gam thứ tự nhiên: cung–nửa–cung–cung–nửa–cung–cung, nghe buồn và trầm (A thứ: A B C D E F G).'],hl:[0,2,4,5,7,9,11],pm:'s',ex:{q:'Bấm 7 nốt của gam C trưởng: C D E F G A B.',a:[0,2,4,5,7,9,11]},qz:[{q:'Gam nào thường nghe buồn hơn?',o:['Gam trưởng','Gam thứ'],a:1,e:'Gam thứ có ♭3 nên nghe tối hơn.'},{q:'Công thức gam trưởng (theo nửa cung)?',o:['2-2-1-2-2-2-1','2-1-2-2-1-2-2','1-2-2-1-2-2-2'],a:0,e:'Cung–cung–nửa–cung–cung–cung–nửa.'}],st:{bpm:90,key:9,mode:'min',prog:'sad',dr:'rnb',mel:'scale'},sn:'Thực hành: nghe giai điệu đi lên trong gam A thứ, rồi đổi sang Trưởng ở Studio để so sánh.'},
{id:'rhythm',lv:'Cơ bản',t:'Nhịp, BPM & ô nhịp',b:['BPM (beats per minute) là số phách trong một phút. 60 BPM là 1 phách mỗi giây; BPM càng lớn nhạc càng nhanh.','Nhịp 4/4 có 4 phách mỗi ô nhịp. Trong Studio, mỗi ô nhịp chia thành 16 bước. Kick thường rơi vào phách 1 và 3, snare vào phách 2 và 4.'],qz:[{q:'120 BPM nghĩa là gì?',o:['120 phách mỗi phút','120 phách mỗi giây','120 ô nhịp mỗi phút'],a:0,e:'BPM là số phách mỗi phút.'},{q:'Một ô nhịp 4/4 có mấy phách?',o:['3','4','8'],a:1,e:'Tử số 4 nghĩa là 4 phách.'}],st:{bpm:140,key:6,mode:'min',prog:'sad',dr:'trap'},sn:'Thực hành: kéo BPM từ 70 đến 150 và nghe cảm giác thay đổi.'},
{id:'chords',lv:'Trung cấp',t:'Hợp âm ba nốt',b:['Hợp âm được xây bằng cách chồng các nốt cách nhau một nốt trong gam: bậc 1 – 3 – 5.','Hợp âm trưởng = 1, 3 trưởng (4 nửa cung), 5: sáng (C–E–G). Hợp âm thứ = 1, ♭3 (3 nửa cung), 5: buồn (C–E♭–G).'],hl:[0,4,7],pm:'c',ex:{q:'Bấm hợp âm C thứ (Cm): C, E♭ (D#), G.',a:[0,3,7]},qz:[{q:'Cm gồm những nốt nào?',o:['C–E–G','C–E♭–G','C–F–G'],a:1,e:'Cm có quãng 3 thứ (E♭).'},{q:'Từ nốt gốc đến quãng 3 của hợp âm trưởng là mấy nửa cung?',o:['3','4','5'],a:1,e:'4 nửa cung (C đến E).'}],st:{bpm:100,key:0,mode:'maj',prog:'pop',dr:'pop',mel:'arp'},sn:'Thực hành: nghe 4 hợp âm lần lượt, giai điệu rải theo nốt 1-3-5.'},
{id:'prog',lv:'Nâng cao',t:'Tiến trình hợp âm & cấu trúc',b:['Tiến trình hợp âm là chuỗi hợp âm lặp lại làm nền cho bài hát. Phổ biến nhất: I – V – vi – IV (trong C trưởng: C – G – Am – F).','Bài hát thường gồm Intro, Verse, Pre-chorus, Chorus, Bridge, Outro. Verse giữ năng lượng thấp, Chorus cao nhất; hãy đổi hợp âm hoặc thêm lớp nhạc cụ giữa các phần.'],qz:[{q:'I–V–vi–IV trong C trưởng là?',o:['C–G–Am–F','C–F–G–Am','Am–F–C–G'],a:0,e:'I = C, V = G, vi = Am, IV = F.'},{q:'Phần nào thường có năng lượng cao nhất?',o:['Verse','Chorus','Intro'],a:1,e:'Chorus là điểm nhấn của bài.'}],st:{bpm:116,key:0,mode:'maj',prog:'pop',dr:'pop',mel:'arp'},sn:'Thực hành: mở Studio với tiến trình I–V–vi–IV, rồi nhờ AI Assistant tạo một tiến trình buồn để so sánh.'}];
const done=()=>{try{return JSON.parse(localStorage.getItem('sn-done')||'{}')}catch(e){return{}}};
let curL,qs;
function piano(hl,p){const W=[0,2,4,5,7,9,11,12],B=[[1,0],[3,1],[6,3],[8,4],[10,5]];return`<div class="pk">${W.map(s=>`<div class="k${hl.includes(s)?' hl':''}" data-s="${s}" data-p="${p}">${NN[s%12]}</div>`).join('')}${B.map(([s,w])=>`<div class="k bk${hl.includes(s)?' hl':''}" data-s="${s}" data-p="${p}" style="left:${(w+1)*12.5-3.5}%">${NN[s]}</div>`).join('')}</div>`}
function vAcademy(id){const l=LS.find(x=>x.id==id),d=done();
if(!l){const n=LS.filter(x=>d[x.id]).length;app.innerHTML=`<div class="hero"><h1>Music Academy</h1><p>Học nhạc lý từ cơ bản đến nâng cao với ví dụ trực quan, bài tập và kiểm tra. Học xong là sang Studio thực hành ngay.</p><p><b>Tiến độ: ${n}/${LS.length} bài</b></p></div><div class="cards">${LS.map((x,i)=>`<a class="card ct" href="#academy/${x.id}"><span class="tag">${x.lv}</span>${d[x.id]?'<span class="tag">✔ Đã hoàn thành</span>':''}<h3>${i+1}. ${x.t}</h3><p class="mut">${x.b[0].slice(0,80)}…</p></a>`).join('')}</div>`;return}
curL=l;qs={n:0,ok:0};const nx=LS[LS.indexOf(l)+1];
app.innerHTML=`<p><a href="#academy">← Tất cả bài học</a></p><span class="tag">${l.lv}</span><h1>${l.t}</h1>${l.b.map(x=>`<p>${x}</p>`).join('')}
<h2>Ví dụ trực quan</h2><div class="card">${l.hl?piano(l.hl,'demo'):l.id=='prog'?`<div class="bar2">${P.pop.map(c=>`<span class="cp">${cn(c,0)}</span>`).join('')}</div>`:'<p class="mut">Nhấn nút bên dưới để nghe một nhịp trống mẫu.</p>'}<button class="btn pri" data-a="demo" data-id="${l.id}">🔊 Nghe ví dụ</button></div>
${l.ex?`<h2>Bài tập</h2><div class="card"><p>${l.ex.q}</p>${piano([],'ex')}<button class="btn pri" data-a="chk" data-id="${l.id}">Kiểm tra</button> <button class="btn" data-a="rst">Làm lại</button><p id="exm" class="fb"></p></div>`:''}
<h2>Kiểm tra kiến thức</h2>${l.qz.map((q,n)=>`<div class="qq card"><p><b>${n+1}. ${q.q}</b></p>${q.o.map((o,j)=>`<button class="opt" data-a="ans" data-q="${n}" data-j="${j}">${o}</button>`).join('')}<p class="fb"></p></div>`).join('')}<p id="sc" class="fb"></p>
<h2>Thực hành trong Studio</h2><div class="card"><p>${l.sn}</p><button class="btn pri" data-a="study" data-id="${l.id}">🎹 Mở trong Studio</button></div>${nx?`<p><a href="#academy/${nx.id}">Bài tiếp theo: ${nx.t} →</a></p>`:''}`}
A.demo=d=>{const l=LS.find(x=>x.id==d.id);if(Eng.own=='d'&&Eng.tm)return Eng.stop();
if(l.hl){ctx();const t=AC.currentTime;l.hl.forEach((s,k)=>l.pm=='s'?note(60+s,t+k*.3,.6,'triangle',.25):note(60+s,t,1.5,'triangle',.2))}
else Eng.play(mkState({...l.st,seed:4}),'d',(e,i,lp)=>{if(e=='step'&&lp>=4)Eng.stop()})};
A.chk=d=>{const l=LS.find(x=>x.id==d.id),s=[...new Set($$('.k.sel').map(k=>+k.dataset.s%12))].sort((a,b)=>a-b),ok=JSON.stringify(s)==JSON.stringify([...new Set(l.ex.a.map(x=>x%12))].sort((a,b)=>a-b)),m=$('#exm');m.textContent=ok?'✔ Chính xác!':'✘ Chưa đúng, hãy thử lại.';m.className='fb '+(ok?'t-ok':'t-no')};
A.rst=()=>{$$('.k.sel').forEach(k=>k.classList.remove('sel'));$('#exm').textContent=''};
A.ans=(d,b)=>{const blk=b.closest('.qq');if(blk.dataset.d)return;blk.dataset.d=1;const q=curL.qz[+d.q],j=+d.j;blk.querySelectorAll('.opt').forEach((o,k)=>{if(k==q.a)o.classList.add('ok');else if(k==j)o.classList.add('no')});
const f=blk.querySelector('.fb');f.textContent=(j==q.a?'✔ Đúng. ':'✘ Chưa đúng. ')+q.e;f.className='fb '+(j==q.a?'t-ok':'t-no');qs.n++;if(j==q.a)qs.ok++;
if(qs.n==curL.qz.length){$('#sc').textContent=`Kết quả: ${qs.ok}/${qs.n}`+(qs.ok==qs.n?' – Xuất sắc! Hãy sang Studio để thực hành.':' – Hãy đọc lại bài và thử lần nữa.');if(qs.ok>=1){try{const x=done();x[curL.id]=1;localStorage.setItem('sn-done',JSON.stringify(x))}catch(e){}}}};
A.study=d=>{const l=LS.find(x=>x.id==d.id),s=l.st;Object.assign(ST,mkState({...s,seed:9}));
if(s.mel){ST.mel.forEach(r=>r.fill(0));if(s.mel=='scale')for(let q=0;q<8;q++)ST.mel[q][q*2]=1;else for(let i=0;i<16;i+=2)ST.mel[[0,2,4,2][i/2%4]][i]=1}
ST.note={t:l.sn,l:l.id};location.hash='#studio'};

/* ===== Marketplace ===== */
let gf='Tất cả',sq='',cart=[];const LIC=[['Basic',.4],['Premium',1],['Exclusive',4]];
function mk(){$('#mk').innerHTML=TR.map((t,i)=>({t,i})).filter(x=>(gf=='Tất cả'||x.t.g==gf)&&(x.t.t+x.t.a+x.t.g+x.t.m).toLowerCase().includes(sq.toLowerCase())).map(({t,i})=>`<div class="card tc"><div class="cov" style="background:${grad(t)}">♪</div><b>${t.t}</b><div class="mut">Producer: ${t.a}</div><div><span class="tag">${t.g}</span><span class="tag">${t.s.bpm} BPM</span><span class="tag">${NN[t.s.key]}${t.s.mode=='min'?'m':''}</span><span class="tag">${t.m}</span></div><select id="lc${i}" aria-label="Giấy phép" style="width:100%;margin:6px 0">${LIC.map((l,k)=>`<option value="${k}">${l[0]} – ${vnd(t.p*l[1])}</option>`).join('')}</select><div class="bar2"><button class="btn" data-a="play" data-i="${i}">▶ Nghe thử</button><button class="btn pri" data-a="buy" data-i="${i}">Thêm vào giỏ</button></div></div>`).join('')||'<p class="mut">Không tìm thấy sản phẩm phù hợp.</p>'}
function cbar(){const s=cart.reduce((a,c)=>a+(c.p||TR[c.i].p)*LIC[c.k][1],0);$('#cb').innerHTML=cart.length?`🛒 <b>${cart.length}</b> sản phẩm · Tổng <b>${vnd(s*(1-W.c/100))}</b>${W.c?` (đã giảm ${W.c}%)`:''} <button class="btn pri" data-a="co">Thanh toán</button> <button class="btn" data-a="cc">Xoá giỏ</button><p class="fb" id="cm"></p>`:'🛒 Giỏ hàng trống'}
function vMarket(){app.innerHTML=`<h1>Chợ nhạc</h1><p class="mut">Mua bán beat, instrumental, sample với giấy phép rõ ràng. Nghe thử trước khi mua.</p><div class="card" id="cb"></div><div class="bar2" style="margin-top:12px"><input type="text" placeholder="Tìm theo tên, nghệ sĩ, thể loại…" data-in="srch" value="${esc(sq)}" style="flex:1;min-width:200px"></div><div class="chips">${['Tất cả','R&B','Trap','Lo-fi','Pop'].map(g=>`<button class="chip${g==gf?' on':''}" data-a="gf" data-g="${g}">${g}</button>`).join('')}</div><div class="cards" id="mk"></div><h2>Cộng đồng đăng bán</h2><div class="cards" id="mc"><p class="mut">Đang tải…</p></div><div class="card" style="margin-top:14px"><b>Có nhạc của riêng bạn?</b><p class="mut">Đăng bán beat từ Studio và quản lý sản phẩm tại mục Published.</p><a class="btn pri" href="#published">➕ Đăng bán nhạc</a> <a class="btn" href="#studio">🎹 Làm beat</a></div><p class="fb">Giá chỉ để minh hoạ. Giấy phép cần quy định rõ quyền phát hành, kiếm tiền, phân phối, thời hạn và lãnh thổ; gói Exclusive không tự động chuyển nhượng toàn bộ bản quyền.</p>`;mk();cbar();lInit().then(cm)}
I.srch=v=>{sq=v;mk();cm()};A.gf=d=>{gf=d.g;vMarket()};A.buy=d=>{cart.push({i:+d.i,k:+$('#lc'+d.i).value});cbar()};A.cc=()=>{cart=[];cbar()};A.co=()=>{$('#cm').textContent=(W.c?`Đã áp dụng mã giảm ${W.c}%. `:'')+'Bản demo: cần kết nối VNPay, MoMo hoặc Stripe ở backend để hoàn tất thanh toán.';setW('c',0)};
/* ===== Đấu trường âm nhạc + Vòng quay may mắn + Kho điểm ===== */
function ld(k){try{return+localStorage.getItem('sn-'+k)||0}catch(e){return 0}}
const W={p:ld('p'),c:ld('c')};
function setW(k,v){W[k]=v;try{localStorage.setItem('sn-'+k,v)}catch(e){}}
const THEMES=['Tất cả','R&B','Lo-fi','Buồn','Chill'],COST=150,QN=5,QT=15000,SL=[10,0,0,20,0,0,5,0,0,0],G={ph:'lobby',th:'Tất cả',q:0,ok:0,spin:false,rot:0,msg:''};
const shf=a=>a.map(x=>[Math.random(),x]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function vArena(){if(G.ph=='play')G.ph='lobby';ra()}
function ra(){const sp=Math.floor(W.p/COST);
app.innerHTML=`<h1>Đấu trường âm nhạc</h1><p class="mut">Ai cũng có thể tham gia: nghe giai điệu, đoán tên bài, tích điểm và đổi lượt quay nhận mã giảm giá.</p>
<div class="card"><div class="bar2"><b>⭐ Kho điểm: ${W.p}</b><span class="tag">🎟 ${sp} lượt quay</span>${W.c?`<span class="tag">Mã giảm ${W.c}% (dùng ở Chợ nhạc)</span>`:''}</div><div class="pb"><i style="width:${Math.min(100,W.p/COST*100)}%"></i></div><p class="fb">Mỗi câu đoán đúng +2 điểm. Đủ ${COST} điểm đổi 1 lượt quay (mỗi lượt trừ ${COST} điểm).</p></div>
<div class="g2" style="margin-top:16px"><section class="card">${gm()}</section><section class="card">${wheel()}</section></div>`}
function gm(){if(G.ph=='lobby')return`<h2 style="margin-top:0">⚔️ Thi đoán nhạc</h2><p>Nghe giai điệu và chọn đúng tên bài trong ${QT/1000} giây. Mỗi vòng ${QN} câu.</p><p class="fb">Chọn chủ đề:</p><div class="chips">${THEMES.map(t=>`<button class="chip${t==G.th?' on':''}" data-a="th" data-t="${t}">${t}</button>`).join('')}</div><button class="btn pri" data-a="go">▶ Bắt đầu vòng chơi</button>`;
if(G.ph=='end')return`<h2 style="margin-top:0">Kết quả vòng chơi</h2><p><b>${G.ok}/${QN}</b> câu đúng · <b>+${G.ok*2} điểm</b> vào kho điểm.</p><div class="bar2"><button class="btn pri" data-a="go">🔁 Chơi lại</button><button class="btn" data-a="lob">Đổi chủ đề</button></div>`;
return`<div class="bar2"><b>Câu ${G.q+1}/${QN}</b><span class="tag">Chủ đề: ${G.th}</span><span class="tag">Đúng: ${G.ok}</span></div><div class="pb"><i id="tb"></i></div><p class="fb" id="tt">${QT/1000} giây</p><button class="btn" data-a="re">🔊 Nghe lại giai điệu</button><div style="margin-top:8px">${G.opts.map((o,j)=>`<button class="opt" data-a="pick" data-j="${j}">${o.t}</button>`).join('')}</div><p class="fb" id="fbk"></p>`}
function wheel(){const cols=SL.map((v,i)=>`${v?'var(--acc)':'var(--soft)'} ${i*36}deg ${i*36+36}deg`).join(',');
return`<h2 style="margin-top:0">🎡 Vòng quay may mắn</h2><div class="wh"><i class="pt"></i><div class="wd" id="wd" style="background:conic-gradient(${cols});transform:rotate(${G.rot}deg)">${SL.map((v,i)=>`<b${v?' class="pz"':''} style="transform:rotate(${i*36+18}deg) translateY(-100px)">${v?'-'+v+'%':'🍀'}</b>`).join('')}</div></div><div class="bar2"><button class="btn pri" data-a="spin"${W.p<COST||G.spin||G.ph=='play'?' disabled':''}>🎟 Quay (−${COST} điểm)</button></div><p class="fb" id="wr">${G.msg||'10 ô: 3 ô giảm giá (5%, 10%, 20%) và 7 ô chúc bạn may mắn lần sau.'}</p>`}
A.th=d=>{G.th=d.t;ra()};A.lob=()=>{G.ph='lobby';ra()};
A.go=()=>{G.ph='play';G.q=0;G.ok=0;G.last=-1;nq()};
A.re=()=>Eng.play(TR[G.c].st,'a',(e,i,l)=>{if(e=='step'&&l>=2)Eng.stop()});
function nq(){const all=TR.map((t,i)=>i),pool=all.filter(i=>(G.th=='Tất cả'||TR[i].g==G.th||TR[i].m==G.th)&&i!=G.last),c=pool[Math.floor(Math.random()*pool.length)];
G.last=G.c=c;G.opts=shf([c,...shf(all.filter(i=>i!=c)).slice(0,3)]).map(i=>({i,t:TR[i].t}));G.done=0;G.end=Date.now()+QT;clearInterval(G.iv);G.iv=setInterval(tick,200);ra();A.re()}
function tick(){const r=G.end-Date.now(),b=$('#tb'),t=$('#tt');if(b)b.style.width=Math.max(0,r/QT*100)+'%';if(t)t.textContent=Math.ceil(Math.max(0,r)/1000)+' giây';if(r<=0)fin(-1)}
A.pick=d=>fin(+d.j);
function fin(j){if(G.done)return;G.done=1;clearInterval(G.iv);Eng.stop();const ok=j>=0&&G.opts[j].i==G.c;
$$('.opt').forEach((o,k)=>{if(G.opts[k].i==G.c)o.classList.add('ok');else if(k==j)o.classList.add('no');o.disabled=true});
const f=$('#fbk');f.textContent=ok?'✔ Chính xác! +2 điểm':(j<0?'⏰ Hết giờ! ':'✘ Chưa đúng. ')+'Đáp án: '+TR[G.c].t;f.className='fb '+(ok?'t-ok':'t-no');
if(ok){G.ok++;setW('p',W.p+2)}
setTimeout(()=>{if(G.ph!='play'||location.hash!='#arena')return;if(++G.q>=QN){G.ph='end';ra()}else nq()},1600)}
A.spin=()=>{if(G.spin||G.ph=='play'||W.p<COST)return;setW('p',W.p-COST);G.spin=true;G.msg='';
const i=Math.floor(Math.random()*10),v=SL[i],tg=360-(i*36+18)+(Math.random()-.5)*24;G.rot+=1800+(((tg-G.rot)%360)+360)%360;
$('#wd').style.transform=`rotate(${G.rot}deg)`;$('[data-a=spin]').disabled=true;$('#wr').textContent='Đang quay…';
setTimeout(()=>{G.spin=false;if(v){if(v>W.c)setW('c',v);G.msg=`🎉 Chúc mừng! Bạn trúng mã giảm ${v}%. Mã được áp dụng khi thanh toán ở Chợ nhạc (giữ mã cao nhất).`}else G.msg='🍀 Chúc bạn may mắn lần sau!';if(location.hash=='#arena')ra()},4300)};
/* ===== Nhiều nhạc cụ + Xuất bản nhạc ===== */
const INS=[{id:'piano',n:'Piano',e:'🎹',w:'triangle',v:.16,a:.01,d:1.8,o:0,f:4000},{id:'gtr',n:'Guitar',e:'🎸',w:'sawtooth',v:.08,a:.003,d:1.6,o:0,f:2200},{id:'synth',n:'Synth',e:'🎛',w:'square',v:.06,a:.01,d:1.5,o:12,f:3000},{id:'strings',n:'Strings',e:'🎻',w:'sawtooth',v:.05,a:.12,d:3.5,o:0,f:1500},{id:'bass',n:'Bass',e:'🔊',w:'sine',v:.28,a:.01,d:2,o:-24,f:600},{id:'bell',n:'Bell',e:'🔔',w:'sine',v:.12,a:.002,d:3,o:24,f:8000},{id:'flute',n:'Flute',e:'🎶',w:'sine',v:.14,a:.06,d:2,o:12,f:5000}];
function ins(I,m,t,d){const o=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();o.type=I.w;o.frequency.value=440*2**((m+I.o-69)/12);f.type='lowpass';f.frequency.value=I.f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(I.v,t+I.a);g.gain.exponentialRampToValueAtTime(.0001,t+d*I.d);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+d*I.d+.05)}
const blank=()=>Array.from({length:8},()=>Array(16).fill(0)),cI=()=>INS.find(x=>x.id==ST.sel)||INS[0];
const cg=()=>{const k=cI().id;return k=='piano'?ST.mel:((ST.mx=ST.mx||{})[k]||(ST.mx[k]=blank()))};
const setG=(g,id=cI().id)=>{if(id=='piano')ST.mel=g;else(ST.mx=ST.mx||{})[id]=g};
function rg(r=Math.random){const g=blank();let d=2;for(let i=0;i<16;i+=2)if(r()<.7){d=Math.max(0,Math.min(7,d+Math.floor(r()*5)-2));g[d][i]=1}return g}
const has=I=>{const g=I.id=='piano'?ST.mel:(ST.mx||{})[I.id];return g&&g.some(r=>r.some(x=>x))};
const X={t:'',b:8};I.xt=v=>{X.t=v};I.xb=v=>{X.b=+v};
async function render(s,bars){const d=60/s.bpm/4,sr=44100,off=new OfflineAudioContext(2,Math.ceil((bars*16*d+1.5)*sr),sr),oa=AC,om=master;AC=off;master=off.createGain();master.gain.value=.7;master.connect(off.destination);
try{for(let L=0;L<bars;L++)for(let i=0;i<16;i++)Eng.sched(.05+(L*16+i)*d,i,L,-1,s)}finally{AC=oa;master=om}return off.startRendering()}
function wav(b){const ch=b.numberOfChannels,n=b.length,D=[...Array(ch).keys()].map(c=>b.getChannelData(c));let pk=0;D.forEach(a=>{for(let i=0;i<n;i++)pk=Math.max(pk,Math.abs(a[i]))});
const g=pk>.95?.95/pk:1,u=new Uint8Array(44+n*ch*2),dv=new DataView(u.buffer),w=(o,s)=>[...s].forEach((c,k)=>dv.setUint8(o+k,c.charCodeAt(0)));
w(0,'RIFF');dv.setUint32(4,36+n*ch*2,true);w(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,ch,true);dv.setUint32(24,b.sampleRate,true);dv.setUint32(28,b.sampleRate*ch*2,true);dv.setUint16(32,ch*2,true);dv.setUint16(34,16,true);w(36,'data');dv.setUint32(40,n*ch*2,true);
let o=44;for(let i=0;i<n;i++)for(let c=0;c<ch;c++){const x=Math.max(-1,Math.min(1,D[c][i]*g));dv.setInt16(o,x<0?x*32768:x*32767,true);o+=2}return u}
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})(),crc=u=>{let c=-1;for(let i=0;i<u.length;i++)c=crcT[(c^u[i])&255]^(c>>>8);return(c^-1)>>>0};
function zip(fs){const te=new TextEncoder(),ps=[],cd=[];let off=0;fs.forEach(f=>{const nm=te.encode(f.n),c=crc(f.d),h=new DataView(new ArrayBuffer(30)),e=new DataView(new ArrayBuffer(46));
h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint32(14,c,true);h.setUint32(18,f.d.length,true);h.setUint32(22,f.d.length,true);h.setUint16(26,nm.length,true);ps.push(h,nm,f.d);
e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x800,true);e.setUint32(16,c,true);e.setUint32(20,f.d.length,true);e.setUint32(24,f.d.length,true);e.setUint16(28,nm.length,true);e.setUint32(42,off,true);cd.push(e,nm);off+=30+nm.length+f.d.length});
const cs=cd.reduce((a,x)=>a+x.byteLength,0),en=new DataView(new ArrayBuffer(22));en.setUint32(0,0x06054b50,true);en.setUint16(8,fs.length,true);en.setUint16(10,fs.length,true);en.setUint32(12,cs,true);en.setUint32(16,off,true);return new Blob([...ps,...cd,en],{type:'application/zip'})}
A.exp=async()=>{const say=m=>{const e=$('#xs');if(e)e.textContent=m};
try{say('Đang tạo file…');
const buf=await render(ST,X.b),nm=(X.t||'beat').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'beat',
pj={app:'SONORA',title:X.t,bpm:ST.bpm,key:NN[ST.key],mode:ST.mode,prog:ST.prog,drums:ST.drums,mel:ST.mel,mx:ST.mx||{}},
z=zip([{n:nm+'.wav',d:wav(buf)},{n:nm+'-project.json',d:new TextEncoder().encode(JSON.stringify(pj))}]);
await dlSave(`SONORA_${nm}_${ST.bpm}BPM.zip`,z);say('✔ Đã tải về. Giải nén để lấy file WAV và project, sẵn sàng đăng bán.')}
catch(e){say(e&&e.code=='declined'?'Bạn đã huỷ tải file.':'Không tải được file ('+((e&&e.code)||'lỗi')+').')}};
/* ===== Đăng bán + Published (quản lý sản phẩm) ===== */
const LST={all:[],mine:[],uid:'',db:null,ready:0},PF={src:'studio',t:'',g:'R&B',pr:'500000',own:false};let CM=[];
async function lInit(){try{if(!LST.ready&&window.claude){const[db,us]=await Promise.all([claude.use('db'),claude.use('user')]);if(db&&us){LST.uid=String(await us.id());LST.db=db}}}catch(e){LST.db=null}LST.ready=1;await lLoad()}
async function lLoad(){let all=[];try{if(LST.db){(await LST.db.collection('listings').get()).docs.forEach(d=>(d.data().items||[]).forEach(x=>all.push({...x,o:d.id})));LST.mine=all.filter(x=>x.o==LST.uid)}else{LST.mine=JSON.parse(localStorage.getItem('sn-items')||'[]');all=LST.mine}}catch(e){}LST.all=all}
async function lSave(items){if(LST.db)await LST.db.doc('listings/'+LST.uid).set({items});else try{localStorage.setItem('sn-items',JSON.stringify(items))}catch(e){}await lLoad()}
const toSt=p=>({bpm:+p.bpm,key:typeof p.key=='number'?p.key:NN.indexOf(p.key),mode:p.mode,prog:p.prog,drums:p.drums,mel:p.mel,mx:p.mx||{}}),gi=id=>LST.mine.find(x=>x.id==id);
const okp=p=>{try{return p.bpm>=40&&p.bpm<=220&&(p.mode=='maj'||p.mode=='min')&&p.key>=0&&p.key<12&&p.prog.length==4&&p.prog.every(c=>c.length>=2&&c.length<=3&&c.every(Number.isFinite))&&p.drums.length==3&&p.drums.every(r=>r.length==16)&&p.mel.length==8&&p.mel.every(r=>r.length==16)&&Object.values(p.mx).every(g=>g.length==8&&g.every(r=>r.length==16))}catch(e){return false}};
const slug=s=>(s||'beat').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'beat';
I.pt=v=>{PF.t=v};I.pg=v=>{PF.g=v};I.pp=v=>{PF.pr=v.replace(/\D/g,'')};
function vPub(){app.innerHTML=`<h1>Published</h1><p class="mut">Đăng bán nhạc của bạn và quản lý các sản phẩm đã đăng.</p><div class="card"><h2 style="margin-top:0">➕ Đăng bán nhạc mới</h2><div class="chips"><button class="chip${PF.src=='studio'?' on':''}" data-a="psrc" data-s="studio">🎹 Bản đang làm trong Studio</button><button class="chip${PF.src=='file'?' on':''}" data-a="psrc" data-s="file">📄 Tải file project (.json)</button></div>${PF.src=='file'?'<p class="fb">Chọn file .json trong gói .zip xuất từ Studio.</p><input type="file" id="pf" accept=".json,application/json">':'<p class="fb">Đăng bản nhạc hiện tại trong Studio (BPM, hợp âm, trống và các nhạc cụ).</p>'}
<div class="bar2" style="margin:10px 0"><input type="text" placeholder="Tên bản nhạc" value="${esc(PF.t)}" data-in="pt"><select data-in="pg" aria-label="Thể loại">${['R&B','Trap','Lo-fi','Pop','Khác'].map(g=>`<option${g==PF.g?' selected':''}>${esc(g)}</option>`).join('')}</select><label>Giá Premium (đ) <input type="text" inputmode="numeric" value="${esc(PF.pr)}" data-in="pp" style="width:120px"></label></div>
<div class="chips"><button class="chip${PF.own?' on':''}" data-a="own">${PF.own?'✔ ':''}Tôi sở hữu đầy đủ quyền với bản nhạc này</button></div><button class="btn pri" data-a="pub">Đăng bán</button><p class="fb" id="ps">Giá Basic = 40% và Exclusive = 400% giá Premium.</p></div><h2>Sản phẩm của bạn</h2><div id="pl" class="fb">Đang tải…</div>`;lInit().then(plist)}
function plist(){const e=$('#pl');if(!e)return;const L=LST.mine.slice().sort((a,b)=>b.at-a.at);e.className='';
e.innerHTML=`<div class="note">${LST.db?'☁️ Đã đồng bộ tài khoản: sản phẩm đang bán hiển thị ở Chợ nhạc.':'💾 Chế độ cục bộ: sản phẩm chỉ lưu trên thiết bị này.'}</div>`+(L.length?`<div class="cards">${L.map(x=>`<div class="card itc"><b>${esc(String(x.t))}</b><div><span class="tag">${x.on?'● Đang bán':'○ Tạm gỡ'}</span><span class="tag">${esc(String(x.g))}</span><span class="tag">${+x.bpm} BPM</span></div><div class="row" style="margin:8px 0"><input type="text" value="${esc(String(x.t))}" aria-label="Tên"><input type="text" inputmode="numeric" value="${+x.price}" aria-label="Giá Premium" style="width:100px"></div><div class="bar2"><button class="btn" data-a="prv" data-id="${x.id}">▶ Nghe</button><button class="btn" data-a="upd" data-id="${x.id}">💾 Lưu</button><button class="btn" data-a="tgl" data-id="${x.id}">${x.on?'Gỡ xuống':'Đăng lại'}</button><button class="btn" data-a="dlp" data-id="${x.id}">⬇ WAV</button><button class="btn" data-a="del" data-id="${x.id}">🗑 Xoá</button></div></div>`).join('')}</div>`:'<p class="mut">Bạn chưa đăng sản phẩm nào.</p>')+'<p class="fb" id="pm"></p>'}
async function mut(fn,msg){const say=m=>{const e=$('#pm');if(e)e.textContent=m};try{await lSave(fn(LST.mine.map(x=>({...x}))));plist();say(msg)}catch(e){say('Không lưu được ('+((e&&e.code)||'lỗi')+').')}}
A.psrc=d=>{PF.src=d.s;vPub()};A.own=(d,b)=>{PF.own=!PF.own;b.classList.toggle('on',PF.own);b.textContent=(PF.own?'✔ ':'')+'Tôi sở hữu đầy đủ quyền với bản nhạc này'};
A.pub=async()=>{const say=m=>{const e=$('#ps');if(e)e.textContent=m},pr=Math.round(+PF.pr);
if(!PF.own)return say('Hãy xác nhận bạn sở hữu đầy đủ quyền với bản nhạc.');if(!PF.t.trim())return say('Hãy nhập tên bản nhạc.');if(!(pr>=10000))return say('Giá Premium tối thiểu 10.000đ.');
let st;try{if(PF.src=='studio')st=toSt(ST);else{const f=$('#pf').files[0];if(!f||f.size>2e6)return say('Hãy chọn file .json (tối đa 2 MB).');st=toSt(JSON.parse(await f.text()))}}catch(e){return say('File project không hợp lệ.')}
if(!okp(st)||!/1/.test(JSON.stringify([st.drums,st.mel,st.mx])))return say('Bản nhạc chưa hợp lệ hoặc còn trống.');
const x={id:'p'+Date.now().toString(36)+Math.floor(Math.random()*1e4),t:PF.t.trim().slice(0,80),g:PF.g,bpm:st.bpm,key:st.key,mode:st.mode,price:pr,on:true,at:Date.now(),p:JSON.stringify(st)};
try{await lInit();await lSave([...LST.mine,x]);PF.t='';PF.own=false;vPub();say('✔ Đã đăng bán! Sản phẩm xuất hiện trong danh sách bên dưới.')}catch(e){say('Không đăng được ('+((e&&e.code)||'lỗi')+'). Có thể bạn chưa có quyền ghi.')}};
A.upd=(d,b)=>{const[t,p]=b.closest('.itc').querySelectorAll('input'),pr=Math.round(+p.value.replace(/\D/g,''));if(!t.value.trim()||!(pr>=10000)){$('#pm').textContent='Tên không được trống, giá tối thiểu 10.000đ.';return}mut(a=>a.map(x=>x.id==d.id?{...x,t:t.value.trim().slice(0,80),price:pr}:x),'Đã lưu thay đổi.')};
A.tgl=d=>mut(a=>a.map(x=>x.id==d.id?{...x,on:!x.on}:x),'Đã cập nhật trạng thái.');
A.del=(d,b)=>{if(!b.dataset.c){b.dataset.c=1;b.textContent='Bấm lần nữa để xoá';return}mut(a=>a.filter(x=>x.id!=d.id),'Đã xoá sản phẩm.')};
A.prv=d=>{try{const x=LST.all.find(y=>y.id==d.id),s=JSON.parse(x.p);if(!okp(s))return;Eng.play(s,'m',(e,i,l)=>{if(e=='step'&&l>=4)Eng.stop()})}catch(e){}};
A.dlp=async d=>{const m=t=>{const q=$('#pm');if(q)q.textContent=t};try{const x=gi(d.id);const s=JSON.parse(x.p);if(!okp(s))return m('Dữ liệu bản nhạc không hợp lệ.');m('Đang tạo file…');const n=slug(x.t);
await dlSave(`SONORA_${n}.zip`,zip([{n:n+'.wav',d:wav(await render(s,8))},{n:n+'-project.json',d:new TextEncoder().encode(x.p)}]));m('✔ Đã tải về.')}catch(e){m(e&&e.code=='declined'?'Bạn đã huỷ tải file.':'Không tải được file.')}};
function cm(){const e=$('#mc');if(!e)return;CM=LST.all.filter(x=>x.on&&(gf=='Tất cả'||x.g==gf)&&(x.t+x.g).toLowerCase().includes(sq.toLowerCase()));
e.innerHTML=CM.map((x,n)=>`<div class="card tc"><div class="cov" style="background:${grad({h:[...String(x.t)].reduce((a,c)=>a+c.charCodeAt(0),0)%360})}">♪</div><b>${esc(String(x.t))}</b><div class="mut">Producer cộng đồng${x.o==LST.uid?' (bạn)':''}</div><div><span class="tag">${esc(String(x.g))}</span><span class="tag">${+x.bpm} BPM</span><span class="tag">${NN[x.key]||''}${x.mode=='min'?'m':''}</span></div><select id="lcx${n}" aria-label="Giấy phép" style="width:100%;margin:6px 0">${LIC.map((l,k)=>`<option value="${k}">${l[0]} – ${vnd(+x.price*l[1])}</option>`).join('')}</select><div class="bar2"><button class="btn" data-a="prv" data-id="${x.id}">▶ Nghe thử</button><button class="btn pri" data-a="buyc" data-n="${n}">Thêm vào giỏ</button></div></div>`).join('')||'<p class="mut">Chưa có sản phẩm cộng đồng nào phù hợp.</p>'}
A.buyc=d=>{const x=CM[+d.n];cart.push({i:0,p:+x.price,k:+$('#lcx'+d.n).value});cbar()};
route();
