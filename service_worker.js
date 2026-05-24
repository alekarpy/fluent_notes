// Fluent Notes — service worker
// Genera nuevas notas desde menú contextual o atajo Alt+Shift+N

function makeId() {
    return crypto?.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function nowIso() { return new Date().toISOString(); }

function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function newNoteObject({ html = '', title = 'New Note' } = {}) {
    const ts = nowIso();
    return {
        id: makeId(),
        title,
        html,
        tags: [],
        color: null,
        pinned: false,
        folderId: null,
        createdAt: ts,
        updatedAt: ts
    };
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'fluent_notes_save_selection',
        title: 'Save selection to Fluent Notes',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== 'fluent_notes_save_selection') return;
    const selection = info.selectionText || '';
    const { notes = [] } = await chrome.storage.local.get(['notes']);
    const n = newNoteObject({
        html: selection ? `<p>${escapeHtml(selection)}</p>` : '',
        title: 'New Note'
    });
    notes.unshift(n);
    await chrome.storage.local.set({ notes, selectedId: n.id });
});

chrome.commands.onCommand.addListener(async (command) => {
    if (command !== 'new-note') return;
    const { notes = [] } = await chrome.storage.local.get(['notes']);
    const n = newNoteObject();
    notes.unshift(n);
    await chrome.storage.local.set({ notes, selectedId: n.id });
});
