    // Toggle visual da senha
    const toggle = document.querySelector('.toggle-pass');
    const password = document.getElementById('password');
    toggle.addEventListener('click', () => {
      const isPass = password.type === 'password';
      password.type = isPass ? 'text' : 'password';
      toggle.textContent = isPass ? 'Ocultar' : 'Mostrar';
      toggle.setAttribute('aria-pressed', String(isPass));
    });

    // Validação simples do formulário
    const form = document.getElementById('loginForm');
    const emailEl = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    function validateEmail(value){
      // validação simples: presença de @ e .
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      emailError.textContent = '';
      passwordError.textContent = '';

      if(!emailEl.value.trim()){
        emailError.textContent = 'Preencha o e‑mail.'; ok = false;
      } else if(!validateEmail(emailEl.value.trim())){
        emailError.textContent = 'E‑mail inválido.'; ok = false;
      }

      if(!password.value || password.value.length < 6){
        passwordError.textContent = 'A senha deve ter ao menos 6 caracteres.'; ok = false;
      }

      if(!ok) return;

      // Aqui é o fetch para o Backend
      buttonFeedback('Entrando...');
      setTimeout(() => {
        buttonFeedback('Entrar');
        // Simular sucesso — no mundo real, redirecione ao receber token do backend
        alert('Login bem‑sucedido!');
        window.location.assign("/schedule/main.html");
      }, 1100);
    });

    function buttonFeedback(text){
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = text;
    }

    // Acessibilidade extra: limpar mensagens de erro ao digitar
    [emailEl, password].forEach(el => el.addEventListener('input', () => {
      if(el === emailEl) emailError.textContent = '';
      if(el === password) passwordError.textContent = '';
    }));
