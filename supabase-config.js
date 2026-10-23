/*
  1. En Supabase abre Project Settings > API (o Connect).
  2. Copia la Project URL y la clave publicable/anon.
  3. Pega los valores de tu proyecto aquí.
  IMPORTANTE: nunca pongas aquí la service_role/secret key.
*/
window.SUPABASE_URL = "https://epmfbzcerrfdoijdvude.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_JCiYvgdfK4FvbpO8sNrj-A_8bzS20wc";
window.supabaseClient = null;

if (window.supabase && window.SUPABASE_URL.startsWith("https://") &&
    !window.SUPABASE_ANON_KEY.includes("PEGA_AQUI")) {
  window.supabaseClient = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );
}
