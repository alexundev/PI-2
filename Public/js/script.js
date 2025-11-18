// --- Utilitários ---
const $ = id => document.getElementById(id);
const toIsoDate = d => d.toISOString().slice(0,10);
// Define data mínima para hoje
const today = new Date();
$('date').setAttribute('min', toIsoDate(today));

// Duração dos serviços (minutos)
const DURATIONS = {
  corte:40, coloracao:90, mechas:120, hidrata:60, escova:45
};

// Simula horários de funcionamento (9:00 - 18:00) e bloqueios
function generateTimeSlots(dateStr, duration){
  const [y,m,d] = dateStr.split('-').map(Number);
  const base = new Date(y,m-1,d,9,0);
  const end = new Date(y,m-1,d,18,0);
  const slots = [];
  while(base.getTime() + duration*60000 <= end.getTime()){
    const h = base.getHours().toString().padStart(2,'0');
    const min = base.getMinutes().toString().padStart(2,'0');
    slots.push(`${h}:${min}`);
    base.setMinutes(base.getMinutes() + 30); // intervalos de 30min
  }
  // Remover horários já ocupados na nossa "base local"
  const taken = getAppointments().filter(a => a.date === dateStr).map(a => a.time);
  return slots.filter(s => !taken.includes(s));
}

// LocalStorage: armazenar agendamentos
function getAppointments(){
  try{
    return JSON.parse(localStorage.getItem('elite_hair_appts')||'[]');
  }catch(e){return []}
}
function saveAppointment(appt){
  const arr = getAppointments();
  arr.push(appt);
  localStorage.setItem('elite_hair_appts', JSON.stringify(arr));
}
function removeAppointment(index){
  const arr = getAppointments();
  arr.splice(index,1);
  localStorage.setItem('elite_hair_appts', JSON.stringify(arr));
}

// Render mini agenda
function renderMiniAgenda(){
  const container = $('miniAgenda');
  const list = $('apptsList');
  const arr = getAppointments();
  list.innerHTML = '';
  if(arr.length===0){list.innerHTML='<div class="small">Nenhum agendamento.</div>';}
  arr.forEach((a,i)=>{
    const div = document.createElement('div'); div.className='appt';
    div.innerHTML = `<div>
      <div><strong>${a.name}</strong> — <span class="small">${a.serviceLabel}</span></div>
      <div class="small">${a.date} • ${a.time}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
      <button class="btn secondary" data-index="${i}" onclick="downloadICS(${i})">Adicionar</button>
      <button class="btn secondary" data-index="${i}" onclick="cancelAppt(${i})">Cancelar</button>
    </div>`;
    list.appendChild(div);
  });
}

window.cancelAppt = function(i){
  if(!confirm('Deseja cancelar este agendamento?')) return;
  removeAppointment(i); renderMiniAgenda(); alert('Agendamento cancelado.');
}

// Gerar arquivo .ics simples
function buildICS(appt){
  const dtStart = appt.date.replace(/-/g,'') + 'T' + appt.time.replace(':','') + '00';
  // assume timezone local, para demo
  const dtEnd = new Date(appt.date + 'T' + appt.time + ':00');
  dtEnd.setMinutes(dtEnd.getMinutes() + appt.duration);
  const dtEndStr = dtEnd.toISOString().replace(/-|:|\.\d+/g,'');
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${encodeURIComponent('Agendamento - '+appt.serviceLabel)}\nDTSTART:${dtStart}\nDTEND:${dtEndStr}\nDESCRIPTION:${encodeURIComponent('Nome: '+appt.name+'\\nObs: '+(appt.notes||''))}\nEND:VEVENT\nEND:VCALENDAR`;
  return ics;
}

function downloadICS(i){
  const arr = getAppointments();
  const appt = arr[i];
  const ics = buildICS(appt);
  const blob = new Blob([ics],{type:'text/calendar'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = `agendamento_${appt.date}_${appt.time.replace(':','')}.ics`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// Map label
const SERVICE_LABELS = {
  corte:'Corte', coloracao:'Coloração', mechas:'Mechas', hidrata:'Hidratação', escova:'Escova'
};

// UI handlers
const timesContainer = $('timesContainer');
$('service').addEventListener('change',()=>{
  updateTimes();
});
$('date').addEventListener('change',()=>{
  updateTimes();
});

function updateTimes(){
  const service = $('service').value;
  const date = $('date').value;
  $('time').value = '';
  timesContainer.innerHTML = '';
  if(!service || !date) return;
  const duration = DURATIONS[service]||45;
  const slots = generateTimeSlots(date,duration);
  if(slots.length===0){ timesContainer.innerHTML = '<div class="small">Nenhum horário disponível nessa data. Tente outro dia.</div>'; return; }
  slots.slice(0,12).forEach(s=>{
    const btn = document.createElement('button'); btn.type='button'; btn.textContent = s; btn.addEventListener('click', ()=>{
      document.querySelectorAll('#timesContainer button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); $('time').value = s;
    });
    timesContainer.appendChild(btn);
  });
}

// Form submit
$('bookingForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const service = $('service').value; if(!service){alert('Escolha um serviço.'); return}
  const date = $('date').value; if(!date){alert('Escolha uma data.'); return}
  const time = $('time').value; if(!time){alert('Selecione um horário.'); return}
  const name = $('name').value.trim(); if(!name){alert('Informe seu nome.'); return}
  const phone = $('phone').value.trim();
  const notes = $('notes').value.trim();
  // Checar conflito simples
  const exists = getAppointments().some(a=>a.date===date && a.time===time);
  if(exists){alert('Horário já reservado. Escolha outro.'); updateTimes(); return}

  const appt = {service,serviceLabel:SERVICE_LABELS[service]||service,date,time,name,phone,notes,duration:DURATIONS[service]||45,createdAt:new Date().toISOString()};
  saveAppointment(appt);
  renderMiniAgenda();
  // criar link mailto com resumo (demo)
  const subject = encodeURIComponent('Confirmação de agendamento - Studio Bella');
  const body = encodeURIComponent(`Olá ${name},\\nSeu agendamento foi confirmado:\\nServiço: ${appt.serviceLabel}\\nData: ${date}\\nHorário: ${time}\\n\\nObrigado!`);
  // show success
  alert('Agendamento confirmado! Um link para adicionar ao seu calendário foi criado.');
  // auto-download do ICS
  const ics = buildICS(appt);
  const blob = new Blob([ics],{type:'text/calendar'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = `agendamento_${date}_${time.replace(':','')}.ics`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  // limpar form parcialmente
  $('time').value = '';
  document.querySelectorAll('#timesContainer button').forEach(b=>b.classList.remove('active'));
});

// clear
$('clearBtn').addEventListener('click', ()=>{document.getElementById('bookingForm').reset(); timesContainer.innerHTML=''; $('date').setAttribute('min', toIsoDate(new Date()));});

// show/hide agenda
$('verAgendaBtn').addEventListener('click', ()=>{
  const mini = $('miniAgenda'); mini.style.display = mini.style.display === 'none' ? 'block' : 'none'; renderMiniAgenda();
});
$('verHorariosBtn').addEventListener('click', ()=>{ const s = $('service').value||'corte'; $('service').value=s; const d = toIsoDate(new Date()); $('date').value = d; updateTimes(); window.scrollTo({top:document.getElementById('timesContainer').offsetTop,behavior:'smooth'});});

// init render
renderMiniAgenda();