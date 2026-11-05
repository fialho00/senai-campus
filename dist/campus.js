(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];
  let hasGemini = false;
  let sendingToGemini = false;
  const aiHistory = [];
  const fmt = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const safeWrite = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* private browsers can deny storage */ } };
  const SCHEDULES = {
    ds: [
      {start:480,end:580,title:'Interfaces Web',place:'Bloco A · Lab 02',building:'blocoa',type:'aula'},
      {start:660,end:720,title:'Orientação de Projeto',place:'Bloco B · Lab 07',building:'blocob',type:'projeto'},
      {start:810,end:900,title:'Banco de Dados',place:'Bloco A · Lab 04',building:'blocoa',type:'aula'},
      {start:920,end:970,title:'Projeto Integrador',place:'Laboratório Maker',building:'maker',type:'projeto'}
    ],
    eletrica: [
      {start:480,end:580,title:'Circuitos Elétricos',place:'Bloco A · Sala 05',building:'blocoa',type:'aula'},
      {start:660,end:720,title:'Projeto de Instalações',place:'Bloco B · Lab 07',building:'blocob',type:'projeto'},
      {start:810,end:900,title:'Comandos Elétricos',place:'Laboratório Maker',building:'maker',type:'aula'},
      {start:920,end:970,title:'Projeto Integrador',place:'Bloco A · Sala 04',building:'blocoa',type:'projeto'}
    ],
    design: [
      {start:480,end:580,title:'Fundamentos de UX',place:'Bloco A · Lab 02',building:'blocoa',type:'aula'},
      {start:660,end:720,title:'Identidade Visual',place:'Bloco B · Lab 07',building:'blocob',type:'projeto'},
      {start:810,end:900,title:'Interfaces Digitais',place:'Bloco A · Lab 04',building:'blocoa',type:'aula'},
      {start:920,end:970,title:'Projeto de Marca',place:'Laboratório Maker',building:'maker',type:'projeto'}
    ]
  };
  const OPPORTUNITIES = [
    {id:'oficina-ia',type:'evento',title:'Oficina rápida: IA aplicada',desc:'Uma atividade prática para experimentar ideias com inteligência artificial.',tags:['IA','Projetos'],interests:['ia','projetos'],courses:['ds','design','eletrica'],date:'Hoje · 10:25',start:625,end:645,building:'biblioteca',place:'Biblioteca',priority:5},
    {id:'vaga-frontend',type:'estagio',title:'Estágio em desenvolvimento web',desc:'Experiência inicial em interfaces, lógica e produtos digitais.',tags:['Desenvolvimento','Carreira'],interests:['carreira','ia'],courses:['ds'],date:'Inscrições até 12/11',building:'blocoa',place:'Candidatura online',priority:4},
    {id:'vaga-eletrica',type:'estagio',title:'Estágio técnico em manutenção',desc:'Acompanhamento de rotinas de manutenção e instalações.',tags:['Eletrotécnica','Carreira'],interests:['carreira','robotica'],courses:['eletrica'],date:'Inscrições até 13/11',building:'blocoa',place:'Candidatura online',priority:4},
    {id:'vaga-design',type:'estagio',title:'Estágio em design de interfaces',desc:'Apoio a pesquisa de UX, protótipos e sistemas visuais.',tags:['Design','Carreira'],interests:['carreira','design'],courses:['design'],date:'Inscrições até 14/11',building:'blocoa',place:'Candidatura online',priority:4},
    {id:'plantao-cv',type:'evento',title:'Plantão de currículo e portfólio',desc:'Uma conversa prática sobre como apresentar seus projetos.',tags:['Carreira','Orientação'],interests:['carreira'],courses:['ds','eletrica','design'],date:'Hoje · 12:20',start:740,end:770,building:'blocoa',place:'Bloco A',priority:3},
    {id:'mostra-projetos',type:'evento',title:'Mostra de projetos estudantis',desc:'Compartilhe seu projeto e conheça ideias de outras turmas.',tags:['Projetos','Comunidade'],interests:['projetos','design','robotica'],courses:['ds','eletrica','design'],date:'Hoje · 15:00',start:900,end:915,building:'maker',place:'Laboratório Maker',priority:2},
    {id:'vaga-suporte',type:'estagio',title:'Estágio em suporte e tecnologia',desc:'Apoio a usuários e resolução de problemas tecnológicos.',tags:['Tecnologia','Carreira'],interests:['carreira'],courses:['ds','eletrica'],date:'Inscrições até 18/11',building:'blocoa',place:'Candidatura online',priority:2}
  ];
  const ANNOUNCEMENTS = [
    {id:'a1',title:'Confira os horários da próxima semana',text:'A grade de demonstração foi atualizada para o planejamento de atividades.',priority:'Importante',date:'Hoje · 09:10',icon:'▦'},
    {id:'a2',title:'Inscrições fictícias para projetos estudantis',text:'Acompanhe as oportunidades de participação em projetos interdisciplinares.',priority:'Oportunidade',date:'Ontem · 16:40',icon:'✳'},
    {id:'a3',title:'Orientação de portfólio para estágio',text:'Organize seus projetos e experiências antes de processos seletivos.',priority:'Carreira',date:'Ontem · 14:00',icon:'↗'}
  ];
  const BUILDINGS = {
    entrada:{title:'Entrada',desc:'Ponto de partida do trajeto simulado.',icon:'↗',path:'M80 430'},
    blocoa:{title:'Bloco A',desc:'Salas de aula e espaços de apoio ilustrativos.',icon:'▦',path:'M80 430 H300 V385'},
    blocob:{title:'Bloco B',desc:'Laboratório 07, destino da próxima atividade demonstrativa.',icon:'◇',path:'M80 430 H280 V300 H470'},
    maker:{title:'Laboratório Maker',desc:'Espaço conceitual para projetos e atividades práticas.',icon:'⚙',path:'M80 430 H280 V300 H485 V155 H627'},
    biblioteca:{title:'Biblioteca',desc:'Espaço ilustrativo de estudo e oficina de IA.',icon:'▤',path:'M80 430 H280 V300 H222 V155'}
  };
  const state = {
    course:'ds', minute:620, interests:new Set(['ia','carreira']), saved:new Set(safeRead('nexo-campus-saved',[])),
    read:new Set(safeRead('nexo-campus-read',[])), notifRead:safeRead('nexo-campus-notif-read',false),
    filter:'todas', map:'blocob', radarAction:'oportunidades', radarTarget:'oficina-ia', view:'inicio', tourStep:0
  };
  const courseSelect = $('courseSelect');
  const schedule = () => SCHEDULES[state.course];
  const currentSession = () => schedule().find(x => state.minute >= x.start && state.minute < x.end);
  const nextSession = () => schedule().find(x => x.start > state.minute);
  const relevant = o => o.courses.includes(state.course);
  const opportunityScore = o => (o.interests.some(i=>state.interests.has(i)) ? 20:0) + o.priority + (o.type==='estagio' && state.interests.has('carreira') ? 8:0);
  const matches = o => o.interests.some(i=>state.interests.has(i));

  function setView(name) {
    if (!$$('.app-view').some(v=>v.dataset.view===name)) name='inicio';
    state.view=name;
    $$('.app-view').forEach(v=>v.classList.toggle('is-visible',v.dataset.view===name));
    $$('.nav-item').forEach(b=>{ const on=b.dataset.nav===name;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    history.replaceState(null,'','#'+name);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function sessionRow(s) {
    const now=state.minute>=s.start && state.minute<s.end;
    return `<div class="agenda-row ${now?'current':''}"><span class="agenda-time">${fmt(s.start)}</span><span class="agenda-dot"></span><div><strong>${s.title}</strong><p>${s.place} · Até ${fmt(s.end)}</p></div><button type="button" data-map="${s.building}">Ver mapa ↗</button></div>`;
  }
  function renderAgenda() {
    $('homeAgenda').innerHTML=schedule().slice(0,3).map(sessionRow).join('');
    $('fullAgenda').innerHTML=schedule().map(sessionRow).join('');
    const progress=Math.max(0,Math.min(100,Math.round((state.minute-480)/(1020-480)*100)));
    $('dayProgress').textContent=progress+'%';$('dayProgressBar').style.width=progress+'%';
  }
  function renderHomeOpportunities() {
    const list=OPPORTUNITIES.filter(relevant).sort((a,b)=>opportunityScore(b)-opportunityScore(a)).slice(0,2);
    $('homeOpportunities').innerHTML=list.map(o=>`<div class="opportunity-mini"><span class="opportunity-mini-icon">${o.type==='estagio'?'↗':'✳'}</span><div><strong>${o.title}</strong><p>${o.desc}</p><small>${o.date} ↗</small></div></div>`).join('');
  }
  function renderNextClass() {
    const active=currentSession(),n=active || nextSession();
    $('nextClassTime').textContent=n?fmt(n.start):'✓';
    $('nextClassTitle').textContent=n?n.title:'Atividades concluídas';
    $('nextClassPlace').textContent=n?n.place:'Que tal conferir as oportunidades?';
    $('nextClassCountdown').textContent=active?'Acontecendo agora':n?`Em ${n.start-state.minute} min`:'Fim da agenda';
    $('clockMain').textContent=fmt(state.minute);$('timeSlider').value=String(state.minute);$('timeSliderLabel').textContent=fmt(state.minute);
  }
  function recommendation() {
    const active=currentSession(),next=nextSession();
    const gap=active?0:next?Math.max(0,next.start-state.minute):Math.max(0,1020-state.minute);
    if(active) return {title:'Sua atividade está acontecendo agora.',desc:`Você está em ${active.title}. Depois, o Senai Campus encontra a próxima oportunidade compatível com sua rotina.`,free:'Em aula',next:next?fmt(next.start):'—',where:active.place,action:'agenda',target:active.building,button:'Ver minha agenda'};
    const event=OPPORTUNITIES.filter(o=>o.type==='evento' && relevant(o) && o.start>=state.minute && o.end<=state.minute+gap && matches(o)).sort((a,b)=>a.start-b.start)[0];
    if(event && gap>=20) return {title:event.id==='oficina-ia'?`Você tem ${gap} minutos livres. Que tal uma oficina de IA?`:`Você tem ${gap} minutos livres. Uma atividade combina com você.`,desc:`${event.title} começa às ${fmt(event.start)} na ${event.place}. Cabe antes da sua próxima aula e combina com seus interesses.`,free:gap+' min',next:next?fmt(next.start):'—',where:event.place,action:'mapa',target:event.building,button:'Encontrar no mapa'};
    if(next && gap<=20) return {title:`Sua próxima atividade começa em ${gap} minutos.`,desc:`${next.title} acontece em ${next.place}. É um bom momento para se orientar e chegar com tranquilidade.`,free:gap+' min',next:fmt(next.start),where:next.place,action:'mapa',target:next.building,button:'Como chegar'};
    const job=OPPORTUNITIES.filter(o=>o.type==='estagio'&&relevant(o)).sort((a,b)=>opportunityScore(b)-opportunityScore(a))[0];
    if(job && state.interests.has('carreira'))return{title:`Uma janela de ${gap} minutos para avançar na carreira.`,desc:`Que tal conhecer a oportunidade “${job.title}”? Você pode salvá-la para analisar depois.`,free:gap+' min',next:next?fmt(next.start):'—',where:'Online',action:'oportunidades',target:job.id,button:'Explorar vagas'};
    return {title:gap>0?`Você tem ${gap} minutos para um próximo passo.`:'Uma pausa também faz parte de aprender.',desc:gap>0?'Explore projetos, comunicados e atividades alinhadas ao seu curso.':'Veja sua agenda e planeje a próxima oportunidade.',free:gap+' min',next:next?fmt(next.start):'—',where:next?next.place:'Campus',action:'oportunidades',target:'',button:'Ver oportunidades'};
  }
  function renderRadar() {
    const r=recommendation();state.radarAction=r.action;state.radarTarget=r.target;
    $('homeRadarTitle').textContent=r.title;$('homeRadarDesc').textContent=r.desc;$('homeRadarMeta').textContent='◷ '+r.free+' • '+(nextSession()?.title || 'Agenda livre');
    $('radarTitle').textContent=r.title;$('radarDescription').textContent=r.desc;$('radarFreeTime').textContent=r.free;$('radarNext').textContent=r.next;$('radarLocation').textContent=r.where;$('radarPrimary').textContent=r.button+' ↗';
    renderNextClass();
  }
  function renderOpportunities() {
    const filtered=OPPORTUNITIES.filter(relevant).filter(o=>state.filter==='todas'||(state.filter==='salvas'?state.saved.has(o.id):o.type===state.filter)).sort((a,b)=>opportunityScore(b)-opportunityScore(a));
    $('savedCount').textContent=state.saved.size;$('opportunityCount').textContent=filtered.length+' resultado'+(filtered.length===1?'':'s');
    $('opportunityList').innerHTML=filtered.length?filtered.map(o=>`<article class="opportunity-card"><div class="opportunity-card-head"><span class="opportunity-type">${o.type==='estagio'?'↗ ESTÁGIO':'✳ EVENTO'}</span><span class="opportunity-deadline">${o.date}</span></div><h3>${o.title}</h3><p>${o.desc}</p><div class="opportunity-tags">${o.tags.map(t=>'<span>'+t+'</span>').join('')}</div><div class="opportunity-card-foot"><small>${o.place}</small><button type="button" class="save-button ${state.saved.has(o.id)?'saved':''}" data-save="${o.id}" aria-pressed="${state.saved.has(o.id)}">${state.saved.has(o.id)?'✓ Salvo':'+ Salvar'}</button></div></article>`).join(''):'<div class="empty-state">Nenhuma oportunidade neste filtro. Experimente outra categoria.</div>';
  }
  function renderAnnouncements() {
    $('announcementList').innerHTML=ANNOUNCEMENTS.map(a=>`<article class="announcement ${state.read.has(a.id)?'read':''}"><div class="announcement-icon">${a.icon}</div><div><div class="announcement-head"><h3>${a.title}</h3><span class="announcement-tag">${a.priority}</span></div><p>${a.text}</p><small>${a.date}</small></div><button type="button" data-read="${a.id}">${state.read.has(a.id)?'✓ Lido':'Marcar como lido'}</button></article>`).join('');
    renderNotifications();
  }
  function renderNotifications() {
    $('notificationCount').textContent=state.notifRead?'':'3';
    $('notificationList').innerHTML=state.notifRead?'<p class="notification-item">Tudo em dia. Nenhuma nova notificação nesta demonstração.</p>':ANNOUNCEMENTS.map(a=>`<div class="notification-item"><strong>${a.title}</strong><p>${a.text}</p><small>${a.date}</small></div>`).join('');
  }
  function selectBuilding(id) {
    if(!BUILDINGS[id])id='blocob';state.map=id;const b=BUILDINGS[id];
    $$('.map-building').forEach(el=>el.classList.toggle('selected',el.dataset.building===id));
    $('mapDetailIcon').textContent=b.icon;$('mapDetailTitle').textContent=b.title;$('mapDetailDesc').textContent=b.desc;$('mapRouteDest').textContent=b.title;
    $('routePath').setAttribute('d',b.path);
  }
  function renderAll(){renderAgenda();renderHomeOpportunities();renderRadar();renderOpportunities();renderAnnouncements();}
  function changeTime(minutes){state.minute=Math.min(1020,Math.max(480,Math.round(minutes/10)*10));renderAll();}
  function sendDemoMessage(text) {
    const value=String(text||'').trim().slice(0,250);if(!value)return;
    appendChat(value,'user');const q=value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    let title,body,action,label;
    const r=recommendation(),next=nextSession()||currentSession(),job=OPPORTUNITIES.filter(o=>o.type==='estagio'&&relevant(o)).sort((a,b)=>opportunityScore(b)-opportunityScore(a))[0];
    if(/livre|agora|fazer|oportunidade.*hoje|tempo/.test(q)){title='Encontrei seu próximo passo ✳';body=r.title+' '+r.desc;action=r.action;label=r.button;}
    else if(/estagio|vaga|trabalho|carreira|emprego/.test(q)){title='Uma oportunidade alinhada ao seu curso';body=job?`No catálogo de demonstração, “${job.title}” combina com o curso selecionado. O prazo ilustrativo é: ${job.date}. Você pode salvar a oportunidade.`:'No momento não há vaga de exemplo para este curso.';action='oportunidades';label='Ver oportunidades';}
    else if(/onde|mapa|sala|bloco|local|chegar/.test(q)){title='Vamos encontrar o caminho ◇';body=next?`Sua atividade é “${next.title}”, em ${next.place}. O mapa mostra uma rota esquemática, não oficial.`:'Selecione um bloco para explorar o mapa conceitual.';action='mapa';label='Abrir mapa';}
    else if(/aula|agenda|horario|compromisso|hoje|proxima/.test(q)){title='Sua agenda, sem complicação';body=next?`O próximo compromisso é “${next.title}”, às ${fmt(next.start)}, em ${next.place}.`:'Você não tem mais aulas programadas no dia demonstrativo.';action='agenda';label='Ver agenda';}
    else if(/aviso|mural|comunicado|notificacao/.test(q)){title='Comunicados que importam ◉';body=`Existem ${ANNOUNCEMENTS.length} comunicados ilustrativos. O mais recente é: “${ANNOUNCEMENTS[0].title}”.`;action='mural';label='Abrir comunicados';}
    else {title='Posso conectar sua rotina às oportunidades.';body='Pergunte sobre tempo livre, próxima aula, vagas, comunicados ou localização. Uso apenas os dados simulados desta demonstração.';action='radar';label='Conhecer o Radar';}
    appendChat({title,body,action,label},'assistant');
  }
  async function sendMessage(text) {
    const value = String(text || '').trim().slice(0, 500);
    if (!value || sendingToGemini) return;
    if (!hasGemini) { sendDemoMessage(value); return; }
    sendingToGemini = true;
    $('chatForm').querySelector('button').disabled = true;
    appendChat(value, 'user');
    const waiting = document.createElement('div');
    waiting.className = 'chat-bubble assistant';
    waiting.textContent = 'A SenAI está pensando…';
    $('chatMessages').append(waiting);
    try {
      const context = { course: { ds: 'Desenvolvimento de Sistemas', eletrica: 'Eletrotécnica', design: 'Design Digital' }[state.course], time: fmt(state.minute), interests: [...state.interests] };
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: value, context, history: aiHistory.slice(-6) }), signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || !result.answer) throw new Error(result.error || 'O assistente não respondeu.');
      waiting.remove();
      appendChat({ title: 'SenAI · Gemini ✦', body: result.answer }, 'assistant');
      aiHistory.push({ role: 'user', text: value }, { role: 'model', text: result.answer.slice(0, 500) });
      $('aiStatus').textContent = 'GEMINI ATIVO';
    } catch (error) {
      waiting.remove();
      appendChat({ title: 'Conexão indisponível', body: error.message || 'Não foi possível acessar o Gemini. Tente novamente.' }, 'assistant');
      $('aiStatus').textContent = 'FALHA DE CONEXÃO';
    } finally {
      sendingToGemini = false;
      $('chatForm').querySelector('button').disabled = false;
      $('chatInput').focus();
    }
  }
  async function initializeServices() {
    try {
      const response = await fetch('/api/status', { cache: 'no-store' });
      if (!response.ok) throw new Error('Serviço indisponível');
      const status = await response.json();
      hasGemini = Boolean(status.gemini);
      $('aiStatus').textContent = hasGemini ? 'GEMINI CONFIGURADO' : 'MODO DEMO';
      $('aiStatus').dataset.active = String(hasGemini);
      $('chatModeDescription').textContent = hasGemini ? 'Gemini conectado ao servidor · dados do campus ilustrativos' : 'Respostas demonstrativas · Gemini aguardando chave no servidor';
    } catch {
      $('aiStatus').textContent = 'MODO DEMO';
      $('aiStatus').dataset.active = 'false';
      $('chatModeDescription').textContent = 'Respostas demonstrativas (sem conexão com a API)';
    }
    try {
      const response = await fetch('/api/me', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (data.authenticated && data.student?.name) {
        const first = data.student.name.split(' ')[0].slice(0, 30);
        $('studentName').textContent = first;
        $('profileButton').textContent = data.student.name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
        $('accessEntry').textContent = 'Minha conta ✓';
        $('accessEntry').title = `Domínio institucional: ${data.student.hd}`;
      }
    } catch { /* demo pública independente do login */ }
  }
  function appendChat(content,role){
    const el=document.createElement('div');el.className='chat-bubble '+role;
    if(role==='user'){el.textContent=content;}else{const heading=document.createElement('strong');heading.textContent=content.title;const p=document.createElement('div');p.textContent=content.body;el.append(heading,p);if(content.action){const btn=document.createElement('button');btn.type='button';btn.className='chat-action';btn.textContent=content.label+' ↗';btn.addEventListener('click',()=>{if(content.action==='mapa')selectBuilding((nextSession()||currentSession())?.building||'blocob');setView(content.action);});el.append(btn);}}
    $('chatMessages').append(el);$('chatMessages').scrollTop=$('chatMessages').scrollHeight;
  }
  const tourSteps=[
    {view:'inicio',title:'Tudo começa no seu dia.',text:'O Senai Campus coloca próximo compromisso e a recomendação mais útil já na tela inicial.'},
    {view:'radar',title:'Aqui está o diferencial.',text:'O Radar cruza horário, curso e interesses para sugerir uma ação que cabe na agenda. Mude os sinais e veja a resposta.'},
    {view:'oportunidades',title:'O futuro aparece no caminho.',text:'Estágios e eventos são filtráveis e podem ser salvos, sempre identificados como exemplos.'},
    {view:'mapa',title:'Da informação ao lugar.',text:'Um toque leva ao mapa esquemático, fechando o ciclo entre recomendação e ação.'},
    {view:'assistente',title:'E tudo pode começar com uma pergunta.',text:'Pergunte sobre agenda, vagas, locais ou tempo livre. O assistente conecta os mesmos dados da plataforma.'}
  ];
  function showTourStep(){const s=tourSteps[state.tourStep];setView(s.view);$('tourStepLabel').textContent=(state.tourStep+1)+' DE '+tourSteps.length;$('tourTitle').textContent=s.title;$('tourText').textContent=s.text;$('nextTour').textContent=state.tourStep===tourSteps.length-1?'Concluir tour ✓':'Próximo passo ↗';$('tourOverlay').hidden=false;}
  function closeTour(){$('tourOverlay').hidden=true;}
  function openNotification(){const pop=$('notificationPopover');pop.hidden=!pop.hidden;$('notificationButton').setAttribute('aria-expanded',String(!pop.hidden));}

  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-nav],[data-open]');if(nav){setView(nav.dataset.nav||nav.dataset.open);if(nav.dataset.open==='mapa')selectBuilding((nextSession()||currentSession())?.building||'blocob');return;}
    const save=e.target.closest('[data-save]');if(save){const id=save.dataset.save;state.saved.has(id)?state.saved.delete(id):state.saved.add(id);safeWrite('nexo-campus-saved',[...state.saved]);renderOpportunities();return;}
    const read=e.target.closest('[data-read]');if(read){state.read.add(read.dataset.read);safeWrite('nexo-campus-read',[...state.read]);renderAnnouncements();return;}
    const map=e.target.closest('[data-map]');if(map){selectBuilding(map.dataset.map);setView('mapa');return;}
    const prompt=e.target.closest('[data-prompt]');if(prompt){setView('assistente');sendMessage(prompt.dataset.prompt);return;}
    if(!e.target.closest('#notificationPopover,#notificationButton') && !$('notificationPopover').hidden){$('notificationPopover').hidden=true;$('notificationButton').setAttribute('aria-expanded','false');}
  });
  courseSelect.addEventListener('change',e=>{state.course=e.target.value;state.filter='todas';$$('.filter-pill').forEach(b=>b.classList.toggle('active',b.dataset.filter==='todas'));renderAll();});
  $$('.clock-next').forEach(b=>b.addEventListener('click',()=>changeTime(state.minute+30)));
  $$('.clock-prev').forEach(b=>b.addEventListener('click',()=>changeTime(state.minute-30)));
  $('timeSlider').addEventListener('input',e=>changeTime(Number(e.target.value)));
  $$('.interest-options input').forEach(input=>input.addEventListener('change',()=>{state.interests=new Set($$('.interest-options input:checked').map(x=>x.value));renderAll();}));
  $('recalculateRadar').addEventListener('click',renderRadar);
  $('radarPrimary').addEventListener('click',()=>{if(state.radarAction==='mapa')selectBuilding(state.radarTarget);setView(state.radarAction);});
  $$('.filter-pill').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;$$('.filter-pill').forEach(x=>x.classList.toggle('active',x===b));renderOpportunities();}));
  $$('.map-building').forEach(g=>{g.addEventListener('click',()=>selectBuilding(g.dataset.building));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectBuilding(g.dataset.building);}});});
  $('chatForm').addEventListener('submit',e=>{e.preventDefault();const value=$('chatInput').value;$('chatInput').value='';sendMessage(value);});
  $('notificationButton').addEventListener('click',openNotification);
  $('clearNotifications').addEventListener('click',()=>{state.notifRead=true;safeWrite('nexo-campus-notif-read',true);renderNotifications();});
  $('profileButton').addEventListener('click',()=>{setView('inicio');$('profileButton').title='Gabriel · Perfil fictício de demonstração';});
  $('startTour').addEventListener('click',()=>{state.tourStep=0;showTourStep();});
  $('endTour').addEventListener('click',closeTour);
  $('nextTour').addEventListener('click',()=>{state.tourStep++;if(state.tourStep>=tourSteps.length){closeTour();setView('radar');}else showTourStep();});
  $('tourOverlay').addEventListener('click',e=>{if(e.target===$('tourOverlay'))closeTour();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeTour();$('notificationPopover').hidden=true;}});
  renderAll();selectBuilding('blocob');appendChat({title:'Oi, Gabriel! Eu sou a SenAI. ✳',body:'Sou a assistente experimental do Senai Campus. Posso conectar sua agenda ilustrativa às oportunidades da demonstração e conversar sobre estudos. Quer descobrir o que fazer com seu tempo livre?',action:'radar',label:'Descobrir meu próximo passo'},'assistant');
  initializeServices();
  const hash=location.hash.slice(1);if($$('.app-view').some(v=>v.dataset.view===hash))setView(hash);
  if(new URLSearchParams(location.search).get('tour')==='1'){state.tourStep=0;showTourStep();}
})();
