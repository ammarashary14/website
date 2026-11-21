(() => {
  'use strict';

  const container = document.getElementById('photo-fields');
  const upload = document.getElementById('photo-upload');
  const addButton = document.getElementById('add-photo-url');
  const status = document.getElementById('photo-status');
  const maxFileSize = 15 * 1024 * 1024;
  let nextId = 0;
  let busy = false;
  let generation = 0;

  function announce(message) {
    if (status) status.textContent = message;
  }

  function changed() {
    const rows = [...container.children];
    rows.forEach((row, index) => {
      row.querySelector('[data-move="up"]').disabled = index === 0;
      row.querySelector('[data-move="down"]').disabled = index === rows.length - 1;
    });
    document.dispatchEvent(new Event('photoschange'));
  }

  function safeSource(value) {
    if (typeof value !== 'string' || !value.trim()) throw new Error('Each photo needs an image URL or an uploaded image.');
    const src = value.trim();
    if (/^data:/i.test(src)) {
      if (!/^data:image\/(?:jpeg|png|webp|gif);base64,(?:[a-z\d+/]{4})*(?:[a-z\d+/]{2}==|[a-z\d+/]{3}=)?$/i.test(src) || src.endsWith(',')) {
        throw new Error('Embedded photos must be JPEG, PNG, WebP, or GIF images. Upload the image again.');
      }
      return src;
    }
    if (/^(?:file:|[a-z]:|\/(?:Users|home|workspace|tmp|private)(?:\/|$)|~(?:[\\/]|$))/i.test(src)) {
      throw new Error('That photo path is on your computer. Use Upload photos, a public https:// image URL, or a site path such as photos/bird.jpg.');
    }
    if (/[\s\\\u0000-\u001f\u007f]/.test(src)) {
      throw new Error('Photo URLs cannot contain spaces or backslashes. Use %20 for spaces in filenames.');
    }
    if (/^https?:\/\//i.test(src)) {
      let parsed;
      try { parsed = new URL(src); } catch { throw new Error('Enter a complete public image URL.'); }
      if (parsed.username || parsed.password) throw new Error('Photo URLs cannot contain embedded credentials.');
      return src;
    }
    if (/^[a-z][a-z\d+.-]*:|^\/\/|^[?#]/i.test(src)) {
      throw new Error('Use an https:// image URL, a site path such as photos/bird.jpg, or upload a photo.');
    }
    return src;
  }

  function validate(photos) {
    if (!Array.isArray(photos)) throw new Error('The photo list is invalid.');
    photos.forEach((photo, index) => {
      if (!photo || typeof photo !== 'object') throw new Error(`Photo ${index + 1} is invalid.`);
      try { safeSource(photo.src); }
      catch (error) { throw new Error(`Photo ${index + 1}: ${error.message}`); }
      if (typeof photo.alt !== 'string' || !photo.alt.trim()) {
        throw new Error(`Photo ${index + 1} needs a short description for people using screen readers.`);
      }
      if (typeof photo.caption !== 'string') throw new Error(`Photo ${index + 1} has an invalid caption.`);
    });
    return photos;
  }

  function read(doc) {
    return [...doc.querySelectorAll('#photo-gallery figure')].flatMap(figure => {
      const img = figure.querySelector('img');
      if (!img) return [];
      return [{
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
        caption: figure.querySelector('figcaption')?.textContent || ''
      }];
    });
  }

  function collect() {
    return [...container.children].map(row => ({
      src: row.querySelector('[data-photo-field="src"]').value.trim(),
      alt: row.querySelector('[data-photo-field="alt"]').value.trim(),
      caption: row.querySelector('[data-photo-field="caption"]').value.trim()
    }));
  }

  function addRow(photo = { src: '', alt: '', caption: '' }) {
    const row = document.createElement('div');
    row.className = 'photo-row';
    const thumb = document.createElement('img');
    thumb.className = 'photo-thumbnail';
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.decoding = 'async';
    thumb.hidden = true;
    const fields = document.createElement('div');
    fields.className = 'photo-row-fields';
    const id = ++nextId;

    for (const [key, label] of [['src', 'Image URL'], ['alt', 'Image description (required)'], ['caption', 'Caption (optional)']]) {
      const field = document.createElement('input');
      field.id = `photo-${id}-${key}`;
      field.dataset.photoField = key;
      field.value = typeof photo[key] === 'string' ? photo[key] : '';
      field.required = key !== 'caption';
      if (key === 'src' && /^data:/i.test(field.value)) {
        field.type = 'hidden';
        const uploaded = document.createElement('p');
        uploaded.className = 'help';
        uploaded.textContent = 'Uploaded image · included in your downloaded page';
        fields.append(uploaded, field);
      } else {
        const fieldLabel = document.createElement('label');
        fieldLabel.htmlFor = field.id;
        fieldLabel.textContent = label;
        if (key === 'src') field.placeholder = 'photos/bird.jpg or https://…';
        fields.append(fieldLabel, field);
      }
      field.addEventListener('input', changed);
    }

    const src = fields.querySelector('[data-photo-field="src"]');
    function updateThumbnail() {
      thumb.hidden = true;
      thumb.removeAttribute('src');
      if (!src.value.trim()) return;
      try {
        thumb.src = safeSource(src.value);
        thumb.hidden = false;
      } catch { /* Show URL validation messages when previewing or downloading. */ }
    }
    thumb.addEventListener('error', () => { thumb.hidden = true; });
    src.addEventListener('change', updateThumbnail);
    updateThumbnail();

    const actions = document.createElement('div');
    actions.className = 'photo-row-actions';
    for (const direction of ['up', 'down']) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.move = direction;
      button.textContent = `Move ${direction}`;
      button.addEventListener('click', () => {
        if (direction === 'up' && row.previousElementSibling) container.insertBefore(row, row.previousElementSibling);
        if (direction === 'down' && row.nextElementSibling) container.insertBefore(row.nextElementSibling, row);
        changed();
        announce(`Photo moved ${direction}.`);
        // Keep keyboard focus in this row even when the clicked button becomes disabled.
        (button.disabled ? row.querySelector('[data-photo-field="alt"]') : button).focus();
      });
      actions.append(button);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove photo';
    remove.addEventListener('click', () => {
      row.remove();
      changed();
      announce('Photo removed from this draft.');
      addButton.focus();
    });
    actions.append(remove);
    fields.append(actions);
    row.append(thumb, fields);
    container.append(row);
    return row;
  }

  function fill(photos = []) {
    generation += 1;
    container.replaceChildren();
    if (Array.isArray(photos)) photos.forEach(addRow);
    changed();
  }

  function render(doc, photos) {
    validate(photos);
    const gallery = doc.getElementById('photo-gallery');
    if (!gallery) throw new Error('The website is missing its photo gallery.');
    gallery.replaceChildren();
    if (!photos.length) {
      const empty = doc.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No photos yet.';
      gallery.append(empty);
    }
    for (const photo of photos) {
      const figure = doc.createElement('figure');
      const link = doc.createElement('a');
      const image = doc.createElement('img');
      const src = safeSource(photo.src);
      link.setAttribute('href', src);
      image.setAttribute('src', src);
      image.alt = photo.alt.trim();
      image.loading = 'lazy';
      image.decoding = 'async';
      link.append(image);
      figure.append(link);
      if (photo.caption.trim()) {
        const caption = doc.createElement('figcaption');
        caption.textContent = photo.caption.trim();
        figure.append(caption);
      }
      gallery.append(figure);
    }
    return doc;
  }

  async function rasterType(file) {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const text = String.fromCharCode(...bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
    if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) return 'image/png';
    if (text.startsWith('GIF87a') || text.startsWith('GIF89a')) return 'image/gif';
    if (text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP') return 'image/webp';
    throw new Error('Choose a JPEG, PNG, WebP, or GIF image.');
  }

  async function prepareUpload(file) {
    if (file.size > maxFileSize) throw new Error('This file is over 15 MB. Choose a smaller image.');
    await rasterType(file);
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    try {
      image.src = objectUrl;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('The image has no readable size.');
      if (image.naturalWidth * image.naturalHeight > 80000000) throw new Error('This image is too large to process here. Resize it below 80 megapixels first.');
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Your browser could not prepare this photo. Try an image URL instead.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) { transparent = true; break; }
      }
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not prepare this image.')), transparent ? 'image/png' : 'image/jpeg', 0.85);
      });
      canvas.width = canvas.height = 0;
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read this image. Please try again.'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      if (error instanceof DOMException) throw new Error('This image could not be decoded. Try another JPEG, PNG, WebP, or GIF file.');
      throw error;
    } finally {
      URL.revokeObjectURL(objectUrl);
      image.src = '';
    }
  }

  addButton.addEventListener('click', () => {
    const row = addRow();
    changed();
    row.querySelector('[data-photo-field="src"]').focus();
    announce('Photo added. Enter its image URL and description.');
  });

  upload.addEventListener('change', async () => {
    if (busy) return;
    const files = [...upload.files];
    if (!files.length) return;
    busy = true;
    upload.disabled = true;
    const batch = ++generation;
    let added = 0;
    const failures = [];
    changed();
    try {
      for (const file of files) {
        if (batch !== generation) break;
        announce(`Preparing ${file.name}…`);
        try {
          const src = await prepareUpload(file);
          if (batch !== generation) break;
          addRow({ src, alt: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Uploaded photo', caption: '' });
          added += 1;
          changed();
        } catch (error) {
          failures.push(`${file.name}: ${error.message}`);
        }
        // Let the browser paint progress before processing the next file.
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      if (batch === generation) {
        announce(`${added ? `Added ${added} photo${added === 1 ? '' : 's'}. Edit each description before publishing. Animated images use a still frame.` : 'No photos added.'}${failures.length ? ` ${failures.join(' ')}` : ''}`);
      }
    } finally {
      busy = false;
      upload.disabled = false;
      upload.value = '';
      changed();
    }
  });

  window.photoEditor = { read, fill, collect, render, validate, isBusy: () => busy };
})();
