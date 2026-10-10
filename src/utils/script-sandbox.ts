/**
 * The form's own code (`doc.script`), like the "Script" box of the old waiting-list forms, but run in a sandbox: a
 * hidden frame with no access to the page, its cookies, its storage or the people's logins (the frame has an opaque
 * origin). The code talks to the form through a small `form` object, by messages:
 *
 *   form.on('change', ({ key, value, values }) => { … })   also 'ready', 'step', 'beforeSubmit', 'submitted'
 *   form.values / form.get('city')                       the answers (kept up to date)
 *   form.set('year', '2000')  form.set({ a: 1, b: 2 })    change answers
 *   form.filterOptions('projects', o => …)              which options a choice field offers (form.resetOptions to undo)
 *   form.setOptions('projects', [{ label, value }])      replace them
 *   form.hide('vat') / form.show('vat')                  hide or show a field (hidden fields are not checked or sent)
 *   form.goToStep(id)  form.redirect(url)
 *   form.fields                                           every field: { model, type, label, options }
 *
 * A 'beforeSubmit' handler can stop the send by returning false or a message (also from a promise).
 */

export type ScriptField = { model: string; type: string; label: string; options?: { label: string; value: any }[] };

export type ScriptHost = {
  values(): any;
  fields(): ScriptField[];
  setValue(key: string, value: any): void;
  setOptions(model: string, options: any[] | null): void;
  setVisible(model: string, visible: boolean | null): void;
  goToStep(id: string): void;
  redirect(url: string): void;
};

/** What runs inside the frame: the `form` object, then the author's code. */
const BOOTSTRAP = `
(function () {
  'use strict';
  var handlers = {};
  var state = { values: {}, fields: [] };
  var post = function (type, data) { parent.postMessage({ __rfgScript: true, type: type, data: data }, '*'); };
  var clone = function (v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); };
  var getPath = function (obj, path) {
    return String(path).replace(/\\[(\\d+)\\]/g, '.$1').split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  };
  var fieldOf = function (model) { return state.fields.filter(function (f) { return f.model === model; })[0]; };
  var form = {
    get values() { return state.values; },
    get fields() { return state.fields; },
    get: function (key) { return getPath(state.values, key); },
    on: function (event, fn) { (handlers[event] = handlers[event] || []).push(fn); return form; },
    set: function (key, value) {
      if (key && typeof key === 'object') { Object.keys(key).forEach(function (k) { post('setValue', { key: k, value: clone(key[k]) }); }); return; }
      post('setValue', { key: key, value: clone(value) });
    },
    setOptions: function (model, options) { post('setOptions', { model: model, options: clone(options) }); },
    filterOptions: function (model, keep) {
      var field = fieldOf(model);
      if (!field || !field.options) return;
      post('setOptions', { model: model, options: clone(field.options.filter(keep)) });
    },
    resetOptions: function (model) { post('setOptions', { model: model, options: null }); },
    hide: function (model) { post('setVisible', { model: model, visible: false }); },
    show: function (model) { post('setVisible', { model: model, visible: true }); },
    resetVisibility: function (model) { post('setVisible', { model: model, visible: null }); },
    goToStep: function (id) { post('goToStep', { id: String(id) }); },
    redirect: function (url) { post('redirect', { url: String(url) }); }
  };
  // older scripts called these on the form element
  form.updateValue = form.set;
  form.setValue = form.set;
  form.getValue = form.get;
  self.form = form;

  var emit = function (event, data) {
    var list = handlers[event] || [];
    var results = [];
    for (var i = 0; i < list.length; i++) {
      try { results.push(list[i](data)); } catch (e) { console.error('[form script] ' + event + ' handler failed', e); }
    }
    return results;
  };

  addEventListener('message', function (e) {
    if (e.source !== parent || !e.data || !e.data.__rfgHost) return;
    var m = e.data;
    if (m.values) state.values = m.values;
    if (m.fields) state.fields = m.fields;
    if (m.type === 'start') {
      try { new Function('form', m.code)(form); } catch (err) { console.error('[form script] the code failed to run', err); }
      emit('ready', { values: state.values });
      return;
    }
    if (m.type === 'event') {
      var results = emit(m.event, m.data);
      if (m.id) {
        Promise.all(results.map(function (r) { return Promise.resolve(r).catch(function () { return undefined; }); })).then(function (all) {
          var blocked = all.filter(function (r) { return r === false || typeof r === 'string'; })[0];
          post('reply', { id: m.id, block: blocked !== undefined, message: typeof blocked === 'string' ? blocked : '' });
        });
      }
    }
  });
  post('loaded');
})();
`;

