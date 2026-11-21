'use strict';

const draftKey = 'ammar-website-draft-v1';
const form = document.getElementById('editor-form');
const status = document.getElementById('editor-status');
const notes = document.getElementById('note-fields');
const input = id => document.getElementById(id);
let source;
let noteNumber = 0;
let ready = false;
let dirty = false;
let saving = false;
const profiles = [
  { key: 'github', label: 'GitHub', hostname: 'github.com' },
  { key: 'math-stackexchange', field: 'mathstackexchange', label: 'Math Stack Exchange', hostname: 'math.stackexchange.com' },
  { key: 'inaturalist', label: 'iNaturalist', hostname: 'inaturalist.org' }
];

function profileLink(doc, profile) {
  const explicit = doc.querySelector(`#other-links a[data-profile="${profile.key}"]`);
  if (explicit) return explicit;
  return [...doc.querySelectorAll('#other-links a:not([data-profile])')].find(link => {
    try {
      const hostname = new URL(link.getAttribute('href')).hostname.replace(/^www\./, '');
      return hostname === profile.hostname;
    } catch { return false; }
  });
}

function safeUrl(value, relative = false) {
  const url = value.trim();
  if (!url) return '';
  if (/^(?:file:|[a-z]:|\/(?:Users|home|workspace)(?:\/|$)|~(?:[\\/]|$))/i.test(url)) {
    throw new Error('That is a path on your computer. Upload the PDF to GitHub first, then use handouts/filename.pdf or a public https:// URL. Leave the link blank to show “PDF coming soon.”');
  }
  if (/\s|\\/.test(url)) throw new Error('Links cannot contain spaces or backslashes. Use %20 for spaces in filenames.');
  if (/^https?:\/\//i.test(url)) {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) throw new Error('Use links without embedded credentials.');
    return url;
  }
  if (relative && !/^[a-z][a-z\d+.-]*:|^\/\//i.test(url)) return url;
  throw new Error('Profile links must start with https:// or http://. Handouts can also use relative file paths.');
}

function readPage(doc) {
  const social = key => doc.querySelector(`[data-social="${key}"]`);
  return {
    title: doc.getElementById('site-title').textContent,
    name: doc.getElementById('owner-name').textContent,
    bio: doc.getElementById('bio').textContent,
    photos: photoEditor.read(doc),
    notes: [...doc.querySelectorAll('#handout-content li')].map(li => ({
      title: li.querySelector('a, [data-note-title]')?.textContent || '',
      url: li.querySelector('a')?.getAttribute('href') || '',
      description: li.querySelector('[data-description]')?.textContent || ''
    })),
    aopsHandle: social('aops').dataset.handle || '',
    aopsUrl: social('aops').getAttribute('href') || '',
    discordHandle: social('discord').dataset.handle || '',
    discordUrl: social('discord').getAttribute('href') || '',
    gmail: (social('gmail').getAttribute('href') || '').replace(/^mailto:/, ''),
    youtube: social('youtube').getAttribute('href') || '',
    ...Object.fromEntries(profiles.map(profile => [
      profile.field || profile.key, profileLink(doc, profile)?.getAttribute('href') || ''
    ]))
  };
}

function addNote(note = {}) {
  const row = document.createElement('div');
  row.className = 'note-row';
  const number = ++noteNumber;
  for (const [key, label] of [['title', 'Note title'], ['url', 'Link (optional)'], ['description', 'Description (optional)']]) {
    const id = `note-${number}-${key}`;
    const fieldLabel = document.createElement('label');
    fieldLabel.htmlFor = id;
    fieldLabel.textContent = label;
    const field = document.createElement('input');
    field.id = id;
    field.dataset.field = key;
    field.value = note[key] || '';
    field.required = key === 'title';
    if (key === 'url') field.placeholder = 'handouts/algebra.pdf or https://…';
    row.append(fieldLabel, field);
  }
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'Remove note';
  remove.addEventListener('click', () => {
    row.remove();
    input('add-note').focus();
    status.textContent = 'Note removed from this draft. Save or download to keep the change.';
    markChanged();
  });
  row.append(remove);
  notes.append(row);
  return row;
}

const fields = {
  title: 'site-title-input', name: 'name-input', bio: 'bio-input',
  aopsHandle: 'aops-handle', aopsUrl: 'aops-url',
  discordHandle: 'discord-handle', discordUrl: 'discord-url',
  gmail: 'gmail-input', youtube: 'youtube-url', github: 'github-url',
  mathstackexchange: 'mathstackexchange-url', inaturalist: 'inaturalist-url'
};

function fill(data) {
  for (const [key, id] of Object.entries(fields)) input(id).value = data[key] || '';
  notes.replaceChildren();
  for (const note of data.notes || []) addNote(note);
  photoEditor.fill(data.photos || []);
  updateSummary();
}

function collect() {
  const data = Object.fromEntries(Object.entries(fields).map(([key, id]) => [key, input(id).value.trim()]));
  data.notes = [...notes.children].map(row => Object.fromEntries(
    [...row.querySelectorAll('input')].map(field => [field.dataset.field, field.value.trim()])
  ));
  data.photos = photoEditor.collect();
  return data;
}

function render(data) {
  if (!data.title || !data.name || !data.bio) throw new Error('Please fill in the website title, name, and bio.');
  const doc = source.cloneNode(true);
  doc.title = data.title;
  doc.getElementById('site-title').textContent = data.title;
  doc.getElementById('owner-name').textContent = data.name;
  doc.getElementById('bio').textContent = data.bio;
  doc.querySelector('meta[name="description"]').setAttribute('content', data.bio.replace(/\s+/g, ' ').slice(0, 160));

  const handouts = doc.getElementById('handout-content');
  handouts.replaceChildren();
  if (data.notes.length) {
    const list = doc.createElement('ul');
    for (const note of data.notes) {
      if (!note.title) throw new Error('Every note needs a title. You can leave its link blank until the PDF is ready.');
      const li = doc.createElement('li');
      if (note.url) {
        const link = doc.createElement('a');
        link.textContent = note.title;
        link.setAttribute('href', safeUrl(note.url, true));
        li.append(link);
      } else {
        const title = doc.createElement('span');
        title.dataset.noteTitle = '';
        title.textContent = note.title;
        const pending = doc.createElement('span');
        pending.className = 'help';
        pending.textContent = ' — PDF coming soon.';
        li.append(title, pending);
      }
      if (note.description) {
        const description = doc.createElement('span');
        description.dataset.description = '';
        description.textContent = note.description;
        li.append(' — ', description);
      }
      list.append(li);
    }
    handouts.append(list);
  } else {
    const empty = doc.createElement('p');
    empty.textContent = 'No handouts yet. Check back soon.';
    handouts.append(empty);
  }

  for (const [key, label, rawUrl, handle] of [
    ['aops', 'AoPS', data.aopsUrl, data.aopsHandle],
    ['discord', 'Discord', data.discordUrl, data.discordHandle],
    ['gmail', 'Gmail', data.gmail ? `mailto:${data.gmail}` : '', ''],
    ['youtube', 'YouTube', data.youtube, '']
  ]) {
    if (key === 'gmail' && data.gmail && !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(data.gmail)) {
      throw new Error('Enter a valid email address.');
    }
    const url = key === 'gmail' ? rawUrl : safeUrl(rawUrl);
    const element = doc.createElement(url ? 'a' : handle ? 'button' : 'span');
    element.className = 'social-link';
    element.dataset.social = key;
    if (handle) element.dataset.handle = handle;
    if (url) element.setAttribute('href', url);
    else if (handle) {
      element.type = 'button';
      element.title = `Copy ${label} username`;
    } else {
      element.classList.add('is-unset');
      element.title = 'Link not added yet';
    }
    const icon = doc.createElement('img');
    icon.src = `icons/${key}.svg`;
    icon.width = icon.height = 32;
    icon.alt = '';
    const text = doc.createElement('span');
    text.textContent = label;
    if (handle) {
      const username = doc.createElement('span');
      username.className = 'handle';
      username.textContent = handle;
      text.append(username);
    }
    element.append(icon, text);
    doc.querySelector(`[data-social="${key}"]`).replaceWith(element);
  }
  const other = doc.getElementById('other-links');
  for (const profile of profiles) {
    const existing = profileLink(doc, profile);
    const url = safeUrl(data[profile.field || profile.key]);
    if (!url) {
      if (existing) {
        const item = existing.closest('li');
        existing.remove();
        if (item && !item.textContent.trim() && !item.querySelector('a')) item.remove();
      }
      continue;
    }
    const link = doc.createElement('a');
    link.dataset.profile = profile.key;
    link.href = url;
    link.textContent = profile.label;
    if (existing) existing.replaceWith(link);
    else {
      const item = doc.createElement('li');
      item.append(link);
      other.append(item);
    }
  }
  photoEditor.render(doc, data.photos);
  return doc;
}

function serialize(doc) {
  return '<!doctype html>\n' + doc.documentElement.outerHTML + '\n';
}

const panelNames = { overview: 'Overview', about: 'About your site', handouts: 'Handouts & notes', photos: 'Photos', links: 'Personal links', publish: 'Publish your changes' };

function showPanel(name, updateHash = true) {
  if (!Object.hasOwn(panelNames, name)) name = 'overview';
  document.querySelectorAll('.dashboard-panel').forEach(panel => { panel.hidden = panel.id !== `panel-${name}`; });
  document.querySelectorAll('.dashboard-nav [data-panel]').forEach(link => {
    if (link.dataset.panel === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  input('panel-title').textContent = panelNames[name];
  if (updateHash) history.replaceState(null, '', `#${name}`);
}

document.querySelectorAll('[data-panel]').forEach(link => link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  showPanel(link.dataset.panel);
}));
window.addEventListener('hashchange', () => showPanel(location.hash.slice(1), false));
showPanel(location.hash.slice(1), false);

function updateSummary() {
  input('overview-title').textContent = input('site-title-input').value.trim() || 'Your website';
  input('stat-notes').textContent = notes.children.length;
  const photos = photoEditor.collect();
  input('stat-photos').textContent = photos.length;
  input('notes-empty').hidden = notes.children.length > 0;
  input('photos-empty').hidden = photos.length > 0;
  const socialCount = [
    input('aops-handle').value || input('aops-url').value,
    input('discord-handle').value || input('discord-url').value,
    input('gmail-input').value, input('youtube-url').value,
    input('github-url').value, input('mathstackexchange-url').value, input('inaturalist-url').value
  ].filter(value => value.trim()).length;
  input('stat-links').textContent = socialCount;
  document.querySelectorAll('[data-editor-action]').forEach(button => {
    button.disabled = !ready || photoEditor.isBusy() || saving;
  });
  input('reset-draft').disabled = !ready || photoEditor.isBusy() || saving;
}

function badge(message, unsaved = false) {
  input('draft-state').textContent = message;
  input('draft-state').classList.toggle('unsaved', unsaved);
}

function markChanged() {
  updateSummary();
  if (!ready) return;
  dirty = true;
  badge('Unsaved changes', true);
  status.textContent = photoEditor.isBusy() ? 'Preparing your photos…' : 'Save a draft to keep your changes on this device.';
}
form.addEventListener('input', markChanged);
document.addEventListener('photoschange', markChanged);
window.addEventListener('beforeunload', event => {
  if (dirty) { event.preventDefault(); event.returnValue = ''; }
});

function openDraftDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ammar-website-editor', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Draft storage is blocked.'));
    request.onsuccess = () => resolve(request.result);
  });
}

