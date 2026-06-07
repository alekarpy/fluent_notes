/* ===========================================================
   Fluent Notes V2 — popup.js
   =========================================================== */

/* ---------- Helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const uid = () => crypto?.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substring(2);
const nowIso = () => new Date().toISOString();
const debounce = (fn, ms = 160) => {
    let t;
    const w = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    w.flush = () => fn();
    return w;
};

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
}
function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* ---------- Constants ---------- */
const DEFAULT_NOTE_TITLE = 'Untitled';
const DEFAULT_FOLDER_NAME = 'New Space';
const RECENT_LIMIT = 8;

const THEME_SWATCHES = {
    //          primary-1       primary-2       analogous       complementary   neutral-warm
    orchid:  [
        { id: 'lavender',  value: '#EDE9FE', label: 'Lavender' },   // primary
        { id: 'thistle',   value: '#F3E8FF', label: 'Thistle' },    // primary
        { id: 'blush',     value: '#FCE7F3', label: 'Blush' },      // analogous (pink)
        { id: 'aqua',      value: '#CCFBF1', label: 'Aqua' },       // complementary (teal)
        { id: 'cream',     value: '#FEFCE8', label: 'Cream' },      // neutral warm
    ],
    ocean:   [
        { id: 'sky',       value: '#DBEAFE', label: 'Sky' },        // primary
        { id: 'powder',    value: '#E0F2FE', label: 'Powder' },     // primary
        { id: 'aqua',      value: '#CCFBF1', label: 'Aqua' },       // analogous (teal)
        { id: 'lavender',  value: '#EDE9FE', label: 'Lavender' },   // complementary (purple)
        { id: 'sand',      value: '#FEF3C7', label: 'Sand' },       // neutral warm
    ],
    emerald: [
        { id: 'mint',      value: '#D1FAE5', label: 'Mint' },       // primary
        { id: 'sage',      value: '#DCFCE7', label: 'Sage' },       // primary
        { id: 'sky',       value: '#DBEAFE', label: 'Sky' },        // analogous (blue-green)
        { id: 'peach',     value: '#FFEDD5', label: 'Peach' },      // complementary (warm)
        { id: 'cream',     value: '#FEFCE8', label: 'Cream' },      // neutral warm
    ],
    sunset:  [
        { id: 'peach',     value: '#FFEDD5', label: 'Peach' },      // primary
        { id: 'amber',     value: '#FEF3C7', label: 'Amber' },      // primary
        { id: 'rose',      value: '#FCE7F3', label: 'Rose' },       // analogous (warm pink)
        { id: 'sage',      value: '#DCFCE7', label: 'Sage' },       // complementary (cool green)
        { id: 'cream',     value: '#FFFBEB', label: 'Cream' },      // neutral warm
    ],
    sakura:  [
        { id: 'blush',     value: '#FCE7F3', label: 'Blush' },      // primary
        { id: 'rose',      value: '#FEE2E2', label: 'Rose' },       // primary
        { id: 'lavender',  value: '#EDE9FE', label: 'Lavender' },   // analogous (purple)
        { id: 'peach',     value: '#FFEDD5', label: 'Peach' },      // complementary (warm)
        { id: 'cream',     value: '#FEF9C3', label: 'Cream' },      // neutral warm
    ],
};

const SUGGESTED_COLORS = THEME_SWATCHES.orchid; // fallback default

const FOLDER_COLORS = [
    { id: 'violet',  value: '#9D4EDD', label: 'Violet' },
    { id: 'pink',    value: '#EC4899', label: 'Pink' },
    { id: 'blue',    value: '#3B82F6', label: 'Blue' },
    { id: 'green',   value: '#10B981', label: 'Green' },
    { id: 'orange',  value: '#F97316', label: 'Orange' },
    { id: 'red',     value: '#EF4444', label: 'Red' },
    { id: 'teal',    value: '#14B8A6', label: 'Teal' },
    { id: 'amber',   value: '#EAB308', label: 'Amber' },
];

function getThemeSwatches() {
    return THEME_SWATCHES[state.ui.workspaceTheme] || THEME_SWATCHES.orchid;
}

const TEXT_COLORS = [
    { id: 'black',   value: '#1A1A2E', label: 'Near Black' },
    { id: 'slate',   value: '#475569', label: 'Slate' },
    { id: 'purple',  value: '#7C3AED', label: 'Purple' },
    { id: 'pink',    value: '#DB2777', label: 'Pink' },
    { id: 'rose',    value: '#E11D48', label: 'Rose' },
    { id: 'blue',    value: '#1D4ED8', label: 'Blue' },
    { id: 'cyan',    value: '#0891B2', label: 'Cyan' },
    { id: 'teal',    value: '#0D9488', label: 'Teal' },
    { id: 'green',   value: '#059669', label: 'Green' },
    { id: 'amber',   value: '#D97706', label: 'Amber' },
    { id: 'orange',  value: '#EA580C', label: 'Orange' },
];

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

const HEADING_STYLES = [
    { key: 'title', badge: 'Title',  preview: 'Title',     size: '40px', weight: '800', lh: '1.1' },
    { key: 'h1',    badge: 'H1',     preview: 'Heading 1', size: '32px', weight: '700', lh: '1.15' },
    { key: 'h2',    badge: 'H2',     preview: 'Heading 2', size: '26px', weight: '700', lh: '1.2' },
    { key: 'h3',    badge: 'H3',     preview: 'Heading 3', size: '22px', weight: '600', lh: '1.2' },
    { key: 'h4',    badge: 'H4',     preview: 'Heading 4', size: '18px', weight: '600', lh: '1.25' },
    { key: 'body',  badge: '¶',      preview: 'Body',      size: '16px', weight: '400', lh: '1.5' },
    { key: 'small', badge: 'Aa',     preview: 'Small',     size: '13px', weight: '400', lh: '1.5' },
];

const SIZE_OPTIONS = [
    '10px','11px','12px','13px','14px','16px','18px','20px',
    '22px','24px','28px','32px','36px','48px','64px','72px','96px',
];

/* ---------- State ---------- */
let state = {
    notes: [],
    folders: [],
    selectedId: null,
    view: 'all',        // 'all' | 'pinned' | 'recent' | 'folder:<id>'
    ui: { theme: 'auto' }
};
let dragNoteId = null;
let menuOpen = false;
let savedEditorRange = null;
let isRenamingFolder = false;

/* ---------- Persistence (Chrome storage) ---------- */
const hasStorage = typeof chrome !== 'undefined' && !!chrome.storage?.local;

async function loadState() {
    const data = hasStorage
        ? await chrome.storage.local.get(['notes', 'folders', 'selectedId', 'view', 'ui'])
        : {};

    let notes = Array.isArray(data.notes) ? data.notes : [];
    let folders = Array.isArray(data.folders) ? data.folders : [];

    notes.forEach(n => {
        n.tags = Array.isArray(n.tags) ? n.tags : [];
        n.color = n.color || null;
        n.textColor = n.textColor || null;
        n.pinned = !!n.pinned;
        if (typeof n.folderId === 'undefined') n.folderId = null;
        if (!n.createdAt) n.createdAt = nowIso();
        if (!n.updatedAt) n.updatedAt = n.createdAt;
        n.settings = n.settings || {};
        // Backwards-compat: si traía settings con bgColor custom, úsalo como color
        if (!n.color && n.settings?.bgColor && n.settings.bgColor !== '#ffffff') {
            n.color = n.settings.bgColor;
        }
    });

    folders.forEach(f => {
        if (typeof f.parentId === 'undefined') f.parentId = null;
        if (typeof f.collapsed !== 'boolean') f.collapsed = false;
        if (!f.color) f.color = null;
        // Backwards-compat: el v2 anterior usaba noteIds; lo migro a folderId en cada nota
        if (Array.isArray(f.noteIds)) {
            f.noteIds.forEach(nid => {
                const n = notes.find(x => x.id === nid);
                if (n && !n.folderId) n.folderId = f.id;
            });
            delete f.noteIds;
        }
    });

    state.notes = notes;
    state.folders = folders;
    state.selectedId = data.selectedId || notes[0]?.id || null;
    state.view = data.view || 'all';
    state.ui = data.ui || { theme: 'auto', workspaceTheme: 'orchid' };
    state.ui.workspaceTheme = state.ui.workspaceTheme || 'orchid';
    state.ui.recentTextColors = state.ui.recentTextColors || [];
    state.ui.recentBgColors = state.ui.recentBgColors || [];
    state.ui.recentFolderColors = state.ui.recentFolderColors || [];

    await saveStateRaw();
    applyTheme(state.ui.theme);
    applyWorkspaceTheme(state.ui.workspaceTheme);
}

async function saveStateRaw() {
    if (!hasStorage) return;
    await chrome.storage.local.set({
        notes: state.notes,
        folders: state.folders,
        selectedId: state.selectedId,
        view: state.view,
        ui: state.ui
    });
}
const saveState = debounce(saveStateRaw, 120);

/* Reflect external storage changes (service worker creating notes) */
function watchStorage() {
    if (!hasStorage) return;
    chrome.storage.onChanged.addListener(async (changes, area) => {
        if (area !== 'local') return;
        if (changes.notes || changes.folders || changes.selectedId) {
            await loadState();
            renderAll();
        }
    });
}

/* ---------- Theme ---------- */
function applyTheme(mode) {
    document.body.removeAttribute('data-theme');
    if (mode === 'dark') document.body.dataset.theme = 'dark';
    if (mode === 'light') document.body.dataset.theme = 'light';
}
function applyWorkspaceTheme(themeName) {
    if (themeName && themeName !== 'orchid') {
        document.body.setAttribute('data-w-theme', themeName);
    } else {
        document.body.removeAttribute('data-w-theme');
    }
}
function cycleTheme() {
    let isDark = false;
    if (state.ui.theme === 'dark') {
        isDark = true;
    } else if (state.ui.theme === 'auto' || !state.ui.theme) {
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    const next = isDark ? 'light' : 'dark';
    state.ui.theme = next;
    applyTheme(next);
    saveState();
    showToast(`Theme: ${next}`);
}

function closeWorkspaceThemePopover() {
    $('#workspaceThemePopover')?.remove();
}

function openWorkspaceThemePicker(anchorEl) {
    closeWorkspaceThemePopover();
    if (!anchorEl) return;

    const pop = document.createElement('div');
    pop.id = 'workspaceThemePopover';
    pop.className = 'workspace-theme-popover';
    pop.innerHTML = `<div class="workspace-theme-title">Workspace Theme</div>`;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'workspace-theme-options';

    const themes = [
        { key: 'orchid', label: 'Orchid', color: '#9D4EDD' },
        { key: 'ocean', label: 'Ocean', color: '#0284c7' },
        { key: 'emerald', label: 'Emerald', color: '#059669' },
        { key: 'sunset', label: 'Sunset', color: '#ea580c' },
        { key: 'sakura', label: 'Sakura', color: '#db2777' }
    ];

    themes.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'workspace-theme-option';
        if (state.ui.workspaceTheme === t.key) {
            btn.classList.add('active');
        }

        const dot = document.createElement('span');
        dot.className = 'workspace-theme-dot';
        dot.style.background = t.color;

        const label = document.createElement('span');
        label.textContent = t.label;

        btn.appendChild(dot);
        btn.appendChild(label);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.ui.workspaceTheme = t.key;
            applyWorkspaceTheme(t.key);
            saveState();
            closeWorkspaceThemePopover();
            // Re-render note color palette with new theme swatches
            const activeNote = currentNote();
            if (activeNote) renderColorPalette(activeNote.color || activeNote.settings?.color || null);
            showToast(`Theme: ${t.label}`);
        });

        optionsContainer.appendChild(btn);
    });

    pop.appendChild(optionsContainer);
    document.body.appendChild(pop);

    const rect = anchorEl.getBoundingClientRect();
    pop.style.top = `${rect.bottom + 6}px`;
    pop.style.left = `${Math.max(10, rect.left + rect.width / 2 - 85)}px`;
}

