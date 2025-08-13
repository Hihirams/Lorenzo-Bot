    const logEl = document.getElementById('log');
    const quick = document.getElementById('quickbar');

    const THEME_KEY = 'lorenzo-theme';
    function getPreferredTheme(){
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    function applyTheme(theme){
      document.documentElement.setAttribute('data-theme', theme);
      const btn = document.getElementById('themeToggleBtn');
      if (btn) btn.setAttribute('aria-pressed', theme === 'light');
    }
    let currentTheme = getPreferredTheme();
    applyTheme(currentTheme);
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e)=>{
      const saved = localStorage.getItem(THEME_KEY);
      if (!saved){
        currentTheme = e.matches ? 'light' : 'dark';
        applyTheme(currentTheme);
      }
    });
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn){
      themeBtn.addEventListener('click', ()=>{
        currentTheme = (document.documentElement.getAttribute('data-theme') === 'light') ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, currentTheme);
        applyTheme(currentTheme);
      });
    }
    document.documentElement.style.colorScheme = 'dark light';

    function setVh(){ document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`) }
    setVh(); window.addEventListener('resize', setVh);

   function addMsg(text, who='bot'){
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (who === 'me' ? 'me' : 'bot');
  wrap.textContent = text;
  const meta = document.createElement('small');
  meta.textContent = (who==='me' ? i18n[currentLang].me_you : i18n[currentLang].bot) + ' · ' + new Date().toLocaleTimeString();
  wrap.appendChild(meta);
  logEl.appendChild(wrap);
  logEl.scrollTop = logEl.scrollHeight;
  return wrap;
}
function addHtml(html, who='bot'){
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (who === 'me' ? 'me' : 'bot');
  wrap.innerHTML = html;
  const meta = document.createElement('small');
  meta.textContent = (who==='me' ? i18n[currentLang].me_you : i18n[currentLang].bot) + ' · ' + new Date().toLocaleTimeString();
  wrap.appendChild(meta);
  logEl.appendChild(wrap);
  logEl.scrollTop = logEl.scrollHeight;
  return wrap;
}

    function addTyping(){
  const d = document.createElement('div');
  d.className = 'msg bot';
  d.innerHTML = `<span class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span><small>${i18n[currentLang].typing}</small>`;
  logEl.appendChild(d);
  logEl.scrollTop = logEl.scrollHeight;
  return d;
}

function renderNode(nodeKey){
  currentNode = nodeKey;
  const node = flows[currentLang][nodeKey];
  const typing = addTyping();
  setTimeout(()=>{
    typing.remove();
    const box = addHtml(node.text.replace(/\n/g, '<br>'), 'bot');
    const opts = renderOptions(nodeKey);
    box.dataset.nodeKey = nodeKey;
    box.appendChild(opts);
  }, 350);
}


const LANG_KEY = 'lorenzo-lang';
let currentLang = localStorage.getItem(LANG_KEY) || 'es';

const i18n = {
  es: {
    title: "Lorenzo SharePoint Helper",
    subtitle: "Asistente de SharePoint (sin Azure)",
    statusReady: " Listo",
    typing: "bot · escribiendo…",
    footnote: "Funciona 100% local. Sin llamadas a Azure.",
    quick_acceso: "Acceso a sitio",
    quick_archivos: "Archivos",
    quick_sp: "🔙 Volver a SharePoint",
    quick_intranet: "Intranet Denso",
    back: "← Volver",
    restart: "↺ Reiniciar",
    me_you: "tú",
    bot: "bot",
    input_placeholder: "Escribe tu mensaje…",
    send: "Enviar",
    intro: "¡Hola! Soy Lorenzo. Ahora trabajo con un <b>flujo de decisiones</b> sin Azure. Usa los 2 accesos rápidos o navega con los chips dentro del chat."
  },
  en: {
    title: "Lorenzo SharePoint Helper",
    subtitle: "SharePoint Assistant (No Azure)",
    statusReady: " Ready",
    typing: "bot · typing…",
    footnote: "Works 100% locally. No Azure calls.",
    quick_acceso: "Site access",
    quick_archivos: "Files",
    quick_sp: "🔙 Back to SharePoint",
    quick_intranet: "Denso Intranet",
    back: "← Back",
    restart: "↺ Restart",
    me_you: "you",
    bot: "bot",
    input_placeholder: "Type your message…",
    send: "Send",
    intro: "Hi! I’m Lorenzo. I now work with a <b>decision flow</b> without Azure. Use the 2 quick actions or navigate with the chips in chat."
  }
};

function toggleLanguage(){
  currentLang = (currentLang === 'es') ? 'en' : 'es';
  localStorage.setItem(LANG_KEY, currentLang);
  applyLanguage(true);
}

function applyLanguage(rerender=false){
  document.querySelector('.title').textContent = i18n[currentLang].title;
  document.querySelector('.subtitle').textContent = i18n[currentLang].subtitle;

  const statusEl = document.querySelector('.status');
  statusEl.innerHTML = '<span class="pulse" aria-hidden="true"></span>' + i18n[currentLang].statusReady;

  const qBtns = document.querySelectorAll('#quickbar > button');
  if (qBtns[0]) qBtns[0].textContent = i18n[currentLang].quick_acceso;
  if (qBtns[1]) qBtns[1].textContent = i18n[currentLang].quick_archivos;
  if (qBtns[2]) qBtns[2].textContent = i18n[currentLang].quick_sp;
  if (qBtns[3]) qBtns[3].textContent = i18n[currentLang].quick_intranet;

  const input = document.getElementById('q');
  if (input) input.placeholder = i18n[currentLang].input_placeholder;
  const send = document.getElementById('send');
  if (send) send.textContent = i18n[currentLang].send;
  const foot = document.querySelector('.footnote');
  if (foot) foot.textContent = i18n[currentLang].footnote;

  if (rerender) {
    logEl.innerHTML = '';
    addHtml(i18n[currentLang].intro, 'bot');
    renderNode(currentNode || 'inicio');
  }
}

document.getElementById('langToggleBtn')?.addEventListener('click', toggleLanguage);

const flows = {
  es: {
    inicio: {
      text: "¿Qué necesitas?",
      options: [
        { label: "Acceso a un sitio", next: "acceso_sitio" },
        { label: "Permisos a carpeta", next: "perm_carpeta" },
        { label: "Subir / restaurar archivos", next: "archivos" }
      ]
    },
    acceso_sitio: {
      text: "Acceso a sitio: elige una opción",
      options: [
        { label: "Solicitar acceso a propietarios", next: "acceso_solicitar" },
        { label: "Ver si ya tengo permisos", next: "acceso_verificar" },
        { label: "No sé a qué sitio ir", next: "acceso_no_se" }
      ]
    },
    acceso_solicitar: {
      text: "Para solicitar acceso: \n1) Abre el sitio de SharePoint.\n2) Haz clic en 'Solicitar acceso'.\n3) Escribe el motivo.\n¿Qué resultado buscas?",
      options: [
        { label: "Acceso de lectura", next: "fin_generar_ticket" },
        { label: "Acceso de edición", next: "fin_generar_ticket" },
        { label: "Acceso de propietario", next: "fin_propietario" }
      ]
    },
    acceso_verificar: {
      text: "Para verificar permisos: \n• Ve a 'Configuración' → 'Permisos del sitio' → 'Avanzado'. \n• Busca tu usuario. ¿Qué viste?",
      options: [
        { label: "Aparezco como 'Visitante'", next: "fin_ok_lectura" },
        { label: "Estoy en 'Miembros'", next: "fin_ok_edicion" },
        { label: "No aparezco", next: "fin_generar_ticket" }
      ]
    },
    acceso_no_se: {
      text: "Si no sabes el sitio, intenta: \n• Preguntar al dueño del proceso \n• Buscar el equipo en Teams \n• Usar la intranet. ¿Qué quieres hacer?",
      options: [
        { label: "Abrir Intranet Denso", link: "http://nsmx53.nadenso.net/portaldenso/default.aspx" },
        { label: "Volver al inicio", next: "inicio" },
        { label: "Generar ticket", next: "fin_generar_ticket" }
      ]
    },
    perm_carpeta: {
      text: "Permisos a carpeta/biblioteca: elige una acción",
      options: [
        { label: "Dar permisos a alguien", next: "perm_dar" },
        { label: "Quitar permisos", next: "perm_quitar" },
        { label: "Diferencia Miembro vs Propietario", next: "roles" }
      ]
    },
    perm_dar: {
      text: "Para dar permisos: \n1) Abrir la carpeta/biblioteca \n2) 'Administrar acceso' \n3) Otorgar nivel adecuado. ¿Nivel?",
      options: [
        { label: "Lectura", next: "fin_ok_lectura" },
        { label: "Edición", next: "fin_ok_edicion" },
        { label: "Solo enlace temporal", next: "fin_enlace" }
      ]
    },
    perm_quitar: {
      text: "Para quitar permisos: \n• 'Administrar acceso' → 'Avanzado' → 'Interrumpir herencia' si aplica → Quitar usuarios/grupos.\n¿Confirmas?",
      options: [
        { label: "Sí, quitar", next: "fin_quitado" },
        { label: "No, volver", next: "perm_carpeta" },
        { label: "Necesito ayuda", next: "fin_generar_ticket" }
      ]
    },
    archivos: {
      text: "Archivos: ¿qué necesitas?",
      options: [
        { label: "Subir un documento", next: "arch_subir" },
        { label: "Restaurar eliminado", next: "arch_restaurar" },
        { label: "Compartir con externo", next: "externo" }
      ]
    },
    arch_subir: {
      text: "Subir documento: \n• Arrastra el archivo a la biblioteca o usa 'Cargar'.\n• Versiones se guardan automáticamente.\n¿Algo más?",
      options: [
        { label: "Crear carpeta antes", next: "arch_carpeta" },
        { label: "Notificar al equipo", next: "fin_notificar" },
        { label: "No, gracias", next: "fin_listo" }
      ]
    },
    arch_restaurar: {
      text: "Restaurar archivo: \n• Abre 'Papelera de reciclaje' del sitio. \n• Selecciona y 'Restaurar'.\nSi no aparece: segunda papelera (Colección).",
      options: [
        { label: "Ya lo restauré", next: "fin_listo" },
        { label: "No aparece", next: "fin_generar_ticket" },
        { label: "Quiero ver versiones", next: "arch_versiones" }
      ]
    },
    arch_carpeta: {
      text: "Crear carpeta: \n• En la biblioteca, 'Nuevo' → 'Carpeta' → nombre claro.\nConvención: equipo-proyecto-año.",
      options: [
        { label: "Hecho", next: "arch_subir" },
        { label: "No tengo permisos", next: "fin_generar_ticket" },
        { label: "Volver", next: "arch_subir" }
      ]
    },
    arch_versiones: {
      text: "Versiones: \n• Click derecho en el archivo → 'Historial de versiones' → elige 'Restaurar'.",
      options: [
        { label: "Restaurado", next: "fin_listo" },
        { label: "No tengo el menú", next: "fin_generar_ticket" },
        { label: "Volver", next: "arch_restaurar" }
      ]
    },
    externo: {
      text: "Compartir con externo: \n• Ver política de tu organización. \n• Preferir enlaces con expiración.",
      options: [
        { label: "Crear enlace con fecha", next: "fin_enlace" },
        { label: "Agregar por correo", next: "fin_generar_ticket" },
        { label: "Volver al inicio", next: "inicio" }
      ]
    },
    roles: {
      text: "Roles: \n• Visitante = lectura \n• Miembro = edición \n• Propietario = control total.",
      options: [
        { label: "Quiero ser Miembro", next: "fin_generar_ticket" },
        { label: "Quiero ser Propietario", next: "fin_propietario" },
        { label: "Volver al inicio", next: "inicio" }
      ]
    },
    fin_ok_lectura: {
      text: "Listo. Tienes nivel de Lectura. Si necesitas cambiarlo, solicita un ajuste de permisos.",
      options: [
        { label: "Generar ticket", next: "fin_generar_ticket" },
        { label: "Volver al inicio", next: "inicio" },
        { label: "Salir", next: "fin_listo" }
      ]
    },
    fin_ok_edicion: {
      text: "Perfecto. Cuentas con permisos de Edición. Recuerda seguir la convención de nombres y versiones.",
      options: [
        { label: "Ver versiones", next: "arch_versiones" },
        { label: "Volver al inicio", next: "inicio" },
        { label: "Salir", next: "fin_listo" }
      ]
    },
    fin_enlace: {
      text: "Para enlace con expiración: \n• Compartir → 'Cualquiera con el enlace' (si está permitido) → Establecer fecha de vencimiento.",
      options: [
        { label: "Hecho", next: "fin_listo" },
        { label: "No me deja", next: "fin_generar_ticket" },
        { label: "Volver", next: "externo" }
      ]
    },
    fin_quitado: {
      text: "Permisos quitados. Revisa que no queden herencias inesperadas en subcarpetas.",
      options: [
        { label: "Volver al inicio", next: "inicio" },
        { label: "Salir", next: "fin_listo" },
        { label: "Necesito soporte", next: "fin_generar_ticket" }
      ]
    },
    fin_propietario: {
      text: "Rol de Propietario otorga control total. Solo asignar si eres responsable del sitio.",
      options: [
        { label: "Solicitar propietario", next: "fin_generar_ticket" },
        { label: "Volver al inicio", next: "inicio" },
        { label: "Salir", next: "fin_listo" }
      ]
    },
    fin_notificar: {
      text: "Notifica a tu equipo por Teams o correo y pega el enlace del archivo.",
      options: [
        { label: "Volver al inicio", next: "inicio" },
        { label: "Salir", next: "fin_listo" },
        { label: "Abrir Intranet", link: "http://nsmx53.nadenso.net/portaldenso/default.aspx" }
      ]
    },
    fin_generar_ticket: {
      text: "Abre tu canal de soporte/Ticket y describe el problema. Incluye: URL del sitio, carpeta/archivo y permisos deseados.",
      options: [
        { label: "Volver al inicio", next: "inicio" },
        { label: "Salir", next: "fin_listo" },
        { label: "Ver roles", next: "roles" }
      ]
    },
    fin_listo: {
      text: "¡Listo! ¿Deseas hacer otra cosa?",
      options: [
        { label: "Volver al inicio", next: "inicio" },
        { label: "Salir", next: "fin_salir" },
        { label: "Compartir con externo", next: "externo" }
      ]
    },
    fin_salir: { text: "Gracias por usar Lorenzo. Puedes volver cuando quieras.", options: [] }
  },

  en: {
    inicio: {
      text: "What do you need?",
      options: [
        { label: "Access to a site", next: "acceso_sitio" },
        { label: "Folder/library permissions", next: "perm_carpeta" },
        { label: "Upload / restore files", next: "archivos" }
      ]
    },
    acceso_sitio: {
      text: "Site access: choose an option",
      options: [
        { label: "Request access from owners", next: "acceso_solicitar" },
        { label: "Check if I already have access", next: "acceso_verificar" },
        { label: "I don’t know the site", next: "acceso_no_se" }
      ]
    },
    acceso_solicitar: {
      text: "To request access:\n1) Open the SharePoint site.\n2) Click 'Request access'.\n3) Explain the reason.\nWhat do you need?",
      options: [
        { label: "Read access", next: "fin_generar_ticket" },
        { label: "Edit access", next: "fin_generar_ticket" },
        { label: "Owner access", next: "fin_propietario" }
      ]
    },
    acceso_verificar: {
      text: "To check permissions:\n• Go to 'Settings' → 'Site permissions' → 'Advanced'.\n• Look for your user. What did you see?",
      options: [
        { label: "I appear as 'Visitor'", next: "fin_ok_lectura" },
        { label: "I’m in 'Members'", next: "fin_ok_edicion" },
        { label: "I don’t appear", next: "fin_generar_ticket" }
      ]
    },
    acceso_no_se: {
      text: "If you don’t know the site, try:\n• Ask the process owner\n• Search the team in Teams\n• Use the intranet. What do you want to do?",
      options: [
        { label: "Open Denso Intranet", link: "http://nsmx53.nadenso.net/portaldenso/default.aspx" },
        { label: "Back to start", next: "inicio" },
        { label: "Create a ticket", next: "fin_generar_ticket" }
      ]
    },
    perm_carpeta: {
      text: "Folder/library permissions: choose an action",
      options: [
        { label: "Grant permissions", next: "perm_dar" },
        { label: "Remove permissions", next: "perm_quitar" },
        { label: "Member vs Owner", next: "roles" }
      ]
    },
    perm_dar: {
      text: "To grant permissions:\n1) Open the folder/library\n2) 'Manage access'\n3) Give the right level. Which one?",
      options: [
        { label: "Read", next: "fin_ok_lectura" },
        { label: "Edit", next: "fin_ok_edicion" },
        { label: "Temporary link only", next: "fin_enlace" }
      ]
    },
    perm_quitar: {
      text: "To remove permissions:\n• 'Manage access' → 'Advanced' → 'Stop inheritance' if needed → Remove users/groups.\nConfirm?",
      options: [
        { label: "Yes, remove", next: "fin_quitado" },
        { label: "No, back", next: "perm_carpeta" },
        { label: "I need help", next: "fin_generar_ticket" }
      ]
    },
    archivos: {
      text: "Files: what do you need?",
      options: [
        { label: "Upload a document", next: "arch_subir" },
        { label: "Restore deleted file", next: "arch_restaurar" },
        { label: "Share with external", next: "externo" }
      ]
    },
    arch_subir: {
      text: "Upload a document:\n• Drag it to the library or click 'Upload'.\n• Versions are saved automatically.\nAnything else?",
      options: [
        { label: "Create folder first", next: "arch_carpeta" },
        { label: "Notify the team", next: "fin_notificar" },
        { label: "No, thanks", next: "fin_listo" }
      ]
    },
    arch_restaurar: {
      text: "Restore a file:\n• Open the site 'Recycle bin'.\n• Select and 'Restore'.\nIf it’s not there, try the site collection recycle bin.",
      options: [
        { label: "Restored already", next: "fin_listo" },
        { label: "It’s not there", next: "fin_generar_ticket" },
        { label: "See versions", next: "arch_versiones" }
      ]
    },
    arch_carpeta: {
      text: "Create a folder:\n• In the library, 'New' → 'Folder' → clear name.\nConvention: team-project-year.",
      options: [
        { label: "Done", next: "arch_subir" },
        { label: "I don’t have permissions", next: "fin_generar_ticket" },
        { label: "Back", next: "arch_subir" }
      ]
    },
    arch_versiones: {
      text: "Versions:\n• Right‑click the file → 'Version history' → choose 'Restore'.",
      options: [
        { label: "Restored", next: "fin_listo" },
        { label: "Menu not available", next: "fin_generar_ticket" },
        { label: "Back", next: "arch_restaurar" }
      ]
    },
    externo: {
      text: "Share with external:\n• Check your org’s policy.\n• Prefer links with expiration.",
      options: [
        { label: "Create expiring link", next: "fin_enlace" },
        { label: "Add by email", next: "fin_generar_ticket" },
        { label: "Back to start", next: "inicio" }
      ]
    },
    roles: {
      text: "Roles:\n• Visitor = read\n• Member = edit\n• Owner = full control.",
      options: [
        { label: "I want to be Member", next: "fin_generar_ticket" },
        { label: "I want to be Owner", next: "fin_propietario" },
        { label: "Back to start", next: "inicio" }
      ]
    },
    fin_ok_lectura: {
      text: "Done. You have Read level. If you need to change it, request a permission update.",
      options: [
        { label: "Create ticket", next: "fin_generar_ticket" },
        { label: "Back to start", next: "inicio" },
        { label: "Exit", next: "fin_listo" }
      ]
    },
    fin_ok_edicion: {
      text: "Great. You have Edit permissions. Remember naming convention and versions.",
      options: [
        { label: "See versions", next: "arch_versiones" },
        { label: "Back to start", next: "inicio" },
        { label: "Exit", next: "fin_listo" }
      ]
    },
    fin_enlace: {
      text: "Expiring link:\n• Share → 'Anyone with the link' (if allowed) → Set expiration date.",
      options: [
        { label: "Done", next: "fin_listo" },
        { label: "It won’t let me", next: "fin_generar_ticket" },
        { label: "Back", next: "externo" }
      ]
    },
    fin_quitado: {
      text: "Permissions removed. Check there’s no unexpected inheritance in subfolders.",
      options: [
        { label: "Back to start", next: "inicio" },
        { label: "Exit", next: "fin_listo" },
        { label: "I need support", next: "fin_generar_ticket" }
      ]
    },
    fin_propietario: {
      text: "Owner gives full control. Only assign it if you’re responsible for the site.",
      options: [
        { label: "Request Owner", next: "fin_generar_ticket" },
        { label: "Back to start", next: "inicio" },
        { label: "Exit", next: "fin_listo" }
      ]
    },
    fin_notificar: {
      text: "Notify your team via Teams or email and paste the file link.",
      options: [
        { label: "Back to start", next: "inicio" },
        { label: "Exit", next: "fin_listo" },
        { label: "Open Intranet", link: "http://nsmx53.nadenso.net/portaldenso/default.aspx" }
      ]
    },
    fin_generar_ticket: {
      text: "Open your support/ticket channel and describe the issue. Include: site URL, folder/file and desired permissions.",
      options: [
        { label: "Back to start", next: "inicio" },
        { label: "Exit", next: "fin_listo" },
        { label: "See roles", next: "roles" }
      ]
    },
    fin_listo: {
      text: "All set! Want to do anything else?",
      options: [
        { label: "Back to start", next: "inicio" },
        { label: "Exit", next: "fin_salir" },
        { label: "Share with external", next: "externo" }
      ]
    },
    fin_salir: { text: "Thanks for using Lorenzo. Come back anytime.", options: [] }
  }
};


    const stack = [];
function renderOptions(nodeKey){
  const node = flows[currentLang][nodeKey];
  const group = document.createElement('div');
  group.className = 'option-group';

  if (stack.length){
    const back = document.createElement('button');
    back.className = 'nav-chip';
    back.textContent = i18n[currentLang].back;
    back.dataset.back = '1';
    group.appendChild(back);
  }
  const restart = document.createElement('button');
  restart.className = 'nav-chip';
  restart.textContent = i18n[currentLang].restart;
  restart.dataset.restart = '1';
  group.appendChild(restart);

  (node.options || []).forEach(opt=>{
    const b = document.createElement('button');
    b.className = 'option-chip';
    b.textContent = opt.label;
    if (opt.next) b.dataset.next = opt.next;
    if (opt.link) b.dataset.link = opt.link;
    group.appendChild(b);
  });
  return group;
}

let currentNode = 'inicio';

   logEl.addEventListener('click', (e)=>{
  const btn = e.target.closest('button.option-chip, button.nav-chip');
  if(!btn) return;

  if (btn.dataset.restart){
    addMsg(i18n[currentLang].restart, 'me');
    stack.length = 0;
    renderNode('inicio');
    return;
  }
  if (btn.dataset.back){
    addMsg(i18n[currentLang].back, 'me');
    const prev = stack.pop() || 'inicio';
    renderNode(prev);
    return;
  }
  if (btn.dataset.link){
    const url = btn.dataset.link;
    addMsg(btn.textContent, 'me');
    window.open(url, '_blank');
    return;
  }
  if (btn.dataset.next){
    const next = btn.dataset.next;
    addMsg(btn.textContent, 'me');
    const currentMsg = btn.closest('.msg');
    const currentKey = currentMsg?.dataset.nodeKey || 'inicio';
    if (currentKey) stack.push(currentKey);
    renderNode(next);
  }
});


    quick.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-start]');
      if(!btn) return;
      const start = btn.getAttribute('data-start');
      addMsg(btn.textContent, 'me');
      stack.length = 0;
      renderNode(start || 'inicio');
    });

    const MIN_PRELOADER_TIME = 2000;
    const bar = document.querySelector('#topbar span');
    let p = 0;
    const startTime = Date.now();
    const tick = setInterval(()=>{
      p += Math.max(5, (100 - p) * 0.25);
      if (p > 100) p = 100;
      bar.style.width = p + '%';
      if (p === 100) clearInterval(tick);
    }, 80);

    const elapsed = Date.now() - startTime;
const remaining = Math.max(0, MIN_PRELOADER_TIME - elapsed);
  window.addEventListener('load', ()=>{
  setTimeout(()=>{
    document.getElementById('preloader')?.classList.add('hidden');
    const topbar = document.getElementById('topbar');
    topbar.style.transition = 'opacity .5s ease';
    topbar.style.opacity = '0';
    setTimeout(()=> topbar.remove(), 600);

    logEl.innerHTML = '';
    applyLanguage(false);
    addHtml(i18n[currentLang].intro, 'bot');
    renderNode('inicio');
  }, remaining);
});

    