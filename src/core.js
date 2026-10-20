'use strict';

// MB Calendar safety helpers. No DOM, network, filesystem or Obsidian side effects.
const LIMITS = Object.freeze({ blockBytes: 2 * 1024 * 1024, events: 5000, exceptions: 2000,
  title: 1000, note: 20000, instances: 2000, dayItems: 500, historyBytes: 8 * 1024 * 1024,
  draftBytes: 12 * 1024 * 1024, states: 300 });
class CalendarError extends Error {
  constructor(code) { super(code); this.name = 'CalendarError'; this.code = code; }
}
const fail = code => { throw new CalendarError(code); };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const byteLength = text => new TextEncoder().encode(text).length;
function asciiDigits(text) {
  return String(text).replace(/[٠-٩۰-۹०-९০-৯]/g, c => {
    const n = c.charCodeAt(0);
    const base = [0x660, 0x6f0, 0x966, 0x9e6].find(b => n >= b && n <= b + 9);
    return String(n - base);
  });
}
function keys(value, allowed) {
  if (!record(value)) fail('schema');
  if (Object.keys(value).some(k => !allowed.includes(k))) fail('unknownField');
}
function string(value, max) { if (typeof value !== 'string' || value.length > max) fail('schema'); }
function optionalStrings(obj, names, max) {
  for (const name of names) if (obj[name] != null) string(obj[name], max);
}
function isoDate(value) {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(asciiDigits(value));
  if (!m) return null;
  const y=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
  const date=new Date(0);date.setUTCFullYear(y,month-1,day);date.setUTCHours(0,0,0,0);
  if(y<1 || y>9999 || date.getUTCFullYear()!==y || date.getUTCMonth()!==month-1 || date.getUTCDate()!==day)return null;
  return String(y).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
function validateCalendar(value, raw = '') {
  if (byteLength(raw) > LIMITS.blockBytes) fail('tooLarge');
  keys(value, ['version','calId','title','settings','events','tasks']);
  if (value.version != null && value.version !== 1) fail('version');
  optionalStrings(value, ['calId','title'], LIMITS.title);
  if (value.settings != null) {
    keys(value.settings, ['view','showCompleted','dayStart','dayEnd']);
    const s = value.settings;
    if (s.view != null && !['month','week','day','agenda'].includes(s.view)) fail('schema');
    if (s.showCompleted != null && typeof s.showCompleted !== 'boolean') fail('schema');
    for (const [k,min,max] of [['dayStart',0,23],['dayEnd',1,24]]) {
      if (s[k] != null && (!Number.isInteger(s[k]) || s[k]<min || s[k]>max)) fail('schema');
    }
    if (s.dayStart != null && s.dayEnd != null && s.dayEnd <= s.dayStart) fail('schema');
  }
  if ('events' in value && !Array.isArray(value.events)) fail('schema');
  if ('tasks' in value && !Array.isArray(value.tasks)) fail('schema');
  if ('events' in value && 'tasks' in value) fail('schema');
  const events = value.events || value.tasks || [];
  if (events.length > LIMITS.events) fail('tooLarge');
  const ids = new Set();
  for (const e of events) {
    keys(e, ['id','title','text','date','due','start','time','end','endDate','task','done','status','repeat','skip','doneDates','note','color','completedAt','created','order']);
    optionalStrings(e, ['id','title','text'], LIMITS.title);
    optionalStrings(e, ['note'], LIMITS.note);
    optionalStrings(e, ['date','due','start','time','end','endDate','completedAt','created','color','status'], 100);
    for(const k of ['start','time','end'])if(e[k]!=null && !/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(e[k]))fail('schema');
    if(e.endDate!=null && !isoDate(e.endDate))fail('schema');
    if(e.endDate && isoDate(e.date || e.due) && isoDate(e.endDate)<isoDate(e.date || e.due))fail('schema');
    if(e.color!=null && !['default','red','orange','yellow','green','blue','purple'].includes(e.color))fail('schema');
    if(e.status!=null && !['done','todo','open'].includes(e.status))fail('schema');
    for (const k of ['task','done']) if (e[k] != null && typeof e[k] !== 'boolean') fail('schema');
    if (e.order != null && (!Number.isFinite(e.order) || !Number.isInteger(e.order))) fail('schema');
    if (e.id) { if (ids.has(e.id)) fail('duplicateId'); ids.add(e.id); }
    if (e.repeat != null) {
      keys(e.repeat, ['unit','every','day','days','until']);
      const r = e.repeat;
      if (!['day','week','month','year','weekday','weekdays'].includes(r.unit)) fail('schema');
      if (r.every != null && (!Number.isInteger(r.every) || r.every < 1 || r.every > 999)) fail('schema');
      if (r.day != null && (!Number.isInteger(r.day) || r.day < 1 || r.day > 31)) fail('schema');
      optionalStrings(r, ['until'], 100);
      if(r.until!=null && (!isoDate(r.until) || (isoDate(e.date || e.due) && isoDate(r.until)<isoDate(e.date || e.due))))fail('schema');
      if (r.days != null && (!Array.isArray(r.days) || r.days.length > 7 || r.days.some(d => !Number.isInteger(d) || d < 0 || d > 6))) fail('schema');
      if (r.unit === 'weekdays' && (!r.days || !r.days.length)) fail('schema');
    }
    for (const k of ['skip','doneDates']) if (e[k] != null) {
      if (!Array.isArray(e[k]) || e[k].length > LIMITS.exceptions) fail('tooLarge');
      e[k].forEach(d => {string(d, 100);if(!isoDate(d))fail('schema');});
    }
  }
  return value;
}
function validateSettings(raw, defaults) {
  const result = Object.assign({}, defaults, { viewMemory: {}, recoveryDrafts: {} });
  if (!record(raw)) return { settings: result, invalid: raw != null };
  let invalid = false;
  for (const k of Object.keys(defaults)) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
    const v = raw[k];
    if (k === 'viewMemory' || k === 'recoveryDrafts') {
      if (record(v) && byteLength(JSON.stringify(v)) <= LIMITS.draftBytes) result[k] = Object.assign(Object.create(null), v);
      else invalid = true;
    } else if (typeof v === typeof defaults[k] && (typeof v !== 'number' || Number.isFinite(v))) result[k] = v;
    else invalid = true;
  }
  const enumKeys = { language:['auto','de','en','ru'], firstView:['month','week','day','agenda'], firstViewMobile:['agenda','day'], fullWidthScope:['desktop','mobile','none','all'], hourCycle:['locale','24','12'] };
  for (const [k,values] of Object.entries(enumKeys)) if (!values.includes(result[k])) { result[k] = defaults[k]; invalid = true; }
  for (const [k,min,max] of [['dayStart',0,23],['dayEnd',1,24],['firstDayOfWeek',-1,6],['defaultDurationMin',15,1380],['monthChips',1,20]]) {
    if (!Number.isInteger(result[k]) || result[k] < min || result[k] > max) { result[k] = defaults[k]; invalid = true; }
  }
  if (result.dayEnd <= result.dayStart) { result.dayEnd = result.dayStart + 1; invalid = true; }
  if (![15,30,60].includes(result.snapMin)) { result.snapMin = 30; invalid = true; }
  if (result.calendarNotePath.length > 4000) { result.calendarNotePath = ''; invalid = true; }
  const oldMemory = result.viewMemory, oldDrafts = result.recoveryDrafts;
  result.viewMemory = Object.fromEntries(Object.entries(oldMemory).filter(([k,v]) => k.length <= 5000 && record(v)
    && (v.view == null || ['month','week','day','agenda'].includes(v.view))
    && (v.showCompleted == null || typeof v.showCompleted === 'boolean')
    && (v.zoomFit == null || typeof v.zoomFit === 'boolean')
    && (v.zoom == null || (Number.isFinite(v.zoom) && v.zoom > 0 && v.zoom <= 3))).slice(-LIMITS.states));
  result.recoveryDrafts = Object.fromEntries(Object.entries(oldDrafts).filter(([k,v]) => k.length<200 && record(v) && typeof v.json === 'string' && typeof v.path === 'string' && byteLength(v.json)<=LIMITS.blockBytes));
  if (Object.keys(oldMemory).length !== Object.keys(result.viewMemory).length || Object.keys(oldDrafts).length !== Object.keys(result.recoveryDrafts).length) invalid = true;
  return { settings: result, invalid };
}