/* ---------- View helpers ---------- */
function visibleNotes(searchTerm = '') {
    let list = state.notes.slice();
    const term = (searchTerm || '').trim().toLowerCase();

    if (state.view === 'pinned') {
        list = list.filter(n => n.pinned).sort(sortNotesForTree);
    } else if (state.view === 'recent') {
        list = list.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        list = list.slice(0, RECENT_LIMIT);
    }

    if (term) {
        list = list.filter(n =>
            (n.title || '').toLowerCase().includes(term) ||
            stripHtml(n.html).toLowerCase().includes(term) ||
            (n.tags || []).some(t => t.toLowerCase().includes(term))
        );
    }
    return list;
}

function countAll() { return state.notes.length; }
function countPinned() { return state.notes.filter(n => n.pinned).length; }
function countRecent() { return Math.min(RECENT_LIMIT, state.notes.length); }
function countFolder(fid) { return state.notes.filter(n => n.folderId === fid).length; }

function viewTitle() {
    if (state.view === 'all') return 'All Notes';
    if (state.view === 'pinned') return 'Pinned';
    if (state.view === 'recent') return 'Recent';
    if (state.view.startsWith('folder:')) {
        const f = state.folders.find(x => x.id === state.view.slice(7));
        return f ? f.name || DEFAULT_FOLDER_NAME : 'Space';
    }
    return 'Notes';
}

function folderName(fid) {
    if (!fid) return null;
    const f = state.folders.find(x => x.id === fid);
    return f ? (f.name || DEFAULT_FOLDER_NAME) : null;
}

function relativeTime(iso) {
    if (!iso) return '—';
    const date = new Date(iso);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d`;
    if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))} wk`;
    return date.toLocaleDateString();
}

/* ===========================================================
   RENDERING
   =========================================================== */

function renderAll() {
    renderNavCounts();
    renderActiveNav();
    renderSpaceTree();
    renderEditor();
}

function renderNavCounts() {
    $('[data-count="all"]').textContent = countAll();
    $('[data-count="pinned"]').textContent = countPinned();
    $('[data-count="recent"]').textContent = countRecent();
}

function renderActiveNav() {
    $$('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.view === state.view);
    });
}

function renderViewTitle() {
    const title = $('#viewTitle');
    if (title) title.textContent = viewTitle();
}

/* ---------- Space tree (recursive) ---------- */
function renderSpaceTree() {
    if (isRenamingFolder) return;
    const ul = $('#spaceTree');
    ul.innerHTML = '';
    const term = $('#searchInput')?.value || '';
    const visible = visibleNotes(term);
    const visibleIds = new Set(visible.map(n => n.id));
    const searching = !!term.trim();
    const showEmptyOnly = visible.length === 0 && searching;
    const forceExpanded = searching;

    if (!showEmptyOnly) {
        const isFlatView = searching || state.view === 'pinned' || state.view === 'recent';
        if (isFlatView) {
            visible.forEach(n => ul.appendChild(buildTreeNoteNode(n)));
        } else {
            const roots = state.folders.filter(f => !f.parentId);
            roots.forEach(f => ul.appendChild(buildSpaceNode(f, false, visibleIds, forceExpanded)));

            const looseNotes = treeNotesForFolder(null, visibleIds);
            looseNotes.forEach(n => ul.appendChild(buildTreeNoteNode(n)));
        }
    }

    if (ul.children.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty-list';
        empty.textContent = term ? 'No results.' : 'No notes in this view.';
        ul.appendChild(empty);
    }

    ul.ondragover = (e) => {
        if (!dragNoteId) return;
        if (e.target.closest('.space-row, .tree-note-row')) return;
        e.preventDefault();
    };
    ul.ondrop = (e) => {
        if (e.target.closest('.space-row, .tree-note-row')) return;
        e.preventDefault();
        const noteId = dragNoteId || e.dataTransfer.getData('text/plain');
        if (noteId) moveNoteToFolder(noteId, null);
    };
}

function treeNotesForFolder(folderId, visibleIds) {
    return state.notes
        .filter(n => (n.folderId || null) === (folderId || null) && visibleIds.has(n.id))
        .sort(sortNotesForTree);
}

function sortNotesForTree(a, b) {
    if (state.view !== 'recent' && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
}

function buildSpaceNode(folder, isChild, visibleIds, forceExpanded) {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'space-row' + (isChild ? ' is-child' : '');
    row.dataset.folderId = folder.id;
    const isActiveFolder = state.view === `folder:${folder.id}`;
    if (isActiveFolder) row.classList.add('active');
    if (folder.color) {
        row.classList.add('has-folder-color');
        row.style.setProperty('--folder-color', folder.color);
    }

    const children = state.folders.filter(f => f.parentId === folder.id);
    const folderNotes = treeNotesForFolder(folder.id, visibleIds);
    const shouldShowEmptyHint = children.length === 0 && folderNotes.length === 0;
    const hasTreeChildren = true; // Always has carets/arrows visible
    const isCollapsed = folder.collapsed && !forceExpanded;

    // Caret
    const caret = document.createElement('button');
    caret.className = 'space-caret';
    caret.type = 'button';
    caret.innerHTML = isCollapsed
        ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`
        : `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
    caret.addEventListener('click', (e) => {
        e.stopPropagation();
        folder.collapsed = !folder.collapsed;
        saveState();
        renderSpaceTree();
    });

    // Icon
    const icon = document.createElement('span');
    icon.className = 'space-icon';
    const strokeColor = folder.color ? 'var(--folder-color-solid)' : 'currentColor';
    const fillColor = folder.color || 'none';
    icon.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>`;

    // Name
    const name = document.createElement('span');
    name.className = 'space-name';
    name.textContent = folder.name || DEFAULT_FOLDER_NAME;
    name.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        startRenameFolder(folder.id, name);
    });

    // Color dot trigger
    const colorDot = document.createElement('button');
    colorDot.className = 'space-color-trigger';
    colorDot.type = 'button';
    colorDot.title = 'Change color';
    if (folder.color) {
        colorDot.innerHTML = `<span class="space-color-dot" style="background-color: ${folder.color};"></span>`;
    } else {
        colorDot.innerHTML = `<span class="space-color-dot no-color"></span>`;
    }
    colorDot.addEventListener('click', (e) => {
        e.stopPropagation();
        openFolderColorPicker(folder.id, colorDot);
    });

    // Count
    const count = document.createElement('span');
    count.className = 'space-count';
    count.textContent = countFolder(folder.id);

    // Actions (visible on hover)
    const actions = document.createElement('span');
    actions.className = 'space-actions';

    const delBtn = document.createElement('button');
    delBtn.className = 'space-action danger';
    delBtn.type = 'button';
    delBtn.title = 'Delete Space';
    delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); confirmDeleteFolder(folder.id); });

    actions.appendChild(delBtn);

    row.appendChild(caret);
    row.appendChild(icon);
    row.appendChild(name);
    row.appendChild(colorDot);
    row.appendChild(count);
    row.appendChild(actions);

    // Click on row selects the folder view and toggles collapse, double click on name renames
    row.addEventListener('click', (e) => {
        if (e.target.closest('.space-caret, .space-color-trigger, .space-action')) return;

        if (e.detail === 2 && e.target.classList.contains('space-name')) {
            clearTimeout(row._clickTimeout);
            startRenameFolder(folder.id, name);
            return;
        }

        clearTimeout(row._clickTimeout);
        row._clickTimeout = setTimeout(() => {
            setView(`folder:${folder.id}`);
            folder.collapsed = !folder.collapsed;
            saveState();
            renderSpaceTree();
        }, 220);
    });

    // Drag drop target
    row.addEventListener('dragover', (e) => {
        if (!dragNoteId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
    });
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        const noteId = dragNoteId || e.dataTransfer.getData('text/plain');
        if (noteId) moveNoteToFolder(noteId, folder.id);
    });

    li.appendChild(row);

    if (hasTreeChildren && !isCollapsed) {
        const childUl = document.createElement('ul');
        childUl.className = 'space-children';
        folderNotes.forEach(n => childUl.appendChild(buildTreeNoteNode(n)));
        children.forEach(c => childUl.appendChild(buildSpaceNode(c, true, visibleIds, forceExpanded)));
        if (shouldShowEmptyHint) childUl.appendChild(buildFolderEmptyHint(folder.id));
        li.appendChild(childUl);
    }

    return li;
}



function buildFolderEmptyHint(folderId) {
    const li = document.createElement('li');
    li.className = 'folder-empty-hint';

    const text = document.createElement('span');
    text.textContent = 'Drag a note here or create a note in this folder.';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'New Note';
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        newNote(folderId);
    });

    li.appendChild(text);
    li.appendChild(btn);
    return li;
}

function buildTreeNoteNode(n) {
    const li = document.createElement('li');
    li.className = 'tree-note-li';

    const row = document.createElement('div');
    row.className = 'tree-note-row';
    row.dataset.id = n.id;
    row.draggable = true;
    if (n.id === state.selectedId) row.classList.add('active');
    if (n.color) row.style.setProperty('--note-color', n.color);

    const chip = document.createElement('span');
    chip.className = 'note-color-chip';

    const text = document.createElement('span');
    text.className = 'tree-note-text';

    const title = document.createElement('span');
    title.className = 'tree-note-title';
    title.textContent = (n.title || '').trim() ? n.title : DEFAULT_NOTE_TITLE;

    const preview = document.createElement('span');
    preview.className = 'tree-note-preview';
    const body = stripHtml(n.html).trim();
    preview.textContent = body || relativeTime(n.updatedAt);

    text.appendChild(title);
    text.appendChild(preview);
    row.appendChild(chip);
    row.appendChild(text);

    if (n.pinned) {
        const pin = document.createElement('span');
        pin.className = 'note-pin-icon';
        pin.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-5-4-5 4 2-7-5-4h6z"/></svg>`;
        row.appendChild(pin);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'tree-note-delete';
    delBtn.type = 'button';
    delBtn.title = 'Delete note';
    delBtn.setAttribute('aria-label', 'Delete note');
    delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;
    delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(n.id);
    });
    row.appendChild(delBtn);

    row.addEventListener('click', (e) => {
        e.stopPropagation();
        selectNote(n.id);
    });
    row.addEventListener('dragstart', (e) => {
        dragNoteId = n.id;
        row.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', n.id); } catch {}
        e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend', () => {
        dragNoteId = null;
        row.classList.remove('dragging');
        $$('.drag-over, .drag-over-before, .drag-over-after').forEach(el => el.classList.remove('drag-over', 'drag-over-before', 'drag-over-after'));
    });
    row.addEventListener('dragover', (e) => {
        if (!dragNoteId || dragNoteId === n.id) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = row.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const isBefore = relativeY < rect.height / 2;
        if (isBefore) {
            row.classList.add('drag-over-before');
            row.classList.remove('drag-over-after');
        } else {
            row.classList.add('drag-over-after');
            row.classList.remove('drag-over-before');
        }
    });
    row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over-before', 'drag-over-after');
    });
    row.addEventListener('drop', (e) => {
        if (!dragNoteId || dragNoteId === n.id) return;
        e.preventDefault();
        e.stopPropagation();
        row.classList.remove('drag-over-before', 'drag-over-after');
        const rect = row.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const isBefore = relativeY < rect.height / 2;
        reorderNote(dragNoteId, n.id, isBefore);
    });

    li.appendChild(row);
    return li;
}

