'use strict';

const draftKey = 'ammar-website-draft-v1';
const form = document.getElementById('editor-form');
const status = document.getElementById('editor-status');
const notes = document.getElementById('note-fields');
const input = id => document.getElementById(id);
let source;
let noteNumber = 0;

function safeUrl(value, relative = false) {
  const url = value.trim();
  if (!url) return '';
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
    notes: [...doc.querySelectorAll('#handout-content li')].map(li => ({
      title: li.querySelector('a').textContent,
      url: li.querySelector('a').getAttribute('href'),
      description: li.querySelector('[data-description]')?.textContent || ''
    })),
    aopsHandle: social('aops').dataset.handle || '',
    aopsUrl: social('aops').getAttribute('href') || '',
    discordHandle: social('discord').dataset.handle || '',
    discordUrl: social('discord').getAttribute('href') || '',
    gmail: (social('gmail').getAttribute('href') || '').replace(/^mailto:/, ''),
    youtube: social('youtube').getAttribute('href') || '',
    github: doc.querySelector('#other-links a')?.getAttribute('href') || ''
  };
}

function addNote(note = {}) {
  const row = document.createElement('div');
  row.className = 'note-row';
  const number = ++noteNumber;
  for (const [key, label] of [['title', 'Note title'], ['url', 'Link'], ['description', 'Description (optional)']]) {
    const id = `note-${number}-${key}`;
    const fieldLabel = document.createElement('label');
    fieldLabel.htmlFor = id;
    fieldLabel.textContent = label;
    const field = document.createElement('input');
    field.id = id;
    field.dataset.field = key;
    field.value = note[key] || '';
    field.required = key !== 'description';
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
  });
  row.append(remove);
  notes.append(row);
  return row;
}

const fields = {
  title: 'site-title-input', name: 'name-input', bio: 'bio-input',
  aopsHandle: 'aops-handle', aopsUrl: 'aops-url',
  discordHandle: 'discord-handle', discordUrl: 'discord-url',
  gmail: 'gmail-input', youtube: 'youtube-url', github: 'github-url'
};

function fill(data) {
  for (const [key, id] of Object.entries(fields)) input(id).value = data[key] || '';
  notes.replaceChildren();
  for (const note of data.notes || []) addNote(note);
}

function collect() {
  const data = Object.fromEntries(Object.entries(fields).map(([key, id]) => [key, input(id).value.trim()]));
  data.notes = [...notes.children].map(row => Object.fromEntries(
    [...row.querySelectorAll('input')].map(field => [field.dataset.field, field.value.trim()])
  ));
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
      if (!note.title || !note.url) throw new Error('Every note needs a title and a link.');
      const li = doc.createElement('li');
      const link = doc.createElement('a');
      link.textContent = note.title;
      link.setAttribute('href', safeUrl(note.url, true));
      li.append(link);
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
  other.replaceChildren();
  if (data.github) {
    const item = doc.createElement('li');
    const link = doc.createElement('a');
    link.href = safeUrl(data.github);
    link.textContent = 'GitHub';
    item.append(link);
    other.append(item);
  }
  return doc;
}

function serialize(doc) {
  return '<!doctype html>\n' + doc.documentElement.outerHTML + '\n';
}

function validDocument() {
  if (!form.reportValidity()) return null;
  try { return render(collect()); }
  catch (error) { status.textContent = error.message; return null; }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const doc = validDocument();
  if (!doc) return;
  // Preview stays sandboxed; scripts are unnecessary for inspecting the page.
  doc.querySelectorAll('script').forEach(script => script.remove());
  const base = doc.createElement('base');
  base.href = new URL('./', location.href).href;
  doc.head.prepend(base);
  input('preview').srcdoc = serialize(doc);
  input('preview-section').hidden = false;
  status.textContent = 'Preview updated below. Your live page has not changed.';
  input('preview-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

input('add-note').addEventListener('click', () => addNote().querySelector('input').focus());
input('save-draft').addEventListener('click', () => {
  try {
    localStorage.setItem(draftKey, JSON.stringify(collect()));
    status.textContent = 'Draft saved in this browser. Download and upload it to GitHub when ready to publish.';
  } catch {
    status.textContent = 'Browser storage is unavailable. You can still download your changes.';
  }
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
  status.textContent = 'Downloaded index.html. Upload it to GitHub using the steps below to publish your changes.';
});

input('reset-draft').addEventListener('click', () => {
  if (!confirm('Discard this browser’s draft and reload the current website content?')) return;
  try { localStorage.removeItem(draftKey); } catch { /* Loading the published page still works. */ }
  fill(readPage(source));
  input('preview-section').hidden = true;
  status.textContent = 'Current website content restored in the editor.';
});

(async () => {
  try {
    const response = await fetch('index.html', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load index.html.');
    source = new DOMParser().parseFromString(await response.text(), 'text/html');
    const published = readPage(source);
    fill(published);
    status.textContent = 'Ready to edit. Save a draft to keep your work in this browser.';
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) {
        const draft = JSON.parse(stored);
        if (!draft || typeof draft !== 'object' || !Array.isArray(draft.notes) ||
            !Object.keys(fields).every(key => typeof draft[key] === 'string') ||
            !draft.notes.every(note => note && ['title', 'url', 'description'].every(key => typeof note[key] === 'string'))) {
          throw new Error('Invalid draft');
        }
        fill(draft);
        status.textContent = 'Loaded your saved browser draft. Discard draft to start from the current website.';
      }
    } catch {
      status.textContent = 'Saved draft unavailable. Loaded the current website; downloads still work.';
    }
    input('editor-fields').disabled = false;
  } catch {
    status.textContent = 'Could not load your website. Open this editor through GitHub Pages or the local development server, then reload.';
  }
})();
