import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Node, domFixture } from './dom-fixture.mjs';
const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const plain = value => JSON.parse(JSON.stringify(value));
function setup(raw = null) {
  const dom = domFixture();
  // Remove the unrelated test header; our plugin must only see the native global nav.
  dom.headerActions.remove();
  const nav = new Node('nav'); nav.setAttribute('aria-label', '全局面板');
  nav.getBoundingClientRect = () => ({ width: 260 });
  const entries = [['plugins', '插件'], ['skills', 'Skill / MCP'], ['schedules', '自动化任务'], ['context', '上下文洞察'], ['board', '任务看板'], ['memory', '记忆系统']].map(([id, label], order) => ({ options: { id, label: () => label, order } }));
  const buttons = entries.map(e => { const b = new Node('button'); b.setAttribute('aria-label', e.options.label()); b.append(new Node('span'), new Node('span')); nav.append(b); return b; });
  const more = new Node('button'); more.setAttribute('aria-label', '更多'); more.setAttribute('aria-haspopup', 'menu'); more.append(new Node('span'), new Node('span'));
  const wrapper = new Node('span'); wrapper.append(more); nav.append(wrapper);
  dom.doc.body.append(nav);
  const unrelated = new Node('nav'); unrelated.setAttribute('aria-label', '会话标签页'); dom.doc.body.append(unrelated);
  let data = raw;
  const storage = { getItem: () => data, setItem: (_key, value) => { data = value; } };
  dom.window.localStorage = storage;
  const registrations = [], cleanups = [], subscriptions = new Set();
  const slots = { entriesOfSlot: () => entries, inject: (_name, cb) => { const off = cb(); return off; }, subscribe: (_name, fn) => { subscriptions.add(fn); return () => subscriptions.delete(fn); }, register: (options, Component) => { const row = { options, Component }; registrations.push(row); return () => registrations.splice(registrations.indexOf(row), 1); } };
  const ctx = { get: () => undefined, logger: { warn() {} }, effect(fn) { const off = fn(); if (off) cleanups.push(off); } };
  Object.defineProperty(ctx, 'slots', { get() { assert.ok(plugin.inject.includes('slots')); return slots; } });
  let registration;
  dom.window.__ModuleLoader__ = { load(value) { registration = value; } };
  const React = { createElement: (type, props, ...children) => ({ type, props: props || {}, children }), useSyncExternalStore: (_subscribe, get) => get() };
  vm.runInNewContext(source, { ...dom.extra, ResizeObserver: class { observe() {} disconnect() {} }, console });
  const plugin = registration.factory(name => { assert.equal(name, 'react'); return React; });
  return { ...dom, nav, buttons, more, wrapper, unrelated, entries, slots, ctx, registrations, cleanups, subscriptions, storage, plugin, registration, serialized: () => data };
}
function descendants(v) { return !v || typeof v !== 'object' ? [] : [v, ...(v.children || []).flat(Infinity).flatMap(descendants)]; }
test('Metadata, lazy flat module, declared injections and portable scoped CSS', () => {
  const f = setup(); assert.equal(f.registration.id, pkg.name); assert.equal(f.plugin.default, undefined);
  assert.deepEqual(plain(f.plugin.inject), ['slots']);
  assert.equal(f.doc.head.children.length, 0, 'No side effects before apply');
  assert.equal(/[A-Za-z0-9]{6}_[A-Za-z]+/.test(f.plugin.CSS), false);
  assert.equal(f.plugin.CSS.includes('[class*='), false);
  for (const path of [pkg.icon, pkg.exports['./client'], pkg.dsh.bundle.patch]) assert.ok(readFileSync(new URL('../' + path, import.meta.url)).length);
});
test('Preferences are bounded, deduplicated, forward-safe, serializable; malformed data falls back to native', () => {
  const { plugin: p } = setup();
  assert.equal(p.parse(null).mode, 'tiles');
  for (const raw of ['{', 'null', '[]', '123', '{"mode":"unknown"}']) assert.equal(p.parse(raw).mode, 'native');
  assert.deepEqual(plain(p.normalize({ mode: 'compact', hideMore: false, hiddenIds: ['a', 'a', null, '', 'b'], extra: 'ignore' })), { version: 1, mode: 'compact', hideMore: false, hiddenIds: ['a', 'b'] });
  const clean = p.normalize({ mode: 'tiles', hiddenIds: Array.from({ length: 250 }, (_, i) => String(i)) });
  assert.equal(clean.hiddenIds.length, 200); assert.deepEqual(plain(p.parse(JSON.stringify(clean))), plain(clean));
});
test('Two layouts preserve button identity/actions and hide the complete More wrapper', () => {
  const f = setup(); let clicked = 0; f.buttons[0].addEventListener('click', () => clicked++);
  const c = f.plugin.createController(f.ctx); c.start();
  assert.equal(f.nav.getAttribute('data-dss-view'), 'tiles');
  assert.ok(f.wrapper.hasAttribute('data-dss-hidden')); assert.equal(f.more.hasAttribute('data-dss-hidden'), false);
  assert.equal(f.nav.querySelectorAll('button').length, 7); f.buttons[0].click(); assert.equal(clicked, 1);
  c.update({ mode: 'compact', hiddenIds: ['context'] });
  assert.equal(f.nav.getAttribute('data-dss-view'), 'compact'); assert.ok(f.buttons[3].hasAttribute('data-dss-hidden'));
  assert.equal(f.unrelated.hasAttribute('data-dss-view'), false);
  assert.deepEqual(f.buttons[0].style, {}); assert.equal(f.buttons[0].getAttribute('aria-label'), '插件');
  c.update({ hideMore: false }); assert.equal(f.wrapper.hasAttribute('data-dss-hidden'), false);
  c.dispose();
});
test('Native mode ignores all hiding, preserves preferences, and re-enables the selected layout', () => {
  const f = setup(); const c = f.plugin.createController(f.ctx); c.start();
  c.update({ mode: 'native', hiddenIds: ['plugins'] });
  assert.equal(f.nav.hasAttribute('data-dss-view'), false); assert.equal(f.buttons[0].hasAttribute('data-dss-hidden'), false); assert.equal(f.wrapper.hasAttribute('data-dss-hidden'), false);
  c.update({ mode: 'tiles' }); assert.ok(f.buttons[0].hasAttribute('data-dss-hidden')); c.dispose();
  assert.equal(f.plugin.parse(f.serialized()).mode, 'tiles');
});
test('Collapsed and too-narrow sidebars stay native and restore on expansion', () => {
  const f = setup(); const c = f.plugin.createController(f.ctx); c.start();
  f.doc.body.setAttribute('data-sidebar-collapsed', 'true'); c.reconcile(); assert.equal(f.nav.hasAttribute('data-dss-view'), false);
  f.doc.body.removeAttribute('data-sidebar-collapsed'); f.nav.getBoundingClientRect = () => ({ width: 180 }); c.reconcile(); assert.equal(f.nav.hasAttribute('data-dss-view'), false);
  f.nav.getBoundingClientRect = () => ({ width: 260 }); c.reconcile(); assert.equal(f.nav.getAttribute('data-dss-view'), 'tiles'); c.dispose();
});
test('Remount, late plugin registration and locale updates retain stable per-entry identities', () => {
  const f = setup(); const c = f.plugin.createController(f.ctx); c.start(); c.update({ hiddenIds: ['memory'] });
  f.nav.remove(); f.doc.body.append(f.nav); f.entries[5].options.label = () => 'Memory'; f.buttons[5].setAttribute('aria-label', 'Memory');
  for (const fn of f.subscriptions) fn(); f.flush();
  assert.ok(f.buttons[5].hasAttribute('data-dss-hidden'));
  const b = new Node('button'); b.setAttribute('aria-label', 'New panel'); b.append(new Node('span'), new Node('span')); f.nav.append(b);
  f.entries.push({ options: { id: 'new', label: 'New panel' } }); for (const fn of f.subscriptions) fn(); f.flush();
  assert.ok(b.hasAttribute('data-dss-button')); assert.equal(b.hasAttribute('data-dss-hidden'), false); c.dispose();
});
test('Settings register in the real settings slot; mode and visibility controls update the live controller', () => {
  const f = setup(); const c = f.plugin.createController(f.ctx); c.start();
  const setting = f.registrations.find(r => r.options.name === 'settings.section'); assert.ok(setting);
  let tree = descendants(setting.Component()); const select = tree.find(n => n.type === 'select');
  assert.equal(select.props.value, 'tiles'); select.props.onChange({ target: { value: 'native' } });
  assert.equal(f.nav.hasAttribute('data-dss-view'), false);
  tree = descendants(setting.Component()); assert.equal(tree.find(n => n.type === 'fieldset').props.disabled, true);
  select.props.onChange({ target: { value: 'compact' } }); assert.equal(f.nav.getAttribute('data-dss-view'), 'compact'); c.dispose();
});
test('Storage updates synchronize, reset clears preferences, denied storage keeps settings usable', () => {
  const f = setup(); const c = f.plugin.createController(f.ctx); c.start();
  f.window.dispatch('storage', { key: f.plugin.KEY, newValue: '{"mode":"native"}' }); assert.equal(f.nav.hasAttribute('data-dss-view'), false);
  f.window.dispatch('storage', { key: null, newValue: null }); assert.equal(f.nav.getAttribute('data-dss-view'), 'tiles'); c.dispose();
  const failed = setup(); Object.defineProperty(failed.window, 'localStorage', { get() { throw Error('denied'); } });
  const other = failed.plugin.createController(failed.ctx); other.start(); assert.ok(other.getSnapshot().storageError);
  other.update({ mode: 'compact' }); assert.equal(failed.nav.getAttribute('data-dss-view'), 'compact'); assert.ok(other.getSnapshot().storageError); other.dispose();
});
test('Repeated apply and dispose remove all markers, timers, styles, observers, subscriptions and settings', () => {
  const f = setup(); f.plugin.apply(f.ctx); f.plugin.apply(f.ctx);
  assert.equal(f.doc.head.children.length, 1); assert.equal(f.registrations.length, 1);
  f.observers[0].fn([]); for (const off of f.cleanups) off(); f.flush();
  assert.equal(f.doc.head.children.length, 0); assert.equal(f.registrations.length, 0); assert.equal(f.subscriptions.size, 0); assert.equal(f.window.__dshSidebarShortcuts, undefined);
  for (const node of [f.nav, f.wrapper, ...f.buttons, f.more, ...f.buttons.flatMap(b => b.children)]) assert.equal(Object.keys(node.attrs).some(k => k.startsWith('data-dss-')), false);
  assert.equal(f.timers.size, 0); assert.ok(f.observers[0].stopped);
});
