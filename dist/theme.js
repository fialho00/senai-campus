(() => {
  'use strict';
  const key = 'nexo-campus-theme';
  const stored = (() => { try { return localStorage.getItem(key); } catch { return null; } })();
  const preferred = stored === 'light' || stored === 'dark' ? stored : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = preferred;
  const update = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.textContent = dark ? '☀ Claro' : '☾ Escuro';
      button.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
      button.setAttribute('aria-pressed', String(dark));
    });
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = dark ? '#0c1628' : '#1A4B9F';
  };
  document.addEventListener('DOMContentLoaded', () => {
    update();
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(key, next); } catch {}
      update();
    }));
  });
})();
