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
  {
    id: 17,
    slug: "paletizador-nivel-inferior-columbia-fl3000",
    name: "Paletizador de Nivel Inferior Columbia FL3000",
    sku: "FL3000",
    description: "Paletizador automático a nivel de piso de velocidad media-alta (30-40 CPM), diseñado para el manejo seguro y eficiente de cajas, charolas y paquetes.",
    sale_mode: "quote",
    stock_status: "on_request",
    price_clp: null,
    image_url: "img/productos/fl3000.jpg",
    image_webp: "",
    category_slug: "paletizado-convencional",
    category_name: "Paletizado Convencional / Final de Línea",
    brand_slug: "columbia-machine",
    brand_name: "Columbia Machine",
    quote_url: "cotizacion.html?sku=paletizador-nivel-inferior-columbia-fl3000",
  },
  {
    id: 18,
    slug: "paletizador-alto-nivel-columbia-hl7200",
    name: "Paletizador de Alto Nivel Columbia HL7200",
    sku: "HL7200",
    description: "Paletizador de alta velocidad (hasta 120 CPM) de entrada superior, ideal para líneas masivas de embotellado, alimentos y consumo masivo.",
    sale_mode: "quote",
    stock_status: "on_request",
    price_clp: null,
    image_url: "img/productos/hl7200.jpg",
    image_webp: "",
    category_slug: "paletizado-alta-velocidad",
    category_name: "Paletizado de Alta Velocidad / Final de Línea",
    brand_slug: "columbia-machine",
    brand_name: "Columbia Machine",
    quote_url: "cotizacion.html?sku=paletizador-alto-nivel-columbia-hl7200",
  },
  {
    id: 19,
    slug: "celda-paletizado-robotico-columbia-ai1800",
    name: "Celda de Paletizado Robótico Columbia-Okura Ai1800",
    sku: "AI1800",
    description: "Robot industrial de paletizado de alta precisión para el manejo versátil de sacos, cajas, baldes y múltiples líneas simultáneas.",
    sale_mode: "quote",
    stock_status: "on_request",
    price_clp: null,
    image_url: "img/productos/ai1800.jpg",
    image_webp: "",
    category_slug: "paletizado-robotico",
    category_name: "Paletizado Robótico / Células de Automatización",
    brand_slug: "columbia-machine",
    brand_name: "Columbia Machine",
    quote_url: "cotizacion.html?sku=celda-paletizado-robotico-columbia-ai1800",
  },
  {
    id: 20,
    slug: "paletizador-compacto-envolvedora-columbia-fl1000sw",
    name: "Paletizador Compacto con Envolvedora Integrada Columbia FL1000-SW",
    sku: "FL1000-SW",
    description: "Sistema híbrido que integra paletizado automático a nivel de piso y envoltura con película estirable (Stretch Wrap) en una sola huella reducida.",
    sale_mode: "quote",
    stock_status: "on_request",
    price_clp: null,
    image_url: "img/productos/fl1000sw.jpg",
    image_webp: "",
    category_slug: "paletizado-integrado",
    category_name: "Paletizado Integrado / Soluciones Compactas",
    brand_slug: "columbia-machine",
    brand_name: "Columbia Machine",
    quote_url: "cotizacion.html?sku=paletizador-compacto-envolvedora-columbia-fl1000sw",
  },
  {
    id: 21,
    slug: "fabricacion-e-integracion-de-cintas-y-sistemas-transportadores-lyc",
    name: "Fabricación e Integración de Cintas y Sistemas Transportadores LYC",
    sku: "LYC-TX",
    description: "Sistemas de transporte industrial a la medida (unilineales, acumulación, elevadores, banda modular, cadenas y pallets) diseñados para áreas estándar o asépticas.",
    sale_mode: "quote",
    stock_status: "on_request",
    price_clp: null,
    image_url: "img/productos/lyc-transportadores.jpg",
    image_webp: "",
    category_slug: "transportadores-manejo-materiales",
    category_name: "Transportadores y Manejo de Materiales / Soluciones de Envasado",
    brand_slug: "lyc",
    brand_name: "LYC",
    quote_url: "cotizacion.html?sku=fabricacion-e-integracion-de-cintas-y-sistemas-transportadores-lyc",
  },
];