/* ---------- Tree note refresh ---------- */
function renderNotesList() {
    renderSpaceTree();
}

function sectionLabel(text, iconPath) {
    const el = document.createElement('div');
    el.className = 'section-label';
    if (iconPath) {
        el.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">${iconPath}</svg>`;
    }
    el.appendChild(document.createTextNode(' ' + text));
    return el;
}

function buildNoteCard(n) {
    const card = document.createElement('article');
    card.className = 'note-card';
    card.dataset.id = n.id;
    card.draggable = true;
    if (n.id === state.selectedId) card.classList.add('active');
    if (n.color) {
        card.classList.add('has-color');
        card.style.setProperty('--note-color', n.color);
    }

    const head = document.createElement('div');
    head.className = 'note-card-head';

    const chip = document.createElement('span');
    chip.className = 'note-color-chip';

    const title = document.createElement('div');
    title.className = 'note-card-title';
    title.textContent = n.title || DEFAULT_NOTE_TITLE;

    head.appendChild(chip);
    head.appendChild(title);

    if (n.pinned) {
        const pin = document.createElement('span');
        pin.className = 'note-pin-icon';
        pin.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 6h6l-5 4 2 7-5-4-5 4 2-7-5-4h6z"/></svg>`;
        head.appendChild(pin);
    }

    const preview = document.createElement('div');
    preview.className = 'note-card-preview';
    preview.textContent = stripHtml(n.html).slice(0, 160) || '—';

    const meta = document.createElement('div');
    meta.className = 'note-card-meta';
    const parts = [];
    parts.push(`<span>${relativeTime(n.updatedAt)}</span>`);
    if (n.folderId) parts.push(`<span class="meta-tag">${escapeHtml(folderName(n.folderId) || '')}</span>`);
    if (n.tags?.length) {
        parts.push(`<span class="meta-tag">#${escapeHtml(n.tags[0])}</span>`);
        if (n.tags.length > 1) parts.push(`<span class="meta-tag">+${n.tags.length - 1}</span>`);
    }
    meta.innerHTML = parts.join('<span class="meta-dot">·</span>');

    card.appendChild(head);
    card.appendChild(preview);
    card.appendChild(meta);

    card.addEventListener('click', () => selectNote(n.id));

    // Drag
    card.addEventListener('dragstart', (e) => {
        dragNoteId = n.id;
        card.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', n.id); } catch {}
        e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
        dragNoteId = null;
        card.classList.remove('dragging');
        $$('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    return card;
}

/* ---------- Editor render ---------- */
function renderEditor() {
    const note = currentNote();
    const editorBody = $('#editorBody');
    const empty = $('#emptyState');

    if (!note) {
        editorBody.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }
    editorBody.classList.remove('hidden');
    empty.classList.add('hidden');
    savedEditorRange = null;

    if (document.activeElement !== $('#titleInput')) {
        $('#titleInput').value = note.title || '';
    }
    if (document.activeElement !== $('#editor')) {
        $('#editor').innerHTML = note.html || '';
    }

    // Set workspace font family
    const noteFont = note.settings?.fontKey || note.fontKey || 'system-ui';
    const fontBtn = $('#fontFamilyBtn');
    if (fontBtn) fontBtn.textContent = noteFont === 'system-ui' ? 'Sans' : noteFont;
    $('#editor').style.fontFamily = cssFont(noteFont);

    // Set note font size
    const noteSize = note.settings?.fontSize || note.fontSize || '16px';
    updateSizeBtn(noteSize);
    $('#editor').style.fontSize = noteSize;

    // Pin badge
    const pinBadge = $('#pinBadge');
    pinBadge.classList.toggle('hidden', !note.pinned);
    $('#pinActionLabel').textContent = note.pinned ? 'Unpin' : 'Pin';

    const pinBtn = $('#pinBtn');
    if (pinBtn) {
        pinBtn.classList.toggle('is-active', note.pinned);
        pinBtn.title = note.pinned ? 'Unpin note' : 'Pin note';
    }

    const firstDot = pinBadge.nextElementSibling;
    if (firstDot && firstDot.classList.contains('dot')) {
        firstDot.classList.toggle('hidden', !note.pinned);
    }

    // Meta — update inner text spans to preserve the SVG icons
    const metaDateText = $('#metaUpdated .meta-date-text');
    if (metaDateText) metaDateText.textContent = `Modified ${relativeTime(note.updatedAt)}`;
    const fName = folderName(note.folderId);
    const metaFolderText = $('#metaFolder .meta-folder-text');
    if (metaFolderText) metaFolderText.textContent = fName || 'No Folder';

    // Color background of the editor pad (sutil)
    const pad = $('#editor');
    if (note.color) {
        pad.style.setProperty('--note-color', note.color);
    } else {
        pad.style.removeProperty('--note-color');
    }

    // Text color for whole note
    if (note.textColor) {
        pad.style.color = note.textColor;
    } else {
        pad.style.removeProperty('color');
    }

    // Update text color indicator bar
    const tcBar = $('#textColorBar');
    if (tcBar) tcBar.style.background = note.textColor || '';

    // Color palette state
    renderColorPalette(note.color);

    // Tags
    renderTags(note.tags || []);
}

function mixWithPaper(hex, mix = 0.5) {
    // Mezcla un color hex con paper (usa color-mix CSS si está disponible)
    return `color-mix(in srgb, ${hex} ${Math.round(mix * 100)}%, transparent)`;
}

function renderColorPalette(activeColor) {
    const pal = $('#colorPalette');
    pal.innerHTML = '';

    // None (no color)
    const none = document.createElement('button');
    none.className = 'swatch none' + (!activeColor ? ' active' : '');
    none.title = 'No Color';
    none.addEventListener('click', () => setNoteColor(null));
    pal.appendChild(none);

    getThemeSwatches().forEach(sw => {
        const btn = document.createElement('button');
        btn.className = 'swatch' + (activeColor === sw.value ? ' active' : '');
        btn.style.background = sw.value;
        btn.title = sw.label;
        btn.addEventListener('click', () => setNoteColor(sw.value));
        pal.appendChild(btn);
    });

    // Custom (color picker)
    const isCustom = activeColor && !getThemeSwatches().find(s => s.value === activeColor);
    const custom = document.createElement('button');
    custom.className = 'swatch custom' + (isCustom ? ' active' : '');
    custom.title = 'Custom Color';
    if (isCustom) custom.style.background = activeColor;
    custom.addEventListener('click', () => {
        const rect = custom.getBoundingClientRect();
        openGenericColorPicker(rect, {
            popId: 'noteBgColorPop',
            title: 'Note Background',
            initColor: activeColor || '#FFD976',
            swatches: getThemeSwatches(),
            recentKey: 'recentBgColors',
            onLive: (hex) => {
                const pad = $('#editor');
                if (pad) pad.style.setProperty('--note-color', hex);
            },
            onCommit: (hex) => setNoteColor(hex),
            onReset: () => setNoteColor(null),
        });
    });
    pal.appendChild(custom);
}

function renderTags(tags) {
    const row = $('#tagsRow');
    // Save the input element to preserve it
    const oldInput = $('#tagInput');
    row.innerHTML = '';
    tags.forEach(t => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `#${escapeHtml(t)}<button class="tag-x" type="button" aria-label="Remove tag" title="Remove">
            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>`;
        chip.querySelector('.tag-x').addEventListener('click', (e) => {
            e.stopPropagation();
            removeTag(t);
        });
        row.appendChild(chip);
    });
    const input = document.createElement('input');
    input.id = 'tagInput';
    input.className = 'tag-input';
    input.placeholder = 'Add tag and press Enter…';
    input.addEventListener('keydown', handleTagInput);
    row.appendChild(input);
}

/* ===========================================================
   ACTIONS
   =========================================================== */

function currentNote() {
    return state.notes.find(n => n.id === state.selectedId) || null;
}

function setView(view) {
    state.view = view;
    saveState();
    renderActiveNav();
    renderSpaceTree();
}

function selectNote(id) {
    state.selectedId = id;
    saveState();
    $$('.tree-note-row, .note-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));
    renderEditor();
}

function newNote(folderId) {
    const ts = nowIso();
    const targetFolderId = typeof folderId === 'string'
        ? folderId
        : (state.view.startsWith('folder:') ? state.view.slice(7) : null);

    const siblings = state.notes.filter(n => n.folderId === targetFolderId);
    let minOrder = 0;
    siblings.forEach(n => {
        if (typeof n.order === 'number' && n.order < minOrder) {
            minOrder = n.order;
        }
    });

    const note = {
        id: uid(),
        title: '',
        html: '',
        tags: [],
        color: null,
        textColor: null,
        pinned: false,
        folderId: targetFolderId,
        createdAt: ts,
        updatedAt: ts,
        order: minOrder - 1
    };
    if (targetFolderId) {
        state.view = `folder:${targetFolderId}`;
        const folder = state.folders.find(f => f.id === targetFolderId);
        if (folder) folder.collapsed = false;
    }
    state.notes.unshift(note);
    state.selectedId = note.id;
    saveState();
    renderAll();
    setTimeout(() => $('#titleInput').focus(), 30);
}

function deleteNote(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;
    const label = note.title ? `"${note.title}"` : 'this note';
    if (!confirm(`Delete ${label}? This action cannot be undone.`)) return;
    state.notes = state.notes.filter(n => n.id !== id);
    if (state.selectedId === id) state.selectedId = state.notes[0]?.id ?? null;
    saveState();
    renderAll();
    showToast('Note deleted');
}

function duplicateNote(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;
    const copy = { ...note, id: uid(), title: (note.title ? note.title + ' (copy)' : 'Untitled (copy)'),
        tags: [...(note.tags || [])], createdAt: nowIso(), updatedAt: nowIso(), pinned: false };
    state.notes.unshift(copy);
    state.selectedId = copy.id;
    saveState();
    renderAll();
    showToast('Note duplicated');
}

function togglePin(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = nowIso();
    saveState();
    renderAll();
    showToast(note.pinned ? 'Note pinned' : 'Note unpinned');
}

function setNoteColor(color) {
    const note = currentNote();
    if (!note) return;
    note.color = color || null;
    note.updatedAt = nowIso();
    saveState();
    renderColorPalette(color);
    // Update pad bg
    const pad = $('#editor');
    if (color) pad.style.setProperty('--note-color', color);
    else pad.style.removeProperty('--note-color');
    renderNotesList();
}

function moveNoteToFolder(noteId, folderId) {
    const note = state.notes.find(n => n.id === noteId);
    if (!note) return;
    note.folderId = folderId || null;
    note.updatedAt = nowIso();
    if (folderId) {
        const f = state.folders.find(x => x.id === folderId);
        // Auto-expand to show note inside parent if needed
        if (f) f.collapsed = false;
    } else {
        // Switch view to 'all' so they can see the note at the root level
        state.view = 'all';
    }
    saveState();
    renderAll();
    showToast(folderId ? `Moved to "${folderName(folderId) || 'space'}"` : 'Moved out of folders');
}

function reorderNote(draggedId, targetId, isBefore) {
    const draggedNote = state.notes.find(n => n.id === draggedId);
    const targetNote = state.notes.find(n => n.id === targetId);
    if (!draggedNote || !targetNote) return;

    const term = $('#searchInput')?.value || '';
    if (state.view === 'recent' || term.trim()) {
        showToast("Reordering is disabled in recent and search views");
        return;
    }

    let siblings;
    if (state.view === 'pinned') {
        siblings = state.notes.filter(n => n.pinned && n.id !== draggedNote.id);
        siblings.sort(sortNotesForTree);
        const targetIndex = siblings.findIndex(n => n.id === targetId);
        if (targetIndex !== -1) {
            const insertIndex = isBefore ? targetIndex : targetIndex + 1;
            siblings.splice(insertIndex, 0, draggedNote);
        }
        siblings.forEach((note, idx) => {
            note.order = idx;
        });
    } else {
        const oldFolderId = draggedNote.folderId;
        const newFolderId = targetNote.folderId;
        
        draggedNote.folderId = newFolderId;
        draggedNote.pinned = targetNote.pinned;
        draggedNote.updatedAt = nowIso();

        siblings = state.notes.filter(n => 
            (n.folderId || null) === (newFolderId || null) && 
            n.pinned === targetNote.pinned && 
            n.id !== draggedNote.id
        );
        siblings.sort(sortNotesForTree);
        const targetIndex = siblings.findIndex(n => n.id === targetId);
        if (targetIndex !== -1) {
            const insertIndex = isBefore ? targetIndex : targetIndex + 1;
            siblings.splice(insertIndex, 0, draggedNote);
        }
        siblings.forEach((note, idx) => {
            note.order = idx;
        });
    }

    saveState();
    renderAll();
    showToast("Note reordered");
}

/* ---------- Tag input ---------- */
function handleTagInput(e) {
    const input = e.currentTarget;
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = input.value.trim().replace(/^#/, '');
        if (!val) return;
        addTag(val);
        input.value = '';
    } else if (e.key === 'Backspace' && !input.value) {
        const note = currentNote();
        if (note && note.tags?.length) {
            note.tags.pop();
            note.updatedAt = nowIso();
            saveState();
            renderTags(note.tags);
            renderNotesList();
        }
    }
}
function addTag(tag) {
    const note = currentNote();
    if (!note) return;
    note.tags = note.tags || [];
    if (note.tags.includes(tag)) return;
    note.tags.push(tag);
    note.updatedAt = nowIso();
    saveState();
    renderTags(note.tags);
    setTimeout(() => $('#tagInput')?.focus(), 0);
    renderNotesList();
}
function removeTag(tag) {
    const note = currentNote();
    if (!note) return;
    note.tags = (note.tags || []).filter(t => t !== tag);
    note.updatedAt = nowIso();
    saveState();
    renderTags(note.tags);
    renderNotesList();
}

/* ===========================================================
   FOLDERS / SPACES
   =========================================================== */

function createFolder(parentId = null) {
    const f = {
        id: uid(),
        name: '',
        parentId: parentId || null,
        color: null,
        collapsed: false
    };
    // Si es root y el padre está colapsado, lo expando
    if (parentId) {
        const parent = state.folders.find(x => x.id === parentId);
        if (parent) parent.collapsed = false;
    }
    state.folders.push(f);
    saveState();
    renderSpaceTree();
    setTimeout(() => {
        const row = document.querySelector(`.space-row[data-folder-id="${f.id}"] .space-name`);
        if (row) startRenameFolder(f.id, row);
    }, 30);
}

function startRenameFolder(folderId, nameEl) {
    const f = state.folders.find(x => x.id === folderId);
    if (!f || !nameEl) return;
    isRenamingFolder = true;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'space-rename-input';
    input.value = f.name || '';
    input.placeholder = DEFAULT_FOLDER_NAME;
    nameEl.replaceWith(input);
    input.focus();
    input.select();
    const finish = (commit) => {
        isRenamingFolder = false;
        if (commit) {
            const currentFolder = state.folders.find(x => x.id === folderId);
            if (currentFolder) {
                currentFolder.name = input.value.trim() || '';
                saveState();
            }
        }
        renderSpaceTree();
    };
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.value = f.name || ''; input.blur(); }
    });
    input.addEventListener('click', (e) => e.stopPropagation());
}

