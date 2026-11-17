document.querySelectorAll('button[data-handle]').forEach(button => {
  button.addEventListener('click', async () => {
    const handle = button.dataset.handle;
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(handle);
      status.textContent = `Copied username: ${handle}`;
    } catch {
      status.textContent = `Username: ${handle} — select this text to copy it.`;
    }
  });
});
