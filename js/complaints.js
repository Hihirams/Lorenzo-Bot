const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));
const showToast = (msg, ms = 2500) => {
  const t = $('#toast'); if(!t) return;
  t.textContent = msg; t.setAttribute('show','');
  setTimeout(()=> t.removeAttribute('show'), ms);
};
const setStatus = (msg, kind = "ok") => {
  const el = $('#statusMsg'); if(!el) return;
  el.textContent = msg || "";
  el.style.color = kind==="ok" ? "#22c55e" : kind==="warn" ? "#f59e0b" : "#ef4444";
};

const modal = $('#complaintsModal');
const openBtn = $('#openComplaintsBtn');
const closeBtn = $('#closeComplaintsBtn');
const form = $('#complaintsForm');
if (!modal || !openBtn || !closeBtn || !form) {
  console.warn('[Complaints] Falta markup del modal/botón.');
} else {
  const openModal = () => {
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    $('#tipo').focus();
    trapFocus(modal);
  };
  const closeModal = () => {
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    releaseFocus();
  };
  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
  window.addEventListener('keydown', e => { if(e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal(); });

  let prevFocus = null, focusNodes = [];
  function trapFocus(container){
    prevFocus = document.activeElement;
    const sels = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    focusNodes = $$(sels, container).filter(n => !n.hasAttribute('disabled'));
    if(focusNodes.length){ focusNodes[0].focus(); }
    document.addEventListener('keydown', handleTab);
  }
  function handleTab(e){
    if(modal.getAttribute('aria-hidden') === 'true') { document.removeEventListener('keydown', handleTab); return; }
    if(e.key !== 'Tab') return;
    const first = focusNodes[0], last = focusNodes[focusNodes.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
  function releaseFocus(){ if(prevFocus) prevFocus.focus(); document.removeEventListener('keydown', handleTab); }

  const asunto = $('#asunto'), descripcion = $('#descripcion');
  const asuntoCount = $('#asuntoCount'), descCount = $('#descCount');
  const LS_KEY = 'complaintDraft_v1';

  const updateCounts = () => {
    if(asuntoCount) asuntoCount.textContent = (asunto.value || '').length;
    if(descCount) descCount.textContent = (descripcion.value || '').length;
  };
  asunto.addEventListener('input', updateCounts);
  descripcion.addEventListener('input', updateCounts);

  const saveDraft = () => {
    const data = getFormData(false);
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  };
  const loadDraft = () => {
    const raw = localStorage.getItem(LS_KEY); if(!raw) return;
    try{
      const d = JSON.parse(raw);
      for(const [k,v] of Object.entries(d)){
        if(k==='adjuntoBase64' || k==='adjuntoNombre' || k==='adjuntoMime') continue;
        const el = form.elements[k];
        if(el) el.value = v;
      }
      $('#consent').checked = !!d.consent;
      updateCounts();
    }catch{}
  };
  const clearDraft = () => localStorage.removeItem(LS_KEY);

  form.addEventListener('input', e => { if(e.target && e.target.name) saveDraft(); });
  $('#btnBorrarBorrador').addEventListener('click', () => {
    clearDraft(); form.reset(); updateCounts(); setStatus("Borrador eliminado.", "warn");
  });

  function setError(name, msg){
    const holder = document.querySelector(`[data-error-for="${name}"]`);
    if(holder) holder.textContent = msg || '';
  }
  function clearErrors(){
    $$('.error').forEach(e => e.textContent = '');
    setStatus('');
  }
  function validate(){
    clearErrors();
    let ok = true;
    const required = [
      ['tipo','Selecciona el tipo.'],
      ['severidad','Selecciona la severidad.'],
      ['asunto','Escribe un asunto.'],
      ['descripcion','Describe el detalle.'],
    ];
    required.forEach(([name,msg])=>{
      const el = form.elements[name];
      if(!el || !String(el.value).trim()){ setError(name,msg); ok=false; }
    });
    const email = $('#email').value.trim();
    if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ setError('email','Correo no válido.'); ok=false; }
    const f = $('#adjunto').files?.[0];
    if(f && f.size > 5*1024*1024){ setError('adjunto','Máximo 5 MB.'); ok=false; }
    if(!$('#consent').checked){ setError('consent','Debes aceptar para continuar.'); ok=false; }
    return ok;
  }

  function getFormData(withFile = true){
    const data = {
      tipo: $('#tipo').value.trim(),
      severidad: $('#severidad').value.trim(),
      modulo: $('#modulo').value.trim(),
      email: $('#email').value.trim(),
      asunto: $('#asunto').value.trim(),
      descripcion: $('#descripcion').value.trim(),
      consent: $('#consent').checked,
      userAgent: navigator.userAgent,
      url: location.href,
      ts: new Date().toISOString(),
    };
    if(!withFile) return data;
    const f = $('#adjunto').files?.[0];
    return new Promise((resolve)=>{
      if(!f){ resolve(data); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = String(reader.result).split(',')[1] || '';
        resolve({...data, adjuntoBase64: base64, adjuntoNombre: f.name, adjuntoMime: f.type});
      };
      reader.readAsDataURL(f);
    });
  }

async function sendData(){
  const basic = {
    tipo: $('#tipo').value.trim(),
    severidad: $('#severidad').value.trim(),
    modulo: $('#modulo').value.trim(),
    email: $('#email').value.trim(),
    asunto: $('#asunto').value.trim(),
    descripcion: $('#descripcion').value.trim(),
    consent: $('#consent').checked,
    userAgent: navigator.userAgent,
    url: location.href,
    ts: new Date().toISOString(),
  };

  const file = document.querySelector('#adjunto')?.files?.[0] || null;

  if (typeof window.COMPLAINTS_WEBHOOK === 'string' && window.COMPLAINTS_WEBHOOK.length){
    const isAppsScript = window.COMPLAINTS_WEBHOOK.includes('script.google.com');

    if (isAppsScript){
  // Construimos payload base
  const payload = {
    source: 'complaints-modal@web',
    ...basic
  };

  // Adjuntar archivo como base64 (si existe)
  if (file) {
    const base64 = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1] || '');
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    payload.adjuntoBase64 = base64;
    payload.adjuntoNombre = file.name;
    payload.adjuntoMime   = file.type;
  }

function getSafeWebhookUrl(raw){
  if (typeof raw !== 'string') return '';
  let u = raw.trim();
  u = u.replace(/^hhttps:\/\//i, 'https://')
       .replace(/^http s:\/\//i, 'https://')
       .replace(/^http:\/\//i, 'https://');
  return u;
}
// y luego:
const webhook = getSafeWebhookUrl(window.COMPLAINTS_WEBHOOK);


  // 👇 Enviar como x-www-form-urlencoded para evitar preflight CORS
  const res = await fetch(window.COMPLAINTS_WEBHOOK, {
    method: 'POST',
    body: new URLSearchParams(payload)    // ← sin headers
  });

  // Apps Script retorna JSON (tu doPost lo hace)
  let j = {};
  try { j = await res.json(); } catch(_) {}

  console.log('AppsScript result:', j);
  if (!res.ok || (j && j.ok === false)) {
    throw new Error('Webhook devolvió error');
  }
  return 'webhook';
}

  }

  const to = (basic.email && basic.email.endsWith('@empresa.com')) ? basic.email : 'soporte@empresa.com';
  const subject = encodeURIComponent(`[${basic.tipo} | ${basic.severidad}] ${basic.asunto}`);
  const bodyLines = [
    `Tipo: ${basic.tipo}`,
    `Severidad: ${basic.severidad}`,
    `Módulo: ${basic.modulo || '(no especificado)'}`,
    `Correo usuario: ${basic.email || '(no proporcionado)'}`,
    `Fecha: ${basic.ts}`,
    `URL: ${basic.url}`,
    `User-Agent: ${basic.userAgent}`,
    '',
    'Descripción:',
    basic.descripcion
  ];
  const body = encodeURIComponent(bodyLines.join('\n'));
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  return 'mailto';
}


  $('#btnPreview').addEventListener('click', async ()=>{
    if(!validate()){ showToast('Revisa los campos en rojo.'); return; }
    const d = await getFormData(false);
    const resumen = [
      `Tipo: ${d.tipo}`,
      `Severidad: ${d.severidad}`,
      `Módulo: ${d.modulo || '(no especificado)'}`,
      `Asunto: ${d.asunto}`,
      `Correo: ${d.email || '(no proporcionado)'}`,
      '',
      d.descripcion
    ].join('\n');
    navigator.clipboard.writeText(resumen).catch(()=>{});
    showToast('Previsualización copiada.');
    setStatus('Se copió un resumen al portapapeles.', 'ok');
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(!validate()){ showToast('Revisa los campos en rojo.'); return; }
    $('#btnEnviar').setAttribute('disabled','');
    setStatus('Enviando…', 'warn');
    try{
      const via = await sendData();
      setStatus(via==='webhook' ? 'Enviado correctamente ✅' : 'Abriendo tu correo ✉️', 'ok');
      showToast('Gracias por tu reporte.');
      localStorage.removeItem(LS_KEY); form.reset(); updateCounts();
      setTimeout(()=> { modal && modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }, 300);
    }catch(err){
      console.error(err);
      setStatus('No se pudo enviar. Intenta de nuevo o usa el correo.', 'error');
      showToast('Error al enviar.');
    }finally{
      $('#btnEnviar').removeAttribute('disabled');
    }
  });

  loadDraft(); updateCounts();
}
