// Helpers
const $ = sel => document.querySelector(sel);
const uid = () => crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2);
const debounce = (fn, ms=160) => { let t; const w=(...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; w.flush=()=>fn(); return w; };

const DEFAULT_NOTE_TITLE = "New Note";
const DEFAULT_FOLDER_NAME = "New Folder…";
const DEFAULT_FOLDER_COLOR = "#8e8e93";
const DEFAULT_BG = "#ffffff";
const DEFAULT_FG = "#000000";
const DEFAULT_ACCENT = "#007aff";

// State
let state = {
    notes: [],
    folders: [],
    selectedId: null,
    ui: { theme: 'auto' }
};

// State for drag & drop
let dragState = { noteId: null };

/* Fonts */
const FONT_KEYS = [
    'system-ui','ABeeZee','Abel','Agbalumo','Alan Sans','Arimo','Barlow Condensed','Be Vietnam Pro','Borel',
    'Bricolage Grotesque','Caveat','Comic Relief','Cormorant','Crafty Girls','Delius Swash Caps','Dosis','Exo',
    'Fredoka','Fuzzy Bubbles','Indie Flower','Inter','Lato','League Spartan','Lily Script One','Meow Script',
    'Montserrat','Noto Sans','Nunito','Open Sans','Parkinsans','Playfair Display','Playwrite AU NSW','Playwrite AU SA',
    'Playwrite AU TAS','Playwrite DE Grund','Playwrite DE SAS','Playwrite DK Uloopet','Playwrite HU','Playwrite IN',
    'Quicksand','Raleway','Ribeye Marrow','Roboto Flex','Roboto','Rubik','Sacramento','Sanchez','Satisfy','Send Flowers',
    'Smooch Sans','Space Grotesk','Special Gothic','Twinkle Star','Ubuntu','Urbanist','Varela Round','Vibur','Winky Sans'
];
const cssFont = key => key === 'system-ui'
    ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
    : `'${key}', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;

/* Persistence */
async function loadState(){
    const {notes=[], folders=[], selectedId=null, ui={theme:'auto'}} =
        await chrome.storage.local.get(["notes","folders","selectedId","ui"]);

    notes.forEach(n => {
        n.settings = n.settings || {};
        if (!n.settings.fontKey) {
            const ff = n.settings.fontFamily || 'system-ui';
            const m = ff.match(/'([^']+)'/);
            n.settings.fontKey = m ? m[1] : (ff.includes('system-ui') ? 'system-ui' : ff);
        }
        if (typeof n.folderId === 'undefined') n.folderId = null;
    });

    folders.forEach(f => {
        if (typeof f.collapsed !== 'boolean') f.collapsed = true;
        if (!f.color) f.color = DEFAULT_FOLDER_COLOR;
        if (!Array.isArray(f.noteIds)) f.noteIds = [];
    });

    state.notes = notes;
    state.folders = folders;
    state.selectedId = selectedId || notes[0]?.id || null;
    state.ui = ui;
    await chrome.storage.local.set({notes, folders});
    applyTheme(ui.theme || 'auto');
}

async function saveState(){
    await chrome.storage.local.set({
        notes: state.notes,
        folders: state.folders,
        selectedId: state.selectedId,
        ui: state.ui
    });
}

/* Theme */
function applyTheme(mode){
    const b = document.body; b.removeAttribute('data-theme');
    if (mode === 'dark')  b.dataset.theme = 'dark';
    if (mode === 'light') b.dataset.theme = 'light';
    const t = $("#themeToggle");
    if (t) t.textContent = `Theme: ${mode[0].toUpperCase()+mode.slice(1)}`;
}
function cycleTheme(){
    const order=['auto','light','dark'];
    const idx = order.indexOf(state.ui.theme || 'auto');
    state.ui.theme = order[(idx+1)%order.length];
    applyTheme(state.ui.theme); saveState();
}

/* UI */
function populateFontSelect(){
    const sel = $("#fontFamily"); if (!sel) return;
    sel.innerHTML = "";
    FONT_KEYS.forEach(key=>{
        const opt = document.createElement("option");
        opt.value = key; opt.textContent = (key==='system-ui' ? 'System' : key);
        sel.appendChild(opt);
    });
}

function stripHtml(html){ const tmp=document.createElement('div'); tmp.innerHTML=html||''; return tmp.textContent||tmp.innerText||""; }

function isDefaultBg(c){ return !c || c.toLowerCase() === DEFAULT_BG; }

function matchesFilter(n, term){
    if (!term) return true;
    return (n.title && n.title.toLowerCase().includes(term)) ||
        stripHtml(n.html).toLowerCase().includes(term);
}

/* SVG icons */
function svgChevron(open){
    // Lucide-style chevron (right when collapsed, down when open)
    const d = open
        ? 'M6 9l6 6 6-6'   // chevron down
        : 'M9 6l6 6-6 6';  // chevron right
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"></path></svg>`;
}
function svgFolder(){
    // Filled folder: el color de "currentColor" pinta el cuerpo entero
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"></path></svg>`;
}
function svgClose(){
    return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>`;
}

/* Build a note <li> */
function buildNoteLi(n, term){
    const li = document.createElement('li');
    li.dataset.id = n.id;
    li.className = 'note-item';
    li.draggable = true;
    if (n.id === state.selectedId) li.classList.add('active');

    // Apply custom colors if note has them
    const bg = n.settings?.bgColor;
    const fg = n.settings?.fgColor;
    if (!isDefaultBg(bg)) {
        li.classList.add('has-color');
        li.style.background = bg;
        li.style.color = fg || DEFAULT_FG;
    }

    // Container for title + preview (so the × can sit beside them)
    const body = document.createElement('div');
    body.className = 'note-body';

    const t = document.createElement('div');
    t.className = 'note-title';
    t.textContent = n.title || DEFAULT_NOTE_TITLE;

    const p = document.createElement('div');
    p.className = 'note-preview';
    p.textContent = stripHtml(n.html).slice(0, 200);

    body.appendChild(t);
    body.appendChild(p);

    // × button (appears on hover)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'note-close';
    closeBtn.type = 'button';
    closeBtn.title = 'Delete note';
    closeBtn.setAttribute('aria-label', 'Delete note');
    closeBtn.innerHTML = svgClose();
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeleteNote(n.id);
    });

    li.appendChild(body);
    li.appendChild(closeBtn);

    li.addEventListener('click', (e) => {
        if (e.target.closest('.note-close')) return;
        selectNote(n.id);
    });

    // Drag events
    li.addEventListener('dragstart', (e) => {
        dragState.noteId = n.id;
        li.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', n.id); } catch {}
        e.dataTransfer.effectAllowed = 'move';
    });
    li.addEventListener('dragend', () => {
        dragState.noteId = null;
        li.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    return li;
}

/* Build a folder <li> */
function buildFolderLi(folder, term){
    const li = document.createElement('li');
    li.className = 'folder-item' + (folder.collapsed ? ' collapsed' : '');
    li.dataset.folderId = folder.id;

    // Header
    const header = document.createElement('div');
    header.className = 'folder-header';

    const caret = document.createElement('button');
    caret.className = 'folder-caret';
    caret.type = 'button';
    caret.title = folder.collapsed ? 'Expand' : 'Collapse';
    caret.innerHTML = svgChevron(!folder.collapsed);
    caret.addEventListener('click', (e) => { e.stopPropagation(); toggleFolder(folder.id); });

    const folderIcon = document.createElement('button');
    folderIcon.className = 'folder-icon';
    folderIcon.type = 'button';
    folderIcon.title = 'Change folder color';
    folderIcon.style.color = folder.color || DEFAULT_FOLDER_COLOR;
    folderIcon.innerHTML = svgFolder();
    folderIcon.addEventListener('click', (e) => { e.stopPropagation(); openFolderColorPicker(folder.id); });

    const name = document.createElement('span');
    name.className = 'folder-name';
    name.textContent = folder.name || DEFAULT_FOLDER_NAME;
    name.title = folder.name || '';
    name.addEventListener('dblclick', (e) => { e.stopPropagation(); startRenameFolder(folder.id, name); });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'folder-close';
    closeBtn.type = 'button';
    closeBtn.title = 'Delete folder';
    closeBtn.innerHTML = svgClose();
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); confirmDeleteFolder(folder.id); });

    header.appendChild(caret);
    header.appendChild(folderIcon);
    header.appendChild(name);
    header.appendChild(closeBtn);

    // Single-click on header (not on a control) toggles
    header.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        toggleFolder(folder.id);
    });

    li.appendChild(header);

    // Children container
    const childList = document.createElement('ul');
    childList.className = 'folder-children';

    const childNotes = folder.noteIds
        .map(id => state.notes.find(n => n.id === id))
        .filter(Boolean)
        .filter(n => matchesFilter(n, term));

    if (childNotes.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'folder-empty';
        empty.textContent = 'Drop notes here';
        childList.appendChild(empty);
    } else {
        childNotes.forEach(n => childList.appendChild(buildNoteLi(n, term)));
    }
    li.appendChild(childList);

    // Drop target on folder
    li.addEventListener('dragover', (e) => {
        if (!dragState.noteId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', (e) => {
        if (!li.contains(e.relatedTarget)) li.classList.remove('drag-over');
    });
    li.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        li.classList.remove('drag-over');
        const noteId = dragState.noteId || e.dataTransfer.getData('text/plain');
        if (noteId) moveNoteToFolder(noteId, folder.id);
    });

    return li;
}

/* Render the whole list */
function renderList(filter=""){
    const ul = $("#noteList"); if (!ul) return;
    ul.innerHTML = "";
    const term = (filter || "").trim().toLowerCase();

    // Folders first
    state.folders.forEach(f => ul.appendChild(buildFolderLi(f, term)));

    // Then loose notes (no folderId)
    state.notes
        .filter(n => !n.folderId)
        .filter(n => matchesFilter(n, term))
        .forEach(n => ul.appendChild(buildNoteLi(n, term)));

    // Make the root list a drop zone (drop outside a folder => move out)
    ul.ondragover = (e) => {
        if (!dragState.noteId) return;
        // Only show the root drop hint if not over a folder
        if (e.target.closest('.folder-item')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    ul.ondrop = (e) => {
        if (e.target.closest('.folder-item')) return;
        e.preventDefault();
        const noteId = dragState.noteId || e.dataTransfer.getData('text/plain');
        if (noteId) moveNoteToFolder(noteId, null);
    };
}

/* Editor */
function renderEditor(){
    const editor=$("#editor"), title=$("#titleInput");
    if (!editor || !title) return;
    const note = state.notes.find(n=>n.id===state.selectedId);
    if (!note){
        editor.innerHTML="";
        title.value="";
        document.documentElement.style.setProperty('--note-accent', DEFAULT_ACCENT);
        return;
    }
    title.value = note.title || "";
    editor.innerHTML = note.html || "";
    const s = note.settings || {};
    if($("#fontFamily")) $("#fontFamily").value = s.fontKey || 'system-ui';
    if($("#fontSize")) $("#fontSize").value   = s.fontSize || "16px";
    if($("#fgColor")) $("#fgColor").value    = s.fgColor  || DEFAULT_FG;
    if($("#bgColor")) $("#bgColor").value    = s.bgColor  || DEFAULT_BG;
    applyEditorStyles(currentSettings());
    syncNoteAccent(s.bgColor);
}

function syncNoteAccent(bg){
    const accent = (!isDefaultBg(bg)) ? bg : DEFAULT_ACCENT;
    document.documentElement.style.setProperty('--note-accent', accent);
}

function applyEditorStyles({fontKey="system-ui", fontSize="16px", fgColor=DEFAULT_FG, bgColor=DEFAULT_BG}={}){
    const editor=$("#editor"); if(!editor) return;
    editor.style.fontFamily = cssFont(fontKey);
    editor.style.fontSize   = fontSize;
    editor.style.color      = fgColor;
    editor.style.background = bgColor + (bgColor.length===7 ? "cc" : "");
    syncNoteAccent(bgColor);
}

/* Ensure note exists when user starts typing */
function ensureActiveNote(){
    if (state.selectedId) return;
    const n = {
        id: uid(),
        title: $("#titleInput")?.value?.trim() || DEFAULT_NOTE_TITLE,
        html: $("#editor")?.innerHTML || "",
        settings: currentSettings(),
        folderId: null
    };
    state.notes.unshift(n);
    state.selectedId = n.id;
    saveState();
    renderList($("#searchInput")?.value||"");
}

function selectNote(id){
    state.selectedId=id;
    saveState();
    renderList($("#searchInput")?.value||"");
    renderEditor();
}

function newNote(initialText=""){
    const n = {
        id: uid(),
        title: DEFAULT_NOTE_TITLE,
        html: initialText ? `<p>${escapeHtml(initialText)}</p>` : "",
        settings: { fontKey:"system-ui", fontSize:"16px", fgColor:DEFAULT_FG, bgColor:DEFAULT_BG },
        folderId: null
    };
    state.notes.unshift(n);
    state.selectedId = n.id;
    saveState(); renderList($("#searchInput")?.value||""); renderEditor();
    $("#titleInput")?.focus();
}

function deleteCurrent(){
    if (!state.selectedId) return;
    deleteNoteById(state.selectedId, /*skipConfirm*/ false);
}

function confirmDeleteNote(id){
    deleteNoteById(id, /*skipConfirm*/ false);
}

function deleteNoteById(id, skipConfirm=false){
    const i = state.notes.findIndex(n => n.id === id);
    if (i < 0) return;
    const note = state.notes[i];
    if (!skipConfirm) {
        const label = note.title ? `"${note.title}"` : 'this note';
        if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    }
    // Remove from any folder
    if (note.folderId) {
        const f = state.folders.find(x => x.id === note.folderId);
        if (f) f.noteIds = f.noteIds.filter(nid => nid !== note.id);
    }
    state.notes.splice(i,1);
    if (state.selectedId === id) {
        state.selectedId = state.notes[0]?.id ?? null;
    }
    saveState();
    renderList($("#searchInput")?.value || "");
    renderEditor();
}

// Auto-save (title/body/styles)
const persistNote = debounce(() => saveCurrentOnly(), 150);

function saveCurrentOnly(){
    ensureActiveNote();
    const note = state.notes.find(n=>n.id===state.selectedId); if(!note) return;
    note.title = $("#titleInput")?.value?.trim() || DEFAULT_NOTE_TITLE;
    note.html  = $("#editor")?.innerHTML || "";
    note.settings = currentSettings();
    saveState(); renderList($("#searchInput")?.value||"");
}

function escapeHtml(s){
    return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

/* ===== FOLDERS ===== */

function createFolder(){
    const f = {
        id: uid(),
        name: '',
        color: DEFAULT_FOLDER_COLOR,
        collapsed: false,
        noteIds: []
    };
    state.folders.unshift(f);
    saveState();
    renderList($("#searchInput")?.value || "");
    // Focus the new folder's name for inline rename
    const li = document.querySelector(`.folder-item[data-folder-id="${f.id}"] .folder-name`);
    if (li) startRenameFolder(f.id, li);
}

function toggleFolder(folderId){
    const f = state.folders.find(x => x.id === folderId);
    if (!f) return;
    f.collapsed = !f.collapsed;
    saveState();
    renderList($("#searchInput")?.value || "");
}

function moveNoteToFolder(noteId, folderId){
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    // Remove from previous folder if any
    if (note.folderId) {
        const prev = state.folders.find(x => x.id === note.folderId);
        if (prev) prev.noteIds = prev.noteIds.filter(id => id !== noteId);
    }
    note.folderId = folderId || null;
    if (folderId) {
        const f = state.folders.find(x => x.id === folderId);
        if (f) {
            if (!f.noteIds.includes(noteId)) f.noteIds.unshift(noteId);
            // Auto-expand to show the dropped note
            f.collapsed = false;
        }
    }
    saveState();
    renderList($("#searchInput")?.value || "");
}

let activeFolderColorId = null;
function openFolderColorPicker(folderId){
    activeFolderColorId = folderId;
    const f = state.folders.find(x => x.id === folderId);
    const picker = $("#folderColorPicker");
    if (!picker) return;
    picker.value = f?.color || DEFAULT_FOLDER_COLOR;
    picker.click();
}
function handleFolderColorChange(e){
    if (!activeFolderColorId) return;
    const f = state.folders.find(x => x.id === activeFolderColorId);
    if (!f) return;
    f.color = e.target.value;
    activeFolderColorId = null;
    saveState();
    renderList($("#searchInput")?.value || "");
}

function startRenameFolder(folderId, nameEl){
    const f = state.folders.find(x => x.id === folderId);
    if (!f || !nameEl) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'folder-rename';
    input.value = f.name || '';
    input.placeholder = DEFAULT_FOLDER_NAME;
    nameEl.replaceWith(input);
    input.focus();
    input.select();

    const finish = (commit) => {
        if (commit) {
            f.name = input.value.trim() || '';
            saveState();
        }
        renderList($("#searchInput")?.value || "");
    };
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.value = f.name || ''; input.blur(); }
    });
    input.addEventListener('click', (e) => e.stopPropagation());
}

function confirmDeleteFolder(folderId){
    const f = state.folders.find(x => x.id === folderId);
    if (!f) return;
    const count = f.noteIds.length;
    const msg = count > 0
        ? `Delete folder "${f.name || 'Untitled'}"?\nIts ${count} note${count===1?'':'s'} will be moved out (not deleted).`
        : `Delete empty folder "${f.name || 'Untitled'}"?`;
    if (!confirm(msg)) return;
    // Move notes out
    state.notes.forEach(n => { if (n.folderId === folderId) n.folderId = null; });
    state.folders = state.folders.filter(x => x.id !== folderId);
    saveState();
    renderList($("#searchInput")?.value || "");
}

/* ===== Export / Backup / Restore ===== */

async function exportTxt(){
    ensureActiveNote();
    const note = state.notes.find(n=>n.id===state.selectedId); if(!note) return;
    const title = (note.title || 'Untitled');
    const body  = stripHtml(note.html);
    const text  = `${title}\n\n${body}\n`;
    const blob  = new Blob([text],{type:'text/plain;charset=utf-8'});
    const url   = URL.createObjectURL(blob);
    const safeName = title.replace(/[\\/:*?"<>|]/g,'_');
    try{
        if (chrome?.downloads?.download) {
            await chrome.downloads.download({ url, filename: `${safeName}.txt`, saveAs: true });
        } else {
            const a=document.createElement('a'); a.href=url; a.download=`${safeName}.txt`; document.body.appendChild(a); a.click(); a.remove();
        }
    } catch(e){
        const a=document.createElement('a'); a.href=url; a.download=`${safeName}.txt`; document.body.appendChild(a); a.click(); a.remove();
    } finally { setTimeout(()=>URL.revokeObjectURL(url), 10000); }
}

function bindFormatting(){
    document.querySelectorAll('[data-cmd]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            document.execCommand(btn.dataset.cmd, false);
            persistNote();
        });
    });
}

// --- BACKUP & RESTORE LOGIC (now includes folders, retro-compatible) ---
async function backupNotes() {
    ensureActiveNote();
    try { persistNote.flush(); } catch{}

    const payload = {
        _version: 2,
        _exportedAt: new Date().toISOString(),
        notes: state.notes,
        folders: state.folders
    };
    const data = JSON.stringify(payload, null, 2);
    const blob = new Blob([data], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    const filename = `FluentNotes_Backup_${date}.json`;

    try {
        if (chrome?.downloads?.download) {
            await chrome.downloads.download({ url, filename: filename, saveAs: true });
        } else {
            const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        }
    } catch(e) {
        const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    } finally {
        setTimeout(()=>URL.revokeObjectURL(url), 10000);
    }
}

function restoreNotes(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const parsed = JSON.parse(e.target.result);

            let importedNotes = [];
            let importedFolders = [];

            if (Array.isArray(parsed)) {
                // v1 format: just an array of notes
                importedNotes = parsed;
            } else if (parsed && Array.isArray(parsed.notes)) {
                // v2 format: { notes, folders, _version }
                importedNotes = parsed.notes;
                importedFolders = Array.isArray(parsed.folders) ? parsed.folders : [];
            } else {
                alert("El archivo no tiene un formato de backup válido.");
                return;
            }

            // Sanitize
            importedNotes.forEach(n => {
                n.settings = n.settings || {};
                if (typeof n.folderId === 'undefined') n.folderId = null;
            });
            importedFolders.forEach(f => {
                if (typeof f.collapsed !== 'boolean') f.collapsed = true;
                if (!f.color) f.color = DEFAULT_FOLDER_COLOR;
                if (!Array.isArray(f.noteIds)) f.noteIds = [];
            });

            // If folders reference missing notes, drop those ids; if notes reference missing folders, clear folderId
            const noteIds = new Set(importedNotes.map(n => n.id));
            const folderIds = new Set(importedFolders.map(f => f.id));
            importedFolders.forEach(f => { f.noteIds = f.noteIds.filter(id => noteIds.has(id)); });
            importedNotes.forEach(n => { if (n.folderId && !folderIds.has(n.folderId)) n.folderId = null; });

            state.notes = importedNotes;
            state.folders = importedFolders;
            state.selectedId = importedNotes[0]?.id || null;
            await saveState();
            renderList($("#searchInput")?.value || "");
            renderEditor();
            alert(`¡Restauración exitosa! ${importedNotes.length} nota(s) y ${importedFolders.length} carpeta(s).`);
        } catch (err) {
            console.error(err);
            alert("Error al leer el archivo JSON. Asegúrate de que sea un backup válido.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function bindInputs(){
    $("#addNote")?.addEventListener("click", ()=> newNote());
    $("#addFolder")?.addEventListener("click", ()=> createFolder());
    $("#deleteNote")?.addEventListener("click", deleteCurrent);
    $("#exportTxt")?.addEventListener("click", exportTxt);

    $("#backupBtn")?.addEventListener("click", backupNotes);
    $("#restoreBtn")?.addEventListener("click", () => $("#restoreFile")?.click());
    $("#restoreFile")?.addEventListener("change", restoreNotes);

    $("#folderColorPicker")?.addEventListener("input", handleFolderColorChange);
    $("#folderColorPicker")?.addEventListener("change", handleFolderColorChange);

    $("#themeToggle")?.addEventListener("click", cycleTheme);

    $("#titleInput")?.addEventListener("input", ()=>{ ensureActiveNote(); persistNote(); });
    $("#editor")?.addEventListener("input", ()=>{ ensureActiveNote(); persistNote(); });

    $("#fontFamily")?.addEventListener("change",  ()=>{ applyEditorStyles(currentSettings()); ensureActiveNote(); persistNote(); });
    $("#fontSize")?.addEventListener("change",    ()=>{ applyEditorStyles(currentSettings()); ensureActiveNote(); persistNote(); });
    $("#fgColor")?.addEventListener("input",      ()=>{ applyEditorStyles(currentSettings()); ensureActiveNote(); persistNote(); });
    $("#bgColor")?.addEventListener("input",      ()=>{ applyEditorStyles(currentSettings()); ensureActiveNote(); persistNote(); });

    $("#searchInput")?.addEventListener("input", debounce((e)=> renderList(e.target.value), 120));

    // Guardado forzoso al ocultar la extensión
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'hidden') {
            saveCurrentOnly();
        }
    });
}

function currentSettings(){
    return {
        fontKey: $("#fontFamily")?.value || "system-ui",
        fontSize: $("#fontSize")?.value  || "16px",
        fgColor: $("#fgColor")?.value    || DEFAULT_FG,
        bgColor: $("#bgColor")?.value    || DEFAULT_BG
    };
}

async function main(){
    populateFontSelect();
    await loadState();
    renderList("");
    renderEditor();
    bindFormatting();
    bindInputs();
}

document.addEventListener('DOMContentLoaded', main);