async function draftTransaction(mode, action) {
  const database = await openDraftDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction('drafts', mode);
      let result;
      const request = action(transaction.objectStore('drafts'));
      request.onsuccess = () => { result = request.result; };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Draft storage failed.'));
    });
  } finally { database.close(); }
}

let latestDraftTime = 0;

function normalizeDraftRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  if (!Object.hasOwn(record, 'savedAt') && !Object.hasOwn(record, 'data')) {
    return { savedAt: 0, data: record };
  }
  if (!Number.isFinite(record.savedAt) || record.savedAt < 0 ||
      !Object.hasOwn(record, 'data') ||
      (record.data !== null && (typeof record.data !== 'object' || Array.isArray(record.data)))) return null;
  latestDraftTime = Math.max(latestDraftTime, record.savedAt);
  return record;
}

function draftRecord(data) {
  // Keep saves ordered even if two actions occur within the same millisecond.
  latestDraftTime = Math.max(Date.now(), latestDraftTime + 1);
  return { savedAt: latestDraftTime, data };
}

async function loadDraft() {
  const results = await Promise.allSettled([
    draftTransaction('readonly', store => store.get('current')),
    Promise.resolve().then(() => {
      const stored = localStorage.getItem(draftKey);
      return stored ? JSON.parse(stored) : null;
    })
  ]);
  if (results.every(result => result.status === 'rejected')) throw new Error('Draft storage is unavailable.');
  const [database, fallback] = results.map(result => result.status === 'fulfilled' ? normalizeDraftRecord(result.value) : null);
  const newest = fallback && (!database || fallback.savedAt >= database.savedAt) ? fallback : database;
  return newest?.data ?? null;
}