let activeFolderColorId = null;
function setFolderColor(folderId, color) {
    const f = state.folders.find(x => x.id === folderId);
    if (!f) return;
    f.color = color || null;
    saveState();
    renderSpaceTree();
}

function closeFolderColorPopover() {
    $('#folderColorPopover')?.remove();
    activeFolderColorId = null;
}

function openFolderColorPicker(folderId, anchorEl) {
    closeFolderColorPopover();
    activeFolderColorId = folderId;
    const f = state.folders.find(x => x.id === folderId);
    if (!f) return;

    const pop = document.createElement('div');
    pop.id = 'folderColorPopover';
    pop.className = 'folder-color-popover';
    pop.innerHTML = `<div class="folder-color-title">Folder Color</div>`;

    const grid = document.createElement('div');
    grid.className = 'folder-color-grid';

    const makeSwatch = (color, label, extraClass = '') => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `folder-color-swatch ${extraClass}`.trim();
        btn.title = label;
        btn.setAttribute('aria-label', label);
        if (color) btn.style.background = color;
        if ((color || null) === (f.color || null)) btn.classList.add('active');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            setFolderColor(folderId, color);
            closeFolderColorPopover();
        });
        return btn;
    };

    grid.appendChild(makeSwatch(null, 'No Color', 'none'));
    FOLDER_COLORS.forEach(sw => grid.appendChild(makeSwatch(sw.value, sw.label)));

    const custom = document.createElement('button');
    custom.type = 'button';
    custom.className = 'folder-color-swatch custom';
    custom.title = 'Custom Color';
    custom.setAttribute('aria-label', 'Custom Color');
    custom.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = custom.getBoundingClientRect();
        closeFolderColorPopover();
        openGenericColorPicker(rect, {
            popId: 'folderCustomColorPop',
            title: 'Folder Color',
            initColor: f.color || '#C45BFF',
            swatches: getThemeSwatches(),
            recentKey: 'recentFolderColors',
            onLive: (hex) => setFolderColor(folderId, hex),
            onCommit: (hex) => setFolderColor(folderId, hex),
            onReset: () => setFolderColor(folderId, null),
        });
    });
    grid.appendChild(custom);

    pop.appendChild(grid);
    document.body.appendChild(pop);

    const rect = anchorEl?.getBoundingClientRect?.() || { right: 12, top: 120 };
    const left = Math.min(rect.right + 8, window.innerWidth - 198);
    const top = Math.min(Math.max(12, rect.top - 12), window.innerHeight - 138);
    pop.style.left = `${Math.max(12, left)}px`;
    pop.style.top = `${top}px`;
}

function confirmDeleteFolder(folderId) {
    const f = state.folders.find(x => x.id === folderId);
    if (!f) return;
    const noteCount = state.notes.filter(n => n.folderId === folderId).length;
    const children = state.folders.filter(x => x.parentId === folderId);
    const msg = noteCount + children.length > 0
        ? `Delete "${f.name || 'Untitled'}"?\nIts ${noteCount} note(s) and ${children.length} subfolder(s) will be unassigned (not deleted).`
        : `Delete space "${f.name || 'Untitled'}"?`;
    if (!confirm(msg)) return;
    // Move notes out
    state.notes.forEach(n => { if (n.folderId === folderId) n.folderId = null; });
    // Promote children to roots
    state.folders.forEach(x => { if (x.parentId === folderId) x.parentId = null; });
    state.folders = state.folders.filter(x => x.id !== folderId);
    if (state.view === `folder:${folderId}`) state.view = 'all';
    saveState();
    renderAll();
    showToast('Space deleted');
}

/* ===========================================================
   FORMATTING — applied to selection
   =========================================================== */

function saveEditorSelection() {
    const editor = $('#editor');
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return;
    if (!editor.contains(sel.anchorNode) || !editor.contains(sel.focusNode)) return;
    savedEditorRange = sel.getRangeAt(0).cloneRange();
}

function restoreEditorSelection() {
    if (!savedEditorRange) return false;
    const editor = $('#editor');
    if (!editor || !editor.contains(savedEditorRange.commonAncestorContainer)) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedEditorRange);
    return true;
}

