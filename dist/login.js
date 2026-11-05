(() => {
  const login = document.getElementById('googleLogin');
  const status = document.getElementById('loginState');
  login.addEventListener('click', event => {
    if (login.getAttribute('aria-disabled') === 'true') event.preventDefault();
  });
  const state = new URLSearchParams(location.search).get('status');
  if (state === 'erro') status.textContent = 'Não foi possível validar a conta. Confira se ela pertence ao domínio institucional autorizado.';
  else if (state === 'saiu') status.textContent = 'Você saiu da conta institucional.';
  Promise.all([
    fetch('/api/status', { cache: 'no-store' }).then(r => r.json()),
    fetch('/api/me', { cache: 'no-store' }).then(r => r.json())
  ]).then(([config, me]) => {
    if (config.googleSenai) {
      login.setAttribute('aria-disabled', 'false');
      if (!state) status.textContent = 'Login Google Workspace habilitado. Apenas domínios institucionais autorizados.';
    } else if (!state) status.textContent = 'Aguardando credenciais OAuth institucionais para ativar este acesso.';
    if (me.authenticated) {
      document.getElementById('signedArea').hidden = false;
      document.getElementById('signedGreeting').textContent = `Conectado como ${me.student.name} (${me.student.hd}).`;
    }
  }).catch(() => { status.textContent = 'Integração ainda não disponível. A demonstração pública continua acessível.'; });
})();
