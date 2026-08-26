/**
 * Catálogo B2B LPAEZsis — carga a prueba de fallos (mock + timeout).
 * Sin dependencias externas salvo helpers opcionales de window.Lpaez.
 */

/* 1) MOCK DATA HARDCODED — cima del archivo, cero dependencias externas */
const MOCK_PRODUCTS = [
  {
    id: 1,
    slug: "secador-botellas-sonic",
    name: "Sistema Secador de Botellas Sonic Air",
    sku: "SAS-DRY-BOT",
    description: "Secado de botellas con turbinas y air knives Sonic. Cotización por línea.",
    sale_mode: "quote",
    stock_status: "on_request",
    price_clp: null,
    image_url: "img/hero/cans.jpg",
    image_webp: "img/hero/cans.webp",
    category_slug: "secadores",
    category_name: "Secadores de Envases",
    brand_slug: "sonic-air-systems",
    brand_name: "Sonic Air Systems",
    quote_url: "cotizacion.html?sku=secador-botellas-sonic",
  },
  {
    id: 2,
    slug: "turbina-soplado-sonic-100",
    name: "Turbina de Soplado Sonic 100",
    sku: "SAS-VT-100",
    description: "Turbina de alto caudal para secado y limpieza industrial.",
    sale_mode: "quote",
    stock_status: "on_request",
    price_clp: null,
    image_url: "img/products/vt-sonic.jpg",
    image_webp: "img/products/vt-sonic.webp",
    category_slug: "turbinas-soplado",
    category_name: "Turbinas de Soplado",
    brand_slug: "sonic-air-systems",
    brand_name: "Sonic Air Systems",
    quote_url: "cotizacion.html?sku=turbina-soplado-sonic-100",
  },
  {
    id: 3,
    slug: "correa-sonic-70-85",
    name: "Correa Sonic 70/85",
    sku: "13514",
    description: "Correa 16 GRV SONIC 70/85 (Cod 13514)",
    sale_mode: "buy",
    stock_status: "in_stock",
    price_clp: null,
    image_url: "img/products/A07-13474.jpg",
    image_webp: "img/products/A07-13474.webp",
    category_slug: "repuestos",
    category_name: "Repuestos y Consumibles",
    brand_slug: "sonic-air-systems",
    brand_name: "Sonic Air Systems",
    quote_url: "cotizacion.html?sku=correa-sonic-70-85",
  },
  {
    id: 4,
    slug: "filtro-poliester-s-75-85-100",
    name: "Filtro Poliéster S 75-85-100",
    sku: "A07-10317",
    description: "Elemento filtro polyester lavable Sonic 75-85-100",
    sale_mode: "buy",
    stock_status: "in_stock",
    price_clp: null,
    image_url: "img/products/A07-10317.jpg",
    image_webp: "img/products/A07-10317.webp",
    category_slug: "repuestos",
    category_name: "Repuestos y Consumibles",
    brand_slug: "sonic-air-systems",
    brand_name: "Sonic Air Systems",
    quote_url: "cotizacion.html?sku=filtro-poliester-s-75-85-100",
  },
  {
    id: 5,
    slug: "filtro-completo-poliester-indicador",
    name: "Filtro Completo Poliéster con indicador",
    sku: "10976",
    description: "Filtro completo polyester lavable Sonic con indicador",
    sale_mode: "buy",
    stock_status: "in_stock",
    price_clp: 195000,
    image_url: "img/products/A07-10976.jpg",
    image_webp: "img/products/A07-10976.webp",
    category_slug: "repuestos",
    category_name: "Repuestos y Consumibles",
    brand_slug: "sonic-air-systems",
    brand_name: "Sonic Air Systems",
    quote_url: "cotizacion.html?sku=filtro-completo-poliester-s-70-85-100-con-indicador",
  },
  {
    id: 6,
    slug: "impeller-sonic-70-100",
    name: "Impeller Sonic 70/100",
    sku: "10015",
    description: "Impulsor soplador Sonic Air Models S70/S100",
    sale_mode: "buy",
    stock_status: "in_stock",
    price_clp: null,
    image_url: "img/products/A07-10015.jpg",
    image_webp: "img/products/A07-10015.webp",
    category_slug: "repuestos",
    category_name: "Repuestos y Consumibles",
    brand_slug: "sonic-air-systems",
    brand_name: "Sonic Air Systems",
    quote_url: "cotizacion.html?sku=impeller-sonic-70-100",
  },
  {
    id: 7,
    slug: "cartucho-rodamientos-s-100-150",
    name: "Cartucho Rodamientos S 100-150",
    sku: "A07-14452",
    description: "Conjunto rodamientos sellado Sonic 100-150",
    sale_mode: "buy",
    stock_status: "in_stock",
    price_clp: null,
    image_url: "img/products/A07-14452.jpg",
    image_webp: "img/products/A07-14452.webp",
    category_slug: "repuestos",
    category_name: "Repuestos y Consumibles",
    brand_slug: "sonic-air-systems",
    brand_name: "Sonic Air Systems",
    quote_url: "cotizacion.html?sku=cartucho-rodamientos-s-100-150",
  },
  {
    id: 8,
    slug: "tensor-correa-sonic",
    name: "Tensor Correa Sonic (todos los modelos)",
    sku: "A07-13455",
    description: "Kit tensor correa Sonic todos los modelos",
    sale_mode: "buy",
    stock_status: "in_stock",
    price_clp: null,
    image_url: "img/products/A07-13455.png",
    image_webp: "img/products/A07-13455.webp",
    category_slug: "repuestos",
    category_name: "Repuestos y Consumibles",
    brand_slug: "sonic-air-systems",
    brand_name: "Sonic Air Systems",
    quote_url: "cotizacion.html?sku=tensor-correa-sonic-todos-los-modelos",
  },
];