let frames = 0;

export class ScriptSandbox {
  private frame: HTMLIFrameElement;
  private ready = false;
  private queue: any[] = [];
  private waiting: { [id: string]: (reply: { block: boolean; message: string }) => void } = {};
  private seq = 0;
  private listener = (e: MessageEvent) => this.onMessage(e);

  constructor(private code: string, private host: ScriptHost, mount: HTMLElement) {
    this.frame = document.createElement('iframe');
    // scripts only: no same origin (no access to the page, its storage or cookies), no popups, no navigating the page
    this.frame.setAttribute('sandbox', 'allow-scripts');
    this.frame.setAttribute('aria-hidden', 'true');
    this.frame.setAttribute('tabindex', '-1');
    this.frame.title = `form-script-${++frames}`;
    this.frame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;';
    this.frame.srcdoc = `<!doctype html><meta charset="utf-8"><script>${BOOTSTRAP.replace(/<\/script/gi, '<\\/script')}</script>`;
    window.addEventListener('message', this.listener);
    mount.appendChild(this.frame);
  }

  destroy() {
    window.removeEventListener('message', this.listener);
    Object.keys(this.waiting).forEach(id => this.waiting[id]({ block: false, message: '' }));
    this.waiting = {};
    this.frame.remove();
  }

  /** Tells the code something happened (the answers travel along). */
  emit(event: string, data: any = {}) {
    this.send({ type: 'event', event, data: this.plain(data), values: this.plain(this.host.values()) });
  }

  /** Like `emit`, and waits for the handlers' verdict (at most `timeout` ms: a slow or broken script never blocks the form). */
  ask(event: string, data: any = {}, timeout = 4000): Promise<{ block: boolean; message: string }> {
    const id = `q${++this.seq}`;
    return new Promise(resolve => {
      const done = (reply: { block: boolean; message: string }) => {
        delete this.waiting[id];
        resolve(reply);
      };
      this.waiting[id] = done;
      setTimeout(() => this.waiting[id] && done({ block: false, message: '' }), timeout);
      this.send({ type: 'event', event, id, data: this.plain(data), values: this.plain(this.host.values()) });
    });
  }

  private send(message: any) {
    const full = { __rfgHost: true, ...message };
    if (!this.ready) this.queue.push(full);
    else this.frame.contentWindow && this.frame.contentWindow.postMessage(full, '*');
  }

  /** Answers as plain data (files and other objects that cannot be copied are left out). */
  private plain(value: any) {
    try {
      return JSON.parse(JSON.stringify(value === undefined ? null : value));
    } catch (e) {
      return null;
    }
  }

  private onMessage(e: MessageEvent) {
    // only the frame of this form, and only its own kind of messages
    if (e.source !== this.frame.contentWindow || !e.data || e.data.__rfgScript !== true) return;
    const { type, data } = e.data;
    if (type === 'loaded') {
      this.ready = true;
      const start = { __rfgHost: true, type: 'start', code: this.code, values: this.plain(this.host.values()), fields: this.plain(this.host.fields()) };
      this.frame.contentWindow.postMessage(start, '*');
      this.queue.forEach(m => this.frame.contentWindow.postMessage(m, '*'));
      this.queue = [];
      return;
    }
    if (!data || typeof data !== 'object') return;
    if (type === 'reply' && this.waiting[data.id]) this.waiting[data.id]({ block: !!data.block, message: String(data.message || '').slice(0, 500) });
    else if (type === 'setValue' && typeof data.key === 'string') this.host.setValue(data.key, data.value);
    else if (type === 'setOptions' && typeof data.model === 'string') this.host.setOptions(data.model, Array.isArray(data.options) ? data.options : null);
    else if (type === 'setVisible' && typeof data.model === 'string') this.host.setVisible(data.model, typeof data.visible === 'boolean' ? data.visible : null);
    else if (type === 'goToStep' && typeof data.id === 'string') this.host.goToStep(data.id);
    else if (type === 'redirect' && typeof data.url === 'string') this.host.redirect(data.url);
  }
}