function execCmdOnSelection(cmd, value = null) {
    // execCommand respects selection for these
    const editor = $('#editor');
    if (!editor) return;
    editor.focus({ preventScroll: true });
    restoreEditorSelection();
    try {
        document.execCommand('styleWithCSS', false, true);
    } catch {}
    document.execCommand(cmd, false, value);
    saveEditorSelection();
    persistEditor();
}

function applyToSelectionCss(prop, value) {
    const editor = $('#editor');
    if (!editor) return false;
    // Asegurar foco en el editor
    editor.focus({ preventScroll: true });
    restoreEditorSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
        showToast('Select text first');
        return false;
    }
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
        showToast('Select text first');
        return false;
    }
    const span = document.createElement('span');
    span.style[prop] = value;
    try {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
        // Reselect contents of the new span
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.addRange(newRange);
        saveEditorSelection();
        persistEditor();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

/* =========================================================
   TEXT COLOR — CUSTOM PICKER
   ========================================================= */

/* Color math */
function tcHsvToHex(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    let r, g, b;
    if      (h < 60)  { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    const toH = n => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return '#' + toH(r) + toH(g) + toH(b);
}

function tcHexToHsv(hex) {
    const s = (hex || '').replace('#', '').padEnd(6, '0');
    const r = parseInt(s.slice(0, 2), 16) / 255;
    const g = parseInt(s.slice(2, 4), 16) / 255;
    const b = parseInt(s.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let hv = 0;
    if (d > 0) {
        if      (max === r) hv = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        else if (max === g) hv = ((b - r) / d + 2) * 60;
        else                hv = ((r - g) / d + 4) * 60;
    }
    return { h: hv, s: max === 0 ? 0 : d / max, v: max };
}

function tcDrawCanvas(ctx, w, h, hue) {
    const sg = ctx.createLinearGradient(0, 0, w, 0);
    sg.addColorStop(0, 'rgba(255,255,255,1)');
    sg.addColorStop(1, `hsl(${hue},100%,50%)`);
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, 'rgba(0,0,0,0)');
    bg.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
}

function tcAddRecent(color) {
    if (!color || color === 'inherit') return;
    state.ui.recentTextColors = state.ui.recentTextColors || [];
    state.ui.recentTextColors = [color,
        ...state.ui.recentTextColors.filter(c => c !== color)
    ].slice(0, 7);
    saveState();
}

let _tcOnClose = null;

function closeTextColorPopover() {
    if (typeof _tcOnClose === 'function') {
        try { _tcOnClose(); } catch (_) {}
        _tcOnClose = null;
    }
    const pop = $('#textColorPopover');
    if (pop) pop.remove();
    $('#textColorBtn')?.setAttribute('aria-expanded', 'false');
}

function closeAllPopovers() {
    closeTextColorPopover();
    closeGenericColorPicker('noteBgColorPop');
    closeGenericColorPicker('folderCustomColorPop');
    closeFontPicker();
    closeTextStylePicker();
}

function applyTextColorToSelection(color) {
    const editor = $('#editor');
    if (!editor) return;
    editor.focus({ preventScroll: true });
    restoreEditorSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed) {
        showToast('Select text first');
        return;
    }
    try {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, color || 'inherit');
    } catch {}
    saveEditorSelection();
    persistEditor();
    showToast(color ? 'Color applied' : 'Color reset');
}

function setNoteTextColor(color) {
    const note = currentNote();
    if (!note) return;
    note.textColor = color || null;
    note.updatedAt = nowIso();
    saveState();
    const pad = $('#editor');
    if (color) pad.style.color = color; else pad.style.removeProperty('color');
    const tcBar = $('#textColorBar');
    if (tcBar) tcBar.style.background = color || '';
    showToast(color ? 'Text color applied' : 'Text color reset');
}

function openTextColorPopover(anchorEl) {
    closeAllPopovers();

    // --- state ---
    // Clone the range so execCommand DOM changes don't invalidate our reference
    let selRange = null;
    try {
        if (savedEditorRange && !savedEditorRange.collapsed) selRange = savedEditorRange.cloneRange();
    } catch (_) {}
    let mode = 'selection';
    let hasInteracted = false;
    const initColor = currentNote()?.textColor || '#7C3AED';
    let { h: hue, s: sat, v: val } = tcHexToHsv(initColor);
    const getHex = () => tcHsvToHex(hue, sat, val);

    // Apply foreColor to the saved selection range.
    // After each execCommand the DOM may change (span created/replaced), so we
    // refresh selRange from the browser's post-command selection each time.
    const applySelColor = (color) => {
        if (!selRange || selRange.collapsed) { showToast('Select text first'); return; }
        const editor = $('#editor');
        if (!editor) return;
        editor.focus({ preventScroll: true });
        const sel = window.getSelection();
        if (!sel) return;
        sel.removeAllRanges();
        try { sel.addRange(selRange.cloneRange()); } catch (_) { return; }
        if (!sel.rangeCount || sel.getRangeAt(0).collapsed) return;
        try {
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('foreColor', false, color || 'inherit');
        } catch {}
        // Keep selRange in sync with the post-apply DOM so next call stays valid
        const selAfter = window.getSelection();
        if (selAfter && selAfter.rangeCount > 0) {
            try { selRange = selAfter.getRangeAt(0).cloneRange(); } catch (_) {}
        }
        persistEditor();
    };

    // Debounced live apply
    let applyTimer = null;
    const liveApply = () => {
        hasInteracted = true;
        clearTimeout(applyTimer);
        applyTimer = setTimeout(() => {
            const hex = getHex();
            if (mode === 'whole') {
                const pad = $('#editor');
                if (pad) pad.style.color = hex;
                const bar = $('#textColorBar');
                if (bar) bar.style.background = hex;
            } else {
                applySelColor(hex);
            }
        }, 120);
    };

    // --- build DOM ---
    const pop = document.createElement('div');
    pop.id = 'textColorPopover';
    pop.className = 'text-color-popover';

    // Header
    const header = document.createElement('div');
    header.className = 'tc-popover-header';
    const titleEl = document.createElement('span');
    titleEl.className = 'tc-popover-title';
    titleEl.textContent = 'Text Color';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tc-popover-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;
    closeBtn.addEventListener('click', closeTextColorPopover);
    header.append(titleEl, closeBtn);
    pop.appendChild(header);

    // Tabs
    const tabsEl = document.createElement('div');
    tabsEl.className = 'tc-tabs';
    const makeTab = (label, modeKey) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tc-tab' + (mode === modeKey ? ' active' : '');
        btn.textContent = label;
        btn.addEventListener('click', () => {
            mode = modeKey;
            tabsEl.querySelectorAll('.tc-tab').forEach(t => t.classList.toggle('active', t === btn));
            if (modeKey === 'whole') {
                const nc = currentNote()?.textColor;
                if (nc) { const hsv = tcHexToHsv(nc); hue = hsv.h; sat = hsv.s; val = hsv.v; }
                syncAll();
            }
        });
        return btn;
    };
    tabsEl.append(makeTab('Selection', 'selection'), makeTab('Whole note', 'whole'));
    pop.appendChild(tabsEl);

    // Canvas
    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'tc-canvas-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'tc-canvas';
    const CW = 256, CH = 148;
    canvas.width = CW; canvas.height = CH;
    const cursor = document.createElement('div');
    cursor.className = 'tc-cursor';
    canvasWrap.append(canvas, cursor);
    pop.appendChild(canvasWrap);

    // Hue slider
    const hueWrap = document.createElement('div');
    hueWrap.className = 'tc-hue-wrap';
    const hueSlider = document.createElement('input');
    hueSlider.type = 'range'; hueSlider.min = 0; hueSlider.max = 360; hueSlider.step = 1;
    hueSlider.className = 'tc-hue'; hueSlider.value = hue;
    hueSlider.addEventListener('input', () => {
        hue = parseFloat(hueSlider.value);
        const ctx = canvas.getContext('2d');
        tcDrawCanvas(ctx, CW, CH, hue);
        syncBottom();
        liveApply();
    });
    hueWrap.appendChild(hueSlider);
    pop.appendChild(hueWrap);

    // Preview + hex
    const bottom = document.createElement('div');
    bottom.className = 'tc-bottom';
    const previewEl = document.createElement('div');
    previewEl.className = 'tc-preview';
    const hexWrap = document.createElement('div');
    hexWrap.className = 'tc-hex-wrap';
    const hexPrefix = document.createElement('span');
    hexPrefix.className = 'tc-hex-prefix'; hexPrefix.textContent = '#';
    const hexInput = document.createElement('input');
    hexInput.type = 'text'; hexInput.className = 'tc-hex';
    hexInput.maxLength = 6; hexInput.spellcheck = false;
    hexInput.addEventListener('input', () => {
        const v6 = hexInput.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
        hexInput.value = v6.toUpperCase();
        if (v6.length === 6) {
            const hsv = tcHexToHsv('#' + v6);
            hue = hsv.h; sat = hsv.s; val = hsv.v;
            hueSlider.value = hue;
            tcDrawCanvas(canvas.getContext('2d'), CW, CH, hue);
            updateCursor();
            previewEl.style.background = '#' + v6;
            syncSwatchActive();
            liveApply();
        }
    });
    hexWrap.append(hexPrefix, hexInput);
    bottom.append(previewEl, hexWrap);
    pop.appendChild(bottom);

    // Preset swatches
    const presetsLbl = document.createElement('div');
    presetsLbl.className = 'tc-section-label'; presetsLbl.textContent = 'Presets';
    pop.appendChild(presetsLbl);
    const presetsRow = document.createElement('div');
    presetsRow.className = 'tc-swatches-row';

    const resetSwatch = document.createElement('button');
    resetSwatch.type = 'button'; resetSwatch.className = 'tc-mini-swatch reset';
    resetSwatch.title = 'Default color';
    resetSwatch.addEventListener('click', () => {
        clearTimeout(applyTimer);
        if (mode === 'whole') setNoteTextColor(null);
        else applySelColor(null);
        closeTextColorPopover();
    });
    presetsRow.appendChild(resetSwatch);

    TEXT_COLORS.forEach(tc => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'tc-mini-swatch';
        btn.style.background = tc.value; btn.title = tc.label;
        btn.dataset.colorVal = tc.value;
        btn.addEventListener('click', () => {
            clearTimeout(applyTimer);
            tcAddRecent(tc.value);
            if (mode === 'whole') {
                setNoteTextColor(tc.value);
                _tcOnClose = null;
            } else {
                applySelColor(tc.value);
                showToast('Color applied');
            }
            closeTextColorPopover();
        });
        presetsRow.appendChild(btn);
    });
    pop.appendChild(presetsRow);

    // Recent swatches
    const recents = (state.ui.recentTextColors || []).filter(Boolean);
    if (recents.length > 0) {
        const recLbl = document.createElement('div');
        recLbl.className = 'tc-section-label';
        recLbl.style.marginTop = '8px'; recLbl.textContent = 'Recent';
        pop.appendChild(recLbl);
        const recRow = document.createElement('div');
        recRow.className = 'tc-swatches-row';
        recents.forEach(color => {
            const btn = document.createElement('button');
            btn.type = 'button'; btn.className = 'tc-mini-swatch';
            btn.style.background = color; btn.title = color;
            btn.dataset.colorVal = color;
            btn.addEventListener('click', () => {
                clearTimeout(applyTimer);
                tcAddRecent(color);
                if (mode === 'whole') {
                    setNoteTextColor(color);
                    _tcOnClose = null;
                } else {
                    applySelColor(color);
                    showToast('Color applied');
                }
                closeTextColorPopover();
            });
            recRow.appendChild(btn);
        });
        pop.appendChild(recRow);
    }

    // --- canvas interaction ---
    const ctx = canvas.getContext('2d');

    const updateCursor = () => {
        cursor.style.left = `${sat * 100}%`;
        cursor.style.top = `${(1 - val) * 100}%`;
    };

    const syncBottom = () => {
        const hex = getHex();
        previewEl.style.background = hex;
        hexInput.value = hex.slice(1).toUpperCase();
    };

    const syncSwatchActive = () => {
        const hex = getHex().toUpperCase();
        presetsRow.querySelectorAll('.tc-mini-swatch[data-color-val]').forEach(b => {
            b.classList.toggle('active', (b.dataset.colorVal || '').toUpperCase() === hex);
        });
    };

    const syncAll = () => {
        tcDrawCanvas(ctx, CW, CH, hue);
        hueSlider.value = hue;
        updateCursor();
        syncBottom();
        syncSwatchActive();
    };

    const pickFromCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        sat = x / rect.width;
        val = 1 - y / rect.height;
        updateCursor();
        syncBottom();
        syncSwatchActive();
        liveApply();
    };

    let isDragging = false;
    const onMouseMove = (e) => { if (isDragging) pickFromCanvas(e); };
    const onMouseUp = () => { isDragging = false; };
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true; pickFromCanvas(e); e.preventDefault();
    });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // --- on close: persist and clean up ---
    _tcOnClose = () => {
        clearTimeout(applyTimer);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (!hasInteracted) return;
        const hex = getHex();
        if (mode === 'whole') {
            setNoteTextColor(hex);
            tcAddRecent(hex);
        } else {
            persistEditor();
        }
    };

    // --- mount and position ---
    document.body.appendChild(pop);
    $('#textColorBtn')?.setAttribute('aria-expanded', 'true');

    requestAnimationFrame(() => syncAll());

    const rect = anchorEl.getBoundingClientRect();
    const popW = 284;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - popW - 8));
    pop.style.top = `${rect.bottom + 6}px`;
    pop.style.left = `${left}px`;
}