// Scan every fence, including ordinary code examples. Never enter a nested fence.
function scanBlocks(text) {
  const lines = String(text).split('\n'), blocks = [];
  let open = null, offset = 0;
  for (let line = 0; line < lines.length; line++) {
    const s = lines[line].replace(/\r$/, ''), end = offset + lines[line].length;
    if (open) {
      const close = /^( {0,3})(`{3,}|~{3,})[ \t]*$/.exec(s);
      if (close && close[2][0] === open.char && close[2].length >= open.length) {
        if (open.calendar) blocks.push({ ...open, lineEnd:line, to:end, bodyTo:offset, closed:true, body:text.slice(open.bodyFrom,offset).trim() });
        open = null;
      }
    } else {
      const match = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(s);
      if (match && !(match[2][0] === '`' && match[3].includes('`'))) {
        const lang = match[3].trim();
        open = { from:offset, lineStart:line, bodyFrom:end+1, char:match[2][0], length:match[2].length,
          indent:match[1], calendar:['md-calendar','mb-calendar'].includes(lang), language:lang };
      }
    }
    offset = end + 1;
  }
  if (open && open.calendar) blocks.push({ ...open, to:text.length, bodyTo:text.length, lineEnd:lines.length-1, closed:false, body:text.slice(open.bodyFrom).trim() });
  return blocks;
}
function fingerprint(source) {
  try { return JSON.stringify(JSON.parse(source.trim() || '{}')); }
  catch { return source.trim().replace(/\r\n/g,'\n'); }
}
function replaceCalendar(text, expected, id, json) {
  const blocks = scanBlocks(text).filter(b => b.closed);
  const matches = blocks.filter(b => {
    if (!id) return fingerprint(b.body) === fingerprint(expected);
    try { return JSON.parse(b.body).calId === id; } catch { return false; }
  });
  if (matches.length !== 1) fail(matches.length ? 'ambiguous' : 'missingBlock');
  const b = matches[0];
  if (fingerprint(b.body) !== fingerprint(expected)) fail('conflict');
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const body = json.split('\n').map(s => b.indent + s).join(nl) + nl;
  return text.slice(0,b.bodyFrom) + body + text.slice(b.bodyTo);
}
function safeExternalURL(value) {
  if (typeof value !== 'string' || /[\u0000-\u0020\u007f-\u009f]/.test(value)) return null;
  try {
    const u = new URL(value);
    return ['https:','http:','mailto:'].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}
function searchKey(value, locale) { return String(value).normalize('NFKC').toLocaleLowerCase(locale).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function chooseLanguage(setting, appLanguage) {
  const code = String(setting === 'auto' ? appLanguage : setting).toLowerCase().replace(/_/g,'-');
  const lang = code.split('-')[0];
  return ['en','de','ru'].includes(lang) ? lang : 'en';
}
function trimHistory(stacks) {
  let bytes = 0;
  for (const u of stacks.values()) { for (const name of ['undo','redo']) { while(u[name].length>50) u[name].shift(); bytes += u[name].reduce((s,x)=>s+x.length*2,0); } }
  for (const u of stacks.values()) for (const name of ['undo','redo']) while(bytes>LIMITS.historyBytes && u[name].length) bytes -= u[name].shift().length*2;
  while(stacks.size>LIMITS.states) stacks.delete(stacks.keys().next().value);
}
module.exports = { LIMITS, CalendarError, record, byteLength, asciiDigits, validateCalendar, validateSettings,
  scanBlocks, fingerprint, replaceCalendar, safeExternalURL, searchKey, chooseLanguage, trimHistory };
