
'use strict';
/* ---------- Helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2=n=>Math.round((+n||0)*100)/100;
const aed=n=>r2(n).toLocaleString('en-US',{maximumFractionDigits:2})+' AED';
const toMin=s=>{const[h,m]=String(s).split(':').map(Number);return h*60+(m||0)};
const hm=m=>{m=((Math.round(m)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const TZ=4*3600e3;
let TODAY=new Date(Date.now()+TZ).toISOString().slice(0,10);
let MONTH=TODAY.slice(0,7);
const addDays=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*864e5).toISOString().slice(0,10);
const fmtD=d=>!d?'—':new Date(d+'T12:00:00Z').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});
const fmtLong=d=>!d?'date à définir':new Date(d+'T12:00:00Z').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
const monthLbl=m=>new Date(m+'-15T12:00:00Z').toLocaleDateString('fr-FR',{month:'long',year:'numeric',timeZone:'UTC'});
const digits=p=>String(p||'').replace(/\D/g,'').replace(/^00/,'');
const T0=Date.now(),START=16*60+48; // horloge de démo : 16:48 à l'ouverture
const now=()=>STORE.demo?START+Math.floor((Date.now()-T0)/60000):Math.floor(((Date.now()+TZ)%864e5)/60000);
const uid=()=>(window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
const ic=(n,c='')=>`<svg class="ico ${c}"><use href="#i-${n}"/></svg>`;
const carSvg=`<svg viewBox="0 0 64 40"><use href="#i-car"/></svg>`;
function toast(t){const d=document.createElement('div');d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),3200)}
function copyText(t,btn){try{navigator.clipboard.writeText(t).then(()=>toast('Copié'),()=>toast('Sélectionne le texte et copie-le'))}catch(e){toast('Sélectionne le texte et copie-le')}}
let rnd=7;const R=()=>{rnd=(rnd*9301+49297)%233280;return rnd/233280};const pick=a=>a[Math.floor(R()*a.length)];

/* ---------- Catalogue Wild Adventures ---------- */
const ACT={
  MR4:{name:'Maverick R 240 CV · 4 places',short:'Maverick R 4p',p:{60:1800,120:3200},seats:4,rank:9,fleet:'buggy',tier:'VIP'},
  MR2:{name:'Maverick R 240 CV · 2 places',short:'Maverick R 2p',p:{60:1600,120:3000},seats:2,rank:8,fleet:'buggy',tier:'VIP'},
  X34:{name:'Maverick X3 Turbo 200 CV · 4 places',short:'X3 Turbo 4p',p:{60:1500,120:2400},seats:4,rank:7,fleet:'buggy',tier:'Best seller'},
  X32:{name:'Maverick X3 Turbo 200 CV · 2 places',short:'X3 Turbo 2p',p:{60:1300,120:2200},seats:2,rank:6,fleet:'buggy',tier:'Best seller'},
  SP4:{name:'Maverick Sport 95 CV · 4 places',short:'Sport 4p',p:{60:1200,120:2000},seats:4,rank:5,fleet:'buggy',tier:'Good deal'},
  SP2:{name:'Maverick Sport 95 CV · 2 places',short:'Sport 2p',p:{60:950,120:1800},seats:2,rank:4,fleet:'buggy',tier:'Good deal'},
  GRZ:{name:'Grizzly 350cc · 2 pers.',short:'Grizzly 350',p:{60:350,120:550},seats:2,rank:1,fleet:'quad',tier:'Automatic'},
  OUT:{name:'Can-Am Outlander 650cc · 1 pers.',short:'Outlander 650',p:{60:500,120:800},seats:1,rank:2,fleet:'quad',tier:'Automatic'},
  RAP:{name:'Raptor 700cc · 1 pers.',short:'Raptor 700',p:{60:500,120:800},seats:1,rank:3,fleet:'quad',tier:'Manual'},
  KTM:{name:'KTM 450cc · 1 pers.',short:'KTM 450',p:{60:550,120:850},seats:1,rank:3,fleet:'bike',tier:'Manual',gear:true}};
const TIERS=[['VIP','buggy'],['Best seller','buggy'],['Good deal','buggy'],['Automatic','quad'],['Manual','quad']];
const INCL={buggy:'Inclus : rafraîchissement, protection, musique, sandboard',quad:'Inclus : rafraîchissement, protection',bike:'Inclus : rafraîchissement, protection'};
const priceOf=(m,d)=>ACT[m].p[d]??null;
const SIZES=['XS','S','M','L','XL','XXL'],BOOTS=Array.from({length:12},(_,i)=>String(36+i));
const DEMANDS=['Débutant','Enfant','Siège bébé','Anniversaire','Coucher de soleil dans les dunes','Végétarien','Photos / vidéo'];
const SAFARI={adult:['Safari adulte',350],vip:['Safari adulte VIP',450],child:['Safari enfant',250],baby:['Safari bébé',0],private:['Safari voiture privée (5 pers.)',1500]};
const OPTIONS={transport:['Transport aller-retour',500],bbq:['Barbecue',150],breakfast:['Breakfast morning',120],gopro:['Photos & vidéo GoPro',150],camel:['Balade à dos de chameau',50],tent:['Tente VIP privée',300]};
const STORAGE={buggy:{name:'Buggy',storage:1500,wash:2000,cap:20},quad:{name:'Quad',storage:800,wash:1200,cap:12},bike:{name:'Dirt bike',storage:500,wash:800,cap:8}};
const STORAGE_SERVICES={bbq:'Location BBQ livrée dans les dunes',setup:'Installation tente + assises + BBQ dans les dunes'};
const CFG={member:20,ext:650,pre:30,late:15,aiOn:true,reviewUrl:'',ownerWa:'',feedbackAgents:true};
const PAYMODES={agent:"Payé à l'agent",site:'Payé sur le site',lien:'Payé par lien',cash:'Sur place · espèces',card:'Sur place · carte'};
const PAYSHORT={agent:'Agent',site:'Site',lien:'Lien',cash:'Espèces',card:'Carte'};
const CHANNELS=['WhatsApp','Site web','Téléphone','Sur place','Agent / plateforme'];

/* ---------- État ---------- */
const S={role:'owner',view:'dashboard',dashTab:'owner',guideTab:'home',guideName:'Calvin',agPer:'month',agYear:TODAY.slice(0,4),bkDay:TODAY,bkF:'all',bkQ:'',bkDet:'',F:null,clTab:'all',stockTab:'parts',agMonth:MONTH,seq:40,lost:1500,saved:2600,closings:[],waConvs:[],waMsgs:[],waSel:null,
  agents:{a0:{id:'a0',name:'Viator',pct:20,phone:''},a1:{id:'a1',name:'GetYourGuide',pct:25,phone:''},a2:{id:'a2',name:'Karim Tours',pct:20,phone:'+971 55 000 0000'},a3:{id:'a3',name:'Hôtel Palm Concierge',pct:15,phone:'+971 4 555 0101'},a4:{id:'a4',name:'Desert Concierge',pct:10,phone:'+971 52 333 4455'}},
  settlements:[],clients:[],bookings:[],storage:[],services:[],incidents:[],maintLog:[],
  expenses:[{amount:2400,cat:'Carburant',sup:'ADNOC',method:'card',veh:''},{amount:1850,cat:'Pièces détachées',sup:'Polaris Gulf',method:'card',veh:'R2-02'},{amount:640,cat:'Wild Coffee',sup:'Al Ain Farms',method:'cash',veh:''},{amount:300,cat:'Nettoyage',sup:'Clean Pro',method:'cash',veh:''}],
  staff:[
    {name:'Calvin',role:'guide',shift:'08-20',status:'present',in:'07:58'},{name:'Nazmul',role:'guide',shift:'08-20',status:'present',in:'07:55'},
    {name:'Ahmed',role:'guide',shift:'10-22',status:'late',in:'10:14',late:14},{name:'Karim',role:'guide',shift:'08-20',status:'present',in:'07:50'},
    {name:'Yusuf',role:'guide',shift:'12-00',status:'present',in:'11:57'},{name:'Omar',role:'guide',shift:'10-22',status:'present',in:'09:56'},
    {name:'Jamshir',role:'guide',shift:'15-00',status:'break',in:'14:58',until:'17:00'},{name:'Ali S.',role:'guide',shift:'—',status:'off'},
    {name:'Sara',role:'reception',shift:'08-20',status:'present',in:'07:45'},{name:'Rafiq',role:'mechanic',shift:'08-18',status:'present',in:'07:40'},
    {name:'Yasmine',role:'manager',shift:'09-21',status:'present',in:'08:52'},{name:'Joy',role:'coffee',shift:'07-19',status:'present',in:'06:55'}],
  stock:{
    parts:[['Courroie',4,3],['Filtre à huile',12,5],['Bras avant',3,3],['Plaquettes de frein',8,4],['Huile moteur (L)',40,16],['Graisse',6,2],['Filtre à air',9,4]],
    coffee:[['Café en grains (kg)',6,4],['Lait (L)',18,12],['Croissants',24,30],['Eau (packs)',22,15],['Soft drinks',96,48]],
    camp:[['Grills BBQ',6,4],['Charbon (sacs)',14,10],['Tentes',3,2],['Coussins & assises (lots)',5,3],['Lanternes',30,20]],
    cleaning:[['Shampoing carrosserie',5,2],['Microfibres',30,20],['Dégraissant',2,3]]},
  tasks:[{who:'Calvin',time:'08:30',name:'Contrôle véhicules',done:true,photo:true},{who:'Calvin',time:'09:00',name:'Espace enfants',done:false,photo:true},{who:'Calvin',time:'10:00',name:'Lavage machines stockées (abonnés lavage)',done:false,photo:true},{who:'Calvin',time:'15:30',name:'Nettoyage zone briefing',done:false,photo:true},{who:'Calvin',time:'18:30',name:'Rangement casques',done:false,photo:false}]};
const V=(id,model,hours,svcAt,status,o={})=>({id,model,hours,svcAt,status,svcType:o.t||'Service normal',rev:o.rev||0,rides:o.rides||0,maint:o.maint||0,dmg:o.dmg||0});
S.vehicles=[
  V('MR4-01','MR4',212.7,250,'available',{rev:396000,rides:224,maint:28600,dmg:9300}),V('MR4-02','MR4',198.3,200,'available',{t:'Courroie',rev:371000,rides:209,maint:24400,dmg:11200}),
  V('MR2-01','MR2',248.2,250,'available',{rev:452000,rides:312,maint:31400,dmg:18700}),V('MR2-02','MR2',289.6,290,'maintenance',{t:'Freins',rev:478000,rides:330,maint:30100,dmg:15200}),
  V('X4-01','X34',540.1,550,'available',{rev:598000,rides:402,maint:48900,dmg:17600}),V('X4-02','X34',488.0,500,'available',{rev:551000,rides:380,maint:41000,dmg:9900}),
  V('X2-01','X32',620.5,625,'available',{rev:701000,rides:571,maint:61200,dmg:22400}),V('X2-02','X32',455.3,500,'cleaning',{rev:559000,rides:430,maint:38700,dmg:14100}),
  V('X2-03','X32',402.6,450,'available',{rev:488000,rides:394,maint:33500,dmg:6200}),V('X2-04','X32',411.3,450,'repair',{rev:512000,rides:441,maint:52300,dmg:41800}),
  V('SP4-01','SP4',324.2,332.4,'available',{rev:301000,rides:288,maint:24800,dmg:8100}),V('SP4-02','SP4',290.0,300,'available',{rev:276000,rides:262,maint:21900,dmg:5300}),
  V('SP2-01','SP2',310.4,350,'available',{rev:254000,rides:302,maint:19800,dmg:4100}),V('SP2-02','SP2',344.9,350,'available',{rev:271000,rides:322,maint:20500,dmg:6900}),
  V('SP2-03','SP2',280.0,300,'available',{rev:229000,rides:275,maint:16200,dmg:2800}),
  V('GRZ-01','GRZ',301.2,350,'available',{rev:104000,rides:292,maint:12100,dmg:5200}),V('GRZ-02','GRZ',265.5,300,'available',{rev:93000,rides:260,maint:10900,dmg:3300}),
  V('GRZ-03','GRZ',199.8,250,'available',{rev:72000,rides:207,maint:7600,dmg:1200}),V('GRZ-04','GRZ',248.1,250,'available',{rev:88000,rides:251,maint:9400,dmg:2600}),
  V('OUT-01','OUT',230.4,250,'available',{rev:121000,rides:240,maint:11800,dmg:3100}),V('OUT-02','OUT',176.9,200,'available',{rev:96000,rides:188,maint:8700,dmg:2200}),
  V('RAP-01','RAP',310.6,350,'available',{rev:139000,rides:276,maint:15100,dmg:6900}),V('RAP-02','RAP',284.2,300,'available',{rev:127000,rides:251,maint:13600,dmg:4800}),
  V('KTM-01','KTM',190.4,200,'available',{t:'Chaîne',rev:118000,rides:196,maint:11200,dmg:4400}),V('KTM-02','KTM',156.0,200,'available',{rev:93000,rides:155,maint:8100,dmg:2900})];

/* ---------- Registre clients (clé = téléphone) ---------- */
function demoClients(){[['Khalid Al Mansoori','+971 50 222 1188','Émirats',true],['Rami Haddad','+961 3 456 789','Liban',true],['Saeed Al Falasi','+971 56 410 7720','Émirats',true],['Tom Becker','+971 52 908 1144','Allemagne',true],
 ['John Smith','+971 50 123 4567','Royaume-Uni',false],['Claire Martin','+33 6 12 34 56 78','France',false],['Omar Ali','+971 55 987 6543','Émirats',false],['Paul Dupont','+33 7 55 44 33 22','France',false],
 ['Emma Johnson','+44 7700 900123','Royaume-Uni',false],['Ivan Petrov','+7 916 555 0101','Russie',false],['Anna Kowalski','+48 601 234 567','Pologne',false],['Linh Nguyen','+84 90 123 4567','Vietnam',false],
 ['Lukas Weber','+49 151 2345 678','Allemagne',false],['Sophie Laurent','+33 6 98 76 54 32','France',false],['Chen Wei','+86 138 0000 0000','Chine',false],['Elena Rossi','+39 333 123 4567','Italie',false],
 ['Fatima Zahra','+212 661 234 567','Maroc',false],['Mehdi Benali','+971 58 777 2211','Émirats',false]]
 .forEach(([name,phone,country,member])=>S.clients.push({name,phone,country,member,memberSince:member?'2026-08':'',notes:''}))}
const client=p=>S.clients.find(c=>digits(c.phone)===digits(p));

/* ---------- Stockage ---------- */
function demoStorage(){[['+971 50 222 1188','Can-Am X3 RS (noir)','buggy','wash','B-03','2026-06-01',MONTH],['+961 3 456 789','Yamaha Raptor 700','quad','storage','Q-02','2026-07-15',MONTH],
 ['+971 56 410 7720','Polaris RZR Pro R','buggy','storage','B-07','2026-08-01',addDays(TODAY,-40).slice(0,7)],['+971 52 908 1144','KTM 350 EXC-F','bike','wash','M-01','2026-09-10',MONTH],
 ['+971 50 222 1188','KTM 250 SX','bike','storage','M-04','2026-10-01',addDays(TODAY,-35).slice(0,7)]]
 .forEach(([phone,vehicle,type,plan,spot,start,paidThrough],i)=>S.storage.push({id:'ST'+(i+1),phone,vehicle,type,plan,spot,start,paidThrough,locker:true,payments:[],active:true}));
S.services.push({id:'SV1',phone:'+971 50 222 1188',service:'setup',date:addDays(TODAY,2),time:'15:00',price:1800,paid:false,note:'8 personnes, coucher de soleil'});
S.services.push({id:'SV2',phone:'+971 52 908 1144',service:'bbq',date:addDays(TODAY,-3),time:'17:00',price:450,paid:true,note:''});S.expenses.forEach(e=>e.date=TODAY)}
const stMonthly=s=>STORAGE[s.type][s.plan];
const stDue=s=>s.active&&s.paidThrough<MONTH;

/* ---------- Bookings ---------- */
function mkB(o){const b=Object.assign({date:TODAY,dur:60,items:{},safari:{},sunit:{},options:[],oprice:{},unit:{},gear:{},demands:[],arrivedAt:null,alerted:{},member:false,agentId:'',pct:0,channel:'WhatsApp',pays:[],vehicles:[],guide:'',contract:false,briefing:false,status:'up',ext:{},after:null,history:[],notes:''},o);
  if(Array.isArray(b.gear))b.gear=b.gear.length?{KTM:b.gear}:{};b.demands=b.demands.map(d=>typeof d==='string'?{tag:d,detail:''}:d);
  const c=client(b.phone);if(c){if(!b.client)b.client=c.name;if(o.member===undefined)b.member=c.member}
  if(b.agentId&&S.agents[b.agentId]){if(o.pct==null)b.pct=S.agents[b.agentId].pct;b.channel='Agent / plateforme'}
  if(!b.num)b.num='WA-'+b.date.slice(2).replace(/-/g,'')+'-'+String(S.bookings.filter(x=>x.date===b.date).length+1).padStart(2,'0');
  b.id=b.id||uid();if(!b.history.length)b.history.push({t:b.date===TODAY?hm(now()):'—',x:'Booking créé · '+(b.agentId?'agent '+S.agents[b.agentId].name:b.channel)});return b}
const sPrice=(b,k)=>b.sunit?.[k]??SAFARI[k][1];
const oPrice=(b,k)=>b.oprice?.[k]??OPTIONS[k][1];
const P=(mode,amount)=>({mode,amount,at:'—'});
const isSafari=b=>Object.values(b.safari).some(q=>q>0);
const fleetItems=b=>Object.entries(b.items).filter(([,q])=>q>0);
const unitOf=(b,m)=>b.unit[m]??priceOf(m,b.dur)??0;
function calc(b){
  const act=r2(fleetItems(b).reduce((s,[m,q])=>s+unitOf(b,m)*q,0)+Object.entries(b.safari).reduce((s,[k,q])=>s+sPrice(b,k)*q,0));
  const disc=b.member?r2(act*CFG.member/100):0, actNet=r2(act-disc);
  const opt=r2(b.options.reduce((s,k)=>s+oPrice(b,k),0));
  const total=r2(actNet+opt), pct=b.agentId?+b.pct||0:0;
  const agentPart=r2(actNet*pct/100), wildPart=r2(total-agentPart);
  const by=m=>r2(b.pays.filter(p=>p.mode===m).reduce((s,p)=>s+p.amount,0));
  const paidAgent=by('agent'),paid=r2(b.pays.reduce((s,p)=>s+p.amount,0));
  const rest=['cancelled','noshow'].includes(b.status)?0:r2(Math.max(0,total-paid));
  return{act,disc,actNet,opt,total,pct,agentPart,wildPart,paidAgent,paid,rest,agentOwes:r2(paidAgent-agentPart),by};
}
function svcLabel(b){return [...fleetItems(b).map(([m,q])=>ACT[m].short+(q>1?' ×'+q:'')),...Object.entries(b.safari).filter(([,q])=>q).map(([k,q])=>({adult:'Safari',vip:'Safari VIP',child:'Safari enfant',baby:'Bébé',private:'Safari privé'}[k])+(q>1?' ×'+q:''))].join(' + ')||'—'}
const guestsOf=b=>fleetItems(b).reduce((s,[m,q])=>s+q,0)+Object.entries(b.safari).reduce((s,[k,q])=>s+(k==='private'?4*q:q),0);
const durOf=b=>isSafari(b)&&!fleetItems(b).length?360:b.dur;
const live=b=>!['cancelled','noshow','draft'].includes(b.status);

/* Données de démonstration : historique ~5 semaines + journée en cours */
function seedDemo(){
  const names=S.clients.map(c=>c.phone);const ags=['','','','a0','a1','a2','a3','a4'];
  const kinds=[{items:{SP2:1}},{items:{X32:1}},{items:{X34:1}},{items:{GRZ:2}},{items:{OUT:1}},{items:{RAP:1}},{items:{MR2:1}},{items:{MR4:1}},{items:{SP4:1}},{items:{KTM:1}},{safari:{adult:2}},{safari:{adult:2,child:1}},{safari:{vip:2}},{safari:{private:1}},{items:{X32:2}}];
  const days=Math.round((Date.parse(TODAY)-Date.parse(TODAY.slice(0,4)+'-01-01'))/864e5);
  for(let d=days;d>=1;d--){const date=addDays(TODAY,-d);const n=d<=35?4+Math.floor(R()*5):2+Math.floor(R()*3);
    for(let i=0;i<n;i++){const k=pick(kinds),ag=pick(ags),ph=pick(names);const b=mkB({date,time:pick(['08:00','09:30','15:00','15:30','16:00','16:30']),dur:R()<.25?120:60,phone:ph,items:{...(k.items||{})},gear:k.items?.KTM?[{helmet:pick(SIZES),suit:pick(SIZES),boots:pick(BOOTS)}]:[],safari:{...(k.safari||{})},options:R()<.35?[pick(Object.keys(OPTIONS))]:[],agentId:ag,channel:ag?'':pick(['WhatsApp','Site web','Téléphone','Sur place']),status:R()<.05?'cancelled':'done',contract:true,briefing:true,guide:pick(['Calvin','Nazmul','Karim','Omar'])});
      const c=calc(b);if(b.status==='done'){if(ag&&R()<.7)b.pays=[P('agent',c.total)];else if(ag)b.pays=[P('lien',Math.min(500,c.total)),P('cash',c.total-Math.min(500,c.total))];else b.pays=[P(pick(['card','cash','site','lien']),c.total)];
        b.after={mood:R()<.82?'content':R()<.5?'moyen':'mecontent',accident:R()<.04?'oui':'non',review:R()<.55?'faite':R()<.6?'relancer':'pas',note:''}}
      S.bookings.push(b)}}
  const T=(o)=>S.bookings.push(mkB(o));
  T({time:'09:00',phone:'+49 151 2345 678',items:{MR2:1},agentId:'a0',pays:[P('agent',1600)],vehicles:['MR2-01'],guide:'Calvin',contract:true,briefing:true,status:'done',after:{mood:'content',accident:'non',review:'faite',note:''}});
  T({time:'09:30',phone:'+971 50 222 1188',items:{X32:2},options:['gopro'],pays:[P('card',2230)],vehicles:['X2-01','X2-03'],guide:'Nazmul',contract:true,briefing:true,status:'done',after:{mood:'content',accident:'non',review:'relancer',note:'Membre, est venu avec un ami'}});
  T({time:'15:40',phone:'+961 3 456 789',items:{SP2:1,SP4:1},agentId:'a2',pays:[P('agent',1720)],vehicles:['SP2-01','SP4-01'],guide:'Yusuf',contract:true,briefing:true,status:'riding',startMin:toMin('15:40'),endMin:toMin('16:40')});
  T({time:'16:20',phone:'+48 601 234 567',items:{X32:1},agentId:'a1',pays:[P('agent',1300)],vehicles:['X2-03'],guide:'Karim',contract:true,briefing:true,status:'riding',startMin:toMin('16:20'),endMin:toMin('17:20')});
  T({time:'16:30',phone:'+84 90 123 4567',items:{GRZ:1},channel:'Sur place',pays:[P('cash',350)],vehicles:['GRZ-04'],guide:'Omar',contract:true,briefing:true,status:'riding',startMin:toMin('16:30'),endMin:toMin('17:30'),demands:['Débutant']});
  T({time:'16:50',phone:'+971 50 123 4567',items:{SP2:2},channel:'WhatsApp',pays:[P('lien',1900)],vehicles:['SP2-02'],guide:'Calvin',contract:true,briefing:true,demands:[{tag:'Anniversaire',detail:'30 ans de John'}],arrivedAt:toMin('16:44')});
  T({time:'17:00',phone:'+33 6 12 34 56 78',items:{X34:1},options:['transport'],agentId:'a3',pays:[P('agent',500)],vehicles:['X4-01'],contract:true,briefing:true});
  T({time:'17:10',phone:'+971 55 987 6543',items:{OUT:1},channel:'Téléphone',pays:[P('lien',500)],vehicles:['OUT-01'],guide:'Nazmul',contract:true,briefing:true,arrivedAt:toMin('16:40')});
  T({time:'17:20',phone:'+33 7 55 44 33 22',items:{GRZ:3},agentId:'a1',pays:[P('agent',1050)],vehicles:['GRZ-01','GRZ-02','GRZ-03'],guide:'Ahmed',contract:true,briefing:false});
  T({time:'17:30',phone:'+86 138 0000 0000',items:{KTM:2},agentId:'a2',pays:[P('agent',1100)],vehicles:['KTM-01','KTM-02'],contract:true,briefing:false,gear:[{helmet:'M',suit:'L',boots:'42'},{helmet:'S',suit:'M',boots:''}],demands:[{tag:'Débutant',detail:'première fois sur une moto'}],arrivedAt:toMin('16:46')});
  T({time:'15:00',phone:'+44 7700 900123',safari:{adult:2,child:1},options:['bbq'],channel:'Site web',pays:[P('site',1100)],guide:'Omar',contract:true,briefing:true,dur:360,status:'riding',startMin:toMin('15:00'),endMin:toMin('21:00'),demands:['Coucher de soleil dans les dunes','Enfant']});
  T({time:'17:15',phone:'+971 56 410 7720',items:{MR2:1},channel:'WhatsApp',pays:[]});
  T({time:'16:15',phone:'+971 58 777 2211',items:{GRZ:2},channel:'WhatsApp',pays:[P('lien',350)],contract:false,briefing:false});
  T({time:'18:00',phone:'+7 916 555 0101',safari:{private:1},options:['transport'],agentId:'a4',pays:[P('agent',500)],dur:360});
  T({time:'18:30',phone:'+212 661 234 567',items:{RAP:1},dur:120,channel:'Site web',pays:[P('site',800)]});
  [[1,'15:00','+39 333 123 4567',{X34:1},{},'a1'],[1,'09:00','+49 151 2345 678',{KTM:1},{},'a2'],[2,'16:00','+971 58 777 2211',{MR4:1},{},''],[3,'15:00','+33 6 98 76 54 32',{},{vip:2},'a0']]
   .forEach(([dd,time,phone,items,safari,ag])=>T({date:addDays(TODAY,dd),time,phone,items,safari,agentId:ag,channel:ag?'':'WhatsApp',pays:ag?[P('agent',100)]:[P('lien',300)]}));
  S.bookings.filter(b=>b.date===TODAY&&b.status==='riding').forEach(b=>b.vehicles.forEach(v=>{S.vehicles.find(x=>x.id===v).status='riding'}));
  /* paiements de stockage passés */
  S.storage.forEach(s=>{let m=s.start.slice(0,7);while(m<=s.paidThrough){s.payments.push({month:m,amount:stMonthly(s),mode:s.id==='ST1'?'card':'transfer',date:m+'-02'});m=addDays(m+'-28',5).slice(0,7)}});
  const prev=addDays(MONTH+'-01',-1).slice(0,7);
  Object.values(S.agents).forEach(a=>{[...new Set(S.bookings.filter(b=>b.agentId===a.id&&b.date<MONTH).map(b=>b.date.slice(0,7)))].forEach(m=>{
    if(m===prev&&['a2','a4'].includes(a.id))return;
    const r=agentPeriod(a,m);if(r.restWild>0)S.settlements.push({agentId:a.id,month:m,amount:r.restWild,date:addDays(m+'-28',5)});if(r.restAgent>0)S.settlements.push({agentId:a.id,month:m,amount:-r.restAgent,date:addDays(m+'-28',5)})})});
  S.settlements.push({agentId:'a2',month:MONTH,amount:-600,date:addDays(TODAY,-6)});
}