const MOCK_CATEGORIES = [
  { slug: "secadores", name: "Secadores de Envases" },
  { slug: "turbinas-soplado", name: "Turbinas de Soplado" },
  { slug: "repuestos", name: "Repuestos y Consumibles" },
  { slug: "fin-de-linea", name: "Máquinas Fin de Línea" },
  { slug: "salas-limpias", name: "Salas Limpias y HEPA" },
  { slug: "cuchillos-aire", name: "Cuchillos de Aire" },
  { slug: "paletizado-convencional", name: "Paletizado Convencional / Final de Línea" },
  { slug: "paletizado-alta-velocidad", name: "Paletizado de Alta Velocidad / Final de Línea" },
  { slug: "paletizado-robotico", name: "Paletizado Robótico / Células de Automatización" },
  { slug: "paletizado-integrado", name: "Paletizado Integrado / Soluciones Compactas" },
  { slug: "transportadores-manejo-materiales", name: "Transportadores y Manejo de Materiales / Soluciones de Envasado" },
];

const MOCK_BRANDS = [
  { slug: "sonic-air-systems", name: "Sonic Air Systems" },
  { slug: "columbia-machine", name: "Columbia Machine" },
  { slug: "columbia-okura", name: "COLUMBIA/OKURA" },
  { slug: "lyc", name: "LYC" },
];

const FETCH_TIMEOUT_MS = 2500;
const PAGE_SIZE = 12;