/* =========================================================
   GENERIC COLOR PICKER (note bg, folder color)
   ========================================================= */

const _genericPickerOnClose = {};

function closeGenericColorPicker(popId) {
    if (typeof _genericPickerOnClose[popId] === 'function') {
        try { _genericPickerOnClose[popId](); } catch (_) {}
        delete _genericPickerOnClose[popId];
    }
    document.getElementById(popId)?.remove();
}

function openGenericColorPicker(anchorRect, { popId, title, initColor, swatches, recentKey, onLive, onCommit, onReset }) {
    closeAllPopovers();

    let { h: hue, s: sat, v: val } = tcHexToHsv(initColor || '#C45BFF');
    const getHex = () => tcHsvToHex(hue, sat, val);
    let hasInteracted = false;

    const liveApply = (() => {
        let t = null;
        return () => {
            hasInteracted = true;
            clearTimeout(t);
            t = setTimeout(() => { if (onLive) onLive(getHex()); }, 80);
        };
    })();

    const pop = document.createElement('div');
    pop.id = popId;
    pop.className = 'color-picker-pop';

    // Header
    const header = document.createElement('div');
    header.className = 'tc-popover-header';
    const titleEl = document.createElement('span');
    titleEl.className = 'tc-popover-title';
    titleEl.textContent = title;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tc-popover-close'; closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;
    closeBtn.addEventListener('click', () => closeGenericColorPicker(popId));
    header.append(titleEl, closeBtn);
    pop.appendChild(header);

    // Canvas
    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'tc-canvas-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'tc-canvas';
    const CW = 256, CH = 148;
    canvas.width = CW; canvas.height = CH;
    const cursor = document.createElement('div');
    cursor.className = 'tc-cursor';
    canvasWrap.append(canvas, cursor);
    pop.appendChild(canvasWrap);

    // Hue slider
    const hueWrap = document.createElement('div');
    hueWrap.className = 'tc-hue-wrap';
    const hueSlider = document.createElement('input');
    hueSlider.type = 'range'; hueSlider.min = 0; hueSlider.max = 360; hueSlider.step = 1;
    hueSlider.className = 'tc-hue'; hueSlider.value = hue;
    hueSlider.addEventListener('input', () => {
        hue = parseFloat(hueSlider.value);
        tcDrawCanvas(canvas.getContext('2d'), CW, CH, hue);
        syncBottom(); liveApply();
    });
    hueWrap.appendChild(hueSlider);
    pop.appendChild(hueWrap);

    // Preview + hex
    const bottom = document.createElement('div');
    bottom.className = 'tc-bottom';
    const previewEl = document.createElement('div');
    previewEl.className = 'tc-preview';
    const hexWrap = document.createElement('div');
    hexWrap.className = 'tc-hex-wrap';
    const hexPrefix = document.createElement('span');
    hexPrefix.className = 'tc-hex-prefix'; hexPrefix.textContent = '#';
    const hexInput = document.createElement('input');
    hexInput.type = 'text'; hexInput.className = 'tc-hex';
    hexInput.maxLength = 6; hexInput.spellcheck = false;
    hexInput.addEventListener('input', () => {
        const v6 = hexInput.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
        hexInput.value = v6.toUpperCase();
        if (v6.length === 6) {
            const hsv = tcHexToHsv('#' + v6);
            hue = hsv.h; sat = hsv.s; val = hsv.v;
            hueSlider.value = hue;
            tcDrawCanvas(canvas.getContext('2d'), CW, CH, hue);
            updateCursor(); previewEl.style.background = '#' + v6;
            syncSwatchActive(); liveApply();
        }
    });
    hexWrap.append(hexPrefix, hexInput);
    bottom.append(previewEl, hexWrap);
    pop.appendChild(bottom);

    // Presets
    const presetsLbl = document.createElement('div');
    presetsLbl.className = 'tc-section-label'; presetsLbl.textContent = 'Presets';
    pop.appendChild(presetsLbl);
    const presetsRow = document.createElement('div');
    presetsRow.className = 'tc-swatches-row';

    if (onReset) {
        const resetSwatch = document.createElement('button');
        resetSwatch.type = 'button'; resetSwatch.className = 'tc-mini-swatch reset';
        resetSwatch.title = 'No color';
        resetSwatch.addEventListener('click', () => {
            onReset(); closeGenericColorPicker(popId);
        });
        presetsRow.appendChild(resetSwatch);
    }

    (swatches || []).forEach(sw => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'tc-mini-swatch';
        btn.style.background = sw.value; btn.title = sw.label;
        btn.dataset.colorVal = sw.value;
        btn.addEventListener('click', () => {
            onCommit(sw.value);
            if (recentKey) {
                state.ui[recentKey] = [sw.value, ...(state.ui[recentKey] || []).filter(c => c !== sw.value)].slice(0, 7);
                saveState();
            }
            closeGenericColorPicker(popId);
        });
        presetsRow.appendChild(btn);
    });
    pop.appendChild(presetsRow);

    // Recent
    const recents = recentKey ? (state.ui[recentKey] || []).filter(Boolean) : [];
    if (recents.length > 0) {
        const recLbl = document.createElement('div');
        recLbl.className = 'tc-section-label';
        recLbl.style.marginTop = '8px'; recLbl.textContent = 'Recent';
        pop.appendChild(recLbl);
        const recRow = document.createElement('div');
        recRow.className = 'tc-swatches-row';
        recents.forEach(color => {
            const btn = document.createElement('button');
            btn.type = 'button'; btn.className = 'tc-mini-swatch';
            btn.style.background = color; btn.title = color;
            btn.dataset.colorVal = color;
            btn.addEventListener('click', () => {
                onCommit(color);
                if (recentKey) {
                    state.ui[recentKey] = [color, ...(state.ui[recentKey] || []).filter(c => c !== color)].slice(0, 7);
                    saveState();
                }
                closeGenericColorPicker(popId);
            });
            recRow.appendChild(btn);
        });
        pop.appendChild(recRow);
    }

    // Canvas interaction
    const ctx = canvas.getContext('2d');
    const updateCursor = () => {
        cursor.style.left = `${sat * 100}%`;
        cursor.style.top = `${(1 - val) * 100}%`;
    };
    const syncBottom = () => {
        const hex = getHex();
        previewEl.style.background = hex;
        hexInput.value = hex.slice(1).toUpperCase();
    };
    const syncSwatchActive = () => {
        const hex = getHex().toUpperCase();
        presetsRow.querySelectorAll('.tc-mini-swatch[data-color-val]').forEach(b => {
            b.classList.toggle('active', (b.dataset.colorVal || '').toUpperCase() === hex);
        });
    };
    const syncAll = () => {
        tcDrawCanvas(ctx, CW, CH, hue);
        hueSlider.value = hue;
        updateCursor(); syncBottom(); syncSwatchActive();
    };
    const pickFromCanvas = (e) => {
        const r = canvas.getBoundingClientRect();
        sat = Math.max(0, Math.min((e.clientX - r.left) / r.width, 1));
        val = Math.max(0, Math.min(1 - (e.clientY - r.top) / r.height, 1));
        updateCursor(); syncBottom(); syncSwatchActive(); liveApply();
    };
    let isDragging = false;
    const onMouseMove = (e) => { if (isDragging) pickFromCanvas(e); };
    const onMouseUp = () => { isDragging = false; };
    canvas.addEventListener('mousedown', (e) => { isDragging = true; pickFromCanvas(e); e.preventDefault(); });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    _genericPickerOnClose[popId] = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (!hasInteracted) return;
        const hex = getHex();
        onCommit(hex);
        if (recentKey) {
            state.ui[recentKey] = [hex, ...(state.ui[recentKey] || []).filter(c => c !== hex)].slice(0, 7);
            saveState();
        }
    };

    document.body.appendChild(pop);
    requestAnimationFrame(() => syncAll());

    const popW = 284;
    const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - popW - 8));
    let top = (anchorRect.bottom || anchorRect.top) + 6;
    if (top + 420 > window.innerHeight - 8) top = Math.max(8, anchorRect.top - 420 - 4);
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;
}