const MOCK_CATEGORIES = [
  { slug: "secadores", name: "Secadores de Envases" },
  { slug: "turbinas-soplado", name: "Turbinas de Soplado" },
  { slug: "repuestos", name: "Repuestos y Consumibles" },
  { slug: "fin-de-linea", name: "Máquinas Fin de Línea" },
  { slug: "salas-limpias", name: "Salas Limpias y HEPA" },
  { slug: "cuchillos-aire", name: "Cuchillos de Aire" },
];

const MOCK_BRANDS = [
  { slug: "sonic-air-systems", name: "Sonic Air Systems" },
  { slug: "columbia-okura", name: "COLUMBIA/OKURA" },
];

const FETCH_TIMEOUT_MS = 2500;
const PAGE_SIZE = 12;

const INDUSTRIES = [
  { id: "alimentos", label: "Alimentos", categories: ["secadores", "cuchillos-aire", "turbinas-soplado"] },
  { id: "packaging", label: "Packaging", categories: ["fin-de-linea"] },
  { id: "farmaceutica", label: "Farmacéutica", categories: ["salas-limpias"] },
  { id: "repuestos", label: "Repuestos", categories: ["repuestos"] },
];

document.addEventListener("DOMContentLoaded", async () => {
  /* 3) NULL-CHECK del contenedor */
  const container = document.getElementById("grid-productos");
  if (!container) {
    console.error("[CATALOGO JS] No existe #grid-productos — abortando.");
    return;
  }

  const loader = document.getElementById("catalogLoader");
  const industryTabs = document.getElementById("industryTabs");
  const filterChips = document.getElementById("filterChips");
  const modeChips = document.getElementById("modeChips");
  const brandSelect = document.getElementById("brandFilter");
  const catalogCount = document.getElementById("catalogCount");
  const pager = document.getElementById("catalogPager");
  const ldScript = document.getElementById("catalogItemListLd");
  const datasheetDialog = document.getElementById("datasheetDialog");
  const datasheetBody = document.getElementById("datasheetBody");

  const escapeHtml =
    window.Lpaez?.escapeHtml ||
    ((str) =>
      String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;"));
  const escapeAttr =
    window.Lpaez?.escapeAttr ||
    ((str) => escapeHtml(str).replace(/'/g, "&#39;"));
  const queryParam =
    window.Lpaez?.queryParam ||
    ((name) => {
      try {
        return new URLSearchParams(window.location.search).get(name) || "";
      } catch (_) {
        return "";
      }
    });

  const state = {
    category: queryParam("category") || "",
    brand: queryParam("brand") || "",
    industry: queryParam("industry") || "",
    mode: queryParam("sale_mode") || queryParam("mode") || "",
    page: Math.max(1, parseInt(queryParam("page") || "1", 10) || 1),
  };

  let allProducts = MOCK_PRODUCTS.slice();
  let allCategories = MOCK_CATEGORIES.slice();
  let allBrands = MOCK_BRANDS.slice();

  function hideLoader() {
    if (loader) {
      loader.style.display = "none";
      loader.hidden = true;
      loader.setAttribute("aria-hidden", "true");
    }
    container.classList.remove("catalog-loading");
    container.setAttribute("aria-busy", "false");
  }

  function showLoader() {
    if (loader) {
      loader.style.display = "";
      loader.hidden = false;
      loader.setAttribute("aria-hidden", "false");
    }
    container.classList.add("catalog-loading");
    container.setAttribute("aria-busy", "true");
    container.innerHTML = Array.from({ length: 6 }, () => {
      return (
        '<article class="product-card catalog-card skeleton-card" aria-hidden="true">' +
        '<div class="product-card-visual skeleton-block"></div>' +
        '<div class="product-card-body">' +
        '<div class="skeleton-line short"></div>' +
        '<div class="skeleton-line"></div>' +
        '<div class="skeleton-line btn"></div>' +
        "</div></article>"
      );
    }).join("");
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (!res || res.status !== 200) {
        throw new Error("HTTP " + (res?.status ?? "fail"));
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadProducts() {
    try {
      const [catsRes, prodRes, brandRes] = await Promise.all([
        fetchJson("/api/categories"),
        fetchJson("/api/products"),
        fetchJson("/api/brands"),
      ]);
      const products = Array.isArray(prodRes?.products) ? prodRes.products : null;
      if (!products || !products.length) throw new Error("empty products");
      allProducts = products.map(normalizeProduct);
      allCategories = Array.isArray(catsRes?.categories)
        ? catsRes.categories
        : MOCK_CATEGORIES.slice();
      allBrands = Array.isArray(brandRes?.brands)
        ? brandRes.brands
        : MOCK_BRANDS.slice();
      return allProducts;
    } catch (err) {
      console.warn("[CATALOGO JS] API no disponible — usando MOCK_PRODUCTS", err);
      allProducts = MOCK_PRODUCTS.slice();
      allCategories = MOCK_CATEGORIES.slice();
      allBrands = MOCK_BRANDS.slice();
      return allProducts;
    }
  }

  function normalizeProduct(p) {
    const prod = p || {};
    const slug = prod.slug || "";
    const name = prod.name || "Producto";
    let sku = slug ? String(slug).toUpperCase() : "N/A";
    const desc = String(prod.description || "");
    const m = desc.match(/Cod(?:igo|igo|\.?)\s*([A-Z0-9\-./]+)/i);
    if (m) sku = m[1];
    let image = prod.image_url || "";
    if (/wp-content\/uploads/i.test(image)) {
      const file = image.match(/\/([^\/?#]+\.(jpe?g|png|webp|gif))$/i);
      if (file) image = "img/products/" + file[1];
    }
    if (!image && window.Lpaez?.resolveProductImage) {
      try {
        image = Lpaez.resolveProductImage(prod);
      } catch (_) {
        image = "img/products/A07-10015.jpg";
      }
    }
    if (!image) image = "img/products/A07-10015.jpg";
    const webp = /\.(jpe?g|png)$/i.test(image)
      ? image.replace(/\.(jpe?g|png)$/i, ".webp")
      : prod.image_webp || "";
    return {
      id: prod.id,
      slug,
      name,
      sku,
      description: desc,
      sale_mode: prod.sale_mode || "quote",
      stock_status: prod.stock_status || "on_request",
      price_clp: prod.price_clp ?? null,
      image_url: image,
      image_webp: webp,
      category_slug: prod.category_slug || "",
      category_name: prod.category_name || "",
      brand_slug: prod.brand_slug || "",
      brand_name: prod.brand_name || "Sonic Air Systems",
      quote_url:
        "cotizacion.html?sku=" +
        encodeURIComponent(slug) +
        "&asunto=" +
        encodeURIComponent("Cotización: " + name),
    };
  }

  function writeUrl() {
    try {
      const params = new URLSearchParams();
      if (state.industry) params.set("industry", state.industry);
      if (state.category) params.set("category", state.category);
      if (state.brand) params.set("brand", state.brand);
      if (state.mode) params.set("sale_mode", state.mode);
      if (state.page > 1) params.set("page", String(state.page));
      const q = params.toString();
      history.replaceState({}, "", "catalogo.html" + (q ? "?" + q : ""));
    } catch (_) {
      /* ignore */
    }
  }

  function filtered() {
    const list = Array.isArray(allProducts) ? allProducts : MOCK_PRODUCTS;
    const ind = INDUSTRIES.find((i) => i.id === state.industry);
    const set = ind
      ? ind.categories.reduce((acc, c) => {
          acc[c] = true;
          return acc;
        }, {})
      : null;
    return list.filter((p) => {
      if (!p) return false;
      if (state.category && p.category_slug !== state.category) return false;
      if (set && !set[p.category_slug]) return false;
      if (state.brand && p.brand_slug !== state.brand) return false;
      if (state.mode && p.sale_mode !== state.mode) return false;
      return true;
    });
  }

  function cardHtml(prod) {
    const name = prod?.name || "Producto";
    const slug = prod?.slug || "";
    const sku = prod?.sku || "N/A";
    const cat = prod?.category_name || prod?.category_slug || "Producto";
    const img = prod?.image_url || "img/products/A07-10015.jpg";
    const webp = prod?.image_webp || "";
    const sale = prod?.sale_mode === "buy" ? "buy" : "quote";
    const quote =
      prod?.quote_url ||
      "cotizacion.html?sku=" + encodeURIComponent(slug || sku);
    const picture = webp
      ? `<picture><source type="image/webp" srcset="${escapeAttr(webp)}"><img src="${escapeAttr(img)}" alt="${escapeAttr(name)}" title="${escapeAttr(name)}" loading="lazy" decoding="async" width="480" height="480"></picture>`
      : `<img src="${escapeAttr(img)}" alt="${escapeAttr(name)}" title="${escapeAttr(name)}" loading="lazy" decoding="async" width="480" height="480">`;
    return (
      `<article class="product-card catalog-card reveal">` +
      `<a class="product-card-visual" href="producto.html?slug=${encodeURIComponent(slug)}" title="${escapeAttr(name)}">${picture}</a>` +
      `<div class="product-card-body">` +
      `<div class="product-meta"><span class="badge-category">${escapeHtml(cat)}</span>` +
      `<span class="badge-mode ${sale === "buy" ? "badge-buy" : "badge-quote"}">${sale === "buy" ? "Comprar" : "Cotizar"}</span></div>` +
      `<h3><a href="producto.html?slug=${encodeURIComponent(slug)}">${escapeHtml(name)}</a></h3>` +
      `<p class="product-sku"><span class="product-sku__label">SKU / Parte</span> ${escapeHtml(sku)}</p>` +
      `<div class="product-card-actions catalog-card-actions">` +
      `<a class="btn btn-primary btn-sm" href="${escapeAttr(quote)}">Pedir cotización</a>` +
      `<button type="button" class="btn btn-outline btn-sm" data-datasheet="${escapeAttr(slug)}" data-datasheet-name="${escapeAttr(name)}" data-datasheet-sku="${escapeAttr(sku)}" data-datasheet-url="${escapeAttr(prod?.ficha_pdf_url || "")}">Descargar ficha técnica</button>` +
      `</div></div></article>`
    );
  }

  function renderFilters() {
    if (industryTabs) {
      industryTabs.innerHTML =
        `<button type="button" class="industry-tab${!state.industry ? " is-active" : ""}" data-industry="" aria-selected="${!state.industry}">Todas</button>` +
        INDUSTRIES.map((ind) => {
          const on = state.industry === ind.id;
          return `<button type="button" class="industry-tab${on ? " is-active" : ""}" data-industry="${escapeAttr(ind.id)}" aria-selected="${on}">${escapeHtml(ind.label)}</button>`;
        }).join("");
    }
    if (filterChips) {
      const used = {};
      filtered().forEach((p) => {
        if (p?.category_slug) used[p.category_slug] = true;
      });
      // show categories from all data for current industry/mode/brand context base list
      const base = Array.isArray(allProducts) ? allProducts : MOCK_PRODUCTS;
      const catsPresent = {};
      base.forEach((p) => {
        if (!p) return;
        if (state.mode && p.sale_mode !== state.mode) return;
        if (state.brand && p.brand_slug !== state.brand) return;
        const ind = INDUSTRIES.find((i) => i.id === state.industry);
        if (ind && !ind.categories.includes(p.category_slug)) return;
        if (p.category_slug) catsPresent[p.category_slug] = p.category_name || p.category_slug;
      });
      const catList = Object.keys(catsPresent).map((slug) => ({
        slug,
        name: catsPresent[slug],
      }));
      filterChips.innerHTML =
        `<button type="button" class="filter-chip${!state.category ? " is-active" : ""}" data-cat="" aria-pressed="${!state.category}">Todas</button>` +
        catList
          .map((c) => {
            const on = state.category === c.slug;
            return `<button type="button" class="filter-chip${on ? " is-active" : ""}" data-cat="${escapeAttr(c.slug)}" aria-pressed="${on}">${escapeHtml(c.name)}</button>`;
          })
          .join("");
    }
    if (brandSelect) {
      brandSelect.innerHTML =
        `<option value="">Todas las marcas</option>` +
        (Array.isArray(allBrands) ? allBrands : MOCK_BRANDS)
          .map((b) => {
            const slug = b?.slug || "";
            const name = b?.name || slug;
            return `<option value="${escapeAttr(slug)}"${state.brand === slug ? " selected" : ""}>${escapeHtml(name)}</option>`;
          })
          .join("");
    }
    if (modeChips) {
      modeChips.querySelectorAll(".filter-chip").forEach((chip) => {
        const on = chip.getAttribute("data-mode") === state.mode;
        chip.classList.toggle("is-active", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }

  function injectJsonLd(products) {
    const origin = window.location.origin || "https://prueba1.lpaezsis.cl";
    const list = Array.isArray(products) ? products : [];
    const graph = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Catálogo de productos LPAEZsis",
      numberOfItems: list.length,
      itemListElement: list.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p?.name || "Producto",
          sku: p?.sku || p?.slug || "",
          image: (p?.image_url || "").indexOf("http") === 0
            ? p.image_url
            : origin + "/" + String(p?.image_url || "").replace(/^\//, ""),
          url: origin + "/producto.html?slug=" + encodeURIComponent(p?.slug || ""),
          brand: { "@type": "Brand", name: p?.brand_name || "Sonic Air Systems" },
        },
      })),
    };
    if (ldScript) ldScript.textContent = JSON.stringify(graph);
  }

  function renderPager(total, page, pages) {
    if (!pager) return;
    if (total <= PAGE_SIZE) {
      pager.hidden = true;
      pager.innerHTML = "";
      return;
    }
    pager.hidden = false;
    pager.innerHTML =
      `<button type="button" class="btn btn-outline btn-sm" data-page="${page - 1}"${page <= 1 ? " disabled" : ""}>Anterior</button>` +
      `<span class="catalog-pager__status">Página ${page} de ${pages}</span>` +
      `<button type="button" class="btn btn-outline btn-sm" data-page="${page + 1}"${page >= pages ? " disabled" : ""}>Siguiente</button>`;
  }

  /** Inyección síncrona de cards tras ocultar loader */
  function renderGrid() {
    hideLoader();
    writeUrl();
    renderFilters();

    let products = filtered();
    products = Array.isArray(products) ? products : MOCK_PRODUCTS.slice();

    const pages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = products.slice(start, start + PAGE_SIZE);

    if (catalogCount) {
      catalogCount.hidden = false;
      catalogCount.textContent =
        products.length === 1 ? "1 producto" : products.length + " productos";
    }

    if (!pageItems.length) {
      container.innerHTML =
        `<div class="empty-state"><p>No hay productos con esos filtros.</p>` +
        `<p class="empty-actions"><button type="button" class="btn btn-primary btn-sm" id="clearCatalogFilters">Ver todos</button>` +
        `<a class="btn btn-outline btn-sm" href="cotizacion.html">Pedir cotización</a></p></div>`;
      document.getElementById("clearCatalogFilters")?.addEventListener("click", () => {
        state.category = "";
        state.brand = "";
        state.industry = "";
        state.mode = "";
        state.page = 1;
        renderGrid();
      });
      renderPager(0, 1, 1);
      injectJsonLd([]);
      console.log("[CATALOGO JS] Productos renderizados exitosamente:", 0);
      return;
    }

    container.innerHTML = pageItems.map(cardHtml).join("");
    renderPager(products.length, state.page, pages);
    injectJsonLd(pageItems);
    window.Lpaez?.observeReveals?.();
    console.log("[CATALOGO JS] Productos renderizados exitosamente:", pageItems.length);
  }

  function bindUi() {
    industryTabs?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-industry]");
      if (!btn) return;
      state.industry = btn.getAttribute("data-industry") || "";
      state.category = "";
      state.page = 1;
      renderGrid();
    });
    filterChips?.addEventListener("click", (e) => {
      const chip = e.target.closest(".filter-chip");
      if (!chip) return;
      state.category = chip.getAttribute("data-cat") || "";
      state.page = 1;
      renderGrid();
    });
    modeChips?.addEventListener("click", (e) => {
      const chip = e.target.closest(".filter-chip");
      if (!chip) return;
      state.mode = chip.getAttribute("data-mode") || "";
      state.page = 1;
      renderGrid();
    });
    brandSelect?.addEventListener("change", () => {
      state.brand = brandSelect.value || "";
      state.page = 1;
      renderGrid();
    });
    pager?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      const page = parseInt(btn.getAttribute("data-page"), 10);
      if (!page || page < 1) return;
      state.page = page;
      renderGrid();
      container.focus({ preventScroll: true });
    });
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-datasheet]");
      if (!btn || !datasheetDialog || !datasheetBody) return;
      const slug = btn.getAttribute("data-datasheet") || "";
      const name = btn.getAttribute("data-datasheet-name") || "Producto";
      const sku = btn.getAttribute("data-datasheet-sku") || "";
      const fromAttr = (btn.getAttribute("data-datasheet-url") || "").trim();
      let pdfUrl =
        fromAttr ||
        (slug ? `img/fichas/${encodeURIComponent(slug)}.pdf` : "img/fichas/");
      if (pdfUrl && !/^https?:/i.test(pdfUrl) && pdfUrl.charAt(0) !== "/") {
        pdfUrl = "/" + pdfUrl.replace(/^\.\//, "");
      }
      datasheetBody.innerHTML =
        `<h3>Ficha técnica</h3><p><strong>${escapeHtml(name)}</strong></p>` +
        `<p class="product-sku">SKU / Parte: ${escapeHtml(sku)}</p>` +
        `<p>Descarga el PDF o solicítalo con tu cotización.</p>` +
        `<div class="empty-actions"><a class="btn btn-primary" href="${escapeAttr(pdfUrl)}" target="_blank" rel="noopener">Descargar PDF</a>` +
        `<a class="btn btn-outline" href="cotizacion.html?sku=${encodeURIComponent(slug)}">Pedir cotización con ficha</a></div>`;
      if (typeof datasheetDialog.showModal === "function") datasheetDialog.showModal();
      else datasheetDialog.setAttribute("open", "");
    });
    document.getElementById("datasheetClose")?.addEventListener("click", () => {
      if (typeof datasheetDialog?.close === "function") datasheetDialog.close();
      else datasheetDialog?.removeAttribute("open");
    });
  }

  /* Boot a prueba de fallos */
  showLoader();
  bindUi();
  try {
    await loadProducts();
  } catch (err) {
    console.warn("[CATALOGO JS] fallback forzado a MOCK_PRODUCTS", err);
    allProducts = MOCK_PRODUCTS.slice();
  } finally {
    hideLoader();
    renderGrid();
  }
});
