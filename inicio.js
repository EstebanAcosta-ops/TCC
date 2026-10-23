(() => {
  const client = window.supabaseClient;
  const grid = document.getElementById("product-grid");
  const status = document.getElementById("status-message");
  const searchInput = document.getElementById("search-input");
  const categoryButtons = [...document.querySelectorAll(".category-chip")];
  const profileSection = document.getElementById("mi-perfil");
  const myProducts = document.getElementById("my-products");
  const productForm = document.getElementById("product-form");
  const productMessage = document.getElementById("product-message");
  let products = [];
  let selectedCategory = "Todos";
  let currentUser = null;

  const money = value => new Intl.NumberFormat("es-CO", {style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(value) || 0);
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function makeProductCard(product, own = false) {
    const card = el("article", "product-card");
    const img = el("img", "product-image");
    img.src = product.image_url;
    img.alt = product.name || "Imagen del producto";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => { img.onerror = null; img.src = "https://placehold.co/640x420/f5f0e9/6d7782?text=Producto"; };
    card.append(img);
    const body = el("div", "product-content");
    body.append(el("span", "product-category", product.category || "Otros"));
    body.append(el("h3", "product-title", product.name));
    body.append(el("p", "product-description", product.description || "Consulta al vendedor para conocer más detalles."));
    body.append(el("p", "product-price", money(product.price)));
    const seller = el("div", "seller-info");
    seller.append(el("strong", "", product.seller_name || "Vendedor"));
    seller.append(el("span", "", "Contacto: " + (product.seller_contact || "No indicado")));
    const contact = String(product.seller_contact || "").trim();
    if (contact) {
      const link = el("a", "contact-link", "Contactar al vendedor");
      // Crea enlace de WhatsApp solo si el contacto parece un número; en otro caso no se adivina el tipo de contacto.
      const digits = contact.replace(/\D/g, "");
      if (digits.length >= 8 && /^[+\d\s().-]+$/.test(contact)) {
        link.href = "https://wa.me/" + digits;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.href = "mailto:" + (contact.includes("@") ? contact : "");
        if (!contact.includes("@")) link.removeAttribute("href");
      }
      if (link.hasAttribute("href")) seller.append(link);
    }
    body.append(seller);
    if (own) {
      const remove = el("button", "delete-button", "Eliminar publicación");
      remove.type = "button";
      remove.addEventListener("click", () => deleteProduct(product.id));
      body.append(remove);
    }
    card.append(body);
    return card;
  }
  function renderProducts() {
    grid.replaceChildren();
    const q = (searchInput.value || "").trim().toLocaleLowerCase("es");
    const filtered = products.filter(p =>
      (selectedCategory === "Todos" || p.category === selectedCategory) &&
      (!q || [p.name,p.description,p.category,p.seller_name].some(v => String(v || "").toLocaleLowerCase("es").includes(q)))
    );
    if (!filtered.length) {
      grid.append(el("div", "empty-state", products.length ? "No encontramos productos con esos filtros." : "Aún no hay productos publicados. ¡Sé la primera persona en publicar uno!"));
    } else filtered.forEach(p => grid.append(makeProductCard(p)));
    status.textContent = products.length ? `${products.length} publicación(es) disponibles` : "";
  }
  async function loadProducts() {
    if (!client) {
      status.textContent = "Configura Supabase en supabase-config.js y ejecuta el SQL de la guía para cargar productos reales.";
      grid.replaceChildren(el("div", "empty-state", "La interfaz está lista. Conecta tu proyecto de Supabase para publicar y consultar productos."));
      return;
    }
    status.textContent = "Cargando productos…";
    const { data, error } = await client.from("products").select("*").order("created_at", {ascending:false});
    if (error) {
      status.textContent = "No se pudieron cargar los productos. Revisa la configuración y las políticas de la base de datos.";
      grid.replaceChildren(el("div", "empty-state", error.message));
      return;
    }
    products = data || [];
    renderProducts();
  }
  async function loadOwnProducts() {
    if (!client || !currentUser) return;
    const { data, error } = await client.from("products").select("*").eq("seller_id", currentUser.id).order("created_at", {ascending:false});
    myProducts.replaceChildren();
    if (error) { myProducts.append(el("div","empty-state","No se pudieron cargar tus publicaciones.")); return; }
    if (!data.length) { myProducts.append(el("div","empty-state","Todavía no tienes publicaciones.")); return; }
    data.forEach(p => myProducts.append(makeProductCard(p, true)));
  }
  async function deleteProduct(id) {
    if (!client || !currentUser || !confirm("¿Quieres eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    const { error } = await client.from("products").delete().eq("id", id).eq("seller_id", currentUser.id);
    if (error) { alert("No se pudo eliminar: " + error.message); return; }
    await loadProducts(); await loadOwnProducts();
  }
  async function initUser() {
    if (!client) return;
    const { data: { user } } = await client.auth.getUser();
    currentUser = user;
    const actions = document.getElementById("nav-actions");
    if (user) {
      actions.replaceChildren();
      const greeting = el("span", "", "Hola, " + (user.user_metadata?.full_name || user.email || "usuario"));
      const logout = el("button", "button button-small", "Cerrar sesión");
      logout.type = "button";
      logout.addEventListener("click", async () => { await client.auth.signOut(); window.location.reload(); });
      actions.append(greeting, logout);
      profileSection.hidden = false;
      await loadOwnProducts();
    }
  }
  if (productForm) productForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!client) { productMessage.textContent = "Configura Supabase antes de publicar."; return; }
    if (!currentUser) { productMessage.textContent = "Inicia sesión para publicar."; return; }
    const data = new FormData(productForm);
    const name = String(data.get("name")).trim();
    const imageUrl = String(data.get("image_url")).trim();
    try {
      const parsed = new URL(imageUrl);
      if (!["http:","https:"].includes(parsed.protocol)) throw new Error();
    } catch { productMessage.textContent = "Introduce una URL de imagen válida que comience por https://"; return; }
    const payload = {
      seller_id: currentUser.id,
      name,
      price: Number(data.get("price")),
      category: String(data.get("category")),
      image_url: imageUrl,
      description: String(data.get("description") || "").trim(),
      seller_name: String(currentUser.user_metadata?.full_name || "Usuario").trim(),
      seller_contact: String(currentUser.user_metadata?.contact || "").trim()
    };
    const button = productForm.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "Publicando…";
    const { error } = await client.from("products").insert(payload);
    button.disabled = false; button.textContent = "Publicar producto";
    if (error) { productMessage.textContent = "Error al publicar: " + error.message; return; }
    productMessage.textContent = "¡Producto publicado!";
    productForm.reset();
    await loadProducts(); await loadOwnProducts();
  });
  searchInput?.addEventListener("input", renderProducts);
  categoryButtons.forEach(button => button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;
    categoryButtons.forEach(b => b.classList.toggle("selected", b === button));
    renderProducts();
  }));
  (async () => { await initUser(); await loadProducts(); })();
})();