/* ---------- Logique opérationnelle ---------- */
const veh=id=>S.vehicles.find(v=>v.id===id);
const bk=id=>S.bookings.find(b=>b.id===id);
const svcLeft=v=>+(v.svcAt-v.hours).toFixed(1);
const assignedOf=(b,m)=>b.vehicles.filter(id=>veh(id)?.model===m).length;
const isToday=b=>b.date===TODAY;
function bStart(b){return b.status==='riding'?b.startMin:toMin(b.time)}
function bEnd(b){return b.status==='riding'?Math.max(b.endMin,now()+5):toMin(b.time)+durOf(b)}
const gearMs=b=>Object.entries(b.items||{}).filter(([m,q])=>q>0&&ACT[m]&&ACT[m].gear).map(([m])=>m);
function syncGear(o,m){if(!o.gear||Array.isArray(o.gear))o.gear={};const n=o.items[m]||0;const a=(o.gear[m]||[]).slice(0,n);while(a.length<n)a.push({helmet:'',suit:'',boots:''});o.gear[m]=a;return a}
function gearMissing(b){return gearMs(b).some(m=>syncGear(b,m).some(g=>!g.helmet||!g.suit||!g.boots))}
const gearLines=b=>gearMs(b).flatMap(m=>syncGear(b,m).map((g,i)=>`${ACT[m].short} pilote ${i+1} : casque ${g.helmet||'?'} · tenue ${g.suit||'?'} · bottes ${g.boots||'?'}`));
const demText=d=>d.tag+(d.detail?' ('+d.detail+')':'');
function prepHtml(b){const L=[...(b.demands.length?['<b>Demandes</b> : '+b.demands.map(d=>esc(demText(d))).join(', ')]:[]),...(b.options.length?['<b>Options</b> : '+b.options.map(k=>OPTIONS[k][0]).join(', ')]:[]),...gearLines(b).map(esc),...(b.notes?['<b>Note</b> : '+esc(b.notes)]:[])];return L.length?`<div class="prep">${L.map(x=>`<div>${x}</div>`).join('')}</div>`:''}
function gearSel(path,j,k,list,label,val,after){return `<select aria-label="${label}" onchange="${path}[${j}].${k}=this.value;${after||''}"><option value="">${label}</option>${list.map(x=>`<option ${x===val?'selected':''}>${x}</option>`).join('')}</select>`}
function gearBox(o,m,path,after){const g=syncGear(o,m);return g.length?`<div class="gear"><b class="small">Équipement ${esc(ACT[m].short)} · tailles par pilote</b>${g.map((x,j)=>`<div class="gr"><b class="small">Pilote ${j+1}</b>${gearSel(path,j,'helmet',SIZES,'Casque',x.helmet,after)}${gearSel(path,j,'suit',SIZES,'Tenue',x.suit,after)}${gearSel(path,j,'boots',BOOTS,'Bottes',x.boots,after)}</div>`).join('')}</div>`:''}
function gearModal(id){const b=bk(id);modal(mh('Tailles équipement',b.num+' · '+esc(b.client))+`<div class="sb">${gearMs(b).map(m=>gearBox(b,m,`bk('${id}').gear.${m}`)).join('')}</div><div class="sf"><button class="btn ghost" onclick="openB('${id}')">Retour</button><button class="btn pri" onclick="if(gearMissing(bk('${id}'))){toast('Complète toutes les tailles');return}logB(bk('${id}'),'Tailles équipement saisies');closeModal();render();openB('${id}')">Enregistrer</button></div>`)}
function blockers(b){
  const out=[],c=calc(b);
  if(c.rest>0)out.push({k:'pay',lvl:'crit',label:'Paiement',detail:'Reste à encaisser : '+aed(c.rest),btn:'Encaisser',fn:`payModal('${b.id}')`});
  if(!b.contract)out.push({k:'contract',lvl:'warn',label:'Contrat',detail:'Contrat non signé',btn:'Faire signer',fn:`contractModal('${b.id}')`});
  if(!b.briefing)out.push({k:'brief',lvl:'warn',label:'Briefing',detail:'Briefing sécurité non validé',btn:'Lancer le briefing',fn:`briefModal('${b.id}')`});
  const need=fleetItems(b).reduce((a,[m,q])=>a+Math.max(0,q-(b.ext[m]||0)-assignedOf(b,m)),0);
  if(need>0)out.push({k:'veh',lvl:'warn',label:'Véhicules',detail:need+' véhicule(s) à assigner',btn:'Assigner',fn:`vehModal('${b.id}')`});
  if(gearMissing(b))out.push({k:'gear',lvl:'warn',label:'Tailles',detail:'Tailles casque / tenue / bottes à saisir',btn:'Saisir les tailles',fn:`gearModal('${b.id}')`});
  if(!b.guide)out.push({k:'guide',lvl:'warn',label:'Guide',detail:'Aucun guide assigné',btn:'Assigner un guide',fn:`guideModal('${b.id}')`});
  const nr=b.vehicles.map(veh).filter(v=>v&&v.status!=='available');
  if(nr.length)out.push({k:'mach',lvl:'crit',label:'Machine',detail:nr.map(v=>v.id+' '+vStatusTxt(v).toLowerCase()).join(', '),btn:'Changer de véhicule',fn:`vehModal('${b.id}')`});
  return out;
}
const STATUS={draft:['À valider','warn'],up:['À venir','or'],late:['En retard','crit'],arrived:['Arrivé','ok'],riding:['En sortie','info'],done:['Terminé','grey'],cancelled:['Annulé','grey'],noshow:['Absent','grey']};
function stOf(b){if(b.status!=='up')return b.status;if(b.arrivedAt)return 'arrived';if(b.date<TODAY||(isToday(b)&&now()>toMin(b.time)+CFG.late))return 'late';return 'up'}
function bStatus(b){if(b.status==='riding'){const d=b.endMin-now();return d<0?{c:'crit',t:'Retour en retard +'+(-d)+' min'}:{c:'info',t:'Retour dans '+d+' min'}}const s=STATUS[stOf(b)];return{c:s[1],t:s[0]}}
function readyPill(b){if(b.status!=='up'||!isToday(b))return '';const dn=toMin(b.time)-now();const soon=!b.arrivedAt&&dn>=0&&dn<=CFG.pre?`<span class="pill p-or">Dans ${dn} min</span>`:'';const bl=blockers(b);return soon+(bl.length?`<span class="pill p-warn" title="${esc(bl.map(x=>x.detail).join(' · '))}">Manque : ${esc(bl.map(x=>x.label.toLowerCase()).join(', '))}</span>`:'<span class="pill p-ok">Prêt à partir</span>')}
const pill=s=>`<span class="pill p-${s.c}">${esc(s.t)}</span>`;
const memberTag=b=>b.member?'<span class="wm">Wild member</span>':'';
function vStatusTxt(v){return{available:'Disponible',riding:'En sortie',maintenance:'Maintenance',repair:'Réparation',cleaning:'Nettoyage'}[v.status]}
function vStatusCls(v){return{available:'ok',riding:'info',maintenance:'warn',repair:'crit',cleaning:'warn'}[v.status]}
const todayB=()=>S.bookings.filter(b=>isToday(b));
function reservedBy(v){return todayB().find(b=>b.status==='up'&&b.vehicles.includes(v.id))}
function ridingBy(v){return todayB().find(b=>b.status==='riding'&&b.vehicles.includes(v.id))}
function freeCount(model,date,t,dur,exclude){
  const units=S.vehicles.filter(v=>v.model===model&&!['maintenance','repair'].includes(v.status));
  const busy=new Set();let demand=0;
  S.bookings.forEach(b=>{
    if(b.id===exclude||b.date!==date||!['up','riding'].includes(b.status))return;
    const s=bStart(b),e=bEnd(b)+10;
    if(s<t+dur&&e>t){b.vehicles.forEach(id=>busy.add(id));demand+=Math.max(0,(b.items[model]||0)-assignedOf(b,model)-(b.ext[model]||0))}
  });
  if(date===TODAY)units.forEach(v=>{if(v.status==='cleaning'&&t<now()+15)busy.add(v.id)});
  return units.filter(v=>!busy.has(v.id)).length-demand;
}
function fits(items,date,t,dur,ex){return Object.entries(items).every(([m,q])=>!q||freeCount(m,date,t,dur,ex)>=q)}
function smartOptions(items,date,t,dur,ex){
  const opts=[],k=dur;
  if(fits(items,date,t,dur,ex))return [{kind:'best',tag:'Disponible',title:hm(t),items:{...items},time:t,ext:{},wait:0,extra:0,note:'100 % flotte Wild · aucune attente'}];
  for(let d=15;d<=90;d+=15)if(fits(items,date,t+d,dur,ex)){opts.push({kind:'best',tag:'Meilleure option',title:hm(t+d),items:{...items},time:t+d,ext:{},wait:d,extra:0,note:'100 % flotte Wild · attente '+d+' min · aucun coût en plus'});break}
  const ext={};let n=0;
  Object.entries(items).forEach(([m,q])=>{const f=Math.max(0,freeCount(m,date,t,dur,ex));if(q>f){ext[m]=q-f;n+=q-f}});
  if(n)opts.push({kind:'ext',tag:'Alternative',title:hm(t),items:{...items},time:t,ext,wait:0,extra:CFG.ext*n,note:`${Object.values(items).reduce((a,q)=>a+q,0)-n} Wild + ${n} partenaire externe · marge −${aed(CFG.ext*n)}`});
  const alt={...items};let ok=true,diff=0;const subs=[];
  Object.entries(items).forEach(([m,q])=>{if(!q)return;const f=Math.max(0,freeCount(m,date,t,dur,ex));if(f>=q)return;let miss=q-f;alt[m]=f;
    Object.keys(ACT).filter(o=>o!==m&&ACT[o].seats>=ACT[m].seats&&ACT[o].fleet===ACT[m].fleet&&priceOf(o,dur)!=null)
      .sort((a,b)=>{const ra=ACT[a].rank-ACT[m].rank,rb=ACT[b].rank-ACT[m].rank;return (ra<0)-(rb<0)||Math.abs(ra)-Math.abs(rb)})
      .forEach(o=>{if(miss<=0)return;const take=Math.min(miss,Math.max(0,freeCount(o,date,t,dur,ex)-(alt[o]||0)));if(take){alt[o]=(alt[o]||0)+take;miss-=take;diff+=((priceOf(o,dur)||0)-(priceOf(m,dur)||0))*take;subs.push(take+' × '+ACT[o].short)}});
    if(miss>0)ok=false});
  if(ok&&subs.length){Object.keys(alt).forEach(x=>{if(!alt[x])delete alt[x]});opts.push({kind:'model',tag:diff>0?'Surclassement':'Autre modèle',title:hm(t),items:alt,time:t,ext:{},wait:0,extra:0,note:`Avec ${subs.join(' + ')} · ${diff>0?'+'+aed(diff)+' pour le client':diff<0?aed(diff)+' pour le client':'même prix'}`})}
  return opts;
}
function guideState(g){
  const st=S.staff.find(s=>s.name===g);const r=todayB().find(b=>b.status==='riding'&&b.guide===g);
  if(r)return{k:'riding',txt:'Retour '+hm(r.endMin)};
  if(st.status==='break')return{k:'break',txt:"Pause jusqu'à "+st.until};
  if(['off','absent','notstarted'].includes(st.status))return{k:'off',txt:{off:'Repos',absent:'Absent',notstarted:'Pas pointé'}[st.status]};
  return{k:'available',txt:st.status==='late'?'Arrivé en retard':'Disponible'};
}
function alerts(){
  const A=[],n=now();
  S.bookings.filter(b=>b.feedback?.needsFollowUp&&!b.feedback.handled).forEach(b=>A.push({lvl:'crit',t:`Client mécontent : ${b.client}`,s:'« '+(b.feedback.answer||'').slice(0,90)+' »',btn:'Voir',fn:`openB('${b.id}')`}));
  S.bookings.filter(b=>b.status==='draft').forEach(b=>A.push({lvl:'act',t:`Booking WhatsApp à valider : ${b.client||b.waFrom}`,s:(b.waRole==='agent'?'Agent '+(S.agents[b.agentId]?.name||''):'Client direct')+' · '+svcLabel(b),btn:'Valider',fn:`editBooking('${b.id}')`}));
  S.waConvs.filter(c=>c.needsHuman).forEach(c=>A.push({lvl:'act',t:`WhatsApp à traiter : ${convName(c)}`,s:c.lastText||'',btn:'Ouvrir',fn:`go('whatsapp');waOpen('${c.id}')`}));
  todayB().filter(b=>b.status==='riding'&&n>b.endMin).forEach(b=>A.push({lvl:'crit',t:`${(b.vehicles.join(' / ')||svcLabel(b))} retour en retard (+${n-b.endMin} min)`,s:`${b.client} · guide ${b.guide}`,btn:'Voir',fn:`openB('${b.id}')`}));
  todayB().filter(b=>stOf(b)==='late').forEach(b=>A.push({lvl:'crit',t:`${b.client} en retard (prévu ${b.time})`,s:'Relancer le client sur WhatsApp',btn:'Relancer',fn:`openB('${b.id}')`}));
  todayB().filter(b=>b.status==='up'&&!b.guide&&toMin(b.time)-n<=60&&toMin(b.time)-n>-CFG.late).forEach(b=>A.push({lvl:'crit',t:`${b.num} sans guide`,s:`${b.client} · départ ${b.time}`,btn:'Assigner',fn:`guideModal('${b.id}')`}));
  todayB().filter(b=>b.status==='up'&&toMin(b.time)-n<=CFG.pre&&toMin(b.time)-n>-CFG.late&&calc(b).rest>0).forEach(b=>A.push({lvl:'act',t:`${b.client} : reste ${aed(calc(b).rest)}`,s:`Départ ${b.time} · ${b.num}`,btn:'Encaisser',fn:`payModal('${b.id}')`}));
  S.storage.filter(stDue).forEach(s=>A.push({lvl:'act',t:`Stockage ${s.spot} impayé (${client(s.phone).name})`,s:`${s.vehicle} · ${aed(stMonthly(s))} pour ${monthLbl(MONTH)}`,btn:'Encaisser',fn:`stPayModal('${s.id}')`}));
  S.vehicles.filter(v=>svcLeft(v)<0).forEach(v=>A.push({lvl:'crit',t:`${v.id} service dépassé`,s:`${Math.abs(svcLeft(v))} h de dépassement`,btn:'Maintenance',fn:`maintModal('${v.id}')`}));
  Object.values(S.agents).map(a=>agentPeriod(a,MONTH)).forEach(r=>{if(r.restWild>500)A.push({lvl:'act',t:`${r.a.name} doit ${aed(r.restWild)} à Wild`,s:monthLbl(MONTH),btn:'Voir',fn:`S.agSel='${r.a.id}';S.agPer='month';S.agMonth=MONTH;go('agents')`});if(r.restAgent>500)A.push({lvl:'act',t:`Wild doit ${aed(r.restAgent)} à ${r.a.name}`,s:monthLbl(MONTH),btn:'Voir',fn:`S.agSel='${r.a.id}';S.agPer='month';S.agMonth=MONTH;go('agents')`})});
  Object.entries(S.stock).forEach(([cat,arr])=>arr.filter(i=>i[1]<=i[2]).forEach(i=>A.push({lvl:'act',t:`Stock ${i[0]} = ${i[1]}`,s:`Minimum ${i[2]} · ${catName(cat)}`,btn:'Commander',fn:`orderItem('${cat}','${esc(i[0])}')`})));
  S.staff.filter(s=>s.status==='late').forEach(s=>A.push({lvl:'act',t:`${s.name} en retard ${s.late} min`,s:`Shift ${s.shift}`,btn:'Voir',fn:`go('staff')`}));
  if(closingToday()&&closingToday().state==='pending')A.push({lvl:'act',t:'Clôture de caisse à valider',s:'Écart '+aed(closingToday().diff),btn:'Valider',fn:`go('finance')`});
  S.services.filter(x=>x.date===addDays(TODAY,1)||x.date===addDays(TODAY,2)).forEach(x=>A.push({lvl:'info',t:`${STORAGE_SERVICES[x.service]} le ${fmtD(x.date)}`,s:`${client(x.phone).name} · ${x.time}`}));
  S.vehicles.filter(v=>svcLeft(v)>=0&&svcLeft(v)<5).forEach(v=>A.push({lvl:'info',t:`${v.id} service dans ${svcLeft(v)} h`,s:v.svcType}));
  return A;
}
const catName=c=>({parts:'Pièces',coffee:'Wild Coffee',camp:'BBQ & camp',cleaning:'Nettoyage'}[c]);
/* Finance : ventes du jour, parts, encaissements */
function finDay(date){
  const bs=S.bookings.filter(b=>b.date===date&&live(b)),cs=bs.map(calc);const sum=k=>r2(cs.reduce((s,c)=>s+c[k],0));
  const by={};Object.keys(PAYMODES).forEach(m=>by[m]=r2(cs.reduce((s,c)=>s+c.by(m),0)));
  const stIn=r2(S.storage.flatMap(s=>s.payments).filter(p=>p.date===date).reduce((s,p)=>s+p.amount,0));
  const svIn=r2(S.services.filter(x=>x.paid&&x.paidAt===date).reduce((s,x)=>s+x.price,0));
  const exp=date===TODAY?r2(S.expenses.filter(e=>e.date===date).reduce((s,e)=>s+e.amount,0)+bs.reduce((s,b)=>s+Object.values(b.ext).reduce((a,q)=>a+q,0)*CFG.ext,0)):0;
  return{n:bs.length,guests:bs.reduce((s,b)=>s+guestsOf(b),0),sales:sum('total'),act:sum('actNet'),opt:sum('opt'),disc:sum('disc'),comm:sum('agentPart'),wild:sum('wildPart'),rest:sum('rest'),by,stIn,svIn,exp,margin:r2(sum('wildPart')+stIn+svIn-exp)};
}
function liveCounts(){const n=now(),up=todayB().filter(b=>b.status==='up');
  return{waiting:up.filter(b=>!b.arrivedAt&&toMin(b.time)-n<=60).length,ready:up.filter(b=>b.arrivedAt&&!blockers(b).length).length,riding:todayB().filter(b=>b.status==='riding').length,returns:todayB().filter(b=>b.status==='riding'&&b.endMin-n<=30).length}}