/* =========================================================
   FONT FAMILY PICKER
   ========================================================= */

function closeFontPicker() {
    document.getElementById('fontFamilyPop')?.remove();
    $('#fontFamilyBtn')?.setAttribute('aria-expanded', 'false');
}

function openFontPicker(anchorEl) {
    if (document.getElementById('fontFamilyPop')) { closeFontPicker(); return; }
    closeAllPopovers();

    const note = currentNote();
    const currentFont = note?.settings?.fontKey || note?.fontKey || 'system-ui';

    const pop = document.createElement('div');
    pop.id = 'fontFamilyPop';
    pop.className = 'font-picker-pop';

    const search = document.createElement('input');
    search.type = 'text'; search.className = 'ff-search';
    search.placeholder = 'Search font…';
    search.setAttribute('aria-label', 'Search fonts');
    pop.appendChild(search);

    const list = document.createElement('ul');
    list.className = 'ff-list';
    list.setAttribute('role', 'listbox');

    const renderList = (filter = '') => {
        list.innerHTML = '';
        const lower = filter.toLowerCase();
        const keys = filter
            ? FONT_KEYS.filter(k => (k === 'system-ui' ? 'sans' : k).toLowerCase().includes(lower))
            : FONT_KEYS;
        keys.forEach(key => {
            const label = key === 'system-ui' ? 'Sans' : key;
            const li = document.createElement('li');
            li.className = 'ff-item' + (key === currentFont ? ' active' : '');
            li.textContent = label;
            li.style.fontFamily = cssFont(key);
            li.setAttribute('role', 'option');
            li.addEventListener('click', () => {
                setNoteFont(key);
                closeFontPicker();
            });
            list.appendChild(li);
        });
        list.querySelector('.ff-item.active')?.scrollIntoView({ block: 'nearest' });
    };

    search.addEventListener('input', () => renderList(search.value));
    pop.appendChild(list);
    document.body.appendChild(pop);
    renderList();

    anchorEl.setAttribute('aria-expanded', 'true');

    const rect = anchorEl.getBoundingClientRect();
    const popW = 188;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - popW - 8));
    pop.style.top = `${rect.bottom + 4}px`;
    pop.style.left = `${left}px`;

    setTimeout(() => search.focus(), 30);
}

function setNoteFont(key) {
    const note = currentNote();
    if (!note) return;
    note.settings = note.settings || {};
    note.settings.fontKey = key;
    note.fontKey = key;
    note.updatedAt = nowIso();
    $('#editor').style.fontFamily = cssFont(key);
    const btn = $('#fontFamilyBtn');
    if (btn) btn.textContent = key === 'system-ui' ? 'Sans' : key;
    persistEditor();
}

/* =========================================================
   TEXT STYLE PICKER (font size + heading presets)
   ========================================================= */

function closeTextStylePicker() {
    document.getElementById('textStylePop')?.remove();
    $('#fontSizeBtn')?.setAttribute('aria-expanded', 'false');
}

function applyHeadingStyle(style) {
    const editor = $('#editor');
    if (!editor) return;
    editor.focus({ preventScroll: true });
    restoreEditorSelection();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.getRangeAt(0).collapsed) {
        showToast('Select text first');
        return;
    }
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = style.size;
    span.style.fontWeight = style.weight;
    span.style.lineHeight = style.lh;
    try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        sel.removeAllRanges();
        const nr = document.createRange();
        nr.selectNodeContents(span);
        sel.addRange(nr);
        saveEditorSelection();
        persistEditor();
        showToast(`${style.badge === '¶' || style.badge === 'Aa' ? style.preview : style.badge} applied`);
    } catch (_) {}
}

function applySize(size) {
    const note = currentNote();
    if (!note) return;
    note.settings = note.settings || {};
    note.settings.fontSize = size;
    note.fontSize = size;
    note.updatedAt = nowIso();
    $('#editor').style.fontSize = size;
    updateSizeBtn(size);
    persistEditor();
}

function updateSizeBtn(size) {
    const btn = $('#fontSizeBtn');
    if (btn) btn.textContent = size.replace('px', '');
}

function openTextStylePicker(anchorEl) {
    if (document.getElementById('textStylePop')) { closeTextStylePicker(); return; }
    closeAllPopovers();

    const note = currentNote();
    const activeSize = note?.settings?.fontSize || note?.fontSize || '16px';

    const pop = document.createElement('div');
    pop.id = 'textStylePop';
    pop.className = 'ts-picker-pop';

    // Header
    const header = document.createElement('div');
    header.className = 'tc-popover-header';
    const titleEl = document.createElement('span');
    titleEl.className = 'tc-popover-title';
    titleEl.textContent = 'Font Size';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button'; closeBtn.className = 'tc-popover-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;
    closeBtn.addEventListener('click', closeTextStylePicker);
    header.append(titleEl, closeBtn);
    pop.appendChild(header);

    const sizeList = document.createElement('ul');
    sizeList.className = 'ts-size-list';

    const markActive = (size) => {
        sizeList.querySelectorAll('.ts-size-item').forEach(p => {
            p.classList.toggle('active', p.dataset.size === size);
        });
    };

    let activeItem = null;
    SIZE_OPTIONS.forEach(size => {
        const item = document.createElement('li');
        item.className = 'ts-size-item' + (size === activeSize ? ' active' : '');
        item.dataset.size = size;
        const numSpan = document.createElement('span');
        numSpan.textContent = size.replace('px', '');
        const unitSpan = document.createElement('span');
        unitSpan.className = 'ts-size-item-unit';
        unitSpan.textContent = 'px';
        item.append(numSpan, unitSpan);
        item.addEventListener('click', () => {
            applySize(size);
            markActive(size);
            customInput.value = size.replace('px', '');
        });
        sizeList.appendChild(item);
        if (size === activeSize) activeItem = item;
    });
    pop.appendChild(sizeList);

    // ---- Custom size row ----
    const customRow = document.createElement('div');
    customRow.className = 'ts-custom-row';

    const minusBtn = document.createElement('button');
    minusBtn.type = 'button'; minusBtn.className = 'ts-custom-spin';
    minusBtn.textContent = '−'; minusBtn.title = 'Decrease size';

    const customInput = document.createElement('input');
    customInput.type = 'number'; customInput.className = 'ts-custom-input';
    customInput.min = 8; customInput.max = 200;
    customInput.value = parseInt(activeSize) || 16;

    const plusBtn = document.createElement('button');
    plusBtn.type = 'button'; plusBtn.className = 'ts-custom-spin';
    plusBtn.textContent = '+'; plusBtn.title = 'Increase size';

    const unit = document.createElement('span');
    unit.className = 'ts-custom-unit'; unit.textContent = 'px';

    const commitCustom = () => {
        const n = Math.max(8, Math.min(200, parseInt(customInput.value) || 16));
        customInput.value = n;
        const size = `${n}px`;
        applySize(size);
        markActive(size);
    };

    minusBtn.addEventListener('click', () => {
        customInput.value = Math.max(8, parseInt(customInput.value) - 1);
        commitCustom();
    });
    plusBtn.addEventListener('click', () => {
        customInput.value = Math.min(200, parseInt(customInput.value) + 1);
        commitCustom();
    });
    customInput.addEventListener('change', commitCustom);
    customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { commitCustom(); closeTextStylePicker(); }
    });

    customRow.append(minusBtn, customInput, unit, plusBtn);
    pop.appendChild(customRow);

    // Mount + position
    document.body.appendChild(pop);
    anchorEl.setAttribute('aria-expanded', 'true');

    const rect = anchorEl.getBoundingClientRect();
    const popW = 160;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - popW - 8));
    let top = rect.bottom + 4;
    if (top + 260 > window.innerHeight - 8) top = Math.max(8, rect.top - 260 - 4);
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;

    // Scroll active size into view
    if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
}

/* Persist editor changes (debounced) */
const persistEditor = debounce(() => {
    const note = currentNote();
    if (!note) return;
    note.title = $('#titleInput').value;
    note.html = $('#editor').innerHTML;
    note.updatedAt = nowIso();
    saveStateRaw();
    // Re-render meta + tree (preview/title may have changed)
    const metaDateText = document.querySelector('#metaUpdated .meta-date-text');
    if (metaDateText) metaDateText.textContent = `Modified ${relativeTime(note.updatedAt)}`;
    renderNotesList();
    renderNavCounts();
}, 200);

/* ===========================================================
   EXPORT
   =========================================================== */

function htmlToMarkdown(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return convertNode(tmp).trim().replace(/\n{3,}/g, '\n\n');
}
function convertNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName.toLowerCase();
    const inner = Array.from(node.childNodes).map(convertNode).join('');
    switch (tag) {
        case 'strong': case 'b': return `**${inner}**`;
        case 'em': case 'i': return `*${inner}*`;
        case 'u': return `__${inner}__`;
        case 'code': return `\`${inner}\``;
        case 'pre': return `\n\`\`\`\n${inner}\n\`\`\`\n`;
        case 'a': return `[${inner}](${node.getAttribute('href') || ''})`;
        case 'img': return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
        case 'br': return '\n';
        case 'p': return `\n\n${inner}\n\n`;
        case 'div': return `${inner}\n`;
        case 'h1': return `\n\n# ${inner}\n\n`;
        case 'h2': return `\n\n## ${inner}\n\n`;
        case 'h3': return `\n\n### ${inner}\n\n`;
        case 'h4': return `\n\n#### ${inner}\n\n`;
        case 'h5': case 'h6': return `\n\n##### ${inner}\n\n`;
        case 'ul': return `\n${Array.from(node.children).map(li => `- ${convertNode(li).trim()}`).join('\n')}\n`;
        case 'ol': {
            let i = 1;
            return `\n${Array.from(node.children).map(li => `${i++}. ${convertNode(li).trim()}`).join('\n')}\n`;
        }
        case 'li': return inner;
        case 'blockquote': return `\n> ${inner.replace(/\n/g, '\n> ')}\n`;
        default: return inner;
    }
}