const INDUSTRIES = [
  { id: "alimentos", label: "Alimentos", categories: ["secadores", "cuchillos-aire", "turbinas-soplado"] },
  { id: "packaging", label: "Packaging", categories: ["fin-de-linea", "paletizado-convencional", "paletizado-alta-velocidad", "paletizado-robotico", "paletizado-integrado", "transportadores-manejo-materiales"] },
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
    let image = prod.image_url || prod.featured_image || prod.image || "";
    if (/wp-content\/uploads/i.test(image)) {
      const file = image.match(/\/([^\/?#]+\.(jpe?g|png|webp|gif))$/i);
      if (file) image = "img/products/" + file[1];
    }
    if (
      (!image || /p-6ffb39180d4af541|p-f65d2c9f90c7de1a|p-822eb15cf1463d95|p-f2f7618440e07dfc/i.test(image)) &&
      window.Lpaez?.resolveProductImage
    ) {
      try {
        image = Lpaez.resolveProductImage(prod) || image;
      } catch (_) {
        /* keep API image */
      }
    }
    if (!image) image = "img/products/A07-10015.jpg";
    const knownWebp =
      /\.(jpe?g|png)$/i.test(image) &&
      !/\/img\/uploads\//i.test(image) &&
      !/\/img\/productos\//i.test(image);
    const webp = knownWebp && !/columbia/i.test(image)
      ? image.replace(/\.(jpe?g|png)$/i, ".webp")
      : "";
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
    const imgFallback =
      prod?.brand_slug === "lyc" || /lyc/i.test(slug)
        ? "/img/productos/lyc-transportadores.jpg"
        : "img/products/A07-10015.jpg";
    const imgTag = webp
      ? `<picture><source type="image/webp" srcset="${escapeAttr(webp)}"><img src="${escapeAttr(img)}" alt="${escapeAttr(name)}" loading="lazy" decoding="async" width="480" height="480" onerror="this.onerror=null;this.src='${imgFallback}'"></picture>`
      : `<img src="${escapeAttr(img)}" alt="${escapeAttr(name)}" loading="lazy" decoding="async" width="480" height="480" onerror="this.onerror=null;this.src='${imgFallback}'">`;
    return (
      `<article class="product-card catalog-card reveal">` +
      `<a class="product-card-visual" href="producto.html?slug=${encodeURIComponent(slug)}" title="${escapeAttr(name)}">${imgTag}</a>` +
      `<div class="product-card-body">` +
      `<div class="product-meta"><span class="badge-category">${escapeHtml(cat)}</span>` +
      `<span class="badge-mode ${sale === "buy" ? "badge-buy" : "badge-quote"}">${sale === "buy" ? "Comprar" : "Cotizar"}</span></div>` +
      `<h3><a href="producto.html?slug=${encodeURIComponent(slug)}">${escapeHtml(name)}</a></h3>` +
      `<p class="product-sku"><span class="product-sku__label">SKU / Parte</span> ${escapeHtml(sku)}</p>` +
      `<div class="product-card-actions catalog-card-actions">` +
      `<a class="btn btn-primary btn-sm" href="${escapeAttr(quote)}">Pedir cotización</a>` +
      `<button type="button" class="btn btn-outline btn-sm" data-datasheet="${escapeAttr(slug)}" data-datasheet-name="${escapeAttr(name)}" data-datasheet-sku="${escapeAttr(sku)}">Descargar ficha técnica</button>` +
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

  function applyCatalogSeo(filteredList, pageItems) {
    const origin =
      (window.Lpaez && Lpaez.pageOrigin && Lpaez.pageOrigin()) ||
      window.location.origin ||
      "https://prueba1.lpaezsis.cl";
    const brand = allBrands.find((b) => b.slug === state.brand);
    const h1 = document.getElementById("catalogTitle");
    const clip =
      (window.Lpaez && Lpaez.clipMetaDescription) ||
      ((t) => String(t || "").slice(0, 160));
    const setMeta = window.Lpaez && Lpaez.setHeadMeta;
    const setCanon = window.Lpaez && Lpaez.setCanonical;
    const subtitle =
      brand && window.Lpaez && Lpaez.brandSubtitle
        ? Lpaez.brandSubtitle(brand)
        : "";
    let title = "Productos industriales | Soluciones Industriales LPAEZsis";
    let desc =
      "Catálogo B2B LPAEZsis: secadores, turbinas, paletizado Columbia, transportadores LYC y repuestos Sonic Air. Filtra por industria y marca.";
    let canonical = origin + "/catalogo.html";
    if (brand) {
      title =
        (brand.seo_title && String(brand.seo_title).trim()) ||
        (subtitle
          ? brand.name + " (" + subtitle + ") | Soluciones Industriales LPAEZsis"
          : "Productos " + brand.name + " | Soluciones Industriales LPAEZsis");
      desc = clip(
        brand.seo_description ||
          brand.short_description ||
          brand.description ||
          "Catálogo de equipos y soluciones " +
            brand.name +
            " representados por LPAEZsis en Chile.",
        160
      );
      canonical = origin + "/catalogo.html?brand=" + encodeURIComponent(brand.slug);
      if (h1) h1.textContent = "Catálogo de Equipos y Soluciones " + brand.name;
    } else if (h1) {
      h1.textContent = "Productos";
    }
    const thin = !filteredList || !filteredList.length;
    document.title = title;
    if (setMeta) {
      setMeta("description", desc);
      setMeta("robots", thin ? "noindex,follow" : "index,follow");
      setMeta("og:title", title, "property");
      setMeta("og:description", desc, "property");
      setMeta("og:url", canonical, "property");
      setMeta("twitter:title", title);
      setMeta("twitter:description", desc);
    }
    if (setCanon) setCanon(canonical);
    const ou = document.getElementById("ogUrl");
    if (ou) ou.setAttribute("content", canonical);
    if (brand && window.Lpaez?.upsertJsonLd) {
      const logo = window.Lpaez.absoluteUrl
        ? Lpaez.absoluteUrl(brand.logo_url || "/img/brand/logo.png")
        : origin + "/img/brand/logo.png";
      const schema = {
        "@context": "https://schema.org",
        "@type": "Brand",
        name: brand.name,
        url: canonical,
        logo,
        description: desc,
      };
      if (subtitle) schema.alternateName = subtitle;
      if (pageItems && pageItems.length) {
        schema.makesOffer = pageItems.map((prod) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: prod.name,
            image:
              (prod.image_url || "").indexOf("http") === 0
                ? prod.image_url
                : origin + "/" + String(prod.image_url || "").replace(/^\//, ""),
            description: clip(prod.description || prod.seo_description || "", 160),
            category: prod.category_name || "",
            url: origin + "/producto.html?slug=" + encodeURIComponent(prod.slug || ""),
          },
        }));
      }
      Lpaez.upsertJsonLd("brandJsonLd", schema);
    }
  }

  function injectJsonLd(products) {
    const origin = window.location.origin || "https://prueba1.lpaezsis.cl";
    const list = Array.isArray(products) ? products : [];
    const brandRow = allBrands.find((b) => b.slug === state.brand);
    const graph = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: brandRow
        ? "Catálogo de Equipos y Soluciones " + brandRow.name
        : "Catálogo de productos LPAEZsis",
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
      applyCatalogSeo([], []);
      console.log("[CATALOGO JS] Productos renderizados exitosamente:", 0);
      return;
    }

    container.innerHTML = pageItems.map(cardHtml).join("");
    renderPager(products.length, state.page, pages);
    injectJsonLd(pageItems);
    applyCatalogSeo(products, pageItems);
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
      const datasheetHref =
        (window.Lpaez && window.Lpaez.resolveDatasheetUrl && window.Lpaez.resolveDatasheetUrl({ slug: slug, description: prod && prod.description })) ||
        "img/fichas/" + encodeURIComponent(slug) + ".pdf";
      datasheetBody.innerHTML =
        `<h3>Ficha técnica</h3><p><strong>${escapeHtml(name)}</strong></p>` +
        `<p class="product-sku">SKU / Parte: ${escapeHtml(sku)}</p>` +
        `<p>Descarga el PDF o solicítalo con tu cotización.</p>` +
        `<div class="empty-actions"><a class="btn btn-primary" href="${escapeAttr(datasheetHref)}" target="_blank" rel="noopener">Descargar PDF</a>` +
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
