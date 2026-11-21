(() => {
  'use strict';

  const gallery = document.getElementById('photo-gallery');
  if (!gallery || typeof HTMLDialogElement === 'undefined' ||
      typeof HTMLDialogElement.prototype.showModal !== 'function') return;

  let dialog;
  let photo;
  let caption;
  let trigger;

  function createDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'photo-dialog';
    dialog.setAttribute('aria-label', 'Photo viewer');

    const content = document.createElement('div');
    content.className = 'photo-dialog-content';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'photo-dialog-close';
    close.textContent = 'Close photo';
    close.autofocus = true;
    close.addEventListener('click', () => dialog.close());

    const figure = document.createElement('figure');
    photo = document.createElement('img');
    photo.decoding = 'async';
    caption = document.createElement('figcaption');
    figure.append(photo, caption);
    content.append(close, figure);
    dialog.append(content);
    document.body.append(dialog);

    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      photo.removeAttribute('src');
      if (trigger?.isConnected) trigger.focus();
      trigger = null;
    });
  }

  gallery.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey ||
        event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('figure a') : null;
    if (!link || !gallery.contains(link) || link.hasAttribute('download')) return;
    const thumbnail = link.querySelector('img');
    if (!thumbnail) return;
    const src = thumbnail.getAttribute('src');
    if (!src) return;

    if (!dialog) createDialog();
    photo.setAttribute('src', src);
    photo.alt = thumbnail.alt;
    caption.textContent = link.closest('figure').querySelector('figcaption')?.textContent || '';
    caption.hidden = !caption.textContent.trim();
    trigger = link;
    try {
      dialog.showModal();
      event.preventDefault();
    } catch {
      // Keep the ordinary link usable if the browser cannot open the dialog.
      trigger = null;
    }
  });
})();
