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
    tipo: "equipo",
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
    tipo: "equipo",
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
    tipo: "repuesto",
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
    tipo: "repuesto",
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
    tipo: "repuesto",
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
    tipo: "repuesto",
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
    tipo: "repuesto",
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
    tipo: "repuesto",
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
];

document.addEventListener("DOMContentLoaded", async () => {
  /* 3) NULL-CHECK del contenedor */
  const container = document.getElementById("grid-productos");
  if (!container) {
    console.error("[CATALOGO JS] No existe #grid-productos — abortando.");
    return;
  }

  const loader = document.getElementById("catalogLoader");
  const industrySelect = document.getElementById("industryFilter");
  const categorySelect = document.getElementById("categoryFilter");
  const brandSelect = document.getElementById("brandFilter");
  const catalogCount = document.getElementById("catalogCount");
  const pager = document.getElementById("catalogPager");
  const ldScript = document.getElementById("catalogItemListLd");
  const datasheetDialog = document.getElementById("datasheetDialog");
  const datasheetBody = document.getElementById("datasheetBody");
  const heroTitle = document.querySelector(".page-hero-inner h1");
  const heroLead =
    document.querySelector(".page-hero-inner .hero-description") ||
    document.querySelector(".page-hero-inner p");
  const catalogGridLabel = document.getElementById("catalogGridLabel");
  // Remueve restos de depuración si quedaran en el DOM
  document.querySelectorAll(".catalog-hint, .catalog-debug-info").forEach((el) => el.remove());

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

  function normalizeTipo(raw) {
    const t = String(raw || "").toLowerCase().trim();
    if (t === "equipo" || t === "repuesto") return t;
    return "";
  }

  // Compat: ?category=repuestos → tipo=repuesto. Sin tipo → equipos.
  let tipoFromQuery = normalizeTipo(queryParam("tipo"));
  if (!tipoFromQuery && queryParam("category") === "repuestos") {
    tipoFromQuery = "repuesto";
  }
  if (!tipoFromQuery) tipoFromQuery = "equipo";

  function cleanFilterValue(raw) {
    let v = String(raw || "").trim();
    if (!v) return "";
    // Normaliza espacios / + a guiones para slugs, y colapsa whitespace
    v = v.replace(/\+/g, " ").replace(/\s+/g, " ").trim();
    const lower = v.toLowerCase();
    if (lower === "todas" || lower === "todas las marcas" || lower === "all") return "";
    // Si parece un slug con espacios (ej. "bandas modulares higiene"), usar guiones
    if (/^[a-z0-9]+(?:\s+[a-z0-9]+)+$/i.test(v) && !/[áéíóúñ]/i.test(v)) {
      v = v.toLowerCase().replace(/\s+/g, "-");
    }
    return v;
  }

  function buildQueryString(overrides) {
    const src = Object.assign(
      {
        tipo: state.tipo,
        industria: state.industria,
        industry: state.industry,
        category: state.category,
        brand: state.brand,
        page: state.page,
      },
      overrides || {}
    );
    const params = new URLSearchParams();
    Object.keys(src).forEach((key) => {
      let val = cleanFilterValue(src[key]);
      if (key === "page") {
        const pageNum = Math.max(1, parseInt(String(src.page || "1"), 10) || 1);
        if (pageNum > 1) params.set("page", String(pageNum));
        return;
      }
      if (key === "tipo") {
        val = normalizeTipo(val) || "";
      }
      if (!val || val === "Todas" || val === "todas") return;
      params.set(key, val);
    });
    return params.toString();
  }

  const state = {
    tipo: tipoFromQuery,
    category:
      queryParam("category") === "repuestos" && tipoFromQuery === "repuesto"
        ? ""
        : cleanFilterValue(queryParam("category")),
    brand: cleanFilterValue(queryParam("brand")),
    industry: cleanFilterValue(queryParam("industry")),
    industria: cleanFilterValue(queryParam("industria")),
    page: Math.max(1, parseInt(queryParam("page") || "1", 10) || 1),
  };

  function applyHeroCopy() {
    if (heroLead && !heroLead.classList.contains("hero-description")) {
      heroLead.classList.add("hero-description");
    }
    if (state.tipo === "repuesto") {
      if (heroTitle) heroTitle.textContent = "Repuestos";
      if (heroLead) {
        heroLead.textContent = "Repuestos y Consumibles";
      }
      if (catalogGridLabel) catalogGridLabel.textContent = "Grilla de repuestos";
      document.title = "Repuestos industriales | Catálogo B2B LPAEZsis";
    } else if (state.tipo === "equipo") {
      if (heroTitle) heroTitle.textContent = "Equipos";
      if (heroLead) {
        heroLead.textContent =
          "Equipos industriales: filtra por industria o marca y solicita cotización con ficha técnica.";
      }
      if (catalogGridLabel) catalogGridLabel.textContent = "Grilla de equipos";
      document.title = "Equipos industriales | Catálogo B2B LPAEZsis";
    } else {
      if (heroTitle) heroTitle.textContent = "Productos";
      if (heroLead) {
        heroLead.textContent =
          "Catálogo B2B: equipos y repuestos. Filtra por industria o marca.";
      }
      if (catalogGridLabel) catalogGridLabel.textContent = "Grilla de productos";
    }
  }
  applyHeroCopy();

  function applyRepuestoFilterVisibility() {
    const isRepuesto = state.tipo === "repuesto";
    const filterIndustria = document.getElementById("filterIndustriaGroup");
    const filterCategoria = document.getElementById("filterCategoriaGroup");
    const filtersBar = document.querySelector(".catalog-filters");
    if (filterIndustria) filterIndustria.style.display = isRepuesto ? "none" : "";
    if (filterCategoria) filterCategoria.style.display = isRepuesto ? "none" : "";
    if (filtersBar) filtersBar.classList.toggle("filters-repuestos", isRepuesto);
    if (isRepuesto) {
      state.industry = "";
      state.category = "";
      if (industrySelect) industrySelect.value = "";
      if (categorySelect) categorySelect.value = "";
    }
  }
  applyRepuestoFilterVisibility();

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
        '<div class="product-card__media skeleton-block"></div>' +
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
      const params = new URLSearchParams();
      if (state.tipo === "equipo" || state.tipo === "repuesto") params.set("tipo", state.tipo);
      if (state.industria) params.set("industria", state.industria);
      const qs = params.toString();
      const productsUrl = "/api/products" + (qs ? "?" + qs : "");
      const [catsRes, prodRes, brandRes] = await Promise.all([
        fetchJson("/api/categories"),
        fetchJson(productsUrl),
        fetchJson("/api/brands"),
      ]);
      const products = Array.isArray(prodRes?.products) ? prodRes.products : null;
      if (!products) throw new Error("empty products");
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
      allProducts = MOCK_PRODUCTS.slice().filter((p) => {
        if (!state.tipo) return true;
        return (p.tipo || (p.sale_mode === "buy" ? "repuesto" : "equipo")) === state.tipo;
      });
      allCategories = MOCK_CATEGORIES.slice();
      allBrands = MOCK_BRANDS.slice();
      return allProducts;
    }
  }

  function productTipoOf(prod) {
    if (prod && (prod.tipo === "repuesto" || prod.tipo === "equipo")) return prod.tipo;
    return prod && prod.sale_mode === "buy" ? "repuesto" : "equipo";
  }

  /** Homologado con marcas/site.js: respeta image_url de la API (/img/uploads/...). */
  function normalizeProductImage(prod) {
    const raw = prod || {};
    let image = String(raw.image_url || raw.image || "").trim();
    if (/wp-content\/uploads/i.test(image)) {
      const file = image.match(/\/([^\/?#]+\.(jpe?g|png|webp|gif))$/i);
      if (file) image = "img/products/" + file[1];
    }
    // Rutas absolutas del sitio (/img/uploads/...) se mantienen; la API ya las entrega así.
    if (!image && window.Lpaez?.resolveProductImage) {
      try {
        image = Lpaez.resolveProductImage(raw);
      } catch (_) {
        image = "";
      }
    }
    if (!image) image = "img/products/A07-10015.jpg";
    return image;
  }

  function slugImageOf(prod, imageUrl) {
    const raw = prod || {};
    if (raw.slug_image) return String(raw.slug_image).trim();
    if (raw.slug) return String(raw.slug).trim();
    const file = String(imageUrl || "").match(/\/([^\/?#]+)\.(jpe?g|png|webp|gif)$/i);
    return file ? file[1] : "";
  }

  /** Solo usa webp si la API lo envía; no inventar .webp (rompe <picture> en uploads). */
  function normalizeProductWebp(prod, imageUrl) {
    const explicit = String((prod && prod.image_webp) || "").trim();
    if (explicit) return explicit;
    // Mocks locales con webp real junto a img/products|hero
    if (/^img\/(products|hero)\//i.test(String(imageUrl || "")) && /\.(jpe?g|png)$/i.test(imageUrl)) {
      return imageUrl.replace(/\.(jpe?g|png)$/i, ".webp");
    }
    return "";
  }

  function productImageHtml(prod) {
    const name = (prod && prod.name) || "Producto";
    const img = (prod && prod.image_url) || "img/products/A07-10015.jpg";
    const webp = (prod && prod.image_webp) || "";
    const slugImage = slugImageOf(prod, img);
    const fallback = slugImage
      ? "/img/productos/" + slugImage + ".jpg"
      : "img/products/A07-10015.jpg";
    const onerror =
      "this.onerror=null;this.src='" + String(fallback).replace(/'/g, "\\'") + "';";
    const imgTag =
      `<img src="${escapeAttr(img)}" alt="${escapeAttr(name)}" title="${escapeAttr(name)}"` +
      ` loading="lazy" decoding="async" width="480" height="480" onerror="${onerror}">`;
    if (webp) {
      return (
        `<picture>` +
        `<source type="image/webp" srcset="${escapeAttr(webp)}">` +
        imgTag +
        `</picture>`
      );
    }
    return imgTag;
  }

  function normalizeProduct(p) {
    const prod = p || {};
    const slug = prod.slug || "";
    const name = prod.name || "Producto";
    let sku = slug ? String(slug).toUpperCase() : "N/A";
    const desc = String(prod.description || "");
    const m = desc.match(/Cod(?:igo|igo|\.?)\s*([A-Z0-9\-./]+)/i);
    if (m) sku = m[1];
    const image = normalizeProductImage(prod);
    const webp = normalizeProductWebp(prod, image);
    const sale = prod.sale_mode || "quote";
    return {
      id: prod.id,
      slug,
      name,
      sku,
      description: desc,
      sale_mode: sale,
      tipo: productTipoOf({ tipo: prod.tipo, sale_mode: sale }),
      stock_status: prod.stock_status || "on_request",
      price_clp: prod.price_clp ?? null,
      image_url: image,
      image_webp: webp,
      slug_image: slugImageOf(prod, image),
      category_slug: prod.category_slug || "",
      category_name: prod.category_name || "",
      brand_slug: prod.brand_slug || "",
      brand_name: prod.brand_name || "Sonic Air Systems",
      industria_slug: prod.industria_slug || "",
      industria_nombre: prod.industria_nombre || "",
      quote_url:
        "cotizacion.html?sku=" +
        encodeURIComponent(slug) +
        "&asunto=" +
        encodeURIComponent("Cotización: " + name),
      ficha_url: prod.ficha_url || prod.datasheet_url || "",
    };
  }

  function writeUrl() {
    try {
      const q = buildQueryString();
      history.replaceState({}, "", "catalogo.html" + (q ? "?" + q : ""));
    } catch (_) {
      /* ignore */
    }
  }

  function categoryBelongsToBrand(categorySlug, brandSlug) {
    if (!categorySlug) return true;
    if (!brandSlug) return true;
    const list = Array.isArray(allProducts) ? allProducts : [];
    return list.some((p) => {
      if (!p) return false;
      if (state.tipo && productTipoOf(p) !== state.tipo) return false;
      return p.brand_slug === brandSlug && p.category_slug === categorySlug;
    });
  }

  function syncCategoryAfterBrandChange() {
    if (!state.brand) {
      // "Todas las marcas": category puede quedarse, pero limpia brand
      return;
    }
    if (!categoryBelongsToBrand(state.category, state.brand)) {
      state.category = "";
      if (categorySelect) categorySelect.value = "";
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
      if (state.tipo && productTipoOf(p) !== state.tipo) return false;
      if (state.industria && p.industria_slug !== state.industria) return false;
      if (state.category && p.category_slug !== state.category) return false;
      if (set && !set[p.category_slug]) return false;
      if (state.brand && p.brand_slug !== state.brand) return false;
      return true;
    });
  }

  function cardHtml(prod) {
    const name = prod?.name || "Producto";
    const slug = prod?.slug || "";
    const sku = prod?.sku || "N/A";
    const cat = prod?.category_name || prod?.category_slug || "Producto";
    const tipo = productTipoOf(prod);
    const isRepuesto = tipo === "repuesto";
    const picture = productImageHtml(prod);

    const quoteHref =
      "contacto.html?quote=" +
      encodeURIComponent(prod.id || "") +
      "&sku=" +
      encodeURIComponent(slug) +
      "&name=" +
      encodeURIComponent(name);

    const fichaUrl = String(prod?.ficha_url || prod?.datasheet_url || "").trim();
    const fichaHtml = fichaUrl
      ? `<a href="${escapeAttr(fichaUrl)}" target="_blank" rel="noopener" class="btn btn-outline-spec">DESCARGAR FICHA TÉCNICA</a>`
      : `<button type="button" class="btn btn-outline-spec" data-datasheet="${escapeAttr(slug)}" data-datasheet-name="${escapeAttr(name)}" data-datasheet-sku="${escapeAttr(sku)}">DESCARGAR FICHA TÉCNICA</button>`;

    let actionsHtml;
    if (isRepuesto) {
      const cartPayload = encodeURIComponent(
        JSON.stringify({
          id: prod.id,
          slug,
          name,
          price_clp: prod.price_clp ?? null,
          sale_mode: "buy",
          tipo: "repuesto",
        })
      );
      actionsHtml =
        `<div class="product-card-actions catalog-card-actions">` +
        `<div class="action-buttons-group">` +
        `<button type="button" class="btn btn-buy" data-card-cart="${escapeAttr(cartPayload)}">COMPRAR</button>` +
        `<a href="${escapeAttr(quoteHref)}" class="btn btn-quote-secondary">COTIZAR</a>` +
        `</div>` +
        fichaHtml +
        `</div>`;
    } else {
      actionsHtml =
        `<div class="product-card-actions catalog-card-actions">` +
        `<a href="${escapeAttr(quoteHref)}" class="btn btn-quote-primary">PEDIR COTIZACIÓN</a>` +
        fichaHtml +
        `</div>`;
    }

    return (
      `<article class="product-card catalog-card reveal" data-tipo="${escapeAttr(tipo)}">` +
      `<a class="product-card__media product-card-visual" href="producto.html?slug=${encodeURIComponent(slug)}" title="${escapeAttr(name)}">` +
      `<span class="badge-type ${isRepuesto ? "badge-type--comprar" : "badge-type--cotizar"}">${isRepuesto ? "Comprar" : "Cotizar"}</span>` +
      `${picture}</a>` +
      `<div class="product-card-body">` +
      `<div class="product-meta"><span class="badge-category">${escapeHtml(cat)}</span></div>` +
      `<h3><a href="producto.html?slug=${encodeURIComponent(slug)}">${escapeHtml(name)}</a></h3>` +
      `<p class="product-sku"><span class="product-sku__label">SKU / Parte</span> ${escapeHtml(sku)}</p>` +
      `${actionsHtml}` +
      `</div></article>`
    );
  }

  function renderFilters() {
    if (industrySelect) {
      industrySelect.innerHTML =
        `<option value="">Todas</option>` +
        INDUSTRIES.map((ind) => {
          return `<option value="${escapeAttr(ind.id)}"${state.industry === ind.id ? " selected" : ""}>${escapeHtml(ind.label)}</option>`;
        }).join("");
    }
    if (categorySelect) {
      const base = Array.isArray(allProducts) ? allProducts : MOCK_PRODUCTS;
      const catsPresent = {};
      base.forEach((p) => {
        if (!p) return;
        if (state.tipo && productTipoOf(p) !== state.tipo) return;
        if (state.brand && p.brand_slug !== state.brand) return;
        const ind = INDUSTRIES.find((i) => i.id === state.industry);
        if (ind && !ind.categories.includes(p.category_slug)) return;
        if (p.category_slug) catsPresent[p.category_slug] = p.category_name || p.category_slug;
      });
      const catList = Object.keys(catsPresent).map((slug) => ({
        slug,
        name: catsPresent[slug],
      }));
      categorySelect.innerHTML =
        `<option value="">Todas</option>` +
        catList
          .map((c) => {
            return `<option value="${escapeAttr(c.slug)}"${state.category === c.slug ? " selected" : ""}>${escapeHtml(c.name)}</option>`;
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
      const noun =
        state.tipo === "repuesto"
          ? products.length === 1
            ? "repuesto"
            : "repuestos"
          : state.tipo === "equipo"
            ? products.length === 1
              ? "equipo"
              : "equipos"
            : products.length === 1
              ? "producto"
              : "productos";
      catalogCount.textContent = products.length + " " + noun;
    }

    if (!pageItems.length) {
      container.innerHTML =
        `<div class="empty-state"><p>No hay productos con esos filtros.</p>` +
        `<p class="empty-actions"><button type="button" class="btn btn-primary btn-sm" id="clearCatalogFilters">Ver todos</button>` +
        `<a class="btn btn-outline btn-sm" href="cotizacion.html">Pedir cotización</a></p></div>`;
      document.getElementById("clearCatalogFilters")?.addEventListener("click", () => {
        const tipo = state.tipo === "repuesto" ? "repuesto" : "equipo";
        window.location.href = "catalogo.html?tipo=" + encodeURIComponent(tipo);
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
    industrySelect?.addEventListener("change", () => {
      state.industry = cleanFilterValue(industrySelect.value || "");
      state.category = "";
      state.page = 1;
      renderGrid();
    });
    categorySelect?.addEventListener("change", () => {
      state.category = cleanFilterValue(categorySelect.value || "");
      state.page = 1;
      renderGrid();
    });
    brandSelect?.addEventListener("change", () => {
      state.brand = cleanFilterValue(brandSelect.value || "");
      // Si elige "Todas las marcas", brand queda vacío y se limpia de la URL en writeUrl
      syncCategoryAfterBrandChange();
      state.page = 1;
      renderFilters();
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
      datasheetBody.innerHTML =
        `<h3>Ficha técnica</h3><p><strong>${escapeHtml(name)}</strong></p>` +
        `<p class="product-sku">SKU / Parte: ${escapeHtml(sku)}</p>` +
        `<p>Descarga el PDF o solicítalo con tu cotización.</p>` +
        `<div class="empty-actions"><a class="btn btn-primary" href="img/fichas/${encodeURIComponent(slug)}.pdf" target="_blank" rel="noopener">Descargar PDF</a>` +
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
    // Si la URL trae marca+categoría incompatibles, descarta la categoría
    syncCategoryAfterBrandChange();
  } catch (err) {
    console.warn("[CATALOGO JS] fallback forzado a MOCK_PRODUCTS", err);
    allProducts = MOCK_PRODUCTS.slice();
  } finally {
    hideLoader();
    renderGrid();
  }
});