async function storeDraft(data) {
  const record = draftRecord(data);
  try {
    await draftTransaction('readwrite', store => store.put(record, 'current'));
  } catch {
    localStorage.setItem(draftKey, JSON.stringify(record));
    return;
  }
  try { localStorage.removeItem(draftKey); } catch { /* The newer database record wins on reload. */ }
}

async function removeDraft() {
  let databaseCleared = false;
  try {
    await draftTransaction('readwrite', store => store.delete('current'));
    databaseCleared = true;
  } catch { /* A timestamped fallback can hide an inaccessible old record. */ }
  if (databaseCleared) {
    try { localStorage.removeItem(draftKey); return; }
    catch { /* Persist a database tombstone if the fallback cannot be cleared. */ }
  }
  const tombstone = draftRecord(null);
  if (!databaseCleared) {
    try { localStorage.setItem(draftKey, JSON.stringify(tombstone)); return; }
    catch { /* Try the database once more if only deletion was unavailable. */ }
  }
  await draftTransaction('readwrite', store => store.put(tombstone, 'current'));
}

function validDocument() {
  if (photoEditor.isBusy()) { status.textContent = 'Wait for your photos to finish preparing.'; return null; }
  const invalid = [...form.querySelectorAll('input, textarea')].find(field => !field.checkValidity());
  if (invalid) {
    showPanel(invalid.closest('.dashboard-panel').id.replace('panel-', ''));
    invalid.reportValidity();
    status.textContent = 'Please complete the highlighted field.';
    return null;
  }
  try {
    photoEditor.validate(photoEditor.collect());
  } catch (error) {
    showPanel('photos');
    status.textContent = error.message;
    return null;
  }
  try { return render(collect()); }
  catch (error) { status.textContent = error.message; return null; }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const doc = validDocument();
  if (!doc) return;
  doc.querySelectorAll('script').forEach(script => script.remove());
  const base = doc.createElement('base');
  base.href = new URL('./', location.href).href;
  doc.head.prepend(base);
  input('preview').srcdoc = serialize(doc);
  input('preview-section').hidden = false;
  status.textContent = 'Preview updated below. Your live page has not changed.';
  input('preview-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
input('close-preview').addEventListener('click', () => {
  input('preview-section').hidden = true;
  input('preview-button').focus();
});

input('add-note').addEventListener('click', () => {
  addNote().querySelector('input').focus();
  markChanged();
});
input('save-draft').addEventListener('click', async () => {
  if (!ready || photoEditor.isBusy() || saving) return;
  saving = true;
  updateSummary();
  const data = collect();
  try {
    await storeDraft(data);
    dirty = JSON.stringify(collect()) !== JSON.stringify(data);
    badge(dirty ? 'Unsaved changes' : 'Saved on this device', dirty);
    status.textContent = dirty ? 'Draft saved. Save again to include your latest changes.' : 'Draft saved with your photos. Download and upload to GitHub when you’re ready.';
  } catch {
    status.textContent = 'Browser storage is unavailable or full. Download the page to keep a copy of your changes.';
    badge('Not saved', true);
  } finally { saving = false; updateSummary(); }
});

input('download').addEventListener('click', () => {
  const doc = validDocument();
  if (!doc) return;
  const url = URL.createObjectURL(new Blob([serialize(doc)], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'index.html';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  showPanel('publish');
  status.textContent = 'Downloaded index.html, including uploaded photos. Follow the steps below to publish.';
});

input('reset-draft').addEventListener('click', async () => {
  if (photoEditor.isBusy() || saving) return;
  if (!confirm('Discard this browser’s draft and reload the current website content?')) return;
  saving = true;
  updateSummary();
  try {
    await removeDraft();
    ready = false;
    fill(readPage(source));
    ready = true;
    dirty = false;
    input('preview-section').hidden = true;
    badge('Current website');
    status.textContent = 'Current website content restored in the dashboard.';
  } catch {
    status.textContent = 'Could not clear the saved draft. Your edits are still here; download them before trying again.';
  } finally { saving = false; updateSummary(); }
});

(async () => {
  try {
    const response = await fetch('index.html', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load index.html.');
    source = new DOMParser().parseFromString(await response.text(), 'text/html');
    const published = readPage(source);
    fill(published);
    badge('Current website');
    status.textContent = 'Ready when you are. Your changes stay in this browser until you publish.';
    try {
      const storedDraft = await loadDraft();
      if (storedDraft) {
        if (typeof storedDraft !== 'object' || Array.isArray(storedDraft)) throw new Error('Invalid draft');
        const draft = { ...published, ...storedDraft };
        if (!Array.isArray(draft.notes) || !Array.isArray(draft.photos) ||
            !Object.keys(fields).every(key => typeof draft[key] === 'string') ||
            !draft.notes.every(note => note && ['title', 'url', 'description'].every(key => typeof note[key] === 'string')) ||
            !draft.photos.every(photo => photo && ['src', 'alt', 'caption'].every(key => typeof photo[key] === 'string'))) {
          throw new Error('Invalid draft');
        }
        fill(draft);
        badge('Saved draft');
        status.textContent = 'Loaded your saved draft. It may differ from the published website.';
      }
    } catch {
      status.textContent = 'Saved draft unavailable. Loaded the current website; you can still download your edits.';
    }
    ready = true;
    input('editor-fields').disabled = false;
    updateSummary();
  } catch {
    badge('Could not load', true);
    status.textContent = 'Could not load your website. Open this dashboard through GitHub Pages or the local server, then reload.';
  }
})();
