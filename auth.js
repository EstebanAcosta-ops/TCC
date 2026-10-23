(() => {
  const client = window.supabaseClient;
  const message = (text, error = false) => {
    const el = document.getElementById("auth-message");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("error", error);
  };

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!client) return message("Primero configura la URL y la clave pública de Supabase en supabase-config.js.", true);
      const data = new FormData(loginForm);
      const button = loginForm.querySelector("button");
      button.disabled = true; button.textContent = "Ingresando…";
      const { error } = await client.auth.signInWithPassword({
        email: String(data.get("email")).trim(),
        password: String(data.get("password"))
      });
      button.disabled = false; button.textContent = "Entrar a mi cuenta →";
      if (error) return message(error.message, true);
      window.location.href = "index.html";
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!client) return message("Primero configura la URL y la clave pública de Supabase en supabase-config.js.", true);
      const data = new FormData(registerForm);
      const button = registerForm.querySelector("button");
      button.disabled = true; button.textContent = "Creando cuenta…";
      const { error } = await client.auth.signUp({
        email: String(data.get("email")).trim(),
        password: String(data.get("password")),
        options: {
          data: {
            full_name: String(data.get("full_name")).trim(),
            contact: String(data.get("contact")).trim()
          },
          emailRedirectTo: window.location.origin + window.location.pathname.replace(/[^/]*$/, "index.html")
        }
      });
      button.disabled = false; button.textContent = "Crear mi cuenta →";
      if (error) return message(error.message, true);
      message("Registro enviado. Si Supabase solicita confirmar el correo, revisa tu bandeja y luego inicia sesión.");
      registerForm.reset();
    });
  }
})();
