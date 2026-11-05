(() => {
  'use strict';
  const reader = document.getElementById('reader');
  const alerts = document.getElementById('alerts');
  const modeButtons = [...document.querySelectorAll('[data-mode]')].filter(el => el.classList.contains('mode-button'));
  const checks = [...document.querySelectorAll('.check-chip input')];
  const speakBtn = document.getElementById('speakBtn');
  const stopBtn = document.getElementById('stopBtn');
  const voiceStatus = document.getElementById('voiceStatus');

  const notices = {
    amendoim: {kind:'warning', title:'Atenção: contém amendoim.', description:'O exemplo de produto declara pasta de amendoim nos ingredientes.'},
    leite: {kind:'caution', title:'Atenção: pode conter leite.', description:'O rótulo ilustrativo informa possibilidade de presença de leite.'},
    soja: {kind:'caution', title:'Atenção: pode conter soja.', description:'O rótulo ilustrativo informa possibilidade de presença de soja.'},
    gluten: {kind:'caution', title:'Atenção à aveia e ao glúten.', description:'Não há comprovação de ausência de glúten neste protótipo. Consulte o rótulo real e o fabricante.'}
  };

  function selectedWarnings() { return checks.filter(x => x.checked).map(x => notices[x.value]); }
  function redraw() {
    alerts.replaceChildren();
    const selected = selectedWarnings();
    if (!selected.length) {
      const div = document.createElement('div'); div.className = 'safe-hint';
      div.textContent = 'Selecione um ingrediente à esquerda para verificar os avisos.';
      alerts.append(div); return;
    }
    selected.forEach(item => {
      const div = document.createElement('div');
      div.className = item.kind === 'warning' ? 'warning-note' : 'caution-note';
      div.setAttribute('role','alert');
      const strong = document.createElement('strong'); strong.textContent = item.title;
      const span = document.createElement('span'); span.textContent = item.description;
      div.append(strong, span); alerts.append(div);
    });
  }
  function stopVoice(message = '') {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stopBtn.disabled = true; speakBtn.disabled = false; voiceStatus.textContent = message;
  }
  modeButtons.forEach(btn => btn.addEventListener('click', () => {
    modeButtons.forEach(x => { x.classList.toggle('is-active', x === btn); x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
    reader.dataset.mode = btn.dataset.mode;
  }));
  checks.forEach(ch => ch.addEventListener('change', () => { redraw(); stopVoice(); }));
  document.getElementById('resetBtn').addEventListener('click', () => {
    checks.forEach(x => { x.checked = false; });
    modeButtons[0].click(); redraw(); stopVoice('Preferências redefinidas.');
  });
  speakBtn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      voiceStatus.textContent = 'Este navegador não oferece leitura de voz. Você ainda pode ler o rótulo na tela.'; return;
    }
    stopVoice();
    const selected = selectedWarnings();
    const text = [
      'NEXO. Rótulo digital demonstrativo. Barra de cacau e aveia, 45 gramas.',
      'Ingredientes: aveia, tâmaras, cacau e pasta de amendoim.',
      'Informações sobre alergênicos: contém amendoim. Pode conter leite e soja.',
      ...selected.map(n => n.title + ' ' + n.description),
      'Este é um produto fictício. Antes de consumir um alimento real, confira sempre o rótulo oficial.'
    ].join(' ');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR'; utterance.rate = .92; utterance.pitch = 1;
    utterance.onend = () => stopVoice('Leitura concluída.');
    utterance.onerror = () => stopVoice('A leitura por voz não pôde ser concluída neste dispositivo.');
    speakBtn.disabled = true; stopBtn.disabled = false; voiceStatus.textContent = 'Lendo o rótulo em voz alta…';
    window.speechSynthesis.speak(utterance);
  });
  stopBtn.addEventListener('click', () => stopVoice('Leitura interrompida.'));
  window.addEventListener('pagehide', () => stopVoice());
  redraw();
})();