async function exportNote(format) {
    const note = currentNote();
    if (!note) return;
    const title = (note.title || 'Untitled');
    let content, ext, mime;
    if (format === 'md') {
        const fm = [
            '---',
            `title: ${title}`,
            note.tags?.length ? `tags: [${note.tags.map(t => `"${t}"`).join(', ')}]` : null,
            note.folderId ? `folder: "${folderName(note.folderId) || ''}"` : null,
            `created: ${note.createdAt}`,
            `updated: ${note.updatedAt}`,
            '---',
            ''
        ].filter(Boolean).join('\n');
        content = `${fm}# ${title}\n\n${htmlToMarkdown(note.html)}\n`;
        ext = 'md'; mime = 'text/markdown;charset=utf-8';
    } else {
        content = `${title}\n\n${stripHtml(note.html)}\n`;
        ext = 'txt'; mime = 'text/plain;charset=utf-8';
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const safeName = title.replace(/[\\/:*?"<>|]/g, '_');
    const filename = `${safeName}.${ext}`;
    try {
        if (chrome?.downloads?.download) {
            await chrome.downloads.download({ url, filename, saveAs: true });
        } else {
            const a = document.createElement('a'); a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
        }
    } catch {
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    showToast(`Exported as ${ext.toUpperCase()}`);
}

/* ---------- Backup / Restore ---------- */
async function backupAll() {
    const payload = {
        _version: 3,
        _exportedAt: nowIso(),
        notes: state.notes,
        folders: state.folders
    };
    const data = JSON.stringify(payload, null, 2);
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `FluentNotes_Backup_${nowIso().split('T')[0]}.json`;
    try {
        if (chrome?.downloads?.download) await chrome.downloads.download({ url, filename, saveAs: true });
        else { const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }
    } catch {
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    showToast('Backup downloaded');
}

function restoreFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            let notes = [], folders = [];
            if (Array.isArray(parsed)) {
                notes = parsed;
            } else if (parsed && Array.isArray(parsed.notes)) {
                notes = parsed.notes;
                folders = Array.isArray(parsed.folders) ? parsed.folders : [];
            } else {
                alert('Invalid backup format.');
                return;
            }
            // Sanitize
            notes.forEach(n => {
                n.tags = Array.isArray(n.tags) ? n.tags : [];
                n.color = n.color || null;
                n.textColor = n.textColor || null;
                n.pinned = !!n.pinned;
                if (typeof n.folderId === 'undefined') n.folderId = null;
                if (!n.createdAt) n.createdAt = nowIso();
                if (!n.updatedAt) n.updatedAt = n.createdAt;
            });
            folders.forEach(f => {
                if (typeof f.parentId === 'undefined') f.parentId = null;
                if (typeof f.collapsed !== 'boolean') f.collapsed = false;
                if (Array.isArray(f.noteIds)) {
                    f.noteIds.forEach(nid => {
                        const n = notes.find(x => x.id === nid);
                        if (n && !n.folderId) n.folderId = f.id;
                    });
                    delete f.noteIds;
                }
            });
            state.notes = notes;
            state.folders = folders;
            state.selectedId = notes[0]?.id || null;
            state.view = 'all';
            await saveStateRaw();
            renderAll();
            showToast(`Restored: ${notes.length} note(s), ${folders.length} space(s)`);
        } catch (err) {
            console.error(err);
            alert('Could not read JSON file.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

/* ===========================================================
   MENU + MODAL
   =========================================================== */

function toggleMenu(force) {
    menuOpen = (typeof force === 'boolean') ? force : !menuOpen;
    const menu = $('#noteMenu');
    menu.classList.toggle('open', menuOpen);
    $('#menuBtn').setAttribute('aria-expanded', String(menuOpen));
}

function openMoveModal() {
    const note = currentNote();
    if (!note) return;
    const overlay = $('#moveModal');
    const list = $('#moveOptions');
    list.innerHTML = '';

    const items = [{ id: null, name: 'No Folder' }, ...flatFolders()];
    items.forEach(item => {
        const li = document.createElement('li');
        if (item.id === note.folderId) li.classList.add('is-current');
        
        let iconHtml;
        if (item.id) {
            const folder = state.folders.find(f => f.id === item.id);
            if (folder && folder.color) {
                const strokeColor = 'var(--folder-color-solid)';
                iconHtml = `<svg viewBox="0 0 24 24" width="13" height="13" fill="${folder.color}" stroke="${strokeColor}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" style="margin-left: 0.5px; margin-right: 0.5px;"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>`;
            } else {
                iconHtml = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" style="margin-left: 0.5px; margin-right: 0.5px;"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>`;
            }
        } else {
            iconHtml = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" style="margin-left: 0.5px; margin-right: 0.5px;"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>`;
        }
        
        li.innerHTML = `
            ${iconHtml}
            <span>${escapeHtml(item.name)}</span>
        `;
        li.addEventListener('click', () => {
            moveNoteToFolder(note.id, item.id);
            closeMoveModal();
        });
        list.appendChild(li);
    });
    overlay.classList.remove('hidden');
}
function closeMoveModal() {
    $('#moveModal').classList.add('hidden');
}
function flatFolders() {
    // Flat list with indentation in name
    const out = [];
    const roots = state.folders.filter(f => !f.parentId);
    roots.forEach(r => {
        out.push({ id: r.id, name: r.name || DEFAULT_FOLDER_NAME });
        state.folders.filter(c => c.parentId === r.id).forEach(c => {
            out.push({ id: c.id, name: `   ${c.name || DEFAULT_FOLDER_NAME}` });
        });
    });
    return out;
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 1800);
}

/* ===========================================================
   INPUT BINDING
   =========================================================== */

function bindAll() {
    // Smart lists
    $$('.nav-item').forEach(el => el.addEventListener('click', () => setView(el.dataset.view)));

    // Sidebar empty background click to clear selected folder/view
    $('.nav').addEventListener('click', (e) => {
        if (e.target.closest('.space-row, .tree-note-row, .nav-item, .nav-header, .nav-footer, .search-wrap, #addSpaceBtn, #addNoteBtn')) {
            return;
        }
        setView('all');
    });

    // Spaces
    $('#addSpaceBtn').addEventListener('click', () => createFolder(null));

    // List actions
    $('#addNoteBtn').addEventListener('click', newNote);
    $('#emptyAddBtn').addEventListener('click', newNote);

    // Search
    $('#searchInput').addEventListener('input', debounce(() => renderNotesList(), 120));

    // Title + body autosave
    $('#titleInput').addEventListener('input', () => {
        const note = currentNote();
        if (!note) return;
        note.title = $('#titleInput').value;
        note.updatedAt = nowIso();
        persistEditor();
    });
    $('#editor').addEventListener('input', () => {
        saveEditorSelection();
        persistEditor();
    });
    $('#editor').addEventListener('mouseup', saveEditorSelection);
    $('#editor').addEventListener('keyup', saveEditorSelection);
    document.addEventListener('selectionchange', saveEditorSelection);

    // Formatting (only B/I/U/list rely on execCommand and respect selection natively)
    $$('.fmt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $('#editor').focus();
            execCmdOnSelection(btn.dataset.cmd);
        });
    });
    // Font apply to entire workspace (editor body)
    $('#fontFamilyBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openFontPicker(e.currentTarget);
    });
    $('#fontSizeBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openTextStylePicker(e.currentTarget);
    });

    // Text color popover
    $('#textColorBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        if ($('#textColorPopover')) {
            closeTextColorPopover();
        } else {
            openTextColorPopover(e.currentTarget);
        }
    });

    // Pin badge toggles pin
    $('#pinBadge').addEventListener('click', () => {
        const n = currentNote();
        if (n) togglePin(n.id);
    });

    // Pin toolbar button
    $('#pinBtn').addEventListener('click', () => {
        const n = currentNote();
        if (n) togglePin(n.id);
    });

    // Menu
    $('#menuBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
    $('#noteMenu').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const n = currentNote();
        if (!n) { toggleMenu(false); return; }
        if (action === 'export-md') exportNote('md');
        else if (action === 'export-txt') exportNote('txt');
        else if (action === 'duplicate') duplicateNote(n.id);
        else if (action === 'move') openMoveModal();
        else if (action === 'pin') togglePin(n.id);
        else if (action === 'delete') deleteNote(n.id);
        toggleMenu(false);
    });
    document.addEventListener('click', (e) => {
        if (!menuOpen) return;
        if (!e.target.closest('#noteMenu') && !e.target.closest('#menuBtn')) toggleMenu(false);
    });
    document.addEventListener('click', (e) => {
        const pop = $('#folderColorPopover');
        if (pop && !e.target.closest('#folderColorPopover') && !e.target.closest('.space-row')) {
            closeFolderColorPopover();
        }
        const palettePop = $('#workspaceThemePopover');
        if (palettePop && !e.target.closest('#workspaceThemePopover') && !e.target.closest('#paletteBtn')) {
            closeWorkspaceThemePopover();
        }
        const tcPop = $('#textColorPopover');
        if (tcPop && !e.target.closest('#textColorPopover') && !e.target.closest('#textColorBtn')) {
            closeTextColorPopover();
        }
        const noteBgPop = $('#noteBgColorPop');
        if (noteBgPop && !e.target.closest('#noteBgColorPop') && !e.target.closest('.swatch.custom')) {
            closeGenericColorPicker('noteBgColorPop');
        }
        const folderCPop = $('#folderCustomColorPop');
        if (folderCPop && !e.target.closest('#folderCustomColorPop')) {
            closeGenericColorPicker('folderCustomColorPop');
        }
        const fontPop = $('#fontFamilyPop');
        if (fontPop && !e.target.closest('#fontFamilyPop') && !e.target.closest('#fontFamilyBtn')) {
            closeFontPicker();
        }
        const tsPop = $('#textStylePop');
        if (tsPop && !e.target.closest('#textStylePop') && !e.target.closest('#fontSizeBtn')) {
            closeTextStylePicker();
        }
    });

    // Modal close
    $('#moveModal').addEventListener('click', (e) => {
        if (e.target === $('#moveModal') || e.target.closest('[data-close-modal]')) closeMoveModal();
    });

    // Theme
    $('#themeBtn').addEventListener('click', cycleTheme);
    $('#paletteBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openWorkspaceThemePicker(e.currentTarget);
    });

    // Backup / restore
    $('#backupBtn').addEventListener('click', backupAll);
    $('#restoreBtn').addEventListener('click', () => $('#restoreFile').click());
    $('#restoreFile').addEventListener('change', restoreFromFile);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const mod = e.metaKey || e.ctrlKey;
        if (mod && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            $('#searchInput').focus();
        }
        if (e.key === 'Escape') {
            if (menuOpen) toggleMenu(false);
            closeFolderColorPopover();
            closeWorkspaceThemePopover();
            closeTextColorPopover();
            closeGenericColorPicker('noteBgColorPop');
            closeGenericColorPicker('folderCustomColorPop');
            closeFontPicker();
            closeTextStylePicker();
            if (!$('#moveModal').classList.contains('hidden')) closeMoveModal();
        }
    });

    // Forced save when hidden
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            try { persistEditor.flush(); } catch {}
        }
    });
}

/* ===========================================================
   MAIN
   =========================================================== */
async function main() {
    await loadState();
    bindAll();
    watchStorage();
    renderAll();
}

document.addEventListener('DOMContentLoaded', main);
