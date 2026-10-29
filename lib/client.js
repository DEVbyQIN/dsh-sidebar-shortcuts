// Preserve native buttons and actions; only plugin-owned attributes affect their layout.
window.__ModuleLoader__.load({
  id: 'dsh-sidebar-shortcuts',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const ID = 'dsh-sidebar-shortcuts';
    const KEY = ID + '.v1';
    const GLOBAL = '__dshSidebarShortcuts';
    const MODES = ['native', 'compact', 'tiles'];
    const DEFAULTS = { version: 1, mode: 'tiles', hideMore: true, hiddenIds: [] };
    const NAV_LABELS = ['全局面板', 'Global panels', 'グローバルパネル', 'Paneles globales', 'Panneaux globaux', 'Globale Bereiche', 'Глобальные панели', 'Painéis globais'];
    const TEXT = {
      zh: { title: '侧栏快捷入口', mode: '显示方式', native: '关闭，恢复原生', compact: '紧凑双列', tiles: '图标宫格', more: '隐藏「更多」按钮', entries: '显示的入口', description: '只调整工作区上方的功能入口。新会话、工作区与会话列表保持原样。关闭后恢复所有原生入口。', storage: '当前无法保存偏好，本次修改仍然有效。', empty: '等待侧栏入口加载…', restore: '恢复默认设置' },
      en: { title: 'Sidebar Shortcuts', mode: 'Layout', native: 'Off — native sidebar', compact: 'Compact columns', tiles: 'Icon tiles', more: 'Hide the More button', entries: 'Visible entries', description: 'Changes only the shortcuts above Workspaces. New Session and workspace/session browsing stay native. Turning this view off restores all native entries.', storage: 'Preferences could not be saved. Changes still apply for this session.', empty: 'Waiting for sidebar entries…', restore: 'Restore defaults' }
    };
    function words() { return TEXT[document.documentElement.lang?.startsWith('zh') ? 'zh' : 'en']; }
    function normalize(raw) {
      const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      return { version: 1, mode: MODES.includes(obj.mode) ? obj.mode : 'native', hideMore: typeof obj.hideMore === 'boolean' ? obj.hideMore : true,
        hiddenIds: Array.isArray(obj.hiddenIds) ? [...new Set(obj.hiddenIds.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 200))].slice(0, 200) : [] };
    }
    function parse(raw) { if (raw === null || raw === undefined) return normalize(DEFAULTS); try { return normalize(JSON.parse(raw)); } catch { return normalize({}); } }
    function panelEntries(slots) {
      const read = slots.entriesOfSlot || slots.entries;
      if (!read) return [];
      return read.call(slots, 'sidebar.panellist').map(entry => {
        const o = entry.options || entry;
        let label = o.id;
        try { label = typeof o.label === 'function' ? o.label() : o.label || o.id; } catch {}
        return { id: o.id, label: String(label), order: o.order || 0 };
      }).filter(e => typeof e.id === 'string').sort((a, b) => a.order - b.order);
    }
    const CSS = `
[data-dss-view] { display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:6px !important; container-type:inline-size; container-name:dss-shortcuts; }
[data-dss-item] { min-width:0 !important; width:100% !important; }
[data-dss-button] { box-sizing:border-box !important; display:flex !important; align-items:center !important; justify-content:flex-start !important; gap:8px !important; width:100% !important; min-width:0 !important; height:auto !important; min-height:36px !important; margin:0 !important; padding:8px !important; border:0 !important; border-radius:8px !important; color:var(--dsw-alias-label-primary) !important; font-size:14px !important; line-height:20px !important; -webkit-app-region:no-drag; }
[data-dss-glyph] { display:flex !important; align-items:center !important; justify-content:center !important; flex:none !important; width:18px !important; height:18px !important; }
[data-dss-title] { display:block !important; min-width:0 !important; max-width:100% !important; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important; }
[data-dss-view="tiles"] [data-dss-button] { flex-direction:column !important; justify-content:center !important; min-height:66px !important; gap:7px !important; border:.5px solid var(--dsw-alias-border-l3) !important; border-radius:10px !important; background:var(--dsw-alias-bg-base) !important; }
[data-dss-view="tiles"] [data-dss-glyph] { width:21px !important; height:21px !important; }
[data-dss-view] [data-dss-button]:hover { background:var(--dsw-alias-interactive-bg-hover) !important; }
[data-dss-view] [data-dss-button][aria-current="page"] { background:var(--dsw-alias-interactive-bg-hover) !important; color:var(--dsw-alias-state-business-primary) !important; }
[data-dss-hidden] { display:none !important; }
@container dss-shortcuts (max-width:230px) { [data-dss-button] { font-size:12px !important; gap:5px !important; padding-inline:5px !important; } }
.dss-settings { color:var(--dsw-alias-label-primary); font-size:14px; line-height:1.6; }
.dss-settings h2 { font-size:20px; font-weight:500; margin:0 0 12px; }
.dss-description { color:var(--dsw-alias-label-secondary); margin:0 0 22px; }
.dss-setting-row { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:12px 0; }
.dss-settings select { color:var(--dsw-alias-label-primary); background:var(--dsw-alias-bg-base); border:1px solid var(--dsw-alias-border-l3); border-radius:8px; padding:8px 12px; font:inherit; max-width:100%; }
.dss-settings input { accent-color:var(--dsw-alias-state-business-primary); width:16px; height:16px; margin:0; }
.dss-entries { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:0 24px; }
.dss-entry { display:flex; align-items:center; gap:9px; padding:10px 0; }
.dss-settings fieldset { border:0; padding:0; margin:18px 0; min-width:0; }
.dss-settings legend { font-weight:500; margin-bottom:8px; }
.dss-settings fieldset:disabled { opacity:.5; }
.dss-reset { font:inherit; padding:8px 12px; border:1px solid var(--dsw-alias-border-l3); border-radius:8px; background:var(--dsw-alias-bg-base); color:inherit; }
.dss-storage { color:var(--dsw-alias-label-secondary); }
`;
    function createController(ctx, storage) {
      let storageError = false;
      let initial;
      try { storage = storage || window.localStorage; initial = parse(storage.getItem(KEY)); } catch { initial = normalize({}); storageError = true; }
      let snapshot = { preferences: initial, panels: panelEntries(ctx.slots), storageError };
      const listeners = new Set();
      const marks = new Map();
      const cleanups = [];
      let disposed = false, timer = null, observer, resize, watchedNav;
      function publish(next) { snapshot = next; listeners.forEach(fn => fn()); }
      const store = { getSnapshot: () => snapshot, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); } };
      function syncMarks(desired) {
        const next = new Map();
        desired.forEach(([el, name, value]) => { if (!next.has(el)) next.set(el, new Map()); next.get(el).set(name, value); });
        marks.forEach((attrs, el) => {
          attrs.forEach((original, name) => {
            if (!next.get(el)?.has(name)) { if (original === null) el.removeAttribute(name); else el.setAttribute(name, original); attrs.delete(name); }
          });
          if (!attrs.size) marks.delete(el);
        });
        next.forEach((attrs, el) => {
          if (!marks.has(el)) marks.set(el, new Map());
          attrs.forEach((value, name) => { if (!marks.get(el).has(name)) marks.get(el).set(name, el.getAttribute(name)); if (el.getAttribute(name) !== value) el.setAttribute(name, value); });
        });
      }
      function reconcile() {
        if (disposed) return;
        const p = snapshot.preferences;
        const desired = [];
        const navs = [...document.querySelectorAll('nav[aria-label]')].filter(nav => NAV_LABELS.includes(nav.getAttribute('aria-label')));
        const nav = navs[0];
        if (resize && watchedNav !== nav) { resize.disconnect(); watchedNav = nav; if (nav) resize.observe(nav); }
        if (p.mode !== 'native' && nav && !nav.closest('[data-sidebar-collapsed="true"]') && nav.getBoundingClientRect().width >= 200) {
          const buttons = [...nav.querySelectorAll('button[aria-label]')];
          // No labels in the collapsed rail; defer entirely to the native shell.
          if (buttons.some(b => b.children.length >= 2)) {
            desired.push([nav, 'data-dss-view', p.mode]);
            buttons.forEach(button => {
              let item = button;
              while (item.parentElement && item.parentElement !== nav) item = item.parentElement;
              const label = button.getAttribute('aria-label');
              const candidates = snapshot.panels.filter(e => e.label === label);
              const more = button.getAttribute('aria-haspopup') === 'menu';
              const id = candidates.length === 1 ? candidates[0].id : null;
              desired.push([item, 'data-dss-item', ''], [button, 'data-dss-button', '']);
              if ((more && p.hideMore) || (id && p.hiddenIds.includes(id))) desired.push([item, 'data-dss-hidden', '']);
              if (button.children[0]) desired.push([button.children[0], 'data-dss-glyph', '']);
              if (button.children[1]) desired.push([button.children[1], 'data-dss-title', '']);
            });
          }
        }
        syncMarks(desired);
      }
      function schedule() { if (!disposed && timer === null) timer = setTimeout(() => { timer = null; reconcile(); }, 50); }
      function update(patch) {
        if (disposed) return;
        const preferences = normalize({ ...snapshot.preferences, ...patch });
        let error = false;
        try { storage.setItem(KEY, JSON.stringify(preferences)); } catch { error = true; }
        publish({ ...snapshot, preferences, storageError: error }); reconcile();
      }
      function refreshPanels() {
        const panels = panelEntries(ctx.slots);
        if (JSON.stringify(panels) !== JSON.stringify(snapshot.panels)) publish({ ...snapshot, panels });
        schedule();
      }
      function Settings() {
        const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot);
        const p = state.preferences, t = words();
        return h('section', { className: 'dss-settings', 'data-dss-settings': '', 'aria-label': t.title },
          h('h2', null, t.title), h('p', { className: 'dss-description' }, t.description),
          h('label', { className: 'dss-setting-row' }, t.mode, h('select', { value: p.mode, 'aria-label': t.mode, onChange: e => update({ mode: e.target.value }) }, MODES.map(mode => h('option', { key: mode, value: mode }, t[mode])))),
          h('fieldset', { disabled: p.mode === 'native' }, h('legend', null, t.entries),
            h('label', { className: 'dss-setting-row' }, t.more, h('input', { type: 'checkbox', checked: p.hideMore, onChange: e => update({ hideMore: e.target.checked }) })),
            h('div', { className: 'dss-entries' }, state.panels.map(entry => h('label', { className: 'dss-entry', key: entry.id }, h('input', { type: 'checkbox', checked: !p.hiddenIds.includes(entry.id), onChange: e => update({ hiddenIds: e.target.checked ? p.hiddenIds.filter(id => id !== entry.id) : [...p.hiddenIds, entry.id] }) }), entry.label)), !state.panels.length && h('p', null, t.empty))),
          h('button', { type: 'button', className: 'dss-reset', onClick: () => update(DEFAULTS) }, t.restore), state.storageError && h('p', { className: 'dss-storage', role: 'status' }, t.storage));
      }
      function start() {
        const css = document.createElement('style'); css.setAttribute('data-plugin', ID); css.setAttribute('data-plugin-css', ID + '/style'); css.textContent = CSS; document.head.appendChild(css);
        observer = new MutationObserver(schedule); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'data-sidebar-collapsed'] });
        if (typeof ResizeObserver !== 'undefined') resize = new ResizeObserver(schedule);
        const onResize = schedule;
        const onStorage = e => { if (e.key === KEY || e.key === null) { publish({ ...snapshot, preferences: parse(e.key === null ? null : e.newValue), storageError: false }); reconcile(); } };
        window.addEventListener('resize', onResize); window.addEventListener('storage', onStorage);
        cleanups.push(() => { window.removeEventListener('resize', onResize); window.removeEventListener('storage', onStorage); css.remove(); });
        cleanups.push(ctx.slots.inject('sidebar.panellist', () => ctx.slots.subscribe('sidebar.panellist', refreshPanels)));
        cleanups.push(ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: ID + ':settings', order: 45, label: () => words().title }, Settings)));
        const locale = ctx.get?.('locale');
        if (locale?.subscribe) cleanups.push(locale.subscribe(() => { refreshPanels(); publish({ ...snapshot }); }));
        reconcile();
        return dispose;
      }
      function dispose() {
        if (disposed) return; disposed = true;
        observer?.disconnect(); resize?.disconnect(); if (timer !== null) clearTimeout(timer);
        syncMarks([]); cleanups.reverse().forEach(fn => { if (typeof fn === 'function') fn(); }); listeners.clear();
      }
      return { start, dispose, update, reconcile, getSnapshot: store.getSnapshot, Settings };
    }
    function apply(ctx) {
      if (window[GLOBAL]) return;
      ctx.effect(() => {
        let controller;
        try { controller = createController(ctx); controller.start(); window[GLOBAL] = controller; }
        catch (error) { controller?.dispose(); ctx.logger?.warn(ID + ': ' + String(error)); return; }
        return () => { controller.dispose(); if (window[GLOBAL] === controller) delete window[GLOBAL]; };
      }, ID + ': sidebar shortcuts');
    }
    return { apply, inject: ['slots'], createController, normalize, parse, panelEntries, CSS, DEFAULTS, KEY };
  }
});