function clientStats(c){const bs=S.bookings.filter(b=>digits(b.phone)===digits(c.phone)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  const done=bs.filter(b=>b.status==='done');const st=S.storage.filter(s=>digits(s.phone)===digits(c.phone));
  const spend=r2(bs.filter(live).reduce((s,b)=>s+calc(b).total,0)+st.flatMap(s=>s.payments).reduce((s,p)=>s+p.amount,0)+S.services.filter(x=>digits(x.phone)===digits(c.phone)).reduce((s,x)=>s+x.price,0));
  return{bs,visits:done.length,spend,last:done[0]?.date||'',st,next:bs.find(b=>b.status==='up'&&b.date>=TODAY),review:done.find(b=>b.after?.review==='relancer'),agents:[...new Set(bs.filter(b=>b.agentId).map(b=>S.agents[b.agentId].name))]}}

/* ---------- Navigation & rôles ---------- */
const NAV={
  dashboard:['Dashboard','dash'],booking:['Booking','book'],whatsapp:['WhatsApp','chat'],clients:['Clients','users'],agents:['Agents','agent'],storage:['Storage','garage'],
  fleet:['Flotte','fleet'],maintenance:['Maintenance','wrench'],stock:['Stock','box'],staff:['Staff','staff'],
  finance:['Finance','cash'],reports:['Rapports','chart'],actions:["Centre d'actions",'alert'],guide:['App Guide','phone'],tv:['Écran TV','tv'],settings:['Réglages','gear']};
const ROLES={
  owner:{name:'Mourad',title:'Direction',nav:['dashboard','booking','whatsapp','clients','agents','storage','#ops','fleet','maintenance','stock','staff','#ges','finance','reports','actions','|','guide','tv','settings'],bottom:['dashboard','booking','clients','finance','actions']},
  manager:{name:'Yasmine',title:'Manager',nav:['dashboard','booking','whatsapp','clients','agents','storage','#ops','fleet','maintenance','staff','#ges','finance','actions','|','guide','tv'],bottom:['dashboard','booking','clients','storage','actions']},
  reception:{name:'Sara',title:'Réception',nav:['booking','whatsapp','clients','storage','actions','|','tv'],bottom:['booking','clients','storage','actions','tv']},
  guide:{name:'Calvin',title:'Guide',nav:['guide'],bottom:['guide']},
  mechanic:{name:'Rafiq',title:'Mécanicien',nav:['maintenance','fleet','stock','actions'],bottom:['maintenance','fleet','stock','actions']}};
function setRole(r){if(!STORE.demo&&STORE.profile.role!=='owner')return;S.role=r;S.guideName=r==='guide'?(STORE.demo?'Calvin':(S.staff.find(x=>x.role==='guide')?.name||'')):S.guideName;S.guideTab='home';$('#role').value=r;go(ROLES[r].nav[0])}
function go(v){if(v==='tv'){openTV();return}if(!ROLES[S.role].nav.includes(v)&&v!=='new'){v=ROLES[S.role].nav[0]}S.view=v;closeModal();$('#side').classList.remove('open');try{if(location.hash!=='#'+v)history.replaceState(null,'','#'+v)}catch(e){}render();window.scrollTo(0,0)}
function toggleSide(){$('#side').classList.toggle('open')}
const staffRole=()=>['owner','manager','reception'].includes(S.role);
const waCount=()=>S.bookings.filter(b=>b.status==='draft').length+S.waConvs.filter(c=>c.needsHuman).length;
function renderChrome(){
  const R_=ROLES[S.role],al=alerts(),crit=al.filter(a=>a.lvl!=='info').length;
  $('#nav').innerHTML=R_.nav.map(k=>k==='|'?'<div class="sep"></div>':k[0]==='#'?`<div class="lbl">${k==='#ops'?'Terrain':'Gestion'}</div>`:`<button class="${S.view===k||(S.view==='new'&&k==='booking')?'on':''}" onclick="go('${k}')">${ic(NAV[k][1])}<span>${NAV[k][0]}</span>${k==='actions'&&crit?`<span class="cnt">${crit}</span>`:''}${k==='whatsapp'&&waCount()?`<span class="cnt">${waCount()}</span>`:''}</button>`).join('');
  $('#bnav').innerHTML=R_.bottom.map(k=>`<button class="${S.view===k?'on':''}" onclick="go('${k}')">${ic(NAV[k][1])}${NAV[k][0].split(' ')[0]}</button>`).join('');
  $('#bellc').textContent=crit;$('#bellc').hidden=!crit;
  $('#av').textContent=R_.name[0];$('#whoName').innerHTML=`<b>${R_.name}</b><br><small class="muted">${R_.title}</small>`;
  const qa=[];
  if(staffRole())qa.push(`<button class="btn pri sm" onclick="newBooking()">+ BOOKING</button>`,`<button class="btn sm" onclick="quickPay()">Encaisser</button>`);
  qa.push(`<button class="btn sm opt2" onclick="incidentModal()">${ic('flag')}Incident</button>`);
  $('#qa').innerHTML=qa.join('');
  $('#fab').style.visibility=staffRole()&&S.view!=='new'?'visible':'hidden';
}
function render(){if(!STORE.demo)S.staff.forEach(s=>{if(s.day!==TODAY&&s.status!=='notstarted'){s.status='notstarted';s.in='';s.late=0}});renderChrome();const f=VIEWS[S.view]||VIEWS.dashboard;$('#view').innerHTML=f();paintPalms();const q=$('#q');if(q){q.placeholder=S.view==='booking'?'Rechercher un booking : client, téléphone, n°, agent…':'Client, téléphone, n° booking, véhicule…';if(S.view!=='booking'&&q.dataset.v==='bk'){q.value='';q.dataset.v=''}};STORE.schedule()}

/* ---------- Vues ---------- */
const VIEWS={};
function chartBars(vals,labels,h=170,fmt=v=>v,hl=-1){
  const W=640,pad=30,max=Math.max(...vals,1)*1.15,bw=(W-pad*2)/vals.length;
  const ticks=[0,.5,1].map(f=>max*f);const tl=t=>t>=1000?Math.round(t/100)/10+'k':Math.round(t);
  const every=Math.ceil(vals.length/12);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${h+26}" role="img">
  ${ticks.map(t=>{const y=h-(t/max)*h+4;return`<line x1="${pad}" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="0" y="${y+4}">${tl(t)}</text>`}).join('')}
  ${vals.map((v,i)=>{const bh=(v/max)*h,x=pad+i*bw+bw*.16,on=i===(hl<0?vals.length-1:hl);return`<rect x="${x}" y="${h-bh+4}" width="${bw*.68}" height="${Math.max(0,bh)}" rx="3" fill="${on?'var(--accent)':'var(--olive)'}" opacity="${on?1:.72}"><title>${labels[i]} · ${fmt(v)}</title></rect>${i%every===0||on?`<text x="${x+bw*.34}" y="${h+20}" text-anchor="middle">${labels[i]}</text>`:''}`}).join('')}
  </svg></div>`;
}
const alertRows=(al,n)=>al.filter(a=>a.lvl!=='info').slice(0,n).map(a=>`<div class="row"><div class="sev ${a.lvl}"></div><div class="grow"><b>${esc(a.t)}</b><small>${esc(a.s)}</small></div>${a.btn?`<button class="btn sm ${a.lvl==='crit'?'pri':''}" onclick="${a.fn}">${a.btn}</button>`:''}</div>`).join('')||'<div class="empty">Aucune action requise</div>';
VIEWS.dashboard=()=>{
  const own=S.role==='owner',tab=own?S.dashTab:'ops',R_=ROLES[S.role],F=finDay(TODAY),L=liveCounts(),al=alerts();
  const head=`<div class="ph"><div><h1>Bonjour ${R_.name}</h1><p>${fmtLong(TODAY)} · <span data-clock>${hm(now())}</span> · base Al Badayer</p></div>${own?`<div class="tabs"><button class="${tab==='owner'?'on':''}" onclick="S.dashTab='owner';render()">Direction</button><button class="${tab==='ops'?'on':''}" onclick="S.dashTab='ops';render()">Opérationnel</button></div>`:''}</div>`;
  const st={p:S.staff.filter(s=>['present','late'].includes(s.status)).length,l:S.staff.filter(s=>s.status==='late').length,b:S.staff.filter(s=>s.status==='break').length,o:S.staff.filter(s=>s.status==='off').length};
  if(tab==='owner'){
    const days=[...Array(14)].map((_,i)=>addDays(TODAY,i-13)),dv=days.map(d=>finDay(d).sales);
    const mrr=S.storage.filter(s=>s.active).reduce((a,s)=>a+stMonthly(s),0);
    const ag=Object.values(S.agents).map(a=>agentMonth(a,MONTH));const owe=sumRows(ag,'restWild'),weOwe=sumRows(ag,'restAgent');
    const members=S.clients.filter(c=>c.member).length;
    const fleet={av:S.vehicles.filter(v=>v.status==='available'&&!reservedBy(v)).length,rid:S.vehicles.filter(v=>v.status==='riding').length,mt:S.vehicles.filter(v=>['maintenance','repair'].includes(v.status)).length};
    return head+`
    <div class="g g4">
      <div class="card kpi hero span2"><div class="palm" data-palm="6"></div><div class="lb">Ventes du jour</div><div class="v">${aed(F.sales)}</div><div class="d">${F.n} bookings · ${F.guests} clients · reste à encaisser ${aed(F.rest)}</div></div>
      <div class="card kpi"><div class="lb">Part Wild</div><div class="v t-ol">${aed(F.wild)}</div><div class="d">après ${aed(F.comm)} de commissions</div></div>
      <div class="card kpi"><div class="lb">Storage / mois</div><div class="v">${aed(mrr)}</div><div class="d">${S.storage.filter(s=>s.active).length} machines · ${members} Wild members</div></div>
    </div>
    <div class="g g3">
      <div class="card span2"><h3>Ventes des 14 derniers jours <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">activités + options</span></h3>${chartBars(dv,days.map(d=>d.slice(8)),170,aed)}</div>
      <div class="g">
        <div class="card"><h3>Agents ce mois <button class="btn ghost sm" onclick="go('agents')">Détail</button></h3><div class="g g2"><div class="stat or sm"><b>${aed(owe)}</b><span>Agents → Wild</span></div><div class="stat info sm"><b>${aed(weOwe)}</b><span>Wild → agents</span></div></div></div>
        <div class="card"><h3>Revenu sauvé / perdu</h3><div class="g g2"><div class="stat ok sm"><b>${aed(S.saved)}</b><span>Sauvé</span></div><div class="stat crit sm"><b>${aed(S.lost)}</b><span>Perdu</span></div></div><p class="small muted" style="margin:8px 0 0">Sauvé grâce aux alternatives proposées, perdu quand le client refuse.</p></div>
      </div>
    </div>
    <div class="g g3">
      <div class="card"><h3>Flotte <button class="btn ghost sm" onclick="go('fleet')">Voir</button></h3><div class="g g3"><button class="stat ok" onclick="go('fleet')"><b>${fleet.av}</b><span>Libres</span></button><button class="stat info" onclick="go('booking')"><b>${fleet.rid}</b><span>Sortie</span></button><button class="stat warn" onclick="go('maintenance')"><b>${fleet.mt}</b><span>Atelier</span></button></div></div>
      <div class="card"><h3>Staff <button class="btn ghost sm" onclick="go('staff')">Voir</button></h3><div class="g g3"><div class="stat ok"><b>${st.p}</b><span>Présents</span></div><div class="stat warn"><b>${st.l}</b><span>Retard</span></div><div class="stat"><b>${st.b}</b><span>Pause</span></div></div></div>
      <div class="card"><h3>À traiter <button class="btn ghost sm" onclick="go('actions')">Tout voir</button></h3>${alertRows(al,3)}</div>
    </div>`;
  }
  const due=S.vehicles.filter(v=>svcLeft(v)<5).length,brk=S.vehicles.filter(v=>v.status==='repair').length,cl=S.vehicles.filter(v=>v.status==='cleaning').length;
  const short=todayB().filter(b=>b.status==='up'&&blockers(b).some(x=>x.k==='veh')).length;
  return head+`
  <div class="card"><h3>En direct <button class="btn pri sm" onclick="go('booking')">Ouvrir Booking</button></h3><div class="strip">
    <button class="stat warn" onclick="S.bkDay=TODAY;S.bkF='up';go('booking')"><b>${L.waiting}</b><span>Clients attendus &lt; 1 h</span></button><button class="stat ok" onclick="S.bkDay=TODAY;S.bkF='arrived';go('booking')"><b>${L.ready}</b><span>Prêts à partir</span></button>
    <button class="stat info" onclick="S.bkDay=TODAY;S.bkF='riding';go('booking')"><b>${L.riding}</b><span>En sortie</span></button><button class="stat" onclick="go('booking')"><b>${L.returns}</b><span>Retours &lt; 30 min</span></button></div></div>
  <div class="g g3">
    <div class="card"><h3>Flotte</h3><div class="g g2"><button class="stat warn" onclick="go('maintenance')"><b>${due}</b><span>Service dû</span></button><button class="stat crit" onclick="go('fleet')"><b>${brk}</b><span>En panne</span></button><button class="stat" onclick="go('fleet')"><b>${cl}</b><span>Nettoyage</span></button><button class="stat ${short?'crit':''}" onclick="go('booking')"><b>${short}</b><span>Manque véhicules</span></button></div></div>
    <div class="card"><h3>Staff</h3><div class="g g2"><div class="stat ok"><b>${st.p}</b><span>Présents</span></div><div class="stat warn"><b>${st.l}</b><span>En retard</span></div><div class="stat"><b>${st.b}</b><span>En pause</span></div><div class="stat"><b>${st.o}</b><span>Repos</span></div></div></div>
    <div class="card"><h3>Actions requises</h3>${alertRows(al,4)}</div>
  </div>`;
};
/* ---------- Onglet Booking : vue du jour, cartes alignées ---------- */
const waUrl=(p,t)=>'https://wa.me/'+digits(p)+'?text='+encodeURIComponent(t);
const relanceMsg=b=>'Bonjour '+b.client+', ici Wild Adventures. Votre activité ('+svcLabel(b)+') était prévue à '+b.time+'. Êtes-vous en route ? Nous vous attendons à Al Badayer.';
const reviewMsg=b=>'Bonjour '+b.client+", merci d'avoir choisi Wild Adventures ! Si vous avez apprécié votre sortie, un petit avis Google nous aiderait beaucoup.";
function chipsHtml(b){
  const fl=fleetItems(b).map(([m,q])=>`<span class="ci cm">${esc(ACT[m].short)}${q>1?' ×'+q:''} · ${b.dur===120?'2h':'1h'}<i>${aed(unitOf(b,m)*q)}</i></span>`);
  const sf=Object.entries(b.safari).filter(([,q])=>q).map(([k,q])=>`<span class="ci cm">${esc(SAFARI[k][0])} ×${q}<i>${aed(sPrice(b,k)*q)}</i></span>`);
  return `<div class="cline">${fl.join('')}${sf.join('')}${b.options.map(k=>`<span class="ci co">+ ${esc(OPTIONS[k][0])}<i>${aed(oPrice(b,k))}</i></span>`).join('')}${b.demands.map(d=>`<span class="ci cd">★ ${esc(demText(d))}</span>`).join('')}${gearLines(b).map(g=>`<span class="ci cg">${esc(g)}</span>`).join('')}</div>`;
}
function cardAction(b){
  const s=stOf(b),c=calc(b);
  if(b.status==='draft')return `<button class="btn pri wide" onclick="editBooking('${b.id}')">Vérifier et valider</button><button class="btn sm wide" onclick="rejectDraft('${b.id}')">Rejeter</button>`;
  if(b.status==='riding')return `<button class="btn pri wide" onclick="endModal('${b.id}')">Fin de sortie</button>`;
  if(s==='up'&&!isToday(b))return `<button class="btn wide" onclick="openB('${b.id}')">Ouvrir</button>`;
  if(s==='up'||s==='late')return `<button class="btn go wide" onclick="arrived('${b.id}')">✓ Client arrivé</button>${s==='late'?`<a class="btn sm wide" href="${waUrl(b.phone,relanceMsg(b))}" target="_blank" rel="noopener">Relancer</a>`:''}`;
  if(s==='arrived'){const bl=blockers(b);return bl.length?`<button class="btn pri wide" onclick="${bl[0].fn}">${bl[0].btn}</button>`:`<button class="btn go wide" onclick="startModal('${b.id}')">Démarrer</button>`}
  if(s==='done'){if(!b.after)return `<button class="btn wide" onclick="afterModal('${b.id}')">Remarque après le tour</button>`;if(b.after.review==='relancer')return `<a class="btn ol wide" href="${waUrl(b.phone,reviewMsg(b))}" target="_blank" rel="noopener">Relancer la review</a>`;return ''}
  if(s==='cancelled'||s==='noshow')return `<button class="btn wide" onclick="reopen('${b.id}')">Réactiver</button>`;
  return '';
}
function bkRow(b,multi){
  const c=calc(b),s=stOf(b);const showCash=c.rest>0&&live(b)&&b.status!=='riding'&&!(s==='arrived'&&blockers(b)[0]?.k==='pay');
  return `<div class="bkr s-${b.status==='riding'?'riding':s}" onclick="if(!event.target.closest('button,a,select,input'))openB('${b.id}')">
   <div class="bkt"><b>${b.status==='riding'?hm(b.startMin):b.time||'--:--'}</b>${multi?`<small>${fmtD(b.date)}</small>`:''}</div>
   <div class="bkm"><div class="bkn">${esc(b.client||'Client à identifier')} ${memberTag(b)}</div>${b.status==='draft'?`<div class="bkp"><span class="pill p-warn">WhatsApp · ${b.waRole==='agent'?'agent '+esc(S.agents[b.agentId]?.name||''):'client direct'}</span>${(b.missing||[]).length?`<span class="pill p-crit">Manque : ${b.missing.map(missLbl).join(', ')}</span>`:''}</div>`:''}<div class="small muted">${b.num} · ${b.agentId?`<span class="t-or">${esc(S.agents[b.agentId].name)} ${calc(b).pct} %</span>`:esc(b.channel)}${b.vehicles.length?' · '+b.vehicles.join(' / '):''}${b.guide?' · guide '+esc(b.guide):''}</div>${chipsHtml(b)}</div>
   <div class="bkmoney"><div><small>Total</small><b>${aed(c.total)}</b></div><div><small>Agent</small><b class="t-or">${c.agentPart?aed(c.agentPart):'—'}</b></div><div><small>Wild</small><b class="t-ol">${aed(c.wildPart)}</b></div><div><small>Reste</small><b class="${c.rest>0?'t-crit':'t-ok'}">${c.rest>0?aed(c.rest):'Payé'}</b></div></div>
   <div class="bka"><div class="bkp">${pill(bStatus(b))}${readyPill(b)}</div>${cardAction(b)}${showCash?`<button class="btn sm wide" onclick="payModal('${b.id}')">Encaisser ${aed(c.rest)}</button>`:''}</div>
  </div>`;
}
function bkBreakdown(bs){
  const cs=bs.filter(live).map(b=>[b,calc(b)]);const T=k=>r2(cs.reduce((s,[,c])=>s+c[k],0));const by=m=>r2(cs.reduce((s,[,c])=>s+c.by(m),0));
  const head={p:'Détail des ventes',w:'Détail de la part Wild',d:'Détail du reste à encaisser'}[S.bkDet];
  const rows=S.bkDet==='d'?cs.filter(([,c])=>c.rest>0):cs;
  return `<div class="card"><h3>${head}<button class="btn sm" onclick="S.bkDet='';render()">Fermer</button></h3>
   <div class="g g2"><div>${[['Machines et safari',T('act')+T('disc')],['Remise Wild member',-T('disc')],['Options (sans commission)',T('opt')],['Total vendu',T('total'),1],['Commissions agents',-T('agentPart')],['Part Wild',T('wildPart'),1]].map(([l,v,bo])=>`<div class="line ${bo?'tline':''}"><span>${l}</span><b>${aed(v)}</b></div>`).join('')}</div>
   <div>${Object.entries(PAYMODES).map(([k,l])=>`<div class="line"><span>${l}</span><b>${aed(by(k))}</b></div>`).join('')}<div class="line tline"><span>Reste à encaisser</span><b class="t-crit">${aed(T('rest'))}</b></div></div></div>
   <div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Heure</th><th>Client</th><th>Activité</th><th class="num">Total</th><th class="num">Agent</th><th class="num">Wild</th><th class="num">Reste</th></tr></thead><tbody>${rows.map(([b,c])=>`<tr class="click" onclick="openB('${b.id}')"><td class="tm">${b.time}</td><td>${esc(b.client)}</td><td>${svcLabel(b)}</td><td class="num">${aed(c.total)}</td><td class="num t-or">${aed(c.agentPart)}</td><td class="num t-ol">${aed(c.wildPart)}</td><td class="num ${c.rest?'t-crit':''}">${c.rest?aed(c.rest):'—'}</td></tr>`).join('')}</tbody></table></div></div>`;
}
VIEWS.booking=()=>{
  const q=(S.bkQ||'').trim().toLowerCase(),f=S.bkF,day=S.bkDay,n=now();
  let bs,title,multi=false;
  const dayAll=S.bookings.filter(b=>b.date===day).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  if(q){const qd=digits(q);bs=S.bookings.filter(b=>((b.client+' '+b.num+' '+(b.agentId?S.agents[b.agentId].name:'')).toLowerCase().includes(q))||(qd.length>=3&&digits(b.phone).includes(qd))).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));title=bs.length+' résultat(s) pour « '+esc(S.bkQ)+' »';multi=true}
  else if(f==='due'){bs=S.bookings.filter(b=>live(b)&&calc(b).rest>0&&b.status!=='up'||(b.status==='up'&&b.date<=TODAY&&calc(b).rest>0)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));title='Reste à encaisser sur place';multi=true}
  else if(f==='draft'){bs=S.bookings.filter(b=>b.status==='draft').sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));title='Bookings WhatsApp à valider';multi=true}
  else if(f==='review'){bs=S.bookings.filter(b=>b.after?.review==='relancer').sort((a,b)=>b.date.localeCompare(a.date));title='Reviews à relancer';multi=true}
  else{const G={all:()=>true,up:b=>['up','late'].includes(stOf(b)),arrived:b=>stOf(b)==='arrived',riding:b=>b.status==='riding',done:b=>b.status==='done'};bs=dayAll.filter(G[f]||G.all)}
  const cnt=k=>dayAll.filter(k).length;
  const sum=(list,k)=>r2(list.filter(live).reduce((s,b)=>s+calc(b)[k],0));
  const kpiList=multi?bs:dayAll;
  const chip=(k,l,c)=>`<button class="chip ${(S.bkF||'all')===k&&!q?'on':''}" onclick="S.bkF='${k}';S.bkQ='';$('#q').value='';render()">${l}${c!=null?` <i>${c}</i>`:''}</button>`;
  return `<div class="ph"><div><h1>Booking</h1><p>${title||(day===TODAY?"Aujourd'hui · "+fmtLong(day):fmtLong(day))}</p></div><div class="acts"><button class="btn" onclick="openTV()">${ic('tv')}Mode TV</button><button class="btn pri big" onclick="newBooking()">+ BOOKING</button></div></div>
  <div class="card bkbar">
    <div class="datebar"><button class="btn" onclick="S.bkDay=addDays(S.bkDay,-1);S.bkF='all';S.bkQ='';render()" aria-label="Jour précédent">◀</button><input type="date" value="${day}" onchange="S.bkDay=this.value||TODAY;S.bkF='all';S.bkQ='';render()" aria-label="Date"><button class="btn" onclick="S.bkDay=addDays(S.bkDay,1);S.bkF='all';S.bkQ='';render()" aria-label="Jour suivant">▶</button><button class="btn ${day===TODAY&&!multi?'ol':''}" onclick="S.bkDay=TODAY;S.bkF='all';S.bkQ='';$('#q').value='';render()">Aujourd'hui</button></div>
    <div class="chips">${chip('all','Tous',dayAll.length)}${chip('up','À venir',cnt(b=>['up','late'].includes(stOf(b))))}${chip('arrived','Arrivés',cnt(b=>stOf(b)==='arrived'))}${chip('riding','En sortie',cnt(b=>b.status==='riding'))}${chip('done','Terminés',cnt(b=>b.status==='done'))}<span class="chipsep"></span>${chip('draft','À valider',S.bookings.filter(b=>b.status==='draft').length)}${chip('due','À encaisser')}${chip('review','Reviews à relancer')}</div>
  </div>
  ${S.bkF!=='draft'&&S.bookings.some(b=>b.status==='draft')?`<div class="al soon"><div><b>${S.bookings.filter(b=>b.status==='draft').length} booking(s) reçu(s) sur WhatsApp à valider</b> · préparés par l'agent IA</div><div class="acts"><button class="btn sm pri" onclick="S.bkF='draft';render()">Voir et valider</button></div></div>`:''}
  <div class="kpis">${[['n','Bookings',kpiList.filter(live).length,''],['p','Vendu',aed(sum(kpiList,'total')),'or'],['w','Part Wild',aed(sum(kpiList,'wildPart')),'ol'],['d','Reste sur place',aed(sum(kpiList,'rest')),'crit']].map(([k,l,v,c])=>k==='n'?`<div class="kpi2"><small>${l}</small><b>${v}</b><em>${sum(kpiList,'agentPart')?aed(sum(kpiList,'agentPart'))+' de commissions':'sans commission'}</em></div>`:`<button class="kpi2 ${S.bkDet===k?'on':''}" onclick="S.bkDet=S.bkDet==='${k}'?'':'${k}';render()"><small>${l}</small><b class="t-${c}">${v}</b><em>${S.bkDet===k?'masquer':'voir le détail'}</em></button>`).join('')}</div>
  ${S.bkDet?bkBreakdown(kpiList):''}
  <div class="legend"><span class="ci cm">Machine / safari</span><span class="ci co">Option</span><span class="ci cd">Demande client</span><span class="ci cg">Tailles équipement</span></div>
  <div class="bklist">${bs.map(b=>bkRow(b,multi)).join('')||`<div class="empty">Aucun booking${day===TODAY&&!multi?" aujourd'hui":''}. <button class="btn pri sm" onclick="newBooking()">+ BOOKING</button></div>`}</div>`;
};
function arrived(id){const b=bk(id);b.arrivedAt=now();const late=b.arrivedAt-toMin(b.time);logB(b,'Client arrivé'+(late>1?' ('+late+' min de retard)':' à l\'heure'));toast(b.client+' : arrivé');render()}
function reopen(id){setTimeout(()=>calSync(id),50);const b=bk(id);b.status='up';b.arrivedAt=null;logB(b,'Booking réactivé');closeModal();render();toast('Booking réactivé')}

function topSearch(i){if(S.view!=='booking')return;i.dataset.v='bk';S.bkQ=i.value;clearTimeout(S._qT);S._qT=setTimeout(()=>{render();const q=$('#q');q.focus();q.setSelectionRange(q.value.length,q.value.length)},250)}
VIEWS.clients=()=>{
  const t=S.clTab,q=(S.clQ||'').toLowerCase(),qd=digits(S.clQ);
  let list=S.clients.map(c=>({c,s:clientStats(c)}));
  if(t==='members')list=list.filter(x=>x.c.member);if(t==='storage')list=list.filter(x=>x.s.st.length);if(t==='review')list=list.filter(x=>x.s.review);
  if(q)list=list.filter(x=>x.c.name.toLowerCase().includes(q)||(qd.length>=3&&digits(x.c.phone).includes(qd)));
  list.sort((a,b)=>b.s.spend-a.s.spend);
  const dupes=findDupes();
  return `<div class="ph"><div><h1>Registre clients</h1><p>Un client = un numéro de téléphone. ${S.clients.length} clients, ${S.clients.filter(c=>c.member).length} Wild members.</p></div><button class="btn pri" onclick="clientModal()">${ic('plus')}Nouveau client</button></div>
  ${dupes.length?`<div class="blocked" style="border-color:var(--warn);background:var(--warn-soft)"><b class="t-warn">Doublons possibles</b>${dupes.map(([a,b])=>`<div class="row" style="border:0;padding:4px 0"><div class="grow">${esc(a.name)} (${esc(a.phone)}) et ${esc(b.name)} (${esc(b.phone)})</div><button class="btn sm" onclick="mergeClients('${esc(a.phone)}','${esc(b.phone)}')">Fusionner</button></div>`).join('')}</div>`:''}
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><div class="tabs">${[['all','Tous'],['members','Wild members'],['storage','Storage'],['review','Review à relancer']].map(([k,l])=>`<button class="${t===k?'on':''}" onclick="S.clTab='${k}';render()">${l}</button>`).join('')}</div><input id="clq" style="max-width:280px" placeholder="Nom ou téléphone" value="${esc(S.clQ||'')}" oninput="S.clQ=this.value;clearTimeout(S._clT);S._clT=setTimeout(()=>{render();const i=$('#clq');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"></div>
  <div class="card"><div class="tw"><table class="tbl"><thead><tr><th>Client</th><th>Téléphone</th><th>Pays</th><th class="num">Visites</th><th class="num">Dépensé</th><th>Dernière visite</th><th>Prochain booking</th><th>Agents</th></tr></thead><tbody>
  ${list.map(({c,s})=>`<tr class="click" onclick="clientDrawer('${esc(c.phone)}')"><td><b>${esc(c.name)}</b> ${c.member?'<span class="wm">Wild member</span>':''}${s.st.length?' <span class="pill p-ol">Storage</span>':''}</td><td>${esc(c.phone)}</td><td>${esc(c.country)}</td><td class="num">${s.visits}</td><td class="num"><b>${aed(s.spend)}</b></td><td>${s.last?fmtD(s.last):'—'}</td><td>${s.next?fmtD(s.next.date)+' '+s.next.time:'—'}</td><td class="small">${esc(s.agents.join(', '))||'Direct'}</td></tr>`).join('')||'<tr><td colspan="8"><div class="empty">Aucun client</div></td></tr>'}
  </tbody></table></div></div>`;
};
function findDupes(){const out=[];for(let i=0;i<S.clients.length;i++)for(let j=i+1;j<S.clients.length;j++){const a=S.clients[i],b=S.clients[j];if(a.name.trim().toLowerCase()===b.name.trim().toLowerCase())out.push([a,b])}return out}
function mergeClients(pa,pb){const a=client(pa),b=client(pb);S.bookings.forEach(x=>{if(digits(x.phone)===digits(pb))x.phone=a.phone});S.storage.forEach(x=>{if(digits(x.phone)===digits(pb))x.phone=a.phone});S.services.forEach(x=>{if(digits(x.phone)===digits(pb))x.phone=a.phone});a.member=a.member||b.member;S.clients=S.clients.filter(c=>c!==b);toast('Fiches fusionnées sous '+a.phone);render()}
function clientDrawer(phone){
  const c=client(phone),s=clientStats(c);
  modal(mh(esc(c.name),`${esc(c.phone)} · ${esc(c.country)}`)+`<div class="sb">
   <label class="cbox ${c.member?'member':''}"><input type="checkbox" ${c.member?'checked':''} onchange="setMember('${esc(c.phone)}',this.checked)"><span style="flex:1"><b>Wild member</b><br><small class="muted">−${CFG.member} % sur toutes les activités, pour lui et ses amis · −20 % au Wild Coffee${c.memberSince?' · depuis '+monthLbl(c.memberSince):''}</small></span></label>
   <div class="g g3"><div class="stat"><b>${s.visits}</b><span>Visites</span></div><div class="stat or"><b>${aed(s.spend)}</b><span>Dépensé</span></div><div class="stat"><b>${s.last?fmtD(s.last):'—'}</b><span>Dernière</span></div></div>
   <div class="copy" style="user-select:all">${esc(c.phone)}</div>
   ${s.st.length?`<div class="grp">Storage</div>${s.st.map(x=>`<div class="row"><div class="grow"><b>${esc(x.vehicle)} · place ${x.spot}</b><small>${STORAGE[x.type].name} · ${x.plan==='wash'?'Storage + lavage':'Storage seul'} · ${aed(stMonthly(x))}/mois · payé jusqu'à ${monthLbl(x.paidThrough)}</small></div>${stDue(x)?`<button class="btn pri sm" onclick="stPayModal('${x.id}')">Encaisser</button>`:'<span class="pill p-ok">À jour</span>'}</div>`).join('')}`:''}
   <div class="grp">Historique (${s.bs.length})</div>
   ${s.bs.slice(0,12).map(b=>{const k=calc(b);return`<div class="row" style="cursor:pointer" onclick="openB('${b.id}')"><div class="grow"><b>${fmtD(b.date)} · ${svcLabel(b)}</b><small>${b.num} · ${b.agentId?esc(S.agents[b.agentId].name):esc(b.channel)}${b.after?' · '+({content:'satisfait',moyen:'moyen',mecontent:'mécontent'}[b.after.mood])+(b.after.review==='relancer'?' · review à relancer':b.after.review==='faite'?' · review faite':''):''}</small></div><b>${aed(k.total)}</b></div>`}).join('')||'<div class="muted">Aucun booking</div>'}
   <label class="fld"><span>Notes</span><textarea rows="2" onchange="client('${esc(c.phone)}').notes=this.value">${esc(c.notes)}</textarea></label>
  </div><div class="sf"><button class="btn" onclick="stContractModal('${esc(c.phone)}')">+ Storage</button><button class="btn pri" onclick="newBooking('${esc(c.phone)}')">Nouveau booking</button></div>`,{drawer:true});
}
function setMember(phone,on){const c=client(phone);c.member=on;if(on&&!c.memberSince)c.memberSince=MONTH;S.bookings.filter(b=>b.status==='up'&&digits(b.phone)===digits(phone)).forEach(b=>b.member=on);toast(on?c.name+' est Wild member':'Membership retiré');render();clientDrawer(phone)}
function clientModal(){modal(mh('Nouveau client')+`<div class="sb"><label class="fld"><span>Téléphone / WhatsApp</span><input id="ncp" inputmode="tel" placeholder="+971 5X XXX XXXX"></label><label class="fld"><span>Nom</span><input id="ncn"></label><label class="fld"><span>Pays</span><input id="ncc"></label><label class="cbox"><input type="checkbox" id="ncm"><span>Wild member</span></label></div><div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="addClient()">Enregistrer</button></div>`)}
function addClient(){const p=$('#ncp').value.trim(),n=$('#ncn').value.trim();if(digits(p).length<6||!n){toast('Téléphone et nom obligatoires');return}const ex=client(p);if(ex){toast('Ce numéro existe déjà : '+ex.name);clientDrawer(ex.phone);return}S.clients.push({name:n,phone:p,country:$('#ncc').value.trim(),member:$('#ncm').checked,memberSince:$('#ncm').checked?MONTH:'',notes:''});closeModal();render();toast('Client ajouté')}
/* ---------- Agents : qui doit quoi, par mois et par année ---------- */
function agentPeriod(a,per){
  const inP=d=>d.startsWith(per);
  const bs=S.bookings.filter(b=>b.agentId===a.id&&inP(b.date)&&live(b)&&b.date<=TODAY).sort((x,y)=>(x.date+x.time).localeCompare(y.date+y.time));const cs=bs.map(calc);
  const st=S.settlements.filter(s=>s.agentId===a.id&&inP(s.month));
  const sum=k=>r2(cs.reduce((s,c)=>s+c[k],0));
  const toWild=r2(cs.reduce((s,c)=>s+Math.max(0,c.agentOwes),0)),toAgent=r2(cs.reduce((s,c)=>s+Math.max(0,-c.agentOwes),0));
  const recv=r2(st.filter(s=>s.amount>0).reduce((s,x)=>s+x.amount,0)),paidOut=r2(-st.filter(s=>s.amount<0).reduce((s,x)=>s+x.amount,0));
  const restWild=r2(Math.max(0,toWild-recv)),restAgent=r2(Math.max(0,toAgent-paidOut));
  return{a,bs,cs,st,n:bs.length,sales:sum('actNet'),comm:sum('agentPart'),paid:sum('paidAgent'),toWild,toAgent,recv,paidOut,restWild,restAgent,net:r2(restWild-restAgent),owes:r2(restWild-restAgent)};
}
const agentMonth=(a,m)=>agentPeriod(a,m);
const sumRows=(rows,k)=>r2(rows.reduce((s,r)=>s+r[k],0));
const amt=(v,cls)=>v>0.009?`<b class="${cls}">${aed(v)}</b>`:'<span class="muted">—</span>';
function netTxt(v,name){return Math.abs(v)<0.01?'<span class="pill p-ok">Réglé</span>':v>0?`<b class="t-or">${name?esc(name)+' doit ':'+ '}${aed(v)}</b>`:`<b class="t-info">${name?'Wild doit ':'− '}${aed(-v)}</b>`}
function periodBar(){
  const years=[...new Set(S.bookings.map(b=>b.date.slice(0,4)))].sort().reverse();
  const months=[...new Set(S.bookings.filter(b=>b.date<=TODAY).map(b=>b.date.slice(0,7)))].sort().reverse();
  const isY=S.agPer==='year';
  return `<div class="acts" style="align-items:center"><div class="tabs"><button class="${isY?'':'on'}" onclick="S.agPer='month';render()">Par mois</button><button class="${isY?'on':''}" onclick="S.agPer='year';render()">Par année</button></div>
   ${isY?`<select style="width:auto" onchange="S.agYear=this.value;render()" aria-label="Année">${years.map(y=>`<option ${y===S.agYear?'selected':''}>${y}</option>`).join('')}</select>`:`<select style="width:auto" onchange="S.agMonth=this.value;render()" aria-label="Mois">${months.map(x=>`<option value="${x}" ${x===S.agMonth?'selected':''}>${monthLbl(x)}</option>`).join('')}</select>`}</div>`;
}
const perKey=()=>S.agPer==='year'?S.agYear:S.agMonth;
const perLbl=()=>S.agPer==='year'?'année '+S.agYear:monthLbl(S.agMonth);
function oweTiles(rows,single){
  const W=sumRows(rows,'restWild'),A=sumRows(rows,'restAgent'),N=r2(W-A);
  return `<div class="g g4 owetiles">
   <div class="card kpi owe-w"><div class="lb">${single?esc(single)+' doit à Wild':'Les agents doivent à Wild'}</div><div class="v">${aed(W)}</div><div class="d">Argent encaissé par l'agent, moins sa commission</div></div>
   <div class="card kpi owe-a"><div class="lb">${single?'Wild doit à '+esc(single):'Wild doit aux agents'}</div><div class="v">${aed(A)}</div><div class="d">Commission sur les clients qui ont payé Wild</div></div>
   <div class="card kpi"><div class="lb">Solde net · ${perLbl()}</div><div class="v ${N>0.01?'t-or':N<-0.01?'t-info':'t-ok'}">${Math.abs(N)<0.01?'Réglé':aed(Math.abs(N))}</div><div class="d">${Math.abs(N)<0.01?'Rien à régler':N>0?(single?esc(single):'Les agents')+' doi'+(single?'t':'vent')+' encore payer Wild':'Wild doit encore payer '+(single?esc(single):'les agents')}</div></div>
   <div class="card kpi"><div class="lb">Commissions · ${perLbl()}</div><div class="v">${aed(sumRows(rows,'comm'))}</div><div class="d">sur ${aed(sumRows(rows,'sales'))} d'activités · ${sumRows(rows,'n')} bookings</div></div></div>`;
}
const settleBtn=r=>r.restWild>0.009||r.restAgent>0.009?`<button class="btn sm pri" onclick="event.stopPropagation();settleModal('${r.a.id}','${perKey()}')">Régler</button>`:'';
VIEWS.agents=()=>{
  const per=perKey(),isY=S.agPer==='year';const sel=S.agSel&&S.agents[S.agSel];
  const head=(t,p,back)=>`<div class="ph"><div>${back?'<button class="btn ghost sm" onclick="S.agSel=null;render()">◀ Tous les agents</button>':''}<h1 ${back?'style="margin-top:6px"':''}>${t}</h1><p>${p}</p></div>${periodBar()}</div>`;
  const yearTable=(a)=>{const ms=[...Array(12)].map((_,i)=>S.agYear+'-'+String(i+1).padStart(2,'0')).filter(m=>m<=MONTH);
    const rows=ms.map(m=>{const rs=(a?[a]:Object.values(S.agents)).map(x=>agentPeriod(x,m));return{m,n:sumRows(rs,'n'),sales:sumRows(rs,'sales'),comm:sumRows(rs,'comm'),restWild:sumRows(rs,'restWild'),restAgent:sumRows(rs,'restAgent'),toWild:sumRows(rs,'toWild'),toAgent:sumRows(rs,'toAgent')}}).filter(r=>r.n).reverse();
    return `<div class="card"><h3>Détail par mois · ${S.agYear}</h3><div class="tw"><table class="tbl"><thead><tr><th>Mois</th><th class="num">Bookings</th><th class="num">Activités vendues</th><th class="num">Commission</th><th class="num">Dû à Wild</th><th class="num">Dû à l'agent</th><th class="num">Reste agent → Wild</th><th class="num">Reste Wild → agent</th><th>Statut</th></tr></thead><tbody>
     ${rows.map(r=>`<tr class="click" onclick="S.agPer='month';S.agMonth='${r.m}';render()"><td><b>${monthLbl(r.m)}</b></td><td class="num">${r.n}</td><td class="num">${aed(r.sales)}</td><td class="num">${aed(r.comm)}</td><td class="num">${aed(r.toWild)}</td><td class="num">${aed(r.toAgent)}</td><td class="num">${amt(r.restWild,'t-or')}</td><td class="num">${amt(r.restAgent,'t-info')}</td><td>${r.restWild<0.01&&r.restAgent<0.01?'<span class="pill p-ok">Réglé</span>':'<span class="pill p-warn">À régler</span>'}</td></tr>`).join('')}
     <tr class="totrow"><td>Total ${S.agYear}</td><td class="num">${sumRows(rows,'n')}</td><td class="num">${aed(sumRows(rows,'sales'))}</td><td class="num">${aed(sumRows(rows,'comm'))}</td><td class="num">${aed(sumRows(rows,'toWild'))}</td><td class="num">${aed(sumRows(rows,'toAgent'))}</td><td class="num t-or">${aed(sumRows(rows,'restWild'))}</td><td class="num t-info">${aed(sumRows(rows,'restAgent'))}</td><td></td></tr></tbody></table></div></div>`};
  if(sel){const r=agentPeriod(sel,per);
    return head(`${esc(sel.name)} <span class="pill p-or" style="vertical-align:middle">${sel.pct} %</span>`,`${esc(sel.phone)||'Pas de numéro'} · commission sur les activités uniquement, jamais sur les options`,true)+
    oweTiles([r],sel.name)+
    `<div class="card"><h3>Calcul · ${perLbl()} ${settleBtn(r)}</h3><div class="g g2"><div>
      <div class="line"><span>Activités vendues (${r.n} bookings)</span><b>${aed(r.sales)}</b></div>
      <div class="line"><span>Commission ${sel.pct} %</span><b>${aed(r.comm)}</b></div>
      <div class="line"><span>Payé par les clients à l'agent</span><b>${aed(r.paid)}</b></div></div><div>
      <div class="line"><span>Dû à Wild (encaissé − commission)</span><b>${aed(r.toWild)}</b></div>
      <div class="line"><span>Déjà reçu de l'agent</span><b>− ${aed(r.recv)}</b></div>
      <div class="line tline"><span><b>Reste : ${esc(sel.name)} → Wild</b></span><b class="t-or">${aed(r.restWild)}</b></div>
      <div class="line"><span>Dû à l'agent (commission sur paiements faits à Wild)</span><b>${aed(r.toAgent)}</b></div>
      <div class="line"><span>Déjà versé à l'agent</span><b>− ${aed(r.paidOut)}</b></div>
      <div class="line tline"><span><b>Reste : Wild → ${esc(sel.name)}</b></span><b class="t-info">${aed(r.restAgent)}</b></div></div></div></div>
    ${!isY&&r.st.length?`<div class="card"><h3>Règlements</h3>${r.st.slice().sort((x,y)=>y.date.localeCompare(x.date)).map(s=>`<div class="row"><div class="grow"><b>${s.amount>0?esc(sel.name)+' a payé Wild':'Wild a payé '+esc(sel.name)}</b><small>${fmtD(s.date)} · pour ${monthLbl(s.month)}</small></div><b class="${s.amount>0?'t-or':'t-info'}">${aed(Math.abs(s.amount))}</b></div>`).join('')}</div>`:''}
    ${isY?yearTable(sel):`<div class="card"><h3>Bookings · ${perLbl()}</h3><div class="tw"><table class="tbl"><thead><tr><th>Date</th><th>Client</th><th>Activité</th><th class="num">Activités</th><th class="num">Commission</th><th>Payé à</th><th class="num">Agent doit à Wild</th><th class="num">Wild doit à l'agent</th></tr></thead><tbody>
    ${r.bs.map((b,i)=>{const c=r.cs[i];return`<tr class="click" onclick="openB('${b.id}')"><td>${fmtD(b.date)}</td><td><b>${esc(b.client)}</b></td><td>${svcLabel(b)}</td><td class="num">${aed(c.actNet)}</td><td class="num">${aed(c.agentPart)}</td><td class="small">${b.pays.map(p=>PAYSHORT[p.mode]+' '+aed(p.amount)).join(' · ')||'—'}</td><td class="num">${amt(c.agentOwes,'t-or')}</td><td class="num">${amt(-c.agentOwes,'t-info')}</td></tr>`}).join('')||'<tr><td colspan="8"><div class="empty">Aucun booking sur cette période</div></td></tr>'}
    ${r.bs.length?`<tr class="totrow"><td colspan="3">Total</td><td class="num">${aed(r.sales)}</td><td class="num">${aed(r.comm)}</td><td></td><td class="num t-or">${aed(r.toWild)}</td><td class="num t-info">${aed(r.toAgent)}</td></tr>`:''}</tbody></table></div></div>`}`;
  }
  const rows=Object.values(S.agents).map(a=>agentPeriod(a,per)).sort((x,y)=>Math.abs(y.net)-Math.abs(x.net)||y.sales-x.sales);
  return head('Agents & commissions','La commission ne porte que sur quads, buggys, dirt bikes et safaris. Les options reviennent à 100 % à Wild.')+
  oweTiles(rows)+
  `<div class="card agt"><h3>Par agent · ${perLbl()}<button class="btn sm" onclick="agentModal()">${ic('plus')}Agent</button></h3><div class="tw"><table class="tbl"><thead><tr><th>Agent</th><th class="num">Bookings</th><th class="num">Activités vendues</th><th class="num">Commission</th><th class="num">Encaissé par l'agent</th><th class="num">Agent doit à Wild</th><th class="num">Wild doit à l'agent</th><th class="num">Solde net</th></tr></thead><tbody>
   ${rows.map(r=>`<tr class="click" onclick="S.agSel='${r.a.id}';render()"><td><b>${esc(r.a.name)}</b> <span class="muted small">${r.a.pct} %</span></td><td class="num">${r.n}</td><td class="num">${aed(r.sales)}</td><td class="num">${aed(r.comm)}</td><td class="num">${aed(r.paid)}</td><td class="num">${amt(r.restWild,'t-or')}</td><td class="num">${amt(r.restAgent,'t-info')}</td><td class="num">${netTxt(r.net)}</td></tr>`).join('')}
   <tr class="totrow"><td>Total</td><td class="num">${sumRows(rows,'n')}</td><td class="num">${aed(sumRows(rows,'sales'))}</td><td class="num">${aed(sumRows(rows,'comm'))}</td><td class="num">${aed(sumRows(rows,'paid'))}</td><td class="num t-or">${aed(sumRows(rows,'restWild'))}</td><td class="num t-info">${aed(sumRows(rows,'restAgent'))}</td><td class="num">${netTxt(r2(sumRows(rows,'restWild')-sumRows(rows,'restAgent')))}</td></tr></tbody></table></div>
   <p class="small muted" style="margin:0">Solde net : <b class="t-or">+</b> l'agent doit payer Wild · <b class="t-info">−</b> Wild doit payer l'agent. Les montants « doit » sont ce qui reste après les règlements déjà enregistrés. Clique sur un agent pour voir le détail et enregistrer un règlement.</p></div>
  ${isY?yearTable(null):''}`;
};
function settleModal(id,per){const a=S.agents[id];const months=per.length===4?[...new Set(S.bookings.filter(b=>b.agentId===id&&b.date.startsWith(per)).map(b=>b.date.slice(0,7)))].sort():[per];
  const open=months.map(m=>agentPeriod(a,m)).map((r,i)=>({m:months[i],w:r.restWild,g:r.restAgent})).filter(x=>x.w>0.009||x.g>0.009);
  const W=r2(open.reduce((s,x)=>s+x.w,0)),G=r2(open.reduce((s,x)=>s+x.g,0));
  modal(mh('Régler avec '+esc(a.name),perLbl())+`<div class="sb">
   ${open.length>1?`<div class="small muted">${open.length} mois à régler : ${open.map(x=>monthLbl(x.m)).join(', ')}</div>`:''}
   <div class="split"><div><small>${esc(a.name)} doit à Wild</small><b>${aed(W)}</b></div><div><small>Wild doit à ${esc(a.name)}</small><b style="color:var(--info)">${aed(G)}</b></div></div>
   <div class="line tot"><span>${W-G>0.009?esc(a.name)+' paie Wild':G-W>0.009?'Wild paie '+esc(a.name):'Compensation exacte'}</span><span>${aed(Math.abs(W-G))}</span></div>
   <p class="small muted" style="margin:0">Les deux montants se compensent : un seul paiement de la différence suffit. Les deux sens sont enregistrés pour l'historique.</p></div>
   <div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="doSettle('${id}','${per}')">Enregistrer le règlement</button></div>`)}
function doSettle(id,per){const a=S.agents[id];const months=per.length===4?[...new Set(S.bookings.filter(b=>b.agentId===id&&b.date.startsWith(per)).map(b=>b.date.slice(0,7)))]:[per];
  months.forEach(m=>{const r=agentPeriod(a,m);if(r.restWild>0.009)S.settlements.push({agentId:id,month:m,amount:r.restWild,date:TODAY});if(r.restAgent>0.009)S.settlements.push({agentId:id,month:m,amount:-r.restAgent,date:TODAY})});
  closeModal();render();toast('Règlement enregistré avec '+a.name)}
function agentModal(id){const a=id?S.agents[id]:{name:'',pct:20,phone:''};modal(mh(id?'Modifier l\'agent':'Nouvel agent')+`<div class="sb"><label class="fld"><span>Nom</span><input id="agn" value="${esc(a.name)}"></label><label class="fld"><span>Commission (%)</span><input id="agp" type="number" value="${a.pct}"></label><label class="fld"><span>WhatsApp</span><input id="agw" value="${esc(a.phone)}"></label><p class="small muted" style="margin:0">Le pourcentage est figé sur chaque booking : le modifier ne change pas les bookings déjà saisis.</p></div><div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="saveAgent('${id||''}')">Enregistrer</button></div>`)}
function saveAgent(id){const n=$('#agn').value.trim();if(!n){toast('Indique un nom');return}id=id||'a'+Date.now().toString(36);S.agents[id]={id,name:n,pct:+$('#agp').value||0,phone:$('#agw').value.trim()};closeModal();render();toast('Agent enregistré')}
VIEWS.storage=()=>{
  const act=S.storage.filter(s=>s.active),mrr=act.reduce((a,s)=>a+stMonthly(s),0),due=act.filter(stDue);
  const occ=t=>act.filter(s=>s.type===t).length;
  return `<div class="ph"><div><h1>Storage</h1><p>Your ride. Your desert base. · stockage sécurisé à Al Badayer, accès 24/7</p></div><div class="acts"><button class="btn" onclick="serviceModal()">+ BBQ / installation</button><button class="btn pri" onclick="stContractModal()">${ic('plus')}Nouveau contrat</button></div></div>
  <div class="g g5">
    <div class="card kpi hero span2"><div class="palm" data-palm="6"></div><div class="lb">Revenu storage mensuel</div><div class="v">${aed(mrr)}</div><div class="d">${act.length} machines stockées · ${due.length} impayé(s) pour ${monthLbl(MONTH)}</div></div>
    ${Object.entries(STORAGE).map(([k,p])=>`<div class="card kpi"><div class="lb">Places ${p.name.toLowerCase()}</div><div class="v">${occ(k)} <small>/ ${p.cap}</small></div><div class="bar" style="margin-top:10px"><i style="width:${occ(k)/p.cap*100}%;background:var(--olive)"></i></div></div>`).join('')}
  </div>
  <div class="card"><h3>Contrats</h3><div class="tw"><table class="tbl"><thead><tr><th>Place</th><th>Client</th><th>Machine</th><th>Formule</th><th class="num">Mensuel</th><th>Payé jusqu'à</th><th></th></tr></thead><tbody>
  ${act.map(s=>{const c=client(s.phone);return`<tr class="click" onclick="clientDrawer('${esc(s.phone)}')"><td class="tm">${s.spot}</td><td><b>${esc(c.name)}</b> <span class="wm">Wild member</span></td><td>${esc(s.vehicle)} <small class="muted">${STORAGE[s.type].name}</small></td><td>${s.plan==='wash'?'Storage + lavage':'Storage seul'}${s.locker?' <small class="muted">+ casier</small>':''}</td><td class="num"><b>${aed(stMonthly(s))}</b></td><td>${stDue(s)?`<span class="pill p-crit">${monthLbl(s.paidThrough)}</span>`:`<span class="pill p-ok">${monthLbl(s.paidThrough)}</span>`}</td><td onclick="event.stopPropagation()">${stDue(s)?`<button class="btn pri sm" onclick="stPayModal('${s.id}')">Encaisser</button>`:`<button class="btn sm" onclick="stPayModal('${s.id}')">Payer d'avance</button>`}</td></tr>`}).join('')}
  </tbody></table></div></div>
  <div class="g g2">
    <div class="card"><h3>Tarifs mensuels <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">AED par machine</span></h3><div class="tw"><table class="tbl ptable"><thead><tr><th>Formule</th>${Object.values(STORAGE).map(p=>`<th class="num">${p.name}</th>`).join('')}</tr></thead><tbody><tr><td>Storage seul</td>${Object.values(STORAGE).map(p=>`<td class="num">${p.storage.toLocaleString('en-US')}</td>`).join('')}</tr><tr><td>Storage + lavage</td>${Object.values(STORAGE).map(p=>`<td class="num">${p.wash.toLocaleString('en-US')}</td>`).join('')}</tr></tbody></table></div><p class="small muted" style="margin:10px 0 0">Le lavage est inclus après chaque sortie. Casier personnel, WC et douches inclus. La location BBQ est facturée en plus.</p></div>
    <div class="card"><h3>Wild Membership <span class="wm">Inclus avec le storage</span></h3><div class="g"><div class="perk"><b class="big">−20 %</b><div>Café et snacks au Wild Coffee</div></div><div class="perk"><b class="big">−20 %</b><div>Sur toutes les activités, pour le membre et ses amis. Appliqué automatiquement au booking.</div></div></div></div>
  </div>
  <div class="card"><h3>BBQ & installations dans les dunes</h3>${S.services.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<div class="row"><div class="grow"><b>${STORAGE_SERVICES[x.service]}</b><small>${esc(client(x.phone).name)} · ${fmtD(x.date)} ${x.time}${x.note?' · '+esc(x.note):''}</small></div><b>${aed(x.price)}</b>${x.paid?'<span class="pill p-ok">Payé</span>':`<button class="btn pri sm" onclick="svcPay('${x.id}')">Encaisser</button>`}</div>`).join('')||'<div class="empty">Aucun service prévu</div>'}</div>`;
};
function stContractModal(phone){
  const c=phone?client(phone):null;
  modal(mh('Nouveau contrat storage')+`<div class="sb"><label class="fld"><span>Téléphone du client</span><input id="scp" value="${esc(c?.phone||'')}" placeholder="+971 …" oninput="const k=client(this.value);$('#scn').value=k?k.name:$('#scn').value;$('#scinfo').textContent=k?'Client existant : '+k.name:''"></label><small class="t-ok" id="scinfo">${c?'Client existant : '+esc(c.name):''}</small><label class="fld"><span>Nom</span><input id="scn" value="${esc(c?.name||'')}"></label>
   <div class="g g2"><label class="fld"><span>Type</span><select id="sct" onchange="stPrice()">${Object.entries(STORAGE).map(([k,p])=>`<option value="${k}">${p.name}</option>`).join('')}</select></label><label class="fld"><span>Formule</span><select id="scf" onchange="stPrice()"><option value="storage">Storage seul</option><option value="wash">Storage + lavage</option></select></label>
   <label class="fld"><span>Machine</span><input id="scv" placeholder="ex. Can-Am X3 RS (noir)"></label><label class="fld"><span>Place</span><input id="scs" placeholder="B-12"></label></div>
   <label class="cbox"><input type="checkbox" id="scl" checked><span>Casier personnel pour l'équipement</span></label>
   <div class="line tot"><span>Mensuel</span><span id="scprice">${aed(STORAGE.buggy.storage)}</span></div><p class="small muted" style="margin:0">Le client devient automatiquement Wild member (−20 % activités et Wild Coffee).</p></div>
   <div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="saveContract()">Créer et encaisser le 1er mois</button></div>`);
}
function stPrice(){$('#scprice').textContent=aed(STORAGE[$('#sct').value][$('#scf').value])}
function saveContract(){const p=$('#scp').value.trim(),n=$('#scn').value.trim(),v=$('#scv').value.trim(),sp=$('#scs').value.trim();if(digits(p).length<6||!n||!v||!sp){toast('Téléphone, nom, machine et place sont obligatoires');return}
  if(S.storage.some(s=>s.active&&s.spot.toLowerCase()===sp.toLowerCase())){toast('La place '+sp+' est déjà occupée');return}
  let c=client(p);if(!c){c={name:n,phone:p,country:'',member:true,memberSince:MONTH,notes:''};S.clients.push(c)}else{c.member=true;c.memberSince=c.memberSince||MONTH}
  const s={id:uid(),phone:c.phone,vehicle:v,type:$('#sct').value,plan:$('#scf').value,spot:sp,start:TODAY,paidThrough:addDays(MONTH+'-01',-1).slice(0,7),locker:$('#scl').checked,payments:[],active:true};
  S.storage.push(s);closeModal();render();toast('Contrat créé · '+c.name+' est Wild member');stPayModal(s.id)}
function stPayModal(id){const s=S.storage.find(x=>x.id===id),c=client(s.phone);const next=addDays(s.paidThrough+'-28',5).slice(0,7);S._sp={mode:'card'};
  modal(mh('Paiement storage',`${esc(c.name)} · ${esc(s.vehicle)} · place ${s.spot}`)+`<div class="sb"><div class="line"><span>Mois</span><b>${monthLbl(next)}</b></div><div class="line tot"><span>Montant</span><span>${aed(stMonthly(s))}</span></div>
  <div class="fld"><span>Moyen</span><div class="seg">${[['card','Carte'],['cash','Espèces'],['transfer','Virement'],['lien','Lien']].map(([k,l])=>`<button class="${k==='card'?'on':''}" onclick="S._sp.mode='${k}';[...this.parentNode.children].forEach(x=>x.classList.toggle('on',x===this))">${l}</button>`).join('')}</div></div></div>
  <div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri big" onclick="stPay('${id}','${next}')">Confirmer</button></div>`)}
function stPay(id,m){const s=S.storage.find(x=>x.id===id);s.payments.push({month:m,amount:stMonthly(s),mode:S._sp.mode,date:TODAY});s.paidThrough=m;closeModal();render();toast('Storage payé jusqu\'à '+monthLbl(m))}
function serviceModal(){modal(mh('BBQ / installation dans les dunes','You ride. We set up.')+`<div class="sb"><label class="fld"><span>Client (téléphone)</span><select id="svp">${S.clients.slice().sort((a,b)=>(b.member-a.member)||a.name.localeCompare(b.name)).map(c=>`<option value="${esc(c.phone)}">${esc(c.name)}${c.member?' · member':''}</option>`).join('')}</select></label>
  <label class="fld"><span>Service</span><select id="svs">${Object.entries(STORAGE_SERVICES).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label>
  <div class="g g2"><label class="fld"><span>Date</span><input id="svd" type="date" value="${addDays(TODAY,1)}"></label><label class="fld"><span>Heure</span><input id="svh" type="time" value="16:00"></label></div>
  <label class="fld"><span>Prix (sur devis, AED)</span><input id="svx" type="number" placeholder="ex. 1200"></label><label class="fld"><span>Note</span><input id="svn" placeholder="Nombre de personnes, emplacement…"></label></div>
  <div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="saveService()">Enregistrer</button></div>`)}
function saveService(){const pr=+$('#svx').value;if(!(pr>0)){toast('Indique le prix du devis');return}S.services.push({id:uid(),phone:$('#svp').value,service:$('#svs').value,date:$('#svd').value,time:$('#svh').value,price:pr,paid:false,note:$('#svn').value});closeModal();render();toast('Service enregistré')}
function svcPay(id){const x=S.services.find(s=>s.id===id);x.paid=true;x.paidAt=TODAY;render();toast('Service encaissé : '+aed(x.price))}
VIEWS.fleet=()=>{
  const f=S.fleetF||'all';const list=S.vehicles.filter(v=>f==='all'||v.model===f);
  return `<div class="ph"><div><h1>Flotte</h1><p>${S.vehicles.length} machines Wild · ${S.vehicles.filter(v=>v.status==='available').length} disponibles. Les machines des clients storage sont dans Storage.</p></div>
  <div class="acts"><button class="btn" onclick="vehicleModal()">${ic('plus')}Machine</button><select style="width:auto" onchange="S.fleetF=this.value;render()"><option value="all">Tous les modèles</option>${Object.entries(ACT).map(([k,m])=>`<option value="${k}" ${f===k?'selected':''}>${m.name}</option>`).join('')}</select></div></div>
  <div class="card"><div class="tw"><table class="tbl"><thead><tr><th>ID</th><th>Modèle</th><th class="num">Heures</th><th>Statut</th><th>Prochain service</th><th class="num">Revenu</th><th class="num">Rev./heure</th></tr></thead><tbody>
  ${list.map(v=>{const l=svcLeft(v),r=reservedBy(v),rb=ridingBy(v);return`<tr class="click" onclick="machineModal('${v.id}')"><td class="tm">${v.id}</td><td>${ACT[v.model].name}</td><td class="num">${v.hours.toFixed(1)}</td><td><span class="pill p-${vStatusCls(v)}">${vStatusTxt(v)}</span>${r&&v.status==='available'?` <small class="muted">rés. ${r.time}</small>`:''}${rb?` <small class="muted">retour ${hm(rb.endMin)}</small>`:''}</td><td class="${l<0?'t-crit':l<5?'t-warn':''}">${v.status==='repair'?'—':l<0?'Dépassé '+(-l)+' h':l+' h'}</td><td class="num">${aed(v.rev)}</td><td class="num">${aed(v.rev/v.hours)}</td></tr>`}).join('')}
  </tbody></table></div></div>`;
};
VIEWS.maintenance=()=>{
  const od=S.vehicles.filter(v=>svcLeft(v)<0||v.status==='repair'),ds=S.vehicles.filter(v=>svcLeft(v)>=0&&svcLeft(v)<5&&v.status!=='repair');
  const inM=S.vehicles.filter(v=>v.status==='maintenance');
  const item=v=>`<div class="row"><div class="sev ${svcLeft(v)<0||v.status==='repair'?'crit':'act'}"></div><div class="grow"><b>${v.id} · ${ACT[v.model].short}</b><small>${v.status==='repair'?'En réparation':v.svcType+' · '+(svcLeft(v)<0?'dépassé de '+(-svcLeft(v))+' h':svcLeft(v)+' h restantes')}</small></div><button class="btn pri sm" onclick="maintModal('${v.id}')">${v.status==='maintenance'||v.status==='repair'?'Terminer':'Démarrer'}</button></div>`;
  return `<div class="ph"><div><h1>Maintenance</h1><p>Basée sur les heures moteur · les pièces utilisées sortent du stock</p></div><button class="btn" onclick="go('stock')">${ic('box')}Stock</button></div>
  <div class="strip" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="stat crit"><b>${od.length}</b><span>Dépassé / panne</span></div><div class="stat warn"><b>${ds.length}</b><span>Bientôt dû</span></div><div class="stat ok"><b>${S.vehicles.length-od.length-ds.length}</b><span>OK</span></div></div>
  <div class="g g2">
    <div class="card"><h3>Prioritaire</h3>${[...od,...ds].map(item).join('')||'<div class="empty">Rien à signaler</div>'}</div>
    <div class="card"><h3>À l'atelier</h3>${inM.map(item).join('')||'<div class="empty">Aucune machine à l\'atelier</div>'}
      <h3 style="margin-top:16px">Terminé aujourd'hui</h3>${S.maintLog.map(m=>`<div class="row"><div class="grow"><b>${m.v} · ${esc(m.type)}</b><small>${m.at} · ${esc(m.mech)} · ${esc(m.parts)}</small></div><b>${aed(m.total)}</b></div>`).join('')||'<div class="muted small">Aucune intervention terminée</div>'}</div>
  </div>`;
};
VIEWS.stock=()=>{
  const t=S.stockTab;
  return `<div class="ph"><div><h1>Stock</h1><p>Pièces, Wild Coffee, matériel BBQ & camp, nettoyage</p></div><button class="btn pri" onclick="stockEntryModal()">${ic('plus')}Entrée de stock</button></div>
  <div class="tabs">${Object.keys(S.stock).map(k=>`<button class="${t===k?'on':''}" onclick="S.stockTab='${k}';render()">${catName(k)}</button>`).join('')}</div>
  <div class="card"><div class="tw"><table class="tbl"><thead><tr><th>Article</th><th class="num">Stock</th><th class="num">Minimum</th><th>Niveau</th><th></th></tr></thead><tbody>
  ${S.stock[t].map(i=>{const low=i[1]<=i[2],pct=Math.min(100,i[1]/(i[2]*3)*100);return`<tr><td><b>${esc(i[0])}</b></td><td class="num ${low?'t-crit':''}"><b>${i[1]}</b></td><td class="num">${i[2]}</td><td style="min-width:140px"><div class="bar"><i style="width:${pct}%;background:var(--${low?'crit':'olive'})"></i></div></td><td>${low?`<button class="btn pri sm" onclick="orderItem('${t}','${esc(i[0])}')">Commander</button>`:''}</td></tr>`}).join('')}
  </tbody></table></div></div>`;
};
VIEWS.staff=()=>{
  const c=k=>S.staff.filter(s=>s.status===k).length;
  const lbl={present:['Présent','ok'],late:['En retard','warn'],break:['Pause','info'],off:['Repos','grey'],absent:['Absent','crit'],notstarted:['Pas pointé','grey']};
  const roleN={guide:'Guide',reception:'Réception',mechanic:'Mécanicien',manager:'Manager',coffee:'Wild Coffee'};
  return `<div class="ph"><div><h1>Staff aujourd'hui</h1><p>Pointage et disponibilité · chacun pointe depuis l'App Guide, ou la réception change le statut ici</p></div>${['owner','manager'].includes(S.role)?`<button class="btn" onclick="staffModal()">${ic('plus')}Membre</button>`:''}</div>
  <div class="g g5"><div class="stat ok"><b>${c('present')}</b><span>Présents</span></div><div class="stat warn"><b>${c('late')}</b><span>En retard</span></div><div class="stat crit"><b>${c('absent')}</b><span>Absents</span></div><div class="stat info"><b>${c('break')}</b><span>Pause</span></div><div class="stat"><b>${c('off')}</b><span>Repos</span></div></div>
  <div class="card"><div class="tw"><table class="tbl"><thead><tr><th>Nom</th><th>Poste</th><th>Shift</th><th>Arrivée</th><th>Statut</th><th>Activité</th></tr></thead><tbody>
  ${S.staff.map(s=>{const g=s.role==='guide'?guideState(s.name):null;const L=lbl[s.status];return`<tr><td><b>${esc(s.name)}</b></td><td>${roleN[s.role]}</td><td>${s.shift}</td><td>${s.in||'—'}</td><td>${staffRole()?`<select style="width:auto;padding:5px 8px" onchange="setStaffStatus(${S.staff.indexOf(s)},this.value)" aria-label="Statut">${Object.entries(lbl).map(([k,[l]])=>`<option value="${k}" ${s.status===k?'selected':''}>${l}</option>`).join('')}</select>${s.late?' <small class="t-warn">+'+s.late+' min</small>':''}`:`<span class="pill p-${L[1]}">${L[0]}${s.late?' +'+s.late+' min':''}</span>`}</td><td>${g?(g.k==='riding'?`<span class="t-info">En sortie · ${g.txt}</span>`:esc(g.txt)):'—'}</td></tr>`}).join('')}
  </tbody></table></div></div>`;
};
VIEWS.finance=()=>{
  const F=finDay(TODAY),cc=closingToday(),can=['owner','manager'].includes(S.role);
  const wildIn=r2(F.by.site+F.by.lien+F.by.cash+F.by.card);
  return `<div class="ph"><div><h1>Finance du jour</h1><p>Ventes, parts agent / Wild, encaissements et caisse</p></div><div class="acts"><button class="btn" onclick="expenseModal()">${ic('plus')}Dépense</button><button class="btn pri" onclick="cashModal()">Clôture de caisse</button></div></div>
  <div class="g g4">
    <div class="card kpi hero span2"><div class="palm" data-palm="6"></div><div class="lb">Marge estimée du jour</div><div class="v">${aed(F.margin)}</div><div class="d">Part Wild ${aed(F.wild)} + storage ${aed(F.stIn+F.svIn)} − dépenses ${aed(F.exp)}</div></div>
    <div class="card kpi"><div class="lb">Ventes</div><div class="v">${aed(F.sales)}</div><div class="d">Activités ${aed(F.act)} · options ${aed(F.opt)}</div></div>
    <div class="card kpi"><div class="lb">Remises members</div><div class="v t-ol">${aed(F.disc)}</div><div class="d">−${CFG.member} % sur les activités</div></div>
  </div>
  ${cc?`<div class="card" style="border-color:var(--${cc.state==='approved'?'ok':'warn'})"><h3>Clôture de caisse <span class="pill p-${cc.state==='approved'?'ok':'warn'}">${cc.state==='approved'?'Validée':'À valider par le manager'}</span></h3><div class="line"><span>Attendu</span><b>${aed(cc.expected)}</b></div><div class="line"><span>Compté</span><b>${aed(cc.actual)}</b></div><div class="line"><span>Écart</span><b class="t-${cc.diff===0?'ok':'crit'}">${aed(cc.diff)}</b></div>${cc.state==='pending'&&can?`<button class="btn go" onclick="closingToday().state='approved';toast('Clôture validée');render()">Valider la clôture</button>`:''}</div>`:''}
  <div class="g g2">
    <div class="card"><h3>Encaissements bookings</h3>${Object.entries(PAYMODES).map(([k,l])=>{const v=F.by[k]||0;return`<div style="margin-bottom:10px"><div class="line"><span>${l}</span><b>${aed(v)}</b></div><div class="bar"><i style="width:${F.sales?v/F.sales*100:0}%;background:var(--${k==='agent'?'accent':'olive'})"></i></div></div>`}).join('')}
      <div class="line"><span class="muted">Reçu directement par Wild</span><b>${aed(wildIn)}</b></div><div class="line"><span class="muted">Reste à encaisser</span><b class="t-crit">${aed(F.rest)}</b></div><p class="small muted" style="margin:6px 0 0">L'argent payé à l'agent est soldé dans l'onglet Agents.</p></div>
    <div class="card"><h3>Dépenses du jour</h3>${S.expenses.filter(e=>e.date===TODAY).map(e=>`<div class="row"><div class="grow"><b>${esc(e.cat)}</b><small>${esc(e.sup)} · ${PAYSHORT[e.method]||'Virement'}${e.veh?' · '+e.veh:''}${e.receipt?' · reçu joint':''}</small></div><b>${aed(e.amount)}</b></div>`).join('')}</div>
  </div>`;
};
VIEWS.reports=()=>{
  const bs=S.bookings.filter(b=>b.date.slice(0,7)===MONTH&&b.date<=TODAY&&live(b)),cs=bs.map(calc);const sum=k=>r2(cs.reduce((s,c)=>s+c[k],0));
  const stM=r2(S.storage.flatMap(s=>s.payments).filter(p=>p.month===MONTH).reduce((s,p)=>s+p.amount,0));
  const byCh={};bs.forEach((b,i)=>{const k=b.agentId?S.agents[b.agentId].name:b.channel;byCh[k]=(byCh[k]||0)+cs[i].total});
  const chs=Object.entries(byCh).sort((a,b)=>b[1]-a[1]),chMax=chs[0]?.[1]||1;
  const byAct={};bs.forEach(b=>{fleetItems(b).forEach(([m,q])=>byAct[ACT[m].name]=(byAct[ACT[m].name]||0)+unitOf(b,m)*q*(b.member?1-CFG.member/100:1));Object.entries(b.safari).forEach(([k,q])=>{if(q)byAct['Safari']=(byAct['Safari']||0)+sPrice(b,k)*q*(b.member?1-CFG.member/100:1)})});
  const acts=Object.entries(byAct).sort((a,b)=>b[1]-a[1]),aMax=acts[0]?.[1]||1;
  const done=bs.filter(b=>b.after),sat=done.filter(b=>b.after.mood==='content').length,rev=done.filter(b=>b.after.review==='faite').length;
  const prof=S.vehicles.map(v=>({...v,net:v.rev-v.maint-v.dmg})).sort((a,b)=>b.net-a.net);
  return `<div class="ph"><div><h1>Rapports</h1><p>${monthLbl(MONTH)} jusqu'à aujourd'hui · calculé sur les bookings enregistrés</p></div><div class="acts"><button class="btn" onclick="toast('Export PDF prêt (démo)')">Exporter PDF</button><button class="btn" onclick="toast('Export XLSX prêt (démo)')">Exporter XLSX</button></div></div>
  <div class="g g4">
    <div class="card kpi"><div class="lb">Ventes activités + options</div><div class="v">${aed(sum('total'))}</div><div class="d">${bs.length} bookings</div></div>
    <div class="card kpi"><div class="lb">Commissions agents</div><div class="v t-or">${aed(sum('agentPart'))}</div><div class="d">${sum('total')?Math.round(sum('agentPart')/sum('total')*100):0} % des ventes</div></div>
    <div class="card kpi"><div class="lb">Part Wild + storage</div><div class="v t-ol">${aed(sum('wildPart')+stM)}</div><div class="d">dont storage ${aed(stM)}</div></div>
    <div class="card kpi"><div class="lb">Satisfaction</div><div class="v">${done.length?Math.round(sat/done.length*100):0} %</div><div class="d">${rev} reviews faites sur ${done.length} tours</div></div>
  </div>
  <div class="g g2">
    <div class="card"><h3>Ventes par canal / agent</h3>${chs.map(([l,v])=>`<div style="margin-bottom:10px"><div class="line"><span>${esc(l)}</span><b>${aed(v)}</b></div><div class="bar"><i style="width:${v/chMax*100}%;background:var(--accent)"></i></div></div>`).join('')}</div>
    <div class="card"><h3>Ventes par activité</h3>${acts.map(([l,v])=>`<div style="margin-bottom:10px"><div class="line"><span>${esc(l)}</span><b>${aed(v)}</b></div><div class="bar"><i style="width:${v/aMax*100}%;background:var(--olive)"></i></div></div>`).join('')}</div>
  </div>
  <div class="card"><h3>Rentabilité par machine (cumul)</h3><div class="tw"><table class="tbl"><thead><tr><th>Machine</th><th class="num">Sorties</th><th class="num">Heures</th><th class="num">Revenu</th><th class="num">Maintenance</th><th class="num">Dommages</th><th class="num">Net</th></tr></thead><tbody>
  ${prof.map(v=>`<tr class="click" onclick="machineModal('${v.id}')"><td><b>${v.id}</b> <small class="muted">${ACT[v.model].short}</small></td><td class="num">${v.rides}</td><td class="num">${v.hours.toFixed(0)}</td><td class="num">${aed(v.rev)}</td><td class="num">${aed(v.maint)}</td><td class="num">${aed(v.dmg)}</td><td class="num"><b>${aed(v.net)}</b></td></tr>`).join('')}</tbody></table></div></div>`;
};
VIEWS.actions=()=>{
  const al=alerts();const sec=(lvl,t,c)=>{const l=al.filter(a=>a.lvl===lvl);return`<div class="card"><h3><span class="t-${c}">${t}</span><span class="pill p-${c}">${l.length}</span></h3>${l.map(a=>`<div class="row"><div class="sev ${lvl}"></div><div class="grow"><b>${esc(a.t)}</b><small>${esc(a.s)}</small></div>${a.btn?`<button class="btn sm ${lvl==='crit'?'pri':''}" onclick="${a.fn}">${a.btn}</button>`:''}</div>`).join('')||'<div class="muted">Rien à signaler</div>'}</div>`};
  return `<div class="ph"><div><h1>Centre d'actions</h1><p>Tout ce qui demande une décision, par priorité</p></div></div>${sec('crit','Critique','crit')}${sec('act','Action requise','warn')}${sec('info','Information','info')}`;
};
VIEWS.settings=()=>`<div class="ph"><div><h1>Réglages</h1><p>Tarifs, options, storage et règles. Modifier un prix ne change pas les bookings déjà saisis.</p></div></div>
  <div class="g g2">
   <div class="card"><h3>Activités (commissionnables)</h3>${Object.entries(ACT).map(([k,m])=>`<div class="row"><div class="grow"><b>${m.name}</b><small>${m.tier} · ${S.vehicles.filter(v=>v.model===k).length} machine(s)</small></div><label class="cbox" style="padding:6px 8px;flex:none"><input type="checkbox" ${m.gear?'checked':''} onchange="ACT['${k}'].gear=this.checked;toast('Équipement mis à jour')"><span class="small">Tailles</span></label><label class="pb"><i>1H</i><input type="number" style="width:84px" value="${m.p[60]}" onchange="ACT['${k}'].p[60]=+this.value||0;toast('Prix mis à jour')"></label><label class="pb"><i>2H</i><input type="number" style="width:84px" value="${m.p[120]}" onchange="ACT['${k}'].p[120]=+this.value||0;toast('Prix mis à jour')"></label></div>`).join('')}
    ${Object.entries(SAFARI).map(([k,s])=>`<div class="row"><div class="grow"><b>${s[0]}</b></div><input type="number" style="width:110px" value="${s[1]}" onchange="SAFARI['${k}'][1]=+this.value||0;toast('Prix mis à jour')"></div>`).join('')}</div>
   <div class="g">
    ${autoSettingsHtml()}
    <div class="card"><h3>Options (100 % Wild, sans commission)</h3>${Object.entries(OPTIONS).map(([k,o])=>`<div class="row"><div class="grow"><b>${o[0]}</b></div><input type="number" style="width:110px" value="${o[1]}" onchange="OPTIONS['${k}'][1]=+this.value||0;toast('Prix mis à jour')"></div>`).join('')}</div>
    <div class="card"><h3>Règles</h3>
     <div class="row"><div class="grow"><b>Remise Wild member</b><small>Sur toutes les activités (pas les options)</small></div><input type="number" style="width:90px" value="${CFG.member}" onchange="CFG.member=+this.value||0;toast('Remise mise à jour')"><b>%</b></div>
     <div class="row"><div class="grow"><b>Coût véhicule partenaire</b></div><input type="number" style="width:110px" value="${CFG.ext}" onchange="CFG.ext=+this.value||0"></div>
     <div class="row"><div class="grow"><b>Alerte avant départ</b></div><input type="number" style="width:90px" value="${CFG.pre}" onchange="CFG.pre=+this.value||0"><b>min</b></div>
     <div class="row"><div class="grow"><b>Client en retard après</b></div><input type="number" style="width:90px" value="${CFG.late}" onchange="CFG.late=+this.value||0"><b>min</b></div>
     <div class="row"><div class="grow"><b>Âge minimum conducteur</b></div><b>16 ans</b></div><button class="btn sm" style="align-self:flex-start;margin-top:8px" onclick="if(!('Notification' in window)){toast('Notifications indisponibles ici : les alertes restent visibles et sonores dans l\'appli');return}Notification.requestPermission().then(()=>toast('Réglage enregistré')).catch(()=>toast('Notifications refusées par cet affichage'));beep()">Activer les notifications sur cet appareil</button><p class="small muted" style="margin:4px 0 0">Les alertes 30 min avant et en cas de retard sonnent tant que l'appli est ouverte.</p></div>
    <div class="card"><h3>Demandes rapides</h3><label class="fld"><span>Une par ligne</span><textarea id="tagsEdit" rows="7">${esc(DEMANDS.join('\n'))}</textarea></label><button class="btn sm" style="align-self:flex-start" onclick="DEMANDS.splice(0,DEMANDS.length,...$('#tagsEdit').value.split('\n').map(x=>x.trim()).filter(Boolean));toast('Demandes enregistrées')">Enregistrer</button></div>
    <div class="card"><h3>Agents <button class="btn sm" onclick="agentModal()">+ Agent</button></h3>${Object.values(S.agents).map(a=>`<div class="row"><div class="grow"><b>${esc(a.name)}</b><small>${esc(a.phone)||'—'}</small></div><span class="pill p-or">${a.pct} %</span><button class="btn sm" onclick="agentModal('${a.id}')">Modifier</button></div>`).join('')}</div>
   </div></div>`;

/* ---------- App Guide (mobile, sans données financières) ---------- */
VIEWS.guide=()=>{
  const g=S.guideName,st=S.staff.find(s=>s.name===g),t=S.guideTab;
  if(!st)return `<div class="ph"><div><h1>App Guide</h1></div></div><div class="empty">${S.staff.some(s=>s.role==='guide')?'Choisis un guide':'Ajoute d\'abord les guides dans l\'onglet Staff'}${S.role!=='guide'&&S.staff.some(s=>s.role==='guide')?` : <select style="width:auto" onchange="S.guideName=this.value;render()"><option></option>${S.staff.filter(s=>s.role==='guide').map(s=>`<option>${esc(s.name)}</option>`).join('')}</select>`:'. Ton nom doit être identique dans Staff et dans ton compte.'}</div>`;
  const myB=todayB().filter(b=>b.guide===g&&['up','riding'].includes(b.status)).sort((a,b)=>bStart(a)-bStart(b));
  const cur=myB.find(b=>b.status==='riding')||myB[0];const tasks=S.tasks.filter(x=>x.who===g);
  const stTxt={present:'Pointé à '+st.in,late:'Pointé à '+st.in+' (retard)',break:"En pause jusqu'à "+(st.until||''),off:'Pointé sorti',absent:'Absent',notstarted:'Pas encore pointé'}[st.status];
  let body='';
  if(t==='home')body=`<div class="card"><div class="line"><span class="muted">Shift</span><b>${st.shift}</b></div><div class="line"><span class="muted">Statut</span><b class="${st.status==='break'?'t-info':'t-ok'}">${stTxt}</b></div></div>
    ${cur?`<div class="card"><h3>${cur.status==='riding'?'Sortie en cours':'Prochaine sortie'}</h3><div style="font-family:var(--display);font-size:34px">${cur.status==='riding'?hm(cur.startMin):cur.time}</div><b>${esc(cur.client)}</b><div class="muted">${svcLabel(cur)} · ${cur.vehicles.join(' / ')||'véhicules à venir'}</div></div>`:'<div class="empty">Aucune sortie assignée</div>'}
    <button class="btn wide" onclick="S.guideTab='tasks';render()">Mes tâches · ${tasks.filter(x=>!taskDone(x)).length} en attente</button>
    <div class="g g2"><button class="btn" onclick="guideBreak()">${st.status==='break'?'Fin de pause':'Pause'}</button><button class="btn" onclick="guideOut()">${['off','notstarted'].includes(st.status)?'Pointer':'Pointer sortie'}</button></div>`;
  if(t==='ride'){
    if(!cur)body='<div class="empty">Aucune sortie assignée pour le moment.</div>';
    else if(cur.status==='riding'){const d=cur.endMin-now();body=`<div class="card" style="text-align:center"><span class="pill p-${d<0?'crit':'info'}">${d<0?'Retard '+(-d)+' min':'En sortie'}</span><h2 style="font-size:28px;margin-top:10px">${esc(cur.client)}</h2><div class="muted">${svcLabel(cur)}</div><div style="font-family:var(--display);font-size:22px;margin-top:8px">${cur.vehicles.join(' · ')}</div></div>${prepHtml(cur)}
      <div class="g g2"><div class="stat"><span>Départ</span><b>${hm(cur.startMin)}</b></div><div class="stat"><span>Retour prévu</span><b>${hm(cur.endMin)}</b></div></div>
      <button class="btn pri big wide" onclick="endModal('${cur.id}')">Fin de sortie</button><button class="btn wide" onclick="incidentModal('${cur.id}')">${ic('flag')}Signaler un incident</button>`}
    else{const bl=blockers(cur);body=`<div class="card"><h3>Prochaine sortie · ${cur.time}</h3><h2 style="font-size:26px">${esc(cur.client)}</h2><div class="muted">${svcLabel(cur)} · ${cur.vehicles.join(' / ')||'—'}</div></div>${prepHtml(cur)}${bl.length?`<div class="blocked"><div class="t">EN PRÉPARATION</div><div>La réception doit compléter : ${bl.map(x=>x.label.toLowerCase()).join(', ')}.</div></div>`:`<div class="readybox"><div class="t">CLIENT PRÊT</div><div>Tout est validé. La réception lance le départ.</div></div>`}<button class="btn wide" onclick="incidentModal('${cur.id}')">${ic('flag')}Signaler un incident</button>`}
  }
  if(t==='tasks')body=tasks.map(x=>`<div class="chk ${taskDone(x)?'ok':'no'}"><div class="ic">${taskDone(x)?'✓':'!'}</div><b>${x.time} · ${esc(x.name)}<small>${taskDone(x)?'Terminé':(x.photo?'Photo obligatoire':'En attente')}</small></b>${taskDone(x)?'':`<button class="btn sm pri" onclick="taskModal(${S.tasks.indexOf(x)})">Faire</button>`}</div>`).join('');
  if(t==='alerts'){const late=myB.filter(b=>b.status==='riding'&&now()>b.endMin);const svc=S.vehicles.filter(v=>myB.some(b=>b.vehicles.includes(v.id))&&svcLeft(v)<5);body=`<div class="card"><h3>Mes alertes</h3>${late.map(b=>`<div class="row"><div class="sev crit"></div><div class="grow"><b>Retour en retard</b><small>${esc(b.client)} · prévu ${hm(b.endMin)}</small></div></div>`).join('')}${svc.map(v=>`<div class="row"><div class="sev act"></div><div class="grow"><b>${v.id} service dans ${svcLeft(v)} h</b><small>Surveiller la machine</small></div></div>`).join('')}${!late.length&&!svc.length?'<div class="muted">Aucune alerte</div>':''}</div>`}
  if(t==='profile')body=`<div class="card" style="text-align:center"><div class="av" style="width:64px;height:64px;font-size:28px;margin:0 auto">${g[0]}</div><h2 style="margin-top:8px">${esc(g)}</h2><div class="muted">Guide</div></div><div class="card"><div class="line"><span>Sorties ce mois</span><b>${S.bookings.filter(b=>b.guide===g&&b.date.slice(0,7)===MONTH&&b.status==='done').length}</b></div><div class="line"><span>Incidents</span><b>${S.incidents.filter(i=>i.guide===g).length}</b></div></div>`;
  const tabs=[['home','Accueil','home'],['ride','Ma sortie','fleet'],['tasks','Tâches','check'],['alerts','Alertes','bell'],['profile','Profil','user']];
  const guides=S.staff.filter(s=>s.role==='guide');
  return `<div class="ph"><div><h1>App Guide</h1><p>Vue mobile terrain · aucune donnée financière</p></div>${S.role!=='guide'?`<select style="width:auto" onchange="S.guideName=this.value;render()">${guides.map(s=>`<option ${s.name===g?'selected':''}>${s.name}</option>`).join('')}</select>`:''}</div>
  <div class="phone"><div class="screen"><div class="ptop"><img src="/logo.png" alt=""><div><small>Wild Adventures</small><h2>${now()<12*60?'Bonjour':'Bonsoir'} ${esc(g)}</h2></div></div><div class="pbody">${body}</div>
  <div class="pnav">${tabs.map(([k,l,i])=>`<button class="${t===k?'on':''}" onclick="S.guideTab='${k}';render()">${ic(i)}${l}</button>`).join('')}</div></div></div>`;
};
function guideBreak(){const s=S.staff.find(x=>x.name===S.guideName);if(!s)return;s.day=TODAY;if(s.status==='break'){s.status='present';delete s.until;toast('Pause terminée')}else{s.status='break';s.until=hm(now()+30);toast("Pause jusqu'à "+s.until)}render()}
function guideOut(){const s=S.staff.find(x=>x.name===S.guideName);if(!s)return;if(['off','notstarted'].includes(s.status)){punchIn(s);toast('Pointé à '+s.in+(s.late>5?' · '+s.late+' min de retard':''))}else{s.status='off';s.day=TODAY;toast('Pointé sortie à '+hm(now()))}render()}

/* ---------- Modals ---------- */
function modal(html,opts={}){$('#modal').innerHTML=`<div class="ov ${opts.drawer?'drawer':''}" onclick="if(event.target===this)closeModal()"><div class="sheet ${opts.wide?'wide':''}" role="dialog" aria-modal="true">${html}</div></div>`}
function closeModal(){$('#modal').innerHTML='';if(S._pendingRender){S._pendingRender=false;setTimeout(render,0)}if(S._briefT){clearInterval(S._briefT);S._briefT=null}}
const mh=(t,s='')=>`<div class="sh"><div class="grow"><h2>${t}</h2>${s?`<small>${s}</small>`:''}</div><button class="x" onclick="closeModal()" aria-label="Fermer">×</button></div>`;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
const logB=(b,x,why)=>b.history.push({t:hm(now()),x,why:why||''});

function priceBlock(b){const c=calc(b);
  return `<div class="card flat"><h3>Prix et commission</h3>
   ${fleetItems(b).map(([m,q])=>`<div class="line"><span>${q} × ${ACT[m].name}</span><span>${aed(unitOf(b,m)*q)}</span></div>`).join('')}
   ${Object.entries(b.safari).filter(([,q])=>q).map(([k,q])=>`<div class="line"><span>${q} × ${SAFARI[k][0]}</span><span>${aed(sPrice(b,k)*q)}</span></div>`).join('')}
   ${c.disc?`<div class="line t-ol"><span>Remise Wild member −${CFG.member} %</span><span>−${aed(c.disc)}</span></div>`:''}
   ${b.options.map(k=>`<div class="line"><span>${OPTIONS[k][0]} <small class="muted">option</small></span><span>${aed(oPrice(b,k))}</span></div>`).join('')}
   <div class="line tot"><span>Total</span><span>${aed(c.total)}</span></div>
   <div class="split"><div><small>${b.agentId?esc(S.agents[b.agentId].name)+' · '+c.pct+' % activités':'Agent'}</small><b>${aed(c.agentPart)}</b></div><div><small>Part Wild</small><b>${aed(c.wildPart)}</b></div></div>
   <div class="line" style="margin-top:6px"><span class="muted">Payé</span><b>${b.pays.map(p=>PAYSHORT[p.mode]+' '+aed(p.amount)).join(' · ')||'—'}</b></div>
   <div class="line"><span class="muted">Reste à payer sur place</span><b class="${c.rest>0?'t-crit':'t-ok'}">${aed(c.rest)}</b></div>
   ${b.agentId?`<div class="line"><span class="muted">Solde avec l'agent</span><b class="${c.agentOwes>0.01?'t-or':c.agentOwes<-0.01?'t-info':'t-ok'}">${c.agentOwes>0.01?'Agent doit '+aed(c.agentOwes):c.agentOwes<-0.01?'Wild doit '+aed(-c.agentOwes):'Réglé'}</b></div>`:''}</div>`}
function openB(id){
  const b=bk(id);if(!b)return;const s=stOf(b),c=calc(b);let main='';
  const it=(bl,k,l,okTxt)=>{const x=bl.find(y=>y.k===k);return`<div class="chk ${x?(x.lvl==='crit'?'bad':'no'):'ok'}"><div class="ic">${x?'!':'✓'}</div><b>${l}<small>${x?esc(x.detail):okTxt}</small></b>${x?`<button class="btn sm" onclick="${x.fn}">${x.btn}</button>`:''}</div>`};
  const checklist=bl=>`<div class="g">${it(bl,'pay','Paiement','Payé')}${it(bl,'contract','Contrat','Signé')}${it(bl,'brief','Briefing','Complété')}${fleetItems(b).length?it(bl,'veh','Véhicules',b.vehicles.join(' / ')+(Object.values(b.ext).some(x=>x)?' + partenaire':'')):''}${gearMs(b).length?it(bl,'gear','Tailles équipement','Saisies'):''}${it(bl,'guide','Guide',b.guide)}${b.vehicles.length?it(bl,'mach','Machines prêtes','Contrôlées'):''}</div>`;
  const ops=`<div class="acts">${fleetItems(b).length?`<button class="btn sm" onclick="upgradeModal('${b.id}')">Surclasser</button><button class="btn sm" onclick="vehModal('${b.id}')">Véhicules</button>`:''}<button class="btn sm" onclick="guideModal('${b.id}')">Guide</button>${gearMs(b).length?`<button class="btn sm" onclick="gearModal('${b.id}')">Tailles</button>`:''}</div>`;
  if(s==='up'||s==='late'){
    main=`<div class="${s==='late'?'blocked':'readybox waitbox'}"><div class="t">${s==='late'?'CLIENT EN RETARD':'EN ATTENTE DU CLIENT'}</div><div>Prévu ${isToday(b)?"aujourd'hui":fmtLong(b.date)} à ${b.time}</div>
      <div class="acts"><button class="btn go" onclick="arrived('${b.id}');openB('${b.id}')">✓ Client arrivé</button><a class="btn" href="${waUrl(b.phone,s==='late'?relanceMsg(b):'')}" target="_blank" rel="noopener">${s==='late'?'Relancer':'WhatsApp client'}</a><button class="btn" onclick="timeModal('${b.id}')">Reporter</button><button class="btn" onclick="if(this.dataset.sure){noShow('${b.id}')}else{this.dataset.sure=1;this.textContent='Confirmer : absent'}">Absent</button></div></div>
      ${isToday(b)?`<h3>Avant le départ</h3>${checklist(blockers(b))}${ops}`:''}`;
  }else if(s==='arrived'){const bl=blockers(b);const late=b.arrivedAt-toMin(b.time);
    main=(bl.length?`<div class="blocked"><div class="t">DÉPART BLOQUÉ</div><div>${esc(bl[0].detail)}</div><button class="btn pri big" style="align-self:flex-start" onclick="${bl[0].fn}">${bl[0].btn}</button></div>`:`<div class="readybox"><div class="t">PRÊT À PARTIR</div><button class="btn go big" style="align-self:flex-start" onclick="startModal('${b.id}')">Démarrer la sortie</button></div>`)+
    `<div class="small muted">Arrivé à ${hm(b.arrivedAt)}${late>1?' · '+late+' min de retard':' · à l\'heure'}</div>${checklist(bl)}${ops}`;
  }else if(b.status==='riding'){const d=b.endMin-now();
    main=`<div class="${d<0?'blocked':'readybox ridebox'}"><div class="t">${d<0?'RETOUR EN RETARD +'+(-d)+' MIN':'EN SORTIE · RETOUR DANS '+d+' MIN'}</div><div>Départ ${hm(b.startMin)} · retour prévu ${hm(b.endMin)} · guide ${esc(b.guide)}</div><div class="acts"><button class="btn pri big" onclick="endModal('${b.id}')">Fin de sortie</button><button class="btn" onclick="incidentModal('${b.id}')">${ic('flag')}Incident</button></div></div>`}
  else if(b.status==='done'){const a=b.after;main=a?`<div class="card flat"><h3>Après le tour <button class="btn sm" onclick="afterModal('${b.id}')">Modifier</button></h3><div class="acts"><span class="pill p-${a.mood==='content'?'ok':a.mood==='moyen'?'warn':'crit'}">${{content:'Satisfait',moyen:'Moyen',mecontent:'Mécontent'}[a.mood]}</span><span class="pill p-${a.accident==='oui'?'crit':'ok'}">${a.accident==='oui'?'Accident':'Sans accident'}</span><span class="pill p-${['faite','lien'].includes(a.review)?'ok':a.review==='relancer'?'info':'grey'}">${{faite:'Review faite',relancer:'Review à relancer',pas:'Review pas demandée',lien:'Lien avis envoyé'}[a.review]}</span></div>${a.note?`<p style="margin:8px 0 0">${esc(a.note)}</p>`:''}${b.feedback?`<div class="small" style="margin-top:8px"><b>Suivi WhatsApp :</b> question envoyée ${isoHM(b.feedback.askedAt)}${b.feedback.answer?` · réponse : « ${esc(b.feedback.answer)} » (${{positive:'positive',neutral:'mitigée',negative:'négative'}[b.feedback.sentiment]||''})`:' · pas encore de réponse'}${b.feedback.reviewSentAt?' · lien avis envoyé':''}</div>`:''}${b.feedback?.needsFollowUp&&!b.feedback.handled?`<button class="btn sm pri" style="margin-top:8px;align-self:flex-start" onclick="fbDone('${b.id}')">Client rappelé : marquer comme traité</button>`:''}${a.review==='relancer'?`<a class="btn ol sm" style="margin-top:8px;align-self:flex-start" href="${waUrl(b.phone,reviewMsg(b))}" target="_blank" rel="noopener">Demander la review sur WhatsApp</a>`:''}</div>`:`<button class="btn pri" onclick="afterModal('${b.id}')">Ajouter la remarque après le tour</button>`}
  else main=`<div class="readybox" style="border-color:var(--line);background:var(--surface2)"><div class="t" style="color:var(--muted)">${STATUS[s][0].toUpperCase()}</div><div class="acts"><button class="btn" onclick="reopen('${b.id}')">Réactiver</button><button class="btn" onclick="timeModal('${b.id}')">Reporter à une autre date</button></div></div>`;
  modal(mh(`${esc(b.client)} ${memberTag(b)}`,`${b.num} · ${fmtD(b.date)} ${b.status==='riding'?hm(b.startMin):b.time} · ${pill(bStatus(b))}`)+
  `<div class="sb">${main}${chipsHtml(b)}${prepHtml(b)}${priceBlock(b)}
   ${c.rest>0&&live(b)?`<button class="btn pri" onclick="payModal('${b.id}')">Encaisser ${aed(c.rest)}</button>`:''}
   <div class="card flat"><h3>Client <button class="btn sm" onclick="clientDrawer('${esc(b.phone)}')">Fiche client</button></h3><div class="line"><span class="muted">Téléphone</span><b>${esc(b.phone)}</b></div><div class="line"><span class="muted">Canal</span><b>${esc(b.channel)}</b></div></div>
   <div class="acts"><a class="btn sm" href="${gcal(b)}" target="_blank" rel="noopener">Ajouter à mon agenda</a>${b.agentId?(S.agents[b.agentId].phone?`<a class="btn sm ol" href="${waUrl(S.agents[b.agentId].phone,agentMsg(b))}" target="_blank" rel="noopener">WhatsApp à ${esc(S.agents[b.agentId].name)}</a>`:`<button class="btn sm" onclick="agentModal('${b.agentId}')">Ajouter le n° de l'agent</button>`)+`<button class="btn sm" onclick="copyText(agentMsg(bk('${b.id}')))">Copier le message agent</button>`:''}<button class="btn sm pri" onclick="editBooking('${b.id}')">Modifier</button></div>
   <div class="card flat"><h3>Suivi et modifications</h3>${b.history.map((h,i)=>[h,i]).reverse().map(([h,i])=>`<div class="hrow"><div class="grow small"><b>${h.t}</b> · ${esc(h.x)}${h.why?`<br><span class="muted">Raison : ${esc(h.why)}</span>`:''}</div><button class="x" onclick="if(this.dataset.sure){bk('${b.id}').history.splice(${i},1);openB('${b.id}')}else{this.dataset.sure=1;this.textContent='Sûr ?'}" aria-label="Retirer cette ligne">✕</button></div>`).join('')}</div>
   ${live(b)&&b.status!=='done'?`<div class="acts" style="justify-content:flex-end"><button class="btn exc" onclick="cancelModal('${b.id}')">Annuler le booking</button>${c.paid>0?`<button class="btn exc" onclick="refundModal('${b.id}')">Rembourser</button>`:''}</div>`:''}
  </div>`,{drawer:true});
}
function agentMsg(b){const c=calc(b);return ['*Booking confirmé – Wild Adventures*',b.num,'Client : '+b.client,'Date : '+fmtLong(b.date)+' à '+b.time,'Activité : '+svcLabel(b)+(fleetItems(b).length?' ('+(b.dur===120?'2 h':'1 h')+')':'')+(c.disc?' (remise member −'+CFG.member+' %)':''),'Prix activités : '+aed(c.actNet),...(b.options.length?['Options (sans commission) : '+b.options.map(k=>OPTIONS[k][0]).join(', ')]:[]),'Commission '+c.pct+' % : '+aed(c.agentPart),'Payé à l\'agent : '+aed(c.paidAgent),c.agentOwes>0.01?'À reverser à Wild : '+aed(c.agentOwes):c.agentOwes<-0.01?'Wild vous doit : '+aed(-c.agentOwes):'Solde : réglé','Reste à payer sur place : '+aed(c.rest),'Lieu : Wild Adventures, Al Badayer'].join('\n')}
function gcal(b){const s=Date.parse(b.date+'T'+b.time+':00Z')-TZ;const f=e=>new Date(e).toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(b.time+' '+b.client+' · '+svcLabel(b))+'&dates='+f(s)+'/'+f(s+durOf(b)*6e4)+'&ctz=Asia/Dubai&location='+encodeURIComponent('Wild Adventures, Al Badayer')+'&details='+encodeURIComponent(b.num+'\n'+b.phone)}
function noShow(id){calSync(id);const b=bk(id);b.status='noshow';b.vehicles=[];logB(b,'Client absent');closeModal();render();toast('Marqué absent')}
function quickPay(){
  const list=todayB().filter(b=>live(b)&&calc(b).rest>0).sort((a,b)=>a.time.localeCompare(b.time));const st=S.storage.filter(stDue);
  modal(mh('Encaisser','Bookings du jour et storage impayés')+`<div class="sb">${list.map(b=>`<div class="row" style="cursor:pointer" onclick="payModal('${b.id}')"><span style="font-family:var(--display);font-size:20px;width:58px">${b.time}</span><div class="grow"><b>${esc(b.client)}</b><small>${b.num} · ${svcLabel(b)}</small></div><b class="t-crit">${aed(calc(b).rest)}</b></div>`).join('')}
  ${st.map(s=>`<div class="row" style="cursor:pointer" onclick="stPayModal('${s.id}')"><span class="pill p-ol">Storage</span><div class="grow"><b>${esc(client(s.phone).name)}</b><small>${esc(s.vehicle)} · place ${s.spot}</small></div><b class="t-crit">${aed(stMonthly(s))}</b></div>`).join('')}
  ${!list.length&&!st.length?'<div class="empty">Rien à encaisser</div>':''}</div>`);
}
function payModal(id,preset){
  const b=bk(id),c=calc(b);S._pm={mode:'card'};
  modal(mh('Encaisser',`${b.num} · ${esc(b.client)}`)+`<div class="sb">
  <div class="line"><span>Total</span><b>${aed(c.total)}</b></div><div class="line"><span>Déjà payé</span><b>${aed(c.paid)}</b></div><div class="line tot"><span>Reste</span><span>${aed(c.rest)}</span></div>
  <label class="fld"><span>Montant</span><input id="pamt" type="number" inputmode="decimal" value="${preset??c.rest}"></label>
  <div class="fld"><span>Moyen</span><div class="seg">${[['card','Carte'],['cash','Espèces'],['lien','Lien'],['agent','Payé à l\'agent']].map(([k,l])=>`<button class="${k==='card'?'on':''}" onclick="S._pm.mode='${k}';[...this.parentNode.children].forEach(x=>x.classList.toggle('on',x===this))">${l}</button>`).join('')}</div></div>
  </div><div class="sf"><button class="btn ghost" onclick="openB('${id}')">Retour</button><button class="btn pri big" onclick="confirmPay('${id}')">Confirmer</button></div>`);
}
function confirmPay(id){
  const amt=+$('#pamt').value;if(!(amt>0)){toast('Indique un montant supérieur à 0');return}
  const b=bk(id);if(S._pm.mode==='agent'&&!b.agentId){toast('Ce booking n\'a pas d\'agent');return}
  b.pays.push({mode:S._pm.mode,amount:amt,at:hm(now())});logB(b,'Paiement '+PAYSHORT[S._pm.mode]+' '+aed(amt));
  closeModal();render();toast('Paiement enregistré'+(isToday(b)&&b.status==='up'?' · départ suggéré '+hm(Math.max(now()+10,toMin(b.time))):''));openB(id);
}
function contractModal(id){
  const b=bk(id);
  modal(mh('Contrat de location',`${esc(b.client)} · ${b.num}`)+`<div class="sb">
  <div class="card flat" style="max-height:180px;overflow:auto;font-size:13.5px;line-height:1.5"><b>WILD ADVENTURES — Conditions de location</b><p>1. Le conducteur doit avoir 16 ans minimum. 2. Casque et lunettes obligatoires pendant toute la sortie. 3. Le client suit le guide à distance de sécurité et respecte les consignes du briefing. 4. Tout dommage causé par une conduite hors consignes est facturé selon le barème en vigueur. 5. Alcool et substances interdits. 6. Wild Adventures peut interrompre la sortie si la sécurité est compromise.</p></div>
  <label class="cbox"><input type="checkbox" id="agree"><span>J'ai lu et j'accepte les conditions</span></label>
  <div class="fld"><span>Signature</span><canvas class="sig" id="sig"></canvas></div><button class="btn ghost sm" style="align-self:flex-start" onclick="initSig()">Effacer</button>
  </div><div class="sf"><button class="btn ghost" onclick="openB('${id}')">Retour</button><button class="btn pri big" onclick="signContract('${id}')">Valider la signature</button></div>`);
  initSig();
}
function initSig(){
  const c=$('#sig');if(!c)return;const r=c.getBoundingClientRect();c.width=r.width*devicePixelRatio;c.height=r.height*devicePixelRatio;
  const x=c.getContext('2d');x.scale(devicePixelRatio,devicePixelRatio);x.lineWidth=2.4;x.lineCap='round';x.strokeStyle=getComputedStyle(document.body).color;
  S._sigInk=0;let d=false;const pt=e=>{const b=c.getBoundingClientRect();return[e.clientX-b.left,e.clientY-b.top]};
  c.onpointerdown=e=>{d=true;c.setPointerCapture(e.pointerId);x.beginPath();x.moveTo(...pt(e))};
  c.onpointermove=e=>{if(!d)return;x.lineTo(...pt(e));x.stroke();S._sigInk++};c.onpointerup=()=>d=false;
}
function signContract(id){if(!$('#agree').checked){toast('Coche l\'acceptation des conditions');return}if((S._sigInk||0)<8){toast('Le client doit signer dans le cadre');return}const b=bk(id);b.contract=true;logB(b,'Contrat signé');closeModal();render();toast('Contrat signé');openB(id)}
function briefModal(id){
  const b=bk(id);S._brief=0;
  modal(mh('Briefing sécurité',`${esc(b.client)} · vidéo 04:32`)+`<div class="sb">
  <div class="video"><span style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#f6d39a">Wild Adventures</span><div><h4>SAFETY BRIEFING</h4><div style="display:flex;align-items:center;gap:10px;margin-top:10px"><button class="btn pri sm" id="playb" onclick="playBrief()">▶ Lire</button><div class="pbar" style="flex:1"><i id="pbi"></i></div><span id="ptm">00:00 / 04:32</span></div></div></div>
  <p class="muted small" style="margin:0">Les cases se débloquent à la fin de la vidéo (lecture accélérée pour la démo).</p>
  ${["J'ai regardé le briefing sécurité",'Je comprends les règles de sécurité',"J'accepte ma responsabilité"].map(t=>`<label class="cbox"><input type="checkbox" class="bc" disabled><span>${t}</span></label>`).join('')}
  </div><div class="sf"><button class="btn exc" onclick="briefOverride('${id}')">Contournement manager</button><button class="btn pri big" onclick="briefDone('${id}')">Confirmer</button></div>`);
}
function playBrief(){if(S._briefT)return;$('#playb').textContent='❚❚ Lecture';
  S._briefT=setInterval(()=>{S._brief+=2.5;const p=Math.min(100,S._brief),i=$('#pbi');if(!i){clearInterval(S._briefT);S._briefT=null;return}
    i.style.width=p+'%';const s=Math.round(272*p/100);$('#ptm').textContent=`0${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} / 04:32`;
    if(p>=100){clearInterval(S._briefT);S._briefT=null;document.querySelectorAll('.bc').forEach(c=>c.disabled=false);$('#playb').textContent='✓ Terminé'}},100)}
function briefDone(id){const c=[...document.querySelectorAll('.bc')];if(c.some(x=>x.disabled)){toast('Termine la vidéo avant de confirmer');return}if(!c.every(x=>x.checked)){toast('Les trois confirmations sont obligatoires');return}const b=bk(id);b.briefing=true;logB(b,'Briefing validé');closeModal();render();toast('Briefing validé');openB(id)}
function briefOverride(id){if(!['owner','manager'].includes(S.role)){toast('Contournement réservé au manager');return}const b=bk(id);b.briefing=true;logB(b,'Briefing contourné par '+ROLES[S.role].name);closeModal();render();toast('Briefing contourné (tracé dans l\'historique)');openB(id)}
function vehModal(id){
  const b=bk(id);S._sel=[...b.vehicles];const s0=bStart(b),dur=durOf(b);
  const body=fleetItems(b).map(([m,q])=>{
    const need=q-(b.ext[m]||0);const vs=S.vehicles.filter(v=>v.model===m);
    const other=v=>todayB().find(o=>o.id!==id&&['up','riding'].includes(o.status)&&o.vehicles.includes(v.id)&&bStart(o)<s0+dur&&bEnd(o)+10>s0);
    const G={av:[],res:[],rid:[],mt:[]};
    vs.forEach(v=>{const o=other(v);if(['maintenance','repair','cleaning'].includes(v.status))G.mt.push(v);else if(v.status==='riding'&&!b.vehicles.includes(v.id))G.rid.push([v,ridingBy(v)]);else if(o&&o.status==='up')G.res.push([v,o]);else G.av.push(v)});
    return`<div class="grp">${ACT[m].name} · ${need} à choisir${b.ext[m]?` (+${b.ext[m]} partenaire)`:''}</div>
    <div class="vgrid" data-m="${m}" data-need="${need}">${G.av.map(v=>`<button class="vbtn ${S._sel.includes(v.id)?'on':''}" onclick="toggleVeh(this,'${v.id}')"><b>${v.id}</b><small>${v.hours.toFixed(0)} h</small><small class="${svcLeft(v)<3?'t-warn':'t-ok'}">${svcLeft(v)<3?'Service dans '+svcLeft(v)+' h':'OK'}</small></button>`).join('')||'<div class="muted">Aucune unité libre</div>'}</div>
    ${G.res.length?`<div class="muted small">Réservés : ${G.res.map(([v,o])=>`${v.id} (${o.time})`).join(', ')}</div>`:''}${G.rid.length?`<div class="muted small">En sortie : ${G.rid.map(([v,o])=>`${v.id} retour ${o?hm(o.endMin):'—'}`).join(', ')}</div>`:''}${G.mt.length?`<div class="muted small">Indisponibles : ${G.mt.map(v=>`${v.id} (${vStatusTxt(v).toLowerCase()})`).join(', ')}</div>`:''}`;
  }).join('');
  modal(mh('Assigner les véhicules',`${b.num} · ${esc(b.client)} · ${b.time}`)+`<div class="sb">${body}</div><div class="sf"><button class="btn ghost" onclick="openB('${id}')">Retour</button><button class="btn pri big" onclick="saveVeh('${id}')">Assigner</button></div>`,{wide:true});
}
function toggleVeh(el,vid){const grid=el.parentNode,need=+grid.dataset.need,m=grid.dataset.m;
  if(S._sel.includes(vid)){S._sel=S._sel.filter(x=>x!==vid);el.classList.remove('on');return}
  const cur=S._sel.filter(x=>veh(x).model===m);
  if(cur.length>=need){const drop=cur[0];S._sel=S._sel.filter(x=>x!==drop);grid.querySelectorAll('.vbtn').forEach(x=>{if(x.querySelector('b').textContent===drop)x.classList.remove('on')})}
  S._sel.push(vid);el.classList.add('on')}
function saveVeh(id){const b=bk(id);b.vehicles=S._sel.filter(x=>veh(x).status==='available'||b.vehicles.includes(x));logB(b,'Véhicules : '+(b.vehicles.join(' / ')||'aucun'));closeModal();render();toast('Véhicules assignés');openB(id)}
function guideModal(id){
  const b=bk(id);const gs=S.staff.filter(s=>s.role==='guide').map(s=>({s,g:guideState(s.name)}));
  const busyUp=n=>todayB().find(o=>o.id!==id&&o.status==='up'&&o.guide===n&&Math.abs(toMin(o.time)-toMin(b.time))<durOf(b));
  const grp=(k,t)=>{const l=gs.filter(x=>x.g.k===k);return l.length?`<div class="grp">${t}</div>${l.map(({s,g})=>{const o=k==='available'?busyUp(s.name):null;return`<div class="row"><div class="av">${s.name[0]}</div><div class="grow"><b>${esc(s.name)}${b.guide===s.name?' · assigné':''}</b><small>${o?'Déjà sur '+o.num+' à '+o.time:esc(g.txt)}</small></div>${k==='available'&&!o?`<button class="btn ${b.guide===s.name?'':'pri'} sm" onclick="setGuide('${id}','${s.name}')">${b.guide===s.name?'Assigné':'Choisir'}</button>`:''}</div>`}).join('')}`:''};
  modal(mh('Assigner un guide',`${b.num} · ${esc(b.client)} · ${b.time}`)+`<div class="sb">${grp('available','Disponibles')}${grp('riding','En sortie')}${grp('break','En pause')}${grp('off','Repos')}</div>`);
}
function setGuide(id,n){const b=bk(id);b.guide=n;logB(b,'Guide : '+n);closeModal();render();toast(n+' assigné');openB(id)}
function startModal(id){const b=bk(id);if(blockers(b).length){openB(id);return}
  modal(mh('Démarrer la sortie ?')+`<div class="sb"><div class="line"><span class="muted">Client</span><b>${esc(b.client)}</b></div><div class="line"><span class="muted">Activité</span><b>${svcLabel(b)}</b></div><div class="line"><span class="muted">Véhicules</span><b>${b.vehicles.join(' / ')||'4×4 safari'}</b></div><div class="line"><span class="muted">Guide</span><b>${esc(b.guide)}</b></div></div><div class="sf"><button class="btn ghost" onclick="closeModal()">Plus tard</button><button class="btn go big" onclick="doStart('${id}')">Démarrer maintenant</button></div>`)}
function doStart(id){const b=bk(id),n=now();b.status='riding';b.startMin=n;b.endMin=n+durOf(b);b.vehicles.forEach(v=>veh(v).status='riding');logB(b,'Sortie démarrée');
  modal(mh('Sortie démarrée')+`<div class="sb" style="text-align:center"><div style="font-family:var(--display);font-size:58px;line-height:1">${hm(n)}</div><div class="muted">Retour prévu</div><div style="font-family:var(--display);font-size:34px">${hm(b.endMin)}</div></div><div class="sf"><button class="btn pri" onclick="closeModal()">OK</button></div>`);render()}
function endModal(id){const b=bk(id),n=now(),d=n-b.startMin;
  modal(mh('Fin de sortie',`${esc(b.client)} · ${b.num}`)+`<div class="sb"><div class="g g2"><div class="stat"><span>Retour réel</span><b>${hm(n)}</b></div><div class="stat ${n>b.endMin?'warn':''}"><span>Durée</span><b>${Math.floor(d/60)}h${String(d%60).padStart(2,'0')}</b></div></div>
  ${b.vehicles.map(vid=>{const v=veh(vid);return`<div class="card flat"><h3>${vid} · heures moteur</h3><div class="g g2"><label class="fld"><span>Avant</span><input value="${v.hours.toFixed(1)}" disabled></label><label class="fld"><span>Après</span><input id="eh-${vid}" type="number" step="0.1" value="${(v.hours+Math.max(.3,d/60)).toFixed(1)}"></label></div></div>`}).join('')}
  </div><div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri big" onclick="doEnd('${id}')">${b.vehicles.length?'Confirmer et inspecter':'Confirmer'}</button></div>`)}
function doEnd(id){const b=bk(id),share=calc(b).actNet/Math.max(1,b.vehicles.length);
  for(const vid of b.vehicles){const v=veh(vid),nh=+$('#eh-'+vid).value;if(!(nh>=v.hours)){toast(vid+' : les heures après doivent être ≥ avant');return}}
  b.vehicles.forEach(vid=>{const v=veh(vid);v.hours=+$('#eh-'+vid).value;v.rides++;v.rev+=share});
  b.status='done';b.retAt=hm(now());logB(b,'Retour '+b.retAt);render();inspectModal(id,0)}
const CHECKS=['Dommages','Carburant','Huile','Eau','Courroie','Carrosserie','Propreté'];
function inspectModal(bid,i){const b=bk(bid),vid=b.vehicles[i];if(!vid){afterModal(bid);return}S._insp={};
  modal(mh('Inspection véhicule',`${vid} · ${i+1}/${b.vehicles.length}`)+`<div class="sb">${CHECKS.map((c,k)=>`<div class="row"><div class="grow"><b>${c}</b></div><div class="seg" style="flex:0 0 auto"><button class="on" style="min-width:56px" onclick="S._insp[${k}]=0;[...this.parentNode.children].forEach(x=>x.classList.toggle('on',x===this))">✓</button><button style="min-width:56px" onclick="S._insp[${k}]=1;[...this.parentNode.children].forEach(x=>x.classList.toggle('on',x===this))">⚠</button></div></div>`).join('')}
  <label class="fld"><span>Photos</span><input type="file" accept="image/*" multiple></label>
  <div class="fld"><span>Résultat</span><div class="seg"><button onclick="inspResult('${bid}',${i},'available')" style="color:var(--ok)">Prêt</button><button onclick="inspResult('${bid}',${i},'cleaning')">Nettoyage</button><button onclick="inspResult('${bid}',${i},'maintenance')" style="color:var(--warn)">Maintenance</button><button onclick="inspResult('${bid}',${i},'incident')" style="color:var(--crit)">Incident</button></div></div></div>`)}
function inspResult(bid,i,r){const b=bk(bid),v=veh(b.vehicles[i]);
  if(r==='available'&&Object.values(S._insp).some(x=>x)){toast('Un point est en ⚠ : choisis Nettoyage, Maintenance ou Incident');return}
  if(r==='incident'){v.status='repair';render();incidentModal(bid,v.id,()=>inspectModal(bid,i+1));return}
  v.status=r;if(r==='maintenance')v.svcType='Contrôle après inspection';render();toast(v.id+' → '+vStatusTxt(v));inspectModal(bid,i+1)}
function afterModal(id){const b=bk(id);const a=b.after||{mood:'content',accident:'non',review:'relancer',note:''};S._af={...a};
  const seg=(k,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button class="${a[k]===v?'on':''}" onclick="S._af.${k}='${v}';[...this.parentNode.children].forEach(x=>x.classList.toggle('on',x===this))">${l}</button>`).join('')}</div>`;
  modal(mh('Remarque après le tour',`${esc(b.client)} · ${svcLabel(b)}`)+`<div class="sb"><div class="fld"><span>Satisfaction</span>${seg('mood',[['content','Satisfait'],['moyen','Moyen'],['mecontent','Mécontent']])}</div><div class="fld"><span>Accident</span>${seg('accident',[['non','Non'],['oui','Oui']])}</div><div class="fld"><span>Review Google</span>${seg('review',[['faite','Faite'],['lien','Lien envoyé'],['relancer','À relancer'],['pas','Pas demandée']])}</div><label class="fld"><span>Note</span><textarea id="afn" rows="2">${esc(a.note)}</textarea></label></div>
  <div class="sf"><button class="btn ghost" onclick="closeModal()">Plus tard</button><button class="btn pri" onclick="saveAfter('${id}')">Enregistrer</button></div>`)}
function saveAfter(id){const b=bk(id);b.after={...S._af,note:$('#afn').value};logB(b,'Remarque après le tour');closeModal();render();toast('Remarque enregistrée');if(b.after.accident==='oui')incidentModal(id)}
function incidentModal(bid,vid,after){
  const b=bid?bk(bid):todayB().find(x=>x.status==='riding');S._inc={resp:'review',after};
  modal(mh('Nouvel incident')+`<div class="sb"><div class="g g2">
  <label class="fld"><span>Véhicule</span><select id="iv"><option value="">—</option>${S.vehicles.map(v=>`<option ${v.id===(vid||b?.vehicles[0])?'selected':''}>${v.id}</option>`).join('')}</select></label>
  <label class="fld"><span>Booking</span><select id="ib"><option value="">—</option>${todayB().map(x=>`<option value="${x.id}" ${x.id===b?.id?'selected':''}>${x.num} · ${esc(x.client)}</option>`).join('')}</select></label>
  <label class="fld"><span>Guide</span><input id="ig" value="${esc(b?.guide||'')}"></label>
  <label class="fld"><span>Type</span><select id="it"><option>Dommage</option><option>Panne</option><option>Blessure</option><option>Autre</option></select></label></div>
  <label class="fld"><span>Description</span><textarea id="idsc" rows="3" placeholder="Ce qui s'est passé, où, quand"></textarea></label>
  <label class="fld"><span>Photos</span><input type="file" accept="image/*" multiple></label>
  <label class="fld"><span>Coût estimé (AED)</span><input id="ic" type="number" value="0"></label>
  <div class="fld"><span>Responsabilité client</span><div class="seg">${[['yes','Oui'],['no','Non'],['review','À examiner']].map(([k,l])=>`<button class="${k==='review'?'on':''}" onclick="S._inc.resp='${k}';[...this.parentNode.children].forEach(x=>x.classList.toggle('on',x===this))">${l}</button>`).join('')}</div></div>
  </div><div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri big" onclick="createIncident()">Créer l'incident</button></div>`);
}
function createIncident(){const d=$('#idsc').value.trim();if(!d){toast('Ajoute une description');return}
  const v=veh($('#iv').value),c=+$('#ic').value||0;if(v){v.dmg+=c;if(['Panne','Dommage'].includes($('#it').value)&&v.status!=='riding')v.status='repair'}
  S.incidents.push({v:v?.id||'',b:$('#ib').value,guide:$('#ig').value,type:$('#it').value,desc:d,cost:c,resp:S._inc.resp,at:hm(now())});
  const b=bk($('#ib').value);if(b)logB(b,'Incident : '+$('#it').value);
  const after=S._inc.after;closeModal();render();toast('Incident créé');if(after)after()}
function timeModal(id){const b=bk(id);
  modal(mh('Reporter le booking',`${b.num} · actuellement ${fmtD(b.date)} ${b.time}`)+`<div class="sb"><div class="g g2"><label class="fld"><span>Nouvelle date</span><input type="date" id="nd" value="${b.date<TODAY?TODAY:b.date}"></label><label class="fld"><span>Nouvelle heure</span><input type="time" id="nt" value="${b.time}" step="300"></label></div><label class="fld"><span>Raison</span><input id="nw" placeholder="Ex. client bloqué dans les embouteillages"></label></div><div class="sf"><button class="btn ghost" onclick="openB('${id}')">Retour</button><button class="btn pri" onclick="saveTime('${id}')">Confirmer le report</button></div>`)}
function saveTime(id){const b=bk(id),d=$('#nd').value||b.date,t=$('#nt').value||b.time;const old=fmtD(b.date)+' '+b.time;
  const clash=b.vehicles.filter(vid=>S.bookings.some(o=>o.id!==id&&o.date===d&&['up','riding'].includes(o.status)&&o.vehicles.includes(vid)&&bStart(o)<toMin(t)+durOf(b)&&bEnd(o)+10>toMin(t)));
  b.vehicles=d===b.date?b.vehicles.filter(v=>!clash.includes(v)):[];b.date=d;b.time=t;b.status='up';b.arrivedAt=null;b.alerted={};logB(b,'Reporté : '+old+' → '+fmtD(d)+' '+t,$('#nw').value);calSync(id);S.bkDay=d;closeModal();render();toast('Booking reporté · pense à mettre à jour l\'agenda');openB(id)}
function upgradeModal(id){
  const b=bk(id);const [m,q]=fleetItems(b).sort((a,c)=>ACT[a[0]].rank-ACT[c[0]].rank)[0];
  const ups=Object.entries(ACT).filter(([o,M])=>M.rank>ACT[m].rank&&M.seats>=ACT[m].seats&&M.fleet===ACT[m].fleet&&priceOf(o,b.dur)!=null);
  modal(mh('Surclasser',b.num)+`<div class="sb"><div class="card flat"><h3>Actuel</h3><b>${q} × ${ACT[m].name}</b><div class="muted">${aed(unitOf(b,m))} / machine</div></div><div class="grp">Surclassements</div>
  ${ups.map(([o,M])=>{const free=freeCount(o,b.date,toMin(b.time),durOf(b),id)>=q;const diff=(priceOf(o,b.dur)-unitOf(b,m))*q*(b.member?1-CFG.member/100:1);return`<div class="row"><div class="grow"><b>${M.name}</b><small>${aed(priceOf(o,b.dur))} · différence +${aed(diff)}${b.member?' (remise member incluse)':''}${free?'':' · indisponible à '+b.time}</small></div><button class="btn ${free?'pri':''} sm" ${free?'':'disabled'} onclick="doUpgrade('${id}','${m}','${o}',${diff})">Choisir</button></div>`}).join('')||'<div class="empty">Déjà au niveau maximum</div>'}</div>`)}
function doUpgrade(id,m,o,diff){const b=bk(id),q=b.items[m];delete b.items[m];delete b.unit[m];b.items[o]=(b.items[o]||0)+q;b.vehicles=b.vehicles.filter(v=>veh(v).model!==m);logB(b,'Surclassement '+ACT[m].short+' → '+ACT[o].short);render();toast('Surclassement : +'+aed(diff));payModal(id,diff)}
function cancelModal(id){modal(mh('Annuler le booking ?',id)+`<div class="sb"><p style="margin:0">Le booking sera annulé et les véhicules libérés. Les paiements reçus restent à rembourser séparément.</p><label class="fld"><span>Motif</span><select id="cr"><option>Demande client</option><option>Météo</option><option>Problème opérationnel</option></select></label></div><div class="sf"><button class="btn" onclick="openB('${id}')">Garder</button><button class="btn" style="color:var(--crit);border-color:var(--crit)" onclick="const b=bk('${id}');b.status='cancelled';b.vehicles=[];logB(b,'Annulé : '+$('#cr').value);closeModal();render();toast('Booking annulé');calSync('${id}')">Confirmer l'annulation</button></div>`)}
function refundModal(id){const b=bk(id),p=calc(b).paid;modal(mh('Remboursement',id)+`<div class="sb"><div class="line"><span>Payé</span><b>${aed(p)}</b></div><label class="fld"><span>Montant à rembourser</span><input id="rf" type="number" value="${p}"></label></div><div class="sf"><button class="btn" onclick="openB('${id}')">Retour</button><button class="btn" style="color:var(--crit);border-color:var(--crit)" onclick="const a=Math.min(+$('#rf').value||0,${p});if(a>0){const b=bk('${id}');b.pays.push({mode:'cash',amount:-a,at:hm(now())});logB(b,'Remboursé '+aed(a));toast('Remboursé '+aed(a))}closeModal();render();openB('${id}')">Confirmer</button></div>`)}
function machineModal(id){const v=veh(id),l=svcLeft(v),rb=ridingBy(v),rs=reservedBy(v);
  modal(mh(v.id,ACT[v.model].name)+`<div class="sb"><span class="pill p-${vStatusCls(v)}" style="align-self:flex-start">${vStatusTxt(v)}${rb?' · retour '+hm(rb.endMin):''}${rs&&v.status==='available'?' · réservé '+rs.time:''}</span>
  <div class="g g2"><div class="stat"><span>Heures moteur</span><b>${v.hours.toFixed(1)}</b></div><div class="stat"><span>Sorties</span><b>${v.rides}</b></div><div class="stat"><span>Revenu</span><b>${aed(v.rev)}</b></div><div class="stat"><span>Rev./heure</span><b>${aed(v.rev/v.hours)}</b></div><div class="stat warn"><span>Maintenance</span><b>${aed(v.maint)}</b></div><div class="stat crit"><span>Dommages</span><b>${aed(v.dmg)}</b></div></div>
  <div class="card flat"><h3>Prochain service</h3><div class="line"><span>${esc(v.svcType)} à</span><b>${v.svcAt.toFixed(0)} h</b></div><div class="line"><span>Restant</span><b class="${l<0?'t-crit':l<5?'t-warn':'t-ok'}">${l<0?'Dépassé '+(-l)+' h':l+' h'}</b></div></div>
  ${S.maintLog.filter(m=>m.v===id).length||S.incidents.filter(i=>i.v===id).length?`<div class="grp">Aujourd'hui</div>${[...S.maintLog.filter(m=>m.v===id).map(m=>`${m.at} · ${m.type} · ${aed(m.total)}`),...S.incidents.filter(i=>i.v===id).map(i=>`${i.at} · Incident ${i.type} · ${aed(i.cost)}`)].map(t=>`<div class="muted small">${esc(t)}</div>`).join('')}`:''}
  </div><div class="sf"><button class="btn exc" onclick="if(this.dataset.sure){removeVehicle('${id}')}else{this.dataset.sure=1;this.textContent='Confirmer le retrait'}">Retirer de la flotte</button><button class="btn" onclick="incidentModal(null,'${id}')">Incident</button><button class="btn pri" onclick="maintModal('${id}')">Maintenance</button></div>`,{drawer:true})}
const PART_PRICE={'Courroie':680,'Filtre à huile':85,'Bras avant':1450,'Plaquettes de frein':220,'Huile moteur (L)':55,'Graisse':45,'Filtre à air':120};
function maintModal(id){const v=veh(id);if(v.status==='riding'){toast(id+' est en sortie, maintenance à son retour');return}
  S._parts=v.svcType==='Courroie'?[['Courroie',1]]:v.svcType==='Freins'?[['Plaquettes de frein',2]]:[['Filtre à huile',1],['Huile moteur (L)',4],['Graisse',1]];
  if(v.status==='available')v.status='maintenance';renderMaint(id);render()}
function renderMaint(id){const v=veh(id),parts=S._parts.reduce((a,[n,q])=>a+(PART_PRICE[n]||0)*q,0);
  modal(mh('Maintenance '+id,ACT[v.model].name)+`<div class="sb"><div class="g g2">
  <label class="fld"><span>Type</span><select id="mt">${['Service normal','Courroie','Freins','Chaîne','Contrôle après inspection','Réparation'].map(t=>`<option ${t===v.svcType?'selected':''}>${t}</option>`).join('')}</select></label>
  <label class="fld"><span>Heures moteur</span><input id="mhrs" type="number" step="0.1" value="${v.hours.toFixed(1)}"></label>
  <label class="fld"><span>Mécanicien</span><select id="mm"><option>Rafiq</option><option>Atelier externe</option></select></label>
  <label class="fld"><span>Main d'œuvre (AED)</span><input id="ml" type="number" value="150" oninput="$('#mtot').textContent=aed(${parts}+(+this.value||0))"></label></div>
  <div class="grp">Pièces</div>${S._parts.map(([n,q],i)=>{const st=S.stock.parts.find(p=>p[0]===n);return`<div class="row"><div class="grow"><b>${esc(n)}</b><small>Stock ${st?st[1]:0} · ${aed(PART_PRICE[n]||0)}/u</small></div><div class="step"><button onclick="S._parts[${i}][1]=Math.max(0,S._parts[${i}][1]-1);renderMaint('${id}')">−</button><b>${q}</b><button onclick="S._parts[${i}][1]++;renderMaint('${id}')">+</button></div></div>`}).join('')}
  <div class="acts"><select id="addp" style="flex:1;width:auto">${S.stock.parts.filter(p=>!S._parts.some(x=>x[0]===p[0])).map(p=>`<option>${esc(p[0])}</option>`).join('')}</select><button class="btn" onclick="const n=$('#addp').value;if(n){S._parts.push([n,1]);renderMaint('${id}')}">+ Pièce</button></div>
  <div class="line"><span>Pièces</span><b>${aed(parts)}</b></div><div class="line tot"><span>Total</span><span id="mtot">${aed(parts+150)}</span></div>
  </div><div class="sf"><button class="btn ghost" onclick="closeModal()">Plus tard</button><button class="btn go big" onclick="completeMaint('${id}')">Terminer</button></div>`)}
function completeMaint(id){const v=veh(id),short=S._parts.filter(([n,q])=>{const st=S.stock.parts.find(p=>p[0]===n);return q>0&&(!st||st[1]<q)});
  if(short.length){toast('Stock insuffisant : '+short.map(x=>x[0]).join(', '));return}
  S._parts.forEach(([n,q])=>{const st=S.stock.parts.find(p=>p[0]===n);if(st)st[1]-=q});
  const parts=S._parts.reduce((a,[n,q])=>a+(PART_PRICE[n]||0)*q,0),lab=+$('#ml').value||0,type=$('#mt').value;
  v.hours=+$('#mhrs').value||v.hours;v.maint+=parts+lab;v.svcAt=Math.ceil((v.hours+1)/50)*50;v.svcType='Service normal';v.status='available';
  S.maintLog.unshift({v:id,type,mech:$('#mm').value,at:hm(now()),parts:S._parts.filter(x=>x[1]).map(([n,q])=>q+'× '+n).join(', '),total:parts+lab});
  closeModal();render();toast(id+' remis en service · stock mis à jour')}
function orderItem(cat,name){const it=S.stock[cat].find(i=>i[0]===name);modal(mh('Commander',name)+`<div class="sb"><div class="line"><span>Stock actuel</span><b>${it[1]}</b></div><div class="line"><span>Minimum</span><b>${it[2]}</b></div><label class="fld"><span>Quantité</span><input id="oq" type="number" value="${it[2]*2}"></label></div><div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="const q=+$('#oq').value||0;S.stock['${cat}'].find(i=>i[0]==='${esc(name)}')[1]+=q;closeModal();render();toast('Commande reçue · +'+q)">Commander (réception immédiate en démo)</button></div>`)}
function stockEntryModal(){const t=S.stockTab;modal(mh('Entrée de stock',catName(t))+`<div class="sb"><label class="fld"><span>Article</span><select id="sei">${S.stock[t].map(i=>`<option>${esc(i[0])}</option>`).join('')}</select></label><label class="fld"><span>Quantité reçue</span><input id="seq" type="number" value="5"></label></div><div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="const it=S.stock['${t}'].find(i=>i[0]===$('#sei').value);it[1]+=(+$('#seq').value||0);closeModal();render();toast('Stock mis à jour')">Enregistrer</button></div>`)}
function expenseModal(){modal(mh('Nouvelle dépense')+`<div class="sb"><div class="g g2">
  <label class="fld"><span>Montant (AED)</span><input id="ea" type="number" value="850"></label>
  <label class="fld"><span>Catégorie</span><select id="ec">${['Pièces détachées','Carburant','Wild Coffee','BBQ & camp','Nettoyage','Partenaire externe','Salaires','Autre'].map(c=>`<option>${c}</option>`).join('')}</select></label>
  <label class="fld"><span>Fournisseur</span><input id="es" value="Polaris Gulf"></label>
  <label class="fld"><span>Paiement</span><select id="em"><option value="card">Carte</option><option value="cash">Espèces</option><option value="transfer">Virement</option></select></label>
  <label class="fld"><span>Machine</span><select id="ev"><option value="">—</option>${S.vehicles.map(v=>`<option>${v.id}</option>`).join('')}</select></label>
  <label class="fld"><span>Reçu</span><input id="er" type="file" accept="image/*"></label></div></div>
  <div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="addExpense()">Enregistrer</button></div>`)}
function addExpense(){const a=+$('#ea').value;if(!(a>0)){toast('Montant invalide');return}S.expenses.push({date:TODAY,amount:a,cat:$('#ec').value,sup:$('#es').value,method:$('#em').value,veh:$('#ev').value,receipt:$('#er').files.length>0});closeModal();render();toast('Dépense enregistrée')}
function cashModal(){
  const F=finDay(TODAY);const cashExp=S.expenses.filter(e=>e.method==='cash'&&e.date===TODAY).reduce((a,e)=>a+e.amount,0);
  const stCash=S.storage.flatMap(s=>s.payments).filter(p=>p.date===TODAY&&p.mode==='cash').reduce((a,p)=>a+p.amount,0);
  const cashIn=r2(F.by.cash+stCash),exp=r2(2000+cashIn-cashExp);
  modal(mh('Clôture de caisse')+`<div class="sb"><div class="line"><span>Fond de caisse</span><b>${aed(2000)}</b></div><div class="line"><span>Espèces reçues (bookings + storage, remboursements déduits)</span><b>${aed(cashIn)}</b></div><div class="line"><span>Dépenses en espèces</span><b>−${aed(cashExp)}</b></div><div class="line tot"><span>Attendu</span><span>${aed(exp)}</span></div>
  <label class="fld"><span>Espèces comptées</span><input id="ca" type="number" value="${exp}" oninput="const d=r2((+this.value||0)-${exp});$('#cd').innerHTML='<b class=&quot;t-'+(d===0?'ok':'crit')+'&quot;>'+aed(d)+'</b>'"></label>
  <div class="line"><span>Écart</span><span id="cd"><b class="t-ok">0 AED</b></span></div></div>
  <div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="const a=+$('#ca').value||0;setClosing({expected:${exp},actual:a,diff:r2(a-${exp}),state:'pending'});closeModal();render();toast('Clôture soumise · validation manager requise')">Soumettre</button></div>`)}
function taskModal(i){const t=S.tasks[i];modal(mh(t.name,t.time)+`<div class="sb">${t.photo?'<label class="fld"><span>Photo obligatoire</span><input id="tp" type="file" accept="image/*"></label>':'<p style="margin:0">Aucune photo requise.</p>'}</div><div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn go" onclick="if(${t.photo}&&!$('#tp').files.length){toast('Ajoute la photo pour valider');return}S.tasks[${i}].doneDay=TODAY;closeModal();render();toast('Tâche terminée')">Valider</button></div>`)}
function doSearch(q){q=q.trim();if(!q)return;const ql=q.toLowerCase(),d=digits(q);
  const v=S.vehicles.find(x=>x.id.toLowerCase().replace('-','')===ql.replace('-',''));if(v){machineModal(v.id);return}
  const b=S.bookings.find(x=>x.num.toLowerCase()===ql);if(b){openB(b.id);return}
  const c=S.clients.find(x=>x.name.toLowerCase().includes(ql)||(d.length>=4&&digits(x.phone).includes(d)));if(c&&staffRole()){clientDrawer(c.phone);return}
  toast('Aucun résultat pour « '+q+' »')}

/* ---------- Formulaire + BOOKING (une seule page, comme l'appli Booking) ---------- */
const SAF='SAFARI';
const ceil5=m=>Math.ceil(m/5)*5;
function newLine(){return{m:'',qty:1,unit:'',custom:false}}
function newBooking(phone){const c=phone?client(phone):null;const d=S.bkDay>=TODAY?S.bkDay:TODAY;
  S.F={date:d,time:d===TODAY?hm(ceil5(now()+10)):'16:00',dur:60,phone:c?.phone||'',client:c?.name||'',member:!!c?.member,lines:[newLine()],options:[],demands:[],pays:[],agentId:'',channel:'WhatsApp',notes:'',gear:{},ext:{},why:'',saved:false,notify:true};
  go('new')}
function editBooking(id){const b=bk(id);
  const lines=fleetItems(b).map(([m,q])=>({m,qty:q,unit:unitOf(b,m),custom:b.unit[m]!=null&&b.unit[m]!==priceOf(m,b.dur)}));
  if(isSafari(b))lines.push({m:SAF,items:Object.fromEntries(Object.keys(SAFARI).map(k=>[k,{qty:b.safari[k]||0,unit:sPrice(b,k)}]))});
  S.F={id,date:b.date,time:b.time,dur:b.dur,phone:b.phone,client:b.client,member:b.member,lines:lines.length?lines:[newLine()],options:b.options.map(k=>({k,price:oPrice(b,k)})),demands:b.demands.map(d=>({...d})),pays:b.pays.map(p=>({...p})),agentId:b.agentId,channel:b.channel,notes:b.notes,gear:JSON.parse(JSON.stringify(b.gear||{})),ext:{...b.ext},why:'',saved:false,draft:b.status==='draft',notify:b.status==='draft'};
  go('new')}
/* Brouillon -> objet booking (pour calculer en direct) */
function fBooking(F){const items={},unit={},safari={},sunit={},oprice={};
  F.lines.forEach(l=>{if(l.m===SAF){Object.entries(l.items).forEach(([k,x])=>{if(+x.qty>0){safari[k]=+x.qty;sunit[k]=+x.unit||0}})}else if(l.m){items[l.m]=(items[l.m]||0)+(+l.qty||1);unit[l.m]=+l.unit||0}});
  F.options.forEach(o=>oprice[o.k]=+o.price||0);
  return mkB({id:F.id||'tmp',num:F.id?bk(F.id).num:'—',date:F.date,time:F.time,dur:F.dur,phone:F.phone,client:F.client,member:F.member,items,unit,safari,sunit,options:F.options.map(o=>o.k),oprice,demands:F.demands.filter(d=>d.tag),pays:F.pays.filter(p=>+p.amount).map(p=>({mode:p.mode,amount:+p.amount,at:p.at||hm(now())})),agentId:F.agentId,channel:F.channel,notes:F.notes,gear:F.gear,ext:F.ext,history:[{t:'',x:''}]});}
const fItems=F=>Object.fromEntries(F.lines.filter(l=>l.m&&l.m!==SAF).map(l=>[l.m,+l.qty||1]));
function fSet(path,val,hard){const ks=path.split('.');let o=S.F;ks.slice(0,-1).forEach(k=>o=o[k]);o[ks[ks.length-1]]=val;if(hard)fHard();else fSoft()}
function fHard(){const y=window.scrollY;render();window.scrollTo(0,y)}
function fLineModel(i,m){const F=S.F,l=F.lines[i];if(m&&m!==l.m&&F.lines.some((x,j)=>j!==i&&x.m===m)){toast(m===SAF?'Le safari est déjà dans la liste':'Cette machine est déjà dans la liste : augmente le nombre');fHard();return}
  if(m===SAF){F.lines[i]={m:SAF,items:Object.fromEntries(Object.keys(SAFARI).map(k=>[k,{qty:k==='adult'?1:0,unit:SAFARI[k][1]}]))}}
  else F.lines[i]={m,qty:l.qty||1,unit:m?priceOf(m,F.dur)??'':'',custom:false};
  fHard()}
function fDur(d){const F=S.F;F.dur=+d;F.lines.forEach(l=>{if(l.m&&l.m!==SAF&&!l.custom)l.unit=priceOf(l.m,F.dur)??0});fHard()}
function fUnit(i,v){const l=S.F.lines[i];l.unit=v;l.custom=+v!==priceOf(l.m,S.F.dur);fSoft()}
function fPhone(v){S.F.phone=v;fSoft()}
function fUseClient(p){const c=client(p);S.F.phone=c.phone;S.F.client=c.name;S.F.member=c.member;fHard()}
function fAgent(id){const F=S.F;F.agentId=id;F.channel=id?'Agent / plateforme':(F.channel==='Agent / plateforme'?'WhatsApp':F.channel);fHard()}
function fAdd(kind){const F=S.F,c=calc(fBooking(F));
  if(kind==='line')F.lines.push(newLine());
  if(kind==='opt'){const k=Object.keys(OPTIONS).find(x=>!F.options.some(o=>o.k===x));if(!k)return toast('Toutes les options sont déjà ajoutées');F.options.push({k,price:OPTIONS[k][1]})}
  if(kind==='dem')F.demands.push({tag:DEMANDS.find(t=>!F.demands.some(d=>d.tag===t))||'Autre',detail:''});
  if(kind==='pay')F.pays.push({mode:F.agentId?'agent':'lien',amount:c.rest||0});
  fHard()}
function fDel(kind,i){const F=S.F;({line:F.lines,opt:F.options,dem:F.demands,pay:F.pays})[kind].splice(i,1);if(kind==='line'&&!F.lines.length)F.lines.push(newLine());fHard()}
function fOpt(i,k){const F=S.F;if(F.options.some((o,j)=>j!==i&&o.k===k)){toast('Option déjà ajoutée');fHard();return}F.options[i]={k,price:OPTIONS[k][1]};fHard()}
function fApply(i){const F=S.F,o=F._opts[i];if(o.wait)F.time=hm(o.time);if(Object.keys(o.ext).length)F.ext={...o.ext};
  if(o.kind==='model'){const old=F.lines.filter(l=>l.m===SAF||!l.m);F.lines=[...Object.entries(o.items).map(([m,q])=>({m,qty:q,unit:priceOf(m,F.dur),custom:false})),...old]}
  F.saved=true;toast('Solution appliquée');fHard()}
function fLost(){const v=calc(fBooking(S.F)).total;S.lost+=v;S.F=null;toast('Revenu perdu enregistré : '+aed(v));go('booking')}
/* zones mises à jour sans redessiner (la saisie garde le focus) */
function fSoft(){const F=S.F;if(!F)return;const b=fBooking(F),c=calc(b);
  F.lines.forEach((l,i)=>{const t=document.getElementById('lt'+i);if(!t)return;if(l.m===SAF){t.textContent=aed(Object.values(l.items).reduce((s,x)=>s+(+x.qty||0)*(+x.unit||0),0));Object.entries(l.items).forEach(([k,x])=>{const e=document.getElementById('st'+i+k);if(e)e.textContent=aed((+x.qty||0)*(+x.unit||0))})}else t.textContent=l.m?aed((+l.qty||0)*(+l.unit||0)):'—';
    const sp=document.getElementById('sp'+i);if(sp)sp.innerHTML=l.m&&l.m!==SAF&&l.custom?`Prix spécial · habituel ${aed(priceOf(l.m,F.dur))}`:'';});
  const fc=document.getElementById('fclient');if(fc)fc.innerHTML=fClientHint();
  const av=document.getElementById('favail');if(av)av.innerHTML=fAvailHtml();
  const sm=document.getElementById('fsum');if(sm)sm.innerHTML=fSumHtml(b,c);
  const pb=document.getElementById('fplace');if(pb)pb.innerHTML=c.paid>c.total+0.01?'<div class="note bad">Les paiements dépassent le total.</div>':c.rest>0?`<div class="note">Reste à payer sur place : ${aed(c.rest)}</div>`:c.total>0?'<div class="note ok">Entièrement payé</div>':'';
  F.lines.forEach((l,i)=>{const g=document.getElementById('gear'+i);if(g&&l.m&&ACT[l.m]?.gear){const items={};items[l.m]=+l.qty||1;const o={items,gear:F.gear};g.innerHTML=gearBox(o,l.m,'S.F.gear.'+l.m,'fSoft()');F.gear=o.gear}});
}
function fClientHint(){const F=S.F,d=digits(F.phone);if(d.length<4)return '<span class="muted small">Tape au moins 4 chiffres : le registre clients est consulté pour éviter les doublons (essaie 1188).</span>';
  const c=S.clients.find(x=>digits(x.phone).includes(d));if(!c)return d.length>=6?'<span class="small t-ol">Nouveau client : il sera ajouté au registre à la confirmation.</span>':'';
  if(digits(c.phone)===digits(F.phone)&&c.name===F.client)return `<span class="pill p-ok">Client du registre</span> <span class="small muted">${clientStats(c).visits} visite(s) · ${aed(clientStats(c).spend)} dépensés</span> ${c.member?'<span class="wm">Wild member</span>':''}`;
  return `<span class="small"><b>Client existant : ${esc(c.name)}</b> · ${esc(c.phone)} · ${clientStats(c).visits} visite(s)</span> ${c.member?'<span class="wm">Wild member</span>':''} <button class="btn sm go" onclick="fUseClient('${esc(c.phone)}')">Utiliser</button>`}
function fAvailHtml(){const F=S.F;const items=fItems(F);F._opts=null;if(!Object.keys(items).length||!F.time)return '';
  const t=toMin(F.time);const rows=Object.entries(items).map(([m,q])=>{const f=Math.max(0,freeCount(m,F.date,t,F.dur,F.id))+(F.id?0:0);const ext=F.ext[m]||0;return f+ext>=q?`<span class="pill p-ok">${esc(ACT[m].short)} : ${f} libre(s)${ext?' + '+ext+' partenaire':''}</span>`:`<span class="pill p-crit">${esc(ACT[m].short)} : ${f} libre(s) sur ${q}</span>`});
  const ok=Object.entries(items).every(([m,q])=>Math.max(0,freeCount(m,F.date,t,F.dur,F.id))+(F.ext[m]||0)>=q);
  if(ok)return `<div class="availok">${rows.join('')}</div>`;
  const opts=smartOptions(items,F.date,t,F.dur,F.id);F._opts=opts;
  return `<div class="availko"><div class="acts">${rows.join('')}</div><b>Pas assez de machines Wild à ${F.time}. Solutions :</b>
   <div class="sugg">${opts.map((o,i)=>`<div class="sg"><span class="tag ${o.kind==='best'?'t-ok':o.kind==='ext'?'t-warn':'t-info'}">${o.tag}</span><b>${o.title}</b><span class="small">${Object.entries(o.items).map(([m,q])=>q+' × '+ACT[m].short).join(' + ')}</span><span class="small muted">${esc(o.note)}</span><button class="btn sm pri" onclick="fApply(${i})">Appliquer</button></div>`).join('')||'<div class="muted small">Aucune solution, même avec un partenaire. Propose un autre horaire.</div>'}</div>
   <button class="btn exc" onclick="fLost()">Le client refuse · enregistrer le revenu perdu</button></div>`}
function fSumHtml(b,c){const F=S.F,ag=F.agentId&&S.agents[F.agentId];
  return `<h3>Résumé</h3>
   <div class="line"><span class="muted">Client</span><b>${esc(F.client)||'—'} ${F.member?'<span class="wm">Member</span>':''}</b></div>
   <div class="line"><span class="muted">Quand</span><b>${fmtD(F.date)} ${F.time||''}</b></div>
   <div class="line"><span class="muted">Activité</span><b style="text-align:right">${svcLabel(b)}</b></div>
   ${c.disc?`<div class="line t-ol"><span>Remise member −${CFG.member} %</span><b>−${aed(c.disc)}</b></div>`:''}
   ${c.opt?`<div class="line"><span class="muted">Options</span><b>${aed(c.opt)}</b></div>`:''}
   ${Object.keys(F.ext).length?`<div class="line t-warn"><span>Partenaire externe</span><b>−${aed(Object.values(F.ext).reduce((a,q)=>a+q,0)*CFG.ext)} marge</b></div>`:''}
   <div class="line tot"><span>Total</span><span>${aed(c.total)}</span></div>
   <div class="split"><div><small>Agent${ag?' · '+c.pct+' %':''}</small><b>${aed(c.agentPart)}</b></div><div><small>Wild</small><b>${aed(c.wildPart)}</b></div></div>
   <div class="line"><span class="muted">Payé</span><b>${aed(c.paid)}</b></div><div class="line"><span class="muted">Reste sur place</span><b class="${c.rest>0?'t-crit':'t-ok'}">${aed(c.rest)}</b></div>
   ${ag?`<div class="note ${Math.abs(c.agentOwes)<0.01?'ok':''}">${c.agentOwes>0.01?esc(ag.name)+' doit verser '+aed(c.agentOwes)+' à Wild':c.agentOwes<-0.01?'Wild doit verser '+aed(-c.agentOwes)+' à '+esc(ag.name):'Rien à régler avec '+esc(ag.name)}</div>`:''}
   ${!F.id||F.draft?`<label class="cbox"><input type="checkbox" ${F.notify?'checked':''} onchange="S.F.notify=this.checked"><span class="small">Envoyer la confirmation WhatsApp ${F.agentId?'à '+esc(S.agents[F.agentId]?.name||'l\'agent')+' (récap commission)':'au client (sans commission)'} et ajouter à l'agenda</span></label>`:''}<button class="btn pri big wide" onclick="fSave()">${F.draft?'Valider et confirmer':F.id?'Enregistrer la modification':'Confirmer le booking'}</button>
   ${F.id?`<button class="btn exc wide" onclick="if(this.dataset.sure){fDelete()}else{this.dataset.sure=1;this.textContent='Confirmer la suppression'}">Supprimer le booking</button>`:''}`}
const del=(k,i)=>`<button class="x" onclick="fDel('${k}',${i})" aria-label="Retirer">✕</button>`;
function mSelect(l,i){return `<select onchange="fLineModel(${i},this.value)" aria-label="Machine"><option value="">Choisir…</option>${TIERS.map(([t])=>`<optgroup label="${t}">${Object.entries(ACT).filter(([,M])=>M.tier===t).map(([m,M])=>`<option value="${m}" ${l.m===m?'selected':''}>${esc(M.name)}</option>`).join('')}</optgroup>`).join('')}<optgroup label="Safari"><option value="${SAF}" ${l.m===SAF?'selected':''}>Safari désert</option></optgroup></select>`}
VIEWS.new=()=>{
  const F=S.F;if(!F){newBooking();return ''}
  const b=fBooking(F),c=calc(b);
  const lineHtml=(l,i)=>{
    if(l.m===SAF)return `<div class="fr">${mSelect(l,i)}<span></span><span></span><b class="ftot" id="lt${i}">${aed(Object.values(l.items).reduce((s,x)=>s+x.qty*x.unit,0))}</b>${del('line',i)}</div>
      ${Object.entries(l.items).map(([k,x])=>`<div class="fr sub"><span>${esc(SAFARI[k][0])}</span><input type="number" min="0" inputmode="numeric" value="${x.qty}" oninput="S.F.lines[${i}].items.${k}.qty=Math.max(0,+this.value||0);fSoft()" aria-label="Nombre"><input type="number" inputmode="decimal" value="${x.unit}" oninput="S.F.lines[${i}].items.${k}.unit=+this.value||0;fSoft()" aria-label="Prix"><span class="ftot" id="st${i}${k}">${aed(x.qty*x.unit)}</span><span></span></div>`).join('')}`;
    const M=ACT[l.m];
    return `<div class="fr">${mSelect(l,i)}<input type="number" min="1" inputmode="numeric" value="${l.qty}" oninput="S.F.lines[${i}].qty=Math.max(1,+this.value||1);fSoft()" onchange="fHard()" aria-label="Nombre"><input type="number" inputmode="decimal" value="${l.unit}" oninput="fUnit(${i},this.value)" aria-label="Prix unité"><b class="ftot" id="lt${i}">${l.m?aed(l.qty*l.unit):'—'}</b>${del('line',i)}</div>
      ${l.m?`<div class="fr note2"><span class="small muted">${esc(M.tier)} · ${INCL[M.fleet]||''}</span><span></span><span class="small t-or" id="sp${i}">${l.custom?'Prix spécial · habituel '+aed(priceOf(l.m,F.dur)):''}</span><span></span><span></span></div>`:''}
      ${M&&M.gear?`<div id="gear${i}">${(()=>{const items={};items[l.m]=+l.qty||1;const o={items,gear:F.gear};const h=gearBox(o,l.m,'S.F.gear.'+l.m,'fSoft()');F.gear=o.gear;return h})()}</div>`:''}`;
  };
  return `<div class="ph"><div><h1>${F.draft?'Valider le booking WhatsApp':F.id?'Modifier le booking':'Nouveau booking'}</h1><p>${F.draft?'Vérifie ce que l\'agent IA a compris, complète, puis valide':F.id?esc(bk(F.id).num):'Saisie rapide sur une seule page'}</p></div><button class="btn ghost" onclick="S.F=null;go('booking')">◀ Retour au Booking</button></div>
  <div class="wz"><div class="g">${F.draft?`<div class="card wamsg"><h3>Message WhatsApp reçu · ${bk(F.id).waRole==='agent'?'agent '+esc(S.agents[bk(F.id).agentId]?.name||''):'client direct'}</h3><div class="copy">${esc(bk(F.id).waText||'')}</div>${(bk(F.id).missing||[]).length?`<div class="note bad">L'agent IA attend encore : ${bk(F.id).missing.map(missLbl).join(', ')}. Tu peux compléter toi-même.</div>`:''}</div>`:''}
   <div class="card"><h3>Client</h3><div class="g fg4">
     <label class="fld"><span>Téléphone / WhatsApp</span><input value="${esc(F.phone)}" inputmode="tel" placeholder="+971 5X XXX XXXX" oninput="fPhone(this.value)"></label>
     <label class="fld"><span>Nom du client</span><input value="${esc(F.client)}" placeholder="Nom du client" oninput="S.F.client=this.value;fSoft()"></label>
     <label class="fld"><span>Date</span><input type="date" value="${F.date}" onchange="S.F.date=this.value||TODAY;fHard()"></label>
     <label class="fld"><span>Heure</span><input type="time" step="300" value="${F.time}" onchange="S.F.time=this.value;fHard()"></label></div>
     <div id="fclient" class="fhint">${fClientHint()}</div></div>
   <div class="card"><h3>Machines et safari<label class="inl">Durée <select onchange="fDur(this.value)"><option value="60" ${F.dur===60?'selected':''}>1 heure</option><option value="120" ${F.dur===120?'selected':''}>2 heures</option></select></label></h3>
     <div class="fr fh"><span>Machine</span><span>Nb</span><span>Prix unité</span><span class="ftot">Total</span><span></span></div>
     ${F.lines.map(lineHtml).join('')}
     <button class="btn sm" style="align-self:flex-start" onclick="fAdd('line')">+ Ajouter une machine ou un safari</button>
     <div id="favail">${fAvailHtml()}</div></div>
   <div class="card"><h3>Options <span class="incl">100 % Wild · sans commission agent</span></h3>
     ${F.options.length?'<div class="fr fh"><span class="c12">Option</span><span>Prix</span><span></span><span></span></div>':''}
     ${F.options.map((o,i)=>`<div class="fr"><select class="c12" onchange="fOpt(${i},this.value)" aria-label="Option">${Object.entries(OPTIONS).map(([k,[l]])=>`<option value="${k}" ${o.k===k?'selected':''}>${esc(l)}</option>`).join('')}</select><input type="number" inputmode="decimal" value="${o.price}" oninput="S.F.options[${i}].price=+this.value||0;fSoft()" aria-label="Prix"><span></span>${del('opt',i)}</div>`).join('')}
     <button class="btn sm" style="align-self:flex-start" onclick="fAdd('opt')">+ Ajouter une option</button></div>
   <div class="card"><h3>Demandes du client</h3>
     ${F.demands.length?'<div class="fr fh"><span>Demande</span><span class="c24">Précision</span><span></span></div>':''}
     ${F.demands.map((d,i)=>`<div class="fr"><select onchange="S.F.demands[${i}].tag=this.value;fSoft()" aria-label="Demande">${[...new Set([...DEMANDS,d.tag,'Autre'])].map(t=>`<option ${d.tag===t?'selected':''}>${esc(t)}</option>`).join('')}</select><input class="c24" value="${esc(d.detail)}" placeholder="Ex. bébé de 2 ans" oninput="S.F.demands[${i}].detail=this.value;fSoft()" aria-label="Précision">${del('dem',i)}</div>`).join('')}
     <button class="btn sm" style="align-self:flex-start" onclick="fAdd('dem')">+ Ajouter une demande</button>
     <label class="fld"><span>Note pour l'équipe</span><input value="${esc(F.notes)}" placeholder="Ex. arrive de l'hôtel Atlantis, parle russe" oninput="S.F.notes=this.value"></label></div>
   <div class="card"><h3>Agent et canal</h3><div class="g fg3">
     <label class="fld"><span>Agent</span><select onchange="fAgent(this.value)"><option value="">Aucun (direct)</option>${Object.values(S.agents).sort((a,b)=>a.name.localeCompare(b.name)).map(a=>`<option value="${a.id}" ${F.agentId===a.id?'selected':''}>${esc(a.name)} (${a.pct} %)</option>`).join('')}</select></label>
     <label class="fld"><span>Canal</span><select ${F.agentId?'disabled':''} onchange="S.F.channel=this.value;fSoft()">${CHANNELS.filter(x=>F.agentId?x==='Agent / plateforme':x!=='Agent / plateforme').map(x=>`<option ${x===F.channel?'selected':''}>${x}</option>`).join('')}</select></label>
     <label class="cbox ${F.member?'member':''}"><input type="checkbox" ${F.member?'checked':''} onchange="S.F.member=this.checked;fHard()"><span><b>Remise Wild member −${CFG.member} %</b><br><small class="muted">Sur les activités, pas les options</small></span></label></div></div>
   <div class="card"><h3>Paiement</h3>
     ${F.pays.length?'<div class="fr fh"><span class="c12">Mode</span><span>Montant</span><span></span><span></span></div>':''}
     ${F.pays.map((p,i)=>`<div class="fr"><select class="c12" onchange="S.F.pays[${i}].mode=this.value;fSoft()" aria-label="Mode">${Object.entries(PAYMODES).filter(([k])=>k!=='agent'||F.agentId||p.mode==='agent').map(([k,v])=>`<option value="${k}" ${p.mode===k?'selected':''}>${v}</option>`).join('')}</select><input type="number" inputmode="decimal" value="${p.amount||''}" placeholder="0" oninput="S.F.pays[${i}].amount=+this.value||0;fSoft()" aria-label="Montant"><span></span>${del('pay',i)}</div>`).join('')}
     <button class="btn sm" style="align-self:flex-start" onclick="fAdd('pay')">+ Ajouter un paiement</button>
     <div id="fplace">${c.paid>c.total+0.01?'<div class="note bad">Les paiements dépassent le total.</div>':c.rest>0?`<div class="note">Reste à payer sur place : ${aed(c.rest)}</div>`:c.total>0?'<div class="note ok">Entièrement payé</div>':''}</div></div>
   ${F.id&&!F.draft?`<label class="fld"><span>Raison de la modification</span><input value="${esc(F.why)}" placeholder="Ex. le client ajoute une machine" oninput="S.F.why=this.value"></label>`:''}
  </div><div class="card fsum" id="fsum">${fSumHtml(b,c)}</div></div>`;
};
function fSave(){
  const F=S.F;const tmp=fBooking(F),c=calc(tmp);
  if(!F.client.trim())return toast('Indique le nom du client');
  if(!fleetItems(tmp).length&&!isSafari(tmp))return toast('Choisis au moins une machine ou un safari');
  if(!(c.total>0))return toast('Indique un prix');
  if(c.paid>c.total+0.01)return toast('Les paiements dépassent le total');
  if(!F.time)return toast("Indique l'heure");
  if(digits(F.phone).length>=6&&!client(F.phone))S.clients.push({name:F.client.trim(),phone:F.phone.trim(),country:'',member:F.member,memberSince:F.member?MONTH:'',notes:''});
  const fields=['date','time','dur','phone','client','member','items','unit','safari','sunit','options','oprice','demands','pays','agentId','pct','channel','notes','gear','ext'];
  let b;
  if(F.id){b=bk(F.id);const before=JSON.parse(JSON.stringify(b));if(F.draft){b.status='up';b.missing=[]}
    fields.forEach(k=>{if(k==='pct'&&tmp.agentId===before.agentId)return;b[k]=JSON.parse(JSON.stringify(tmp[k]))});
    b.vehicles=b.date===before.date?b.vehicles.filter(v=>b.items[veh(v).model]):[];
    const d=bDiff(before,b);if(!d.length&&!F.draft){toast('Aucune modification');return}
    logB(b,F.draft?'Validé par '+ROLES[S.role].name+(d.length?' · '+d.join(' · '):''):'Modification : '+d.join(' · '),F.why);
  }else{
    b=mkB(Object.fromEntries(fields.filter(k=>k!=='pct').map(k=>[k,JSON.parse(JSON.stringify(tmp[k]))])));
    b.history=[{t:hm(now()),x:'Booking créé · '+svcLabel(b)+' · '+aed(calc(b).total)+' · '+(b.agentId?'agent '+S.agents[b.agentId].name:b.channel)}];
    S.bookings.push(b);if(F.saved)S.saved+=calc(b).total;
  }
  fleetItems(b).forEach(([m,q])=>{let need=q-(b.ext[m]||0)-assignedOf(b,m);S.vehicles.filter(v=>v.model===m&&v.status==='available'&&!b.vehicles.includes(v.id)).forEach(v=>{if(need<=0)return;const clash=S.bookings.some(x=>x.id!==b.id&&x.date===b.date&&['up','riding'].includes(x.status)&&x.vehicles.includes(v.id)&&bStart(x)<toMin(b.time)+durOf(b)&&bEnd(x)+10>toMin(b.time));if(!clash){b.vehicles.push(v.id);need--}})});
  const wasEdit=!!F.id&&!F.draft,wasDraft=!!F.draft,notify=F.notify;S.F=null;S.bkDay=b.date;S.bkF='all';S.bkQ='';go('booking');doneModal(b.id,wasEdit,wasDraft);if(wasEdit)calSync(b.id);else confirmRemote(b.id,notify);
}
function fDelete(){const id=S.F.id;const ev=bk(id).calEventId;if(ev)setTimeout(()=>calSync(id,{deleted:true,calEventId:ev}),800);S.bookings=S.bookings.filter(b=>b.id!==id);S.F=null;go('booking');toast('Booking supprimé')}
function bDiff(a,b){const out=[],f=(l,x,y)=>{if(String(x??'')!==String(y??''))out.push(l+' : '+(x===''||x==null?'—':x)+' → '+(y===''||y==null?'—':y))};
  f('Client',a.client,b.client);f('Téléphone',a.phone,b.phone);f('Date',fmtD(a.date),fmtD(b.date));f('Heure',a.time,b.time);f('Durée',a.dur/60+' h',b.dur/60+' h');f('Activité',svcLabel(a),svcLabel(b));
  f('Options',a.options.map(k=>OPTIONS[k][0]).join(', '),b.options.map(k=>OPTIONS[k][0]).join(', '));f('Demandes',a.demands.map(demText).join(', '),b.demands.map(demText).join(', '));
  f('Équipement',gearLines(a).join(' / '),gearLines(b).join(' / '));f('Total',aed(calc(a).total),aed(calc(b).total));
  f('Agent',a.agentId?S.agents[a.agentId].name:'aucun',b.agentId?S.agents[b.agentId].name:'aucun');f('Canal',a.channel,b.channel);f('Member',a.member?'oui':'non',b.member?'oui':'non');
  f('Paiements',a.pays.map(p=>PAYSHORT[p.mode]+' '+aed(p.amount)).join(', '),b.pays.map(p=>PAYSHORT[p.mode]+' '+aed(p.amount)).join(', '));return out}
function doneModal(id,wasEdit,wasDraft){const b=bk(id),c=calc(b),ag=b.agentId&&S.agents[b.agentId];
  modal(mh(wasEdit?'✓ Booking modifié':wasDraft?'✓ Booking WhatsApp validé':'✓ Booking confirmé',b.num)+`<div class="sb" style="text-align:center"><div><b>${esc(b.client)}</b> · ${fmtLong(b.date)} à ${b.time}</div>${chipsHtml(b)}
   <div class="split" style="text-align:left"><div><small>Agent</small><b>${aed(c.agentPart)}</b></div><div><small>Wild</small><b>${aed(c.wildPart)}</b></div></div>
   <div class="line"><span>Total</span><b>${aed(c.total)}</b></div><div class="line"><span>Reste sur place</span><b class="${c.rest?'t-crit':'t-ok'}">${aed(c.rest)}</b></div>
   <div class="small muted">Véhicules : ${b.vehicles.join(' / ')||(fleetItems(b).length?'à assigner':'safari 4×4')}</div>
   <div class="note ok" id="dmStatus">${wasEdit?'Mise à jour de Google Agenda…':'Ajout à Google Agenda et envoi de la confirmation…'}</div>
   <a class="small" href="${gcal(b)}" target="_blank" rel="noopener">Lien agenda manuel</a></div>
   <div class="sf"><button class="btn" onclick="openB('${id}')">Voir le booking</button><button class="btn pri" onclick="newBooking()">+ Autre booking</button></div>`)}
/* Alertes 30 min avant et retard (sonnent tant que l'appli est ouverte) */
let AC=null;
function beep(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();[0,.25].forEach(t=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=880;o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(.2,AC.currentTime+t);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+t+.2);o.start(AC.currentTime+t);o.stop(AC.currentTime+t+.2)})}catch(e){}}
function notify(title,body){toast(title+' · '+body);beep();try{if('Notification' in window&&Notification.permission==='granted')new Notification(title,{body})}catch(e){}}
function tick(){const n=now();let ch=false;
  todayB().filter(b=>stOf(b)==='up'||stOf(b)==='late').forEach(b=>{const t=toMin(b.time);b.alerted=b.alerted||{};const key=b.date+b.time;
    if(n>=t-CFG.pre&&n<t&&b.alerted.pre!==key){b.alerted.pre=key;notify('Dans '+Math.max(1,t-n)+' min : '+b.client,svcLabel(b)+' à '+b.time);ch=true}
    else if(n>=t+CFG.late&&b.alerted.late!==key){b.alerted.late=key;logB(b,'Alerte : client non arrivé à '+b.time);ch=true}});
  if(ch&&S.view!=='new'&&!$('#modal').innerHTML)render()}

/* ---------- Écran TV (sans données financières) ---------- */
function openTV(){
  const draw=()=>{const n=now();const up=todayB().filter(b=>b.status==='up').sort((a,b)=>toMin(a.time)-toMin(b.time)).slice(0,6);
    const prep=[...new Set(up.slice(0,4).flatMap(b=>b.vehicles))];const ret=todayB().filter(b=>b.status==='riding').sort((a,b)=>a.endMin-b.endMin);
    const lab=b=>{const bl=blockers(b);if(!b.arrivedAt)return[stOf(b)==='late'?'EN RETARD':'ATTENDU',stOf(b)==='late'?'var(--crit)':'var(--muted)'];if(!bl.length)return['PRÊT','var(--ok)'];if(bl.some(x=>x.k==='brief'||x.k==='contract'))return['BRIEFING','var(--warn)'];return['PRÉPARATION','var(--warn)']};
    $('#tvwrap').innerHTML=`<div class="tv"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div style="display:flex;align-items:center;gap:18px"><img src="/logo.png" alt="Wild Adventures" style="width:110px"><h1>LIVE OPERATIONS</h1></div><div style="display:flex;align-items:center;gap:16px"><div class="clock">${hm(n)}</div><button class="btn" onclick="closeTV()">Quitter</button></div></div>
    <div class="tvg"><div class="tvc"><h2>PROCHAINS DÉPARTS</h2>${up.map(b=>{const[l,c]=lab(b);return`<div class="tvrow"><span class="tm">${b.time}</span><span style="flex:1">${esc(b.client.split(' ').slice(-1)[0].toUpperCase())}</span><span style="flex:1;color:var(--muted)">${svcLabel(b).toUpperCase()}</span><span style="color:${c}">${l}</span></div>`}).join('')||'<div class="tvrow">—</div>'}</div>
    <div class="tvc"><h2>À PRÉPARER</h2>${prep.map(v=>`<div class="tvrow">${v}</div>`).join('')}${up.slice(0,4).flatMap(b=>gearLines(b).map(g=>`<div class="tvrow"><small>${esc(g)}</small></div>`)).join('')}${prep.length?'':'<div class="tvrow">—</div>'}</div>
    <div class="tvc"><h2>RETOURS</h2>${ret.map(b=>{const d=b.endMin-n;return`<div class="tvrow"><span style="flex:1">${b.vehicles.join(' ')||'SAFARI'}</span><span style="color:${d<0?'var(--crit)':'var(--info)'}">${d<0?'+'+(-d):d} min</span></div>`}).join('')||'<div class="tvrow">—</div>'}</div></div></div>`};
  draw();clearInterval(S._tv);S._tv=setInterval(draw,20000);
}
function closeTV(){clearInterval(S._tv);$('#tvwrap').innerHTML=''}

/* ---------- Palmes décoratives (dessinées par le code) ---------- */
function palmSVG(n){let out='';const W=400;
  for(let f=0;f<n;f++){const a=(-160+f*(140/(n-1)))*Math.PI/180,len=150+((f*37)%40),bend=f<n/2?-1:1;
    const ex=200+Math.cos(a)*len,ey=200+Math.sin(a)*len,cx=200+Math.cos(a)*len*.55-Math.sin(a)*bend*30,cy=200+Math.sin(a)*len*.55+Math.cos(a)*bend*30+20;
    out+=`<path d="M200 200 Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="currentColor" stroke-width="3" fill="none"/>`;
    for(let i=1;i<18;i++){const t=i/18,x=(1-t)*(1-t)*200+2*(1-t)*t*cx+t*t*ex,y=(1-t)*(1-t)*200+2*(1-t)*t*cy+t*t*ey;
      const tx=2*(1-t)*(cx-200)+2*t*(ex-cx),ty=2*(1-t)*(cy-200)+2*t*(ey-cy),tl=Math.hypot(tx,ty),ux=tx/tl,uy=ty/tl,L=10+46*Math.sin(Math.PI*t)*(1-t*.35);
      [1,-1].forEach(sd=>{const ang=sd*1.05,dx=ux*Math.cos(ang)-uy*Math.sin(ang),dy=ux*Math.sin(ang)+uy*Math.cos(ang);const lx=x+dx*L,ly=y+dy*L+L*.25;
        out+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${(x+dx*L*.5-dy*4).toFixed(1)} ${(y+dy*L*.5+dx*4+3).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)} Q${(x+dx*L*.5+dy*3).toFixed(1)} ${(y+dy*L*.5-dx*3).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}Z" fill="currentColor"/>`})}}
  return `<svg viewBox="0 0 ${W} ${W}" aria-hidden="true">${out}<path d="M200 200 Q206 300 196 400" stroke="currentColor" stroke-width="9" fill="none"/></svg>`}
function paintPalms(){document.querySelectorAll('[data-palm]:not([data-done])').forEach(e=>{e.innerHTML=palmSVG(+e.dataset.palm);e.dataset.done=1})}

/* ---------- Démarrage ---------- */

/* ====================================================================
   VRAIE APPLICATION : données en ligne, WhatsApp, agenda
   ==================================================================== */
const closingToday=()=>S.closings.find(c=>c.date===TODAY)||null;
function setClosing(o){S.closings=S.closings.filter(c=>c.date!==TODAY);S.closings.push({date:TODAY,...o})}
const taskDone=t=>t.doneDay===TODAY||(STORE.demo&&t.done);
const missLbl=k=>({client_name:'nom',date:'date',time:'heure',activity:'activité',quantity:'quantité'}[k]||k);
const isoHM=a=>{if(!a)return '';const d=new Date(Date.parse(a)+TZ).toISOString();return (d.slice(0,10)===TODAY?'':fmtD(d.slice(0,10))+' ')+d.slice(11,16)};
function normB(x){return Object.assign({items:{},unit:{},safari:{},sunit:{},options:[],oprice:{},gear:{},demands:[],pays:[],vehicles:[],ext:{},history:[],alerted:{},after:null,arrivedAt:null,member:false,agentId:'',pct:0,dur:60,channel:'WhatsApp',notes:'',guide:'',contract:false,briefing:false,status:'up',client:'',phone:'',date:TODAY,time:'',num:''},x)}
const uidOf=o=>o._id||(o._id=uid());
function exportConfig(){return{ACT,SAFARI,OPTIONS,STORAGE,CFG,DEMANDS:[...DEMANDS]}}
function applyConfig(c){if(!c)return;const put=(dst,src)=>{if(!src)return;Object.keys(dst).forEach(k=>delete dst[k]);Object.assign(dst,src)};put(ACT,c.ACT);put(SAFARI,c.SAFARI);put(OPTIONS,c.OPTIONS);put(STORAGE,c.STORAGE);if(c.CFG)Object.assign(CFG,c.CFG);if(c.DEMANDS)DEMANDS.splice(0,DEMANDS.length,...c.DEMANDS)}
/* Ce qui est enregistré en base : un type ("kind") par collection */
function collections(){return{
  booking:()=>S.bookings.map(b=>[b.id,b]),
  client:()=>S.clients.map(c=>[uidOf(c),c]),
  agent:()=>Object.values(S.agents).map(a=>[a.id,a]),
  storage:()=>S.storage.map(s=>[s.id,s]),
  service:()=>S.services.map(s=>[s.id,s]),
  settlement:()=>S.settlements.map(x=>[uidOf(x),x]),
  vehicle:()=>S.vehicles.map(v=>[v.id,v]),
  staff:()=>S.staff.map(x=>[uidOf(x),x]),
  expense:()=>S.expenses.map(x=>[uidOf(x),x]),
  incident:()=>S.incidents.map(x=>[uidOf(x),x]),
  maint:()=>S.maintLog.map(x=>[uidOf(x),x]),
  task:()=>S.tasks.map(x=>[uidOf(x),x]),
  closing:()=>S.closings.map(x=>[x.date,x]),
  wa_conv:()=>S.waConvs.map(c=>[c.id,c]),
  doc:()=>[['stock',S.stock],['counters',{lost:S.lost,saved:S.saved}],['config',exportConfig()]],
}}
const ARR={client:'clients',settlement:'settlements',staff:'staff',expense:'expenses',incident:'incidents',maint:'maintLog',task:'tasks'};
const BYID={booking:'bookings',storage:'storage',service:'services',vehicle:'vehicles',wa_conv:'waConvs',wa_msg:'waMsgs'};
function applyRows(rows){
  const by={};rows.forEach(r=>(by[r.kind]=by[r.kind]||[]).push(r));
  const doc=id=>(by.doc||[]).find(r=>r.id===id)?.data;
  if(!doc('config')){ // premier démarrage : on garde le catalogue, les agents, la flotte et l'équipe par défaut
    S.expenses=[];S.lost=0;S.saved=0;S.staff=[];S.tasks=[];Object.values(S.agents).forEach(a=>a.phone='');
    S.vehicles.forEach(v=>Object.assign(v,{rev:0,rides:0,maint:0,dmg:0}));
    return true;
  }
  applyConfig(doc('config'));
  if(doc('stock'))S.stock=doc('stock');
  const c=doc('counters');if(c){S.lost=c.lost||0;S.saved=c.saved||0}
  const list=k=>(by[k]||[]).map(r=>r.data);
  S.bookings=list('booking').map(normB);S.clients=list('client');S.agents=Object.fromEntries(list('agent').map(a=>[a.id,a]));
  S.storage=list('storage');S.services=list('service');S.settlements=list('settlement');S.vehicles=list('vehicle');S.staff=list('staff');
  S.expenses=list('expense');S.incidents=list('incident');S.maintLog=list('maint');S.tasks=list('task');S.closings=list('closing');
  S.waConvs=list('wa_conv');S.waMsgs=list('wa_msg').sort((a,b)=>(a.at||'').localeCompare(b.at||''));
  return false;
}
/* Mise à jour reçue d'un autre écran ou du serveur (WhatsApp) */
function applyRemote(type,kind,id,data){
  if(kind==='doc'){if(type==='delete')return;if(id==='config'){applyConfig(data);softRender();return exportConfig()}if(id==='stock'){S.stock=data;softRender();return data}if(id==='counters'){S.lost=data.lost||0;S.saved=data.saved||0;softRender();return data}return}
  if(kind==='agent'){if(type==='delete')delete S.agents[id];else S.agents[id]=data;softRender();return data}
  if(kind==='closing'){S.closings=S.closings.filter(c=>c.date!==id);if(type!=='delete')S.closings.push(data);softRender();return data}
  const coll=BYID[kind]||ARR[kind];if(!coll)return;
  const key=BYID[kind]?(o=>o.id===id):(o=>o._id===id);
  const arr=S[coll];const i=arr.findIndex(key);
  if(type==='delete'){if(i>=0)arr.splice(i,1);softRender();return}
  const obj=kind==='booking'?normB(data):data;
  if(i>=0){Object.keys(arr[i]).forEach(k=>delete arr[i][k]);Object.assign(arr[i],obj)}else arr.push(obj);
  if(kind==='wa_msg')arr.sort((a,b)=>(a.at||'').localeCompare(b.at||''));
  if(kind==='booking'&&type!=='delete'&&obj.status==='draft'&&i<0)toast('Nouveau booking WhatsApp à valider : '+(obj.client||obj.waFrom||''));
  softRender();return obj;
}
let _rq=0;function softRender(){if(S.view==='new'||$('#modal').innerHTML){S._pendingRender=true;return}cancelAnimationFrame(_rq);_rq=requestAnimationFrame(render)}
/* Agenda + WhatsApp côté serveur */
function setDm(html){const e=$('#dmStatus');if(e)e.innerHTML=html}
async function confirmRemote(id,notify){
  if(STORE.demo){setDm('Mode démo : l\'agenda et la confirmation WhatsApp partiront automatiquement une fois l\'appli en ligne.');return}
  try{await STORE.flush();const r=await STORE.api('/api/booking-confirm',{id,notify});
    const cal={ok:'✓ Ajouté à Google Agenda',off:'Agenda non connecté',error:'✗ Agenda : '+(r.calendarError||'erreur')}[r.calendar]||r.calendar;
    const wa={ok:'✓ Confirmation WhatsApp envoyée à '+esc(r.to||''),template:'✓ Confirmation envoyée à '+esc(r.to||'')+' (modèle WhatsApp)',sent_outside_window:'⚠ Envoyé à '+esc(r.to||'')+' hors fenêtre 24 h : peut ne pas arriver (configure les modèles)',no_phone:'Pas de numéro WhatsApp : rien envoyé',off:'Pas de confirmation demandée',skipped:'WhatsApp non connecté',error:'✗ WhatsApp : '+(r.whatsappError||'erreur')}[r.whatsapp]||r.whatsapp;
    setDm(cal+'<br>'+wa);
  }catch(e){setDm('✗ '+esc(e.message)+' · le booking est bien enregistré')}
}
function calSync(id,opts={}){if(STORE.demo)return;STORE.flush().then(()=>STORE.api('/api/booking-sync',{id,...opts})).catch(e=>toast('Agenda non mis à jour : '+e.message))}
function rejectDraft(id){const b=bk(id);b.status='cancelled';logB(b,'Brouillon WhatsApp rejeté');closeModal();render();toast('Brouillon rejeté')}
function fbDone(id){const b=bk(id);b.feedback.handled=true;logB(b,'Client mécontent : suivi traité');closeModal();render();toast('Marqué comme traité')}

/* ---------- Messagerie WhatsApp ---------- */
const convName=c=>c.role==='agent'?(S.agents[c.agentId]?.name||c.name):(client(c.phone)?.name||c.name||c.phone);
const waBadge=c=>{const dr=c.draftId&&bk(c.draftId)?.status==='draft';return (c.needsHuman?'<span class="pill p-crit">À traiter</span>':'')+(dr?'<span class="pill p-warn">À valider</span>':'')+(c.human||c.humanUntil>new Date().toISOString()?'<span class="pill p-info">Équipe</span>':'')+(c.stage==='await_feedback'?'<span class="pill p-grey">Suivi envoyé</span>':'')};
VIEWS.whatsapp=()=>{
  const convs=S.waConvs.slice().sort((a,b)=>(b.lastAt||'').localeCompare(a.lastAt||''));
  const sel=convs.find(c=>c.id===S.waSel)||null;
  const off=!STORE.demo&&!STORE.features.whatsapp;
  const head=`<div class="ph"><div><h1>WhatsApp</h1><p>L'agent IA lit les messages, prépare les bookings et fait le suivi des clients. ${CFG.aiOn?'<span class="pill p-ok">Agent IA actif</span>':'<span class="pill p-grey">Agent IA en pause</span>'}</p></div><button class="btn" onclick="go('settings')">${ic('gear')}Réglages</button></div>
   ${off?'<div class="al late"><div><b>WhatsApp n\'est pas encore connecté.</b> Suis l\'étape 4 du guide de mise en ligne (fichier README).</div></div>':''}`;
  const list=`<div class="walist">${convs.map(c=>`<button class="wac ${sel&&sel.id===c.id?'on':''}" onclick="waOpen('${c.id}')"><div class="av ${c.role==='agent'?'m':''}">${esc((convName(c)||'?')[0])}</div><div class="grow"><b>${esc(convName(c))}</b><span class="pill ${c.role==='agent'?'p-or':'p-ol'}">${c.role==='agent'?'Agent':'Client'}</span><small>${esc(c.lastText||'')}</small><div class="bkp">${waBadge(c)}</div></div><div class="wam"><small>${isoHM(c.lastAt)}</small>${c.unread?`<i>${c.unread}</i>`:''}</div></button>`).join('')||'<div class="empty">Aucune conversation pour l\'instant. Les messages reçus sur ton WhatsApp Business apparaîtront ici.</div>'}</div>`;
  let thread='<div class="wathread"><div class="empty">Choisis une conversation</div></div>';
  if(sel){const msgs=S.waMsgs.filter(m=>m.phone===sel.id);const draft=sel.draftId&&bk(sel.draftId);const ag=sel.role==='agent'?S.agents[sel.agentId]:null;const human=sel.human||sel.humanUntil>new Date().toISOString();
    thread=`<div class="wathread"><div class="card"><div class="wah"><button class="btn ghost sm wab" onclick="S.waSel=null;render()">◀</button><div class="grow"><h2>${esc(convName(sel))}</h2><small class="muted">${esc(sel.phone)} · ${ag?'Agent · commission '+ag.pct+' %':'Client direct · aucune commission'}${!ag&&client(sel.phone)?.member?' · <span class="wm">Wild member</span>':''}</small></div></div>
      <div class="acts">${draft&&draft.status==='draft'?`<button class="btn pri sm" onclick="editBooking('${draft.id}')">Vérifier le booking à valider</button>`:draft?`<button class="btn sm" onclick="openB('${draft.id}')">Voir le booking</button>`:''}${!ag&&(client(sel.phone)||!draft)?`<button class="btn sm" onclick="${client(sel.phone)?`clientDrawer('${esc(client(sel.phone).phone)}')`:`newBooking();S.F.phone='${esc(sel.phone)}';S.F.client='${esc(sel.name||'')}';fHard()`}">${client(sel.phone)?'Fiche client':'Créer un booking'}</button>`:''}${human?`<button class="btn sm ol" onclick="waHuman('${sel.id}',false)">Rendre la main à l'agent IA</button>`:`<button class="btn sm" onclick="waHuman('${sel.id}',true)">Prendre la main</button>`}${sel.needsHuman?`<button class="btn sm" onclick="waConv('${sel.id}').needsHuman=false;render()">Marquer comme traité</button>`:''}</div>
      ${human?'<div class="note">L\'équipe gère cette conversation : l\'agent IA ne répond plus.</div>':''}</div>
      <div class="wamsgs" id="wamsgs">${msgs.map(m=>`<div class="bub ${m.dir} ${m.by==='ai'?'ai':''}">${esc(m.text)}<small>${m.dir==='out'?({ai:'Agent IA',phone:'Téléphone'}[m.by]||(String(m.by||'').startsWith('staff')?'Équipe '+esc(String(m.by).slice(6)):'Équipe'))+' · ':''}${isoHM(m.at)}${m.dir==='out'?' · '+({sent:'envoyé',delivered:'distribué',read:'lu',failed:'échec'}[m.status]||m.status||''):''}${m.error?' · '+esc(m.error):''}</small></div>`).join('')||'<div class="muted small">Aucun message chargé (30 derniers jours)</div>'}</div>
      <div class="wareply"><textarea id="waText" rows="2" placeholder="Répondre en tant qu'équipe Wild Adventures…"></textarea><button class="btn pri" onclick="waSend()">Envoyer</button></div></div>`}
  return head+`<div class="wabox ${sel?'sel':''}">${list}${thread}</div>`;
};
const waConv=id=>S.waConvs.find(c=>c.id===id);
function waOpen(id){S.waSel=id;const c=waConv(id);if(c&&c.unread)c.unread=0;render();const m=$('#wamsgs');if(m)m.scrollTop=m.scrollHeight}
function waHuman(id,on){const c=waConv(id);c.human=on;if(!on){c.humanUntil=null;c.needsHuman=false}render();toast(on?'Tu gères cette conversation':'L\'agent IA reprend la conversation')}
async function waSend(){const c=waConv(S.waSel),t=$('#waText').value.trim();if(!c||!t)return;
  if(STORE.demo){S.waMsgs.push({id:uid(),phone:c.id,dir:'out',text:t,by:'staff:'+ROLES[S.role].name,at:new Date().toISOString(),status:'sent'});c.human=true;c.lastText=t;c.lastAt=new Date().toISOString();render();toast('Mode démo : message simulé');return}
  try{await STORE.api('/api/wa-send',{phone:c.phone,text:t});$('#waText').value='';toast('Message envoyé')}catch(e){toast('Échec : '+e.message)}}

/* ---------- Réglages : automatisation, flotte, équipe ---------- */
function autoSettingsHtml(){const F=STORE.features||{};const st=(ok,l)=>`<div class="row"><div class="grow"><b>${l}</b></div>${STORE.demo?'<span class="pill p-grey">Démo</span>':ok?'<span class="pill p-ok">Connecté</span>':'<span class="pill p-warn">À connecter</span>'}</div>`;
  return `<div class="card"><h3>Agent IA WhatsApp</h3>
   ${st(F.whatsapp,'WhatsApp Business')}${st(F.calendar,'Google Agenda')}${st(F.ai,'Agent IA (Claude)')}
   <label class="cbox"><input type="checkbox" ${CFG.aiOn?'checked':''} onchange="CFG.aiOn=this.checked;render()"><span><b>L'agent IA répond aux messages</b><br><small class="muted">Il prépare les bookings (à valider), répond aux questions de prix et fait le suivi. Décoche pour tout gérer à la main.</small></span></label>
   <label class="cbox"><input type="checkbox" ${CFG.feedbackAgents?'checked':''} onchange="CFG.feedbackAgents=this.checked;render()"><span><b>Suivi satisfaction aussi pour les clients des agents</b><br><small class="muted">Message à 20 h (Dubaï) aux clients dont le tour est terminé, s'il y a un numéro.</small></span></label>
   <label class="fld"><span>Lien pour laisser un avis Google</span><input value="${esc(CFG.reviewUrl)}" placeholder="https://g.page/r/…/review" onchange="CFG.reviewUrl=this.value.trim();render();toast('Lien enregistré')"></label>
   <p class="small muted" style="margin:0">Envoyé uniquement aux clients qui répondent positivement. Sans lien, ils reçoivent juste un remerciement.</p>
   <label class="fld"><span>WhatsApp du responsable (alerte client mécontent)</span><input value="${esc(CFG.ownerWa)}" placeholder="+971 5X XXX XXXX" onchange="CFG.ownerWa=this.value.trim();render();toast('Numéro enregistré')"></label>
   ${STORE.demo?'':`<div class="row"><div class="grow"><b>Connecté en tant que</b><small>${esc(STORE.profile?.name||'')} · ${esc(STORE.user?.email||'')}</small></div><button class="btn sm" onclick="STORE.logout()">Se déconnecter</button></div>`}</div>`}
function vehicleModal(){modal(mh('Ajouter une machine')+`<div class="sb"><div class="g g2"><label class="fld"><span>Identifiant</span><input id="nvi" placeholder="ex. X2-05"></label><label class="fld"><span>Modèle</span><select id="nvm">${Object.entries(ACT).map(([k,m])=>`<option value="${k}">${esc(m.name)}</option>`).join('')}</select></label><label class="fld"><span>Heures moteur</span><input id="nvh" type="number" step="0.1" value="0"></label><label class="fld"><span>Prochain service à (h)</span><input id="nvs" type="number" value="50"></label></div></div><div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="addVehicle()">Ajouter</button></div>`)}
function addVehicle(){const id=$('#nvi').value.trim().toUpperCase();if(!id)return toast('Indique un identifiant');if(veh(id))return toast('Cet identifiant existe déjà');S.vehicles.push(V(id,$('#nvm').value,+$('#nvh').value||0,+$('#nvs').value||50,'available'));closeModal();render();toast('Machine ajoutée')}
function removeVehicle(id){if(S.bookings.some(b=>['up','riding'].includes(b.status)&&b.vehicles.includes(id)))return toast('Machine assignée à un booking en cours');S.vehicles=S.vehicles.filter(v=>v.id!==id);closeModal();render();toast('Machine retirée')}
function staffModal(){modal(mh('Ajouter un membre de l\'équipe')+`<div class="sb"><label class="fld"><span>Nom</span><input id="nsn"></label><div class="g g2"><label class="fld"><span>Poste</span><select id="nsr"><option value="guide">Guide</option><option value="reception">Réception</option><option value="mechanic">Mécanicien</option><option value="manager">Manager</option><option value="coffee">Wild Coffee</option></select></label><label class="fld"><span>Horaires</span><input id="nss" placeholder="08-20" value="08-20"></label></div><p class="small muted" style="margin:0">Pour qu'il se connecte à l'appli, crée aussi son compte (guide de mise en ligne, étape 2).</p></div><div class="sf"><button class="btn ghost" onclick="closeModal()">Annuler</button><button class="btn pri" onclick="addStaff()">Ajouter</button></div>`)}
function addStaff(){const n=$('#nsn').value.trim();if(!n)return toast('Indique un nom');S.staff.push({_id:uid(),name:n,role:$('#nsr').value,shift:$('#nss').value.trim()||'—',status:'notstarted',in:'',day:TODAY});closeModal();render();toast('Membre ajouté')}
function setStaffStatus(i,v){const s=S.staff[i];s.status=v;s.day=TODAY;if((v==='present'||v==='late')&&!s.in)s.in=hm(now());render()}
function punchIn(s){const st=toMin(String(s.shift).split('-')[0]+':00');const n=now();s.in=hm(n);s.day=TODAY;s.late=isNaN(st)?0:Math.max(0,n-st);s.status=s.late>5?'late':'present'}

/* ---------- Mode démo : conversations WhatsApp d'exemple ---------- */
function demoWhatsApp(){
  const t=(m)=>new Date(Date.now()-m*60000).toISOString(),tom=addDays(TODAY,1),sat=addDays(TODAY,(6-new Date(TODAY+'T12:00:00Z').getUTCDay()+7)%7||7);
  const d1=mkB({date:tom,time:'16:00',phone:'',client:'Chen Wei',items:{KTM:2},unit:{KTM:550},agentId:'a2',pays:[{mode:'agent',amount:1100,at:'10:12'}],status:'draft',history:[{t:'10:12',x:'Reçu par WhatsApp · agent Karim Tours'}]});
  Object.assign(d1,{source:'whatsapp',waRole:'agent',waFrom:'+971550000000',waText:"Salam, 2 KTM demain 16h pour Chen Wei, débutant. Il m'a payé 1100.",missing:[],createdAt:t(18),demands:[{tag:'Débutant',detail:''}]});
  const d2=mkB({date:sat,time:'',phone:'+447911123456',client:'Sarah Williams',items:{X32:2},status:'draft',history:[{t:'10:31',x:'Reçu par WhatsApp · client direct · manque : heure'}]});
  Object.assign(d2,{source:'whatsapp',waRole:'client',waFrom:'+447911123456',waText:'Hi! Can we book 2 Maverick X3 for Saturday afternoon?',missing:['time'],createdAt:t(6)});
  S.bookings.push(d1,d2);
  const conv=(id,o)=>S.waConvs.push(Object.assign({id,phone:'+'+id,role:'client',agentId:'',stage:'idle',draftId:null,human:false,needsHuman:false,unread:0,lang:'en',history:[]},o));
  const msg=(phone,dir,text,by,m)=>S.waMsgs.push({id:uid(),phone,dir,text,by,at:t(m),status:dir==='out'?'read':'received'});
  conv('971550000000',{role:'agent',agentId:'a2',name:'Karim Tours',stage:'pending_validation',draftId:d1.id,lastAt:t(17),lastText:'Bien reçu, l\'équipe confirme très vite.',lang:'fr'});
  msg('971550000000','in',d1.waText,'contact',18);msg('971550000000','out',"Bien reçu : 2 KTM 450 demain à 16:00 pour Chen Wei (débutant), 1 100 AED payés. L'équipe confirme très vite.",'ai',17);
  conv('447911123456',{name:'Sarah Williams',stage:'collecting',draftId:d2.id,unread:1,lastAt:t(5),lastText:'What time would you like to ride on Saturday?'});
  msg('447911123456','in',d2.waText,'contact',6);msg('447911123456','out','Hi Sarah! 2 × Maverick X3 Turbo (2 seats) on Saturday, great choice 🏜️ What time would you like to ride, and for 1 or 2 hours?','ai',5);
  conv('79165550101',{name:'Ivan Petrov',needsHuman:true,unread:2,lastAt:t(40),lastText:'Can I get a refund for the transport?',lang:'en'});
  msg('79165550101','in','Hello, our hotel changed. Can I get a refund for the transport?','contact',41);msg('79165550101','out','Thank you Ivan, a team member will get back to you shortly about the transport.','ai',40);
  const y=S.bookings.filter(b=>b.date>=addDays(TODAY,-3)&&b.date<TODAY&&b.status==='done'&&b.phone&&!b.agentId).reverse().filter((b,i,arr)=>arr.findIndex(x=>x.phone===b.phone)===i);
  if(y[0]){y[0].feedback={askedAt:t(60*14),answer:'Amazing experience, the guide was great!',sentiment:'positive',reviewSentAt:t(60*13.8)};y[0].after={...(y[0].after||{accident:'non',note:''}),mood:'content',review:'lien'};
    conv(digits(y[0].phone),{name:y[0].client,lastAt:t(60*13.8),lastText:'Thank you! It would mean a lot…'});msg(digits(y[0].phone),'out',"Hi! Thank you for riding with Wild Adventures today! 🏜️ How was your experience? Just reply to this message.",'ai',60*14);msg(digits(y[0].phone),'in',y[0].feedback.answer,'contact',60*13.9);msg(digits(y[0].phone),'out','Thank you so much! 🙏\n\nIt would mean a lot to us if you could share your experience on Google:\nhttps://g.page/r/…/review','ai',60*13.8)}
  if(y[1]){y[1].feedback={askedAt:t(60*14),answer:'The buggy stopped twice in the dunes, not great.',sentiment:'negative',needsFollowUp:true};y[1].after={...(y[1].after||{accident:'non',note:''}),mood:'mecontent',review:'pas'}}
}

/* ---------- Démarrage ---------- */
(async function init(){
  const boot=document.getElementById('boot');
  try{
    const r=await STORE.boot();
    if(r.demo){demoClients();demoStorage();seedDemo();demoWhatsApp();document.body.classList.add('is-demo')}
    else{
      const first=applyRows(await STORE.loadAll());
      S.role=r.profile.role;ROLES[S.role].name=r.profile.name;
      if(S.role==='guide')S.guideName=r.profile.name;
      if(r.profile.role!=='owner')document.querySelector('.rolebox select').hidden=true;
      else{const o=document.querySelector('#role option[value="owner"]');if(o)o.textContent='Direction — '+r.profile.name}
      STORE.coll=collections;STORE.onRemote=applyRemote;
      if(first){STORE.prime();STORE.snap.clear();STORE.schedule()}else STORE.prime();
      STORE.listen();
    }
  }catch(e){console.error(e);if(boot)boot.innerHTML='<div class="card"><b>Impossible de charger les données.</b><p class="small">'+esc(e.message||e)+'</p><button class="btn pri" onclick="location.reload()">Réessayer</button></div>';return}
  if(boot)boot.remove();
  const h=location.hash.slice(1);
  if(h==='tv'){render();openTV()}else{S.view=ROLES[S.role].nav.includes(h)?h:ROLES[S.role].nav[0];render()}
  setInterval(tick,30000);setTimeout(tick,1500);
  setInterval(()=>{document.querySelectorAll('[data-clock]').forEach(e=>e.textContent=hm(now()))},15000);
  setInterval(()=>{const d=new Date(Date.now()+TZ).toISOString().slice(0,10);if(d!==TODAY&&!STORE.demo&&S.view!=='new'){STORE.flush().then(()=>location.reload())}},60000);
  window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h&&h!==S.view&&(VIEWS[h]||h==='tv')&&h!=='new')go(h)});
})();
