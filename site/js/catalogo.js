/**
 * Catálogo B2B — filtrado por URL, industria, brand, cards, JSON-LD, paginación.
 */
(function () {
  "use strict";

  var PAGE_SIZE = 12;
  var grid = document.getElementById("catalogGrid");
  var filterChips = document.getElementById("filterChips");
  var modeChips = document.getElementById("modeChips");
  var industryTabs = document.getElementById("industryTabs");
  var brandSelect = document.getElementById("brandFilter");
  var catalogCount = document.getElementById("catalogCount");
  var pager = document.getElementById("catalogPager");
  var datasheetDialog = document.getElementById("datasheetDialog");
  var datasheetBody = document.getElementById("datasheetBody");
  var ldScript = document.getElementById("catalogItemListLd");

  if (!grid || !window.Lpaez) return;

  var state = {
    category: "",
    brand: "",
    industry: "",
    mode: "",
    page: 1,
  };

  var allProducts = [];
  var allCategories = [];
  var allBrands = [];

  var INDUSTRIES = [
    {
      id: "alimentos",
      label: "Alimentos",
      categories: ["secadores", "cuchillos-aire", "turbinas-soplado"],
    },
    {
      id: "packaging",
      label: "Packaging",
      categories: ["fin-de-linea"],
    },
    {
      id: "farmaceutica",
      label: "Farmacéutica",
      categories: ["salas-limpias"],
    },
    {
      id: "repuestos",
      label: "Repuestos",
      categories: ["repuestos"],
    },
  ];

  var CHIP_SHORT = {
    secadores: "Secadores",
    "turbinas-soplado": "Turbinas",
    "cuchillos-aire": "Air knives",
    repuestos: "Repuestos",
    "fin-de-linea": "Fin de línea",
    "salas-limpias": "Salas limpias",
  };

  var FETCH_TIMEOUT_MS = 3000;
  var WA_FALLBACK = "https://wa.me/56968232745?text=" +
    encodeURIComponent("Hola LPAEZsis, no pude cargar el catálogo y necesito ayuda.");

  /** Mock local (~8 ítems) para disponibilidad UX si la API falla. */
  var MOCK_CATALOG = {
    categories: [
      { id: 1, slug: "secadores", name: "Secadores de Envases", is_active: 1, sort_order: 10 },
      { id: 2, slug: "turbinas-soplado", name: "Turbinas de Soplado", is_active: 1, sort_order: 20 },
      { id: 4, slug: "repuestos", name: "Repuestos y Consumibles", is_active: 1, sort_order: 40 },
      { id: 5, slug: "fin-de-linea", name: "Máquinas Fin de Línea", is_active: 1, sort_order: 50 },
      { id: 6, slug: "salas-limpias", name: "Salas Limpias y HEPA", is_active: 1, sort_order: 60 },
    ],
    brands: [
      { id: 1, slug: "sonic-air-systems", name: "Sonic Air Systems", is_active: 1 },
      { id: 7, slug: "columbia-okura", name: "COLUMBIA/OKURA", is_active: 1 },
    ],
    products: [
      {
        id: 101,
        slug: "secador-botellas-sonic",
        name: "Sistema Secador de Botellas Sonic Air",
        description: "Sistema de secado de botellas con turbinas y air knives. Cotización según línea.",
        sale_mode: "quote",
        stock_status: "on_request",
        price_clp: null,
        image_url: "img/hero/cans.jpg",
        category_id: 1,
        category_slug: "secadores",
        category_name: "Secadores de Envases",
        brand_id: 1,
        brand_slug: "sonic-air-systems",
        brand_name: "Sonic Air Systems",
        is_active: 1,
        sort_order: 5,
      },
      {
        id: 102,
        slug: "turbina-soplado-sonic-100",
        name: "Turbina de Soplado Sonic 100",
        description: "Turbina de alto caudal para secado y limpieza industrial.",
        sale_mode: "quote",
        stock_status: "on_request",
        price_clp: null,
        image_url: "img/products/vt-sonic.jpg",
        category_id: 2,
        category_slug: "turbinas-soplado",
        category_name: "Turbinas de Soplado",
        brand_id: 1,
        brand_slug: "sonic-air-systems",
        brand_name: "Sonic Air Systems",
        is_active: 1,
        sort_order: 15,
      },
      {
        id: 103,
        slug: "correa-sonic-70-85",
        name: "Correa Sonic 70/85",
        description: "Correa 16 GRV SONIC 70/85 (Cod 13514)",
        sale_mode: "buy",
        stock_status: "in_stock",
        price_clp: null,
        image_url: "img/products/A07-13474.jpg",
        category_id: 4,
        category_slug: "repuestos",
        category_name: "Repuestos y Consumibles",
        brand_id: 1,
        brand_slug: "sonic-air-systems",
        brand_name: "Sonic Air Systems",
        is_active: 1,
        sort_order: 10,
      },
      {
        id: 104,
        slug: "filtro-poliester-s-75-85-100",
        name: "Filtro Poliéster S 75-85-100",
        description: "Elemento filtro polyester lavable Sonic 75-85-100",
        sale_mode: "buy",
        stock_status: "in_stock",
        price_clp: null,
        image_url: "img/products/A07-10317.jpg",
        category_id: 4,
        category_slug: "repuestos",
        category_name: "Repuestos y Consumibles",
        brand_id: 1,
        brand_slug: "sonic-air-systems",
        brand_name: "Sonic Air Systems",
        is_active: 1,
        sort_order: 20,
      },
      {
        id: 105,
        slug: "filtro-completo-poliester-s-70-85-100-con-indicador",
        name: "Filtro Completo Poliéster con indicador",
        description: "Filtro completo polyester lavable Sonic (Cod 10976)",
        sale_mode: "buy",
        stock_status: "in_stock",
        price_clp: 195000,
        image_url: "img/products/A07-10976.jpg",
        category_id: 4,
        category_slug: "repuestos",
        category_name: "Repuestos y Consumibles",
        brand_id: 1,
        brand_slug: "sonic-air-systems",
        brand_name: "Sonic Air Systems",
        is_active: 1,
        sort_order: 30,
      },
      {
        id: 106,
        slug: "impeller-sonic-70-100",
        name: "Impeller Sonic 70/100",
        description: "Impulsor soplador Sonic Air Models S70/S100 (Cod 10015)",
        sale_mode: "buy",
        stock_status: "in_stock",
        price_clp: null,
        image_url: "img/products/A07-10015.jpg",
        category_id: 4,
        category_slug: "repuestos",
        category_name: "Repuestos y Consumibles",
        brand_id: 1,
        brand_slug: "sonic-air-systems",
        brand_name: "Sonic Air Systems",
        is_active: 1,
        sort_order: 40,
      },
      {
        id: 107,
        slug: "cartucho-rodamientos-s-100-150",
        name: "Cartucho Rodamientos S 100-150",
        description: "Conjunto rodamientos sellado Sonic 100-150",
        sale_mode: "buy",
        stock_status: "in_stock",
        price_clp: null,
        image_url: "img/products/A07-14452.jpg",
        category_id: 4,
        category_slug: "repuestos",
        category_name: "Repuestos y Consumibles",
        brand_id: 1,
        brand_slug: "sonic-air-systems",
        brand_name: "Sonic Air Systems",
        is_active: 1,
        sort_order: 50,
      },
      {
        id: 108,
        slug: "paletizado-columbia-okura",
        name: "Paletizado robotizado Columbia/Okura",
        description: "Solución de fin de línea / paletizado. Cotización por proyecto.",
        sale_mode: "quote",
        stock_status: "on_request",
        price_clp: null,
        image_url: "img/hero/line.jpg",
        category_id: 5,
        category_slug: "fin-de-linea",
        category_name: "Máquinas Fin de Línea",
        brand_id: 7,
        brand_slug: "columbia-okura",
        brand_name: "COLUMBIA/OKURA",
        is_active: 1,
        sort_order: 8,
      },
    ],
  };

  function isDevEnv() {
    try {
      var host = String(window.location.hostname || "");
      return (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.indexOf(".cvm.dev") !== -1 ||
        host.indexOf("prueba1.") === 0 ||
        /(?:^|\.)local$/i.test(host)
      );
    } catch (e) {
      return false;
    }
  }

  function logDevError(label, err) {
    if (!isDevEnv()) return;
    try {
      console.error("[catalogo]", label, err);
    } catch (e) { /* ignore */ }
  }

  function escapeHtml(s) {
    return Lpaez.escapeHtml(s);
  }
  function escapeAttr(s) {
    return Lpaez.escapeAttr(s);
  }

  function showSkeleton() {
    var loader = document.getElementById("catalogLoader");
    if (loader) {
      loader.style.display = "";
      loader.hidden = false;
      loader.setAttribute("aria-hidden", "false");
    }
    grid.innerHTML = skeletonHtml();
    grid.classList.add("catalog-loading");
    grid.setAttribute("aria-busy", "true");
    if (pager) {
      pager.hidden = true;
      pager.innerHTML = "";
    }
    if (catalogCount) catalogCount.hidden = true;
  }

  function forceHideLoader() {
    var loader = document.getElementById("catalogLoader");
    if (loader) {
      loader.style.display = "none";
      loader.hidden = true;
      loader.setAttribute("aria-hidden", "true");
    }
    grid.classList.remove("catalog-loading");
    grid.setAttribute("aria-busy", "false");
    var stuck = grid.querySelector(".catalog-loading-label");
    if (stuck && stuck.parentNode === grid) {
      /* label will be replaced on render; remove if still present alone */
    }
  }

  function hideSkeleton() {
    forceHideLoader();
  }

  function whatsappCatalogUrl() {
    var el = document.querySelector("[data-wa]");
    if (el && el.getAttribute("href") && el.getAttribute("href").indexOf("wa.me") !== -1) {
      return el.getAttribute("href");
    }
    return WA_FALLBACK;
  }

  function outageEmptyHtml() {
    return (
      '<div class="empty-state catalog-outage">' +
      "<p><strong>No pudimos cargar el catálogo en este momento.</strong></p>" +
      "<p>Puedes reintentar o escribirnos por WhatsApp para cotizar sin demora.</p>" +
      '<p class="empty-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" id="catalogRetryBtn">Reintentar</button>' +
      '<a class="btn btn-outline btn-sm" id="catalogWaBtn" href="' +
      escapeAttr(whatsappCatalogUrl()) +
      '" target="_blank" rel="noopener noreferrer">Contactar por WhatsApp</a>' +
      "</p></div>"
    );
  }

  function bindOutageActions() {
    var retry = document.getElementById("catalogRetryBtn");
    if (retry) {
      retry.addEventListener("click", function () {
        initCatalog(true);
      });
    }
  }

  /** Alias pedido: MOCK_PRODUCTS */
  var MOCK_PRODUCTS = MOCK_CATALOG.products;

  function applyMockData() {
    allCategories = Array.isArray(MOCK_CATALOG.categories)
      ? MOCK_CATALOG.categories.slice()
      : [];
    allBrands = Array.isArray(MOCK_CATALOG.brands) ? MOCK_CATALOG.brands.slice() : [];
    allProducts = Array.isArray(MOCK_PRODUCTS) ? MOCK_PRODUCTS.slice() : [];
    return allProducts.length > 0;
  }

  function fetchJsonWithTimeout(url, timeoutMs) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = null;
    var opts = { credentials: "same-origin" };
    if (controller) opts.signal = controller.signal;
    var fetchPromise = fetch(url, opts).then(function (res) {
      if (!res || res.status !== 200) {
        var err = new Error("HTTP " + (res && res.status));
        err.status = res && res.status;
        throw err;
      }
      return res.json();
    });
    var timeoutPromise = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        if (controller) {
          try {
            controller.abort();
          } catch (e) { /* ignore */ }
        }
        var err = new Error("Timeout after " + timeoutMs + "ms");
        err.code = "TIMEOUT";
        reject(err);
      }, timeoutMs);
    });
    return Promise.race([fetchPromise, timeoutPromise]).then(
      function (data) {
        if (timer) clearTimeout(timer);
        return data;
      },
      function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      }
    );
  }

  async function loadCatalogPayload() {
    var results = await Promise.all([
      fetchJsonWithTimeout("/api/categories", FETCH_TIMEOUT_MS),
      fetchJsonWithTimeout("/api/products", FETCH_TIMEOUT_MS),
      fetchJsonWithTimeout("/api/brands", FETCH_TIMEOUT_MS),
    ]);
    var cats = (results[0] && results[0].categories) || [];
    var products = results[1] && results[1].products;
    var brands = (results[2] && results[2].brands) || [];
    products = Array.isArray(products) ? products : null;
    if (!products || !products.length) {
      var emptyErr = new Error("API returned empty/invalid products");
      emptyErr.code = "EMPTY";
      throw emptyErr;
    }
    return {
      categories: Array.isArray(cats) ? cats : [],
      products: products,
      brands: Array.isArray(brands) ? brands : [],
      source: "api",
    };
  }

  async function initCatalog(isRetry) {
    showSkeleton();
    readUrlState();
    try {
      var payload = await loadCatalogPayload();
      allCategories = Array.isArray(payload.categories) ? payload.categories : [];
      allBrands = Array.isArray(payload.brands) ? payload.brands : [];
      allProducts = Array.isArray(payload.products) ? payload.products : MOCK_PRODUCTS.slice();
      renderCatalog();
    } catch (err) {
      logDevError(isRetry ? "retry failed" : "api failed — injecting MOCK_PRODUCTS", err);
      try {
        if (!applyMockData()) {
          throw new Error("mock unavailable");
        }
        renderCatalog();
      } catch (mockErr) {
        logDevError("mock/render failed", mockErr);
        grid.innerHTML = outageEmptyHtml();
        if (catalogCount) catalogCount.hidden = true;
        if (pager) {
          pager.hidden = true;
          pager.innerHTML = "";
        }
        bindOutageActions();
      }
    } finally {
      forceHideLoader();
    }
  }

  function readUrlState() {
    state.category = Lpaez.queryParam("category") || "";
    state.brand = Lpaez.queryParam("brand") || "";
    state.industry = Lpaez.queryParam("industry") || "";
    state.mode = Lpaez.queryParam("sale_mode") || Lpaez.queryParam("mode") || "";
    var page = parseInt(Lpaez.queryParam("page") || "1", 10);
    state.page = page > 0 ? page : 1;

    // Map legacy category landing from home sectors into industry when useful
    if (!state.industry && state.category) {
      INDUSTRIES.forEach(function (ind) {
        if (ind.categories.indexOf(state.category) !== -1) {
          /* keep category; industry optional */
        }
      });
    }
  }

  function writeUrlState() {
    if (!window.history || !window.history.replaceState) return;
    var params = new URLSearchParams();
    if (state.industry) params.set("industry", state.industry);
    if (state.category) params.set("category", state.category);
    if (state.brand) params.set("brand", state.brand);
    if (state.mode) params.set("sale_mode", state.mode);
    if (state.page > 1) params.set("page", String(state.page));
    var q = params.toString();
    var url = "catalogo.html" + (q ? "?" + q : "");
    window.history.replaceState({}, "", url);
  }

  function skeletonHtml() {
    var cards = [0, 1, 2, 3, 4, 5].map(function () {
      return (
        '<article class="product-card catalog-card skeleton-card" aria-hidden="true">' +
        '<div class="product-card-visual skeleton-block"></div>' +
        '<div class="product-card-body">' +
        '<div class="skeleton-line short"></div>' +
        '<div class="skeleton-line"></div>' +
        '<div class="skeleton-line short"></div>' +
        '<div class="skeleton-line btn"></div>' +
        '<div class="skeleton-line btn"></div>' +
        "</div></article>"
      );
    }).join("");
    return cards;
  }

  function productSku(p) {
    p = p || {};
    var desc = String(p.description || "");
    var m = desc.match(/Cod(?:igo|igo|\.?)\s*([A-Z0-9\-./]+)/i) || desc.match(/\b([A-Z]?\d{4,})\b/);
    if (m) return m[1];
    return String(p.slug || p.id || "N/A").toUpperCase();
  }

  function localImageSrc(p) {
    p = p || {};
    var src = "";
    try {
      src = Lpaez.resolveProductImage(p) || "";
    } catch (e) {
      src = p.image_url || "img/products/A07-10015.jpg";
    }
    var wp = String(src).match(/\/([^\/?#]+\.(jpe?g|png|webp|gif))$/i);
    if (/wp-content\/uploads/i.test(src) && wp) {
      return "img/products/" + wp[1];
    }
    if (/^https?:\/\/[^/]*lpaezsis\.cl\//i.test(src)) {
      try {
        var u = new URL(src);
        return u.pathname.replace(/^\//, "");
      } catch (e) {
        return src;
      }
    }
    return src || "img/products/A07-10015.jpg";
  }

  function pictureHtml(src, alt) {
    src = String(src || "");
    var webp = "";
    if (/\.(jpe?g|png)$/i.test(src) && src.indexOf("http") !== 0) {
      webp = src.replace(/\.(jpe?g|png)$/i, ".webp");
    }
    var img =
      '<img src="' +
      escapeAttr(src) +
      '" alt="' +
      escapeAttr(alt) +
      '" title="' +
      escapeAttr(alt) +
      '" loading="lazy" decoding="async" width="480" height="480">';
    if (!webp) return img;
    return (
      '<picture><source type="image/webp" srcset="' +
      escapeAttr(webp) +
      '">' +
      img +
      "</picture>"
    );
  }

  function industryCategorySet() {
    if (!state.industry) return null;
    var ind = INDUSTRIES.filter(function (i) {
      return i.id === state.industry;
    })[0];
    if (!ind) return null;
    var set = {};
    ind.categories.forEach(function (c) {
      set[c] = true;
    });
    return set;
  }

  function filteredProducts() {
    var list = Array.isArray(allProducts) ? allProducts : MOCK_PRODUCTS;
    var industrySet = industryCategorySet();
    return list.filter(function (p) {
      if (!p) return false;
      if (state.category && p.category_slug !== state.category) return false;
      if (industrySet && !industrySet[p.category_slug]) return false;
      if (state.brand && p.brand_slug !== state.brand) return false;
      if (state.mode && p.sale_mode !== state.mode) return false;
      return true;
    });
  }

  function categoriesWithProducts() {
    var list = Array.isArray(allProducts) ? allProducts : MOCK_PRODUCTS;
    var cats = Array.isArray(allCategories) ? allCategories : [];
    var industrySet = industryCategorySet();
    var slugs = {};
    list.forEach(function (p) {
      if (!p) return;
      if (state.mode && p.sale_mode !== state.mode) return;
      if (state.brand && p.brand_slug !== state.brand) return;
      if (industrySet && !industrySet[p.category_slug]) return;
      if (p.category_slug) slugs[p.category_slug] = true;
    });
    return cats.filter(function (c) {
      return c && !!slugs[c.slug];
    });
  }

  function renderIndustryTabs() {
    if (!industryTabs) return;
    industryTabs.innerHTML =
      '<button type="button" class="industry-tab' +
      (!state.industry ? " is-active" : "") +
      '" role="tab" data-industry="" aria-selected="' +
      (!state.industry ? "true" : "false") +
      '" tabindex="' +
      (!state.industry ? "0" : "-1") +
      '">Todas</button>' +
      INDUSTRIES.map(function (ind) {
        var on = state.industry === ind.id;
        return (
          '<button type="button" class="industry-tab' +
          (on ? " is-active" : "") +
          '" role="tab" data-industry="' +
          escapeAttr(ind.id) +
          '" aria-selected="' +
          (on ? "true" : "false") +
          '" tabindex="' +
          (on ? "0" : "-1") +
          '">' +
          escapeHtml(ind.label) +
          "</button>"
        );
      }).join("");
  }

  function renderCategoryChips() {
    var cats = categoriesWithProducts();
    if (state.category && !cats.some(function (c) {
      return c.slug === state.category;
    })) {
      // Keep URL category even if empty — empty state will show
    }
    filterChips.innerHTML =
      '<button type="button" class="filter-chip' +
      (!state.category ? " is-active" : "") +
      '" data-cat="" aria-pressed="' +
      (!state.category ? "true" : "false") +
      '" title="Todas las categorías">Todas</button>' +
      cats.map(function (c) {
        var active = state.category === c.slug;
        var label = CHIP_SHORT[c.slug] || c.name;
        return (
          '<button type="button" class="filter-chip' +
          (active ? " is-active" : "") +
          '" data-cat="' +
          escapeAttr(c.slug) +
          '" aria-pressed="' +
          (active ? "true" : "false") +
          '" title="' +
          escapeAttr(c.name) +
          '">' +
          escapeHtml(label) +
          "</button>"
        );
      }).join("");
  }

  function renderBrandSelect() {
    if (!brandSelect) return;
    var options =
      '<option value="">Todas las marcas</option>' +
      allBrands
        .map(function (b) {
          return (
            '<option value="' +
            escapeAttr(b.slug) +
            '"' +
            (state.brand === b.slug ? " selected" : "") +
            ">" +
            escapeHtml(b.name) +
            "</option>"
          );
        })
        .join("");
    brandSelect.innerHTML = options;
  }

  function syncModeChips() {
    if (!modeChips) return;
    modeChips.querySelectorAll(".filter-chip").forEach(function (chip) {
      var on = chip.getAttribute("data-mode") === state.mode;
      chip.classList.toggle("is-active", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function b2bCardHtml(p) {
    p = p || {};
    var name = (p && p.name) || "Producto";
    var slug = (p && p.slug) || "";
    var sku = productSku(p);
    var img = localImageSrc(p);
    var catLabel =
      (p && p.category_name) ||
      CHIP_SHORT[(p && p.category_slug) || ""] ||
      "Producto";
    var saleMode = (p && p.sale_mode) || "quote";
    var quoteUrl =
      "cotizacion.html?sku=" +
      encodeURIComponent(slug || sku) +
      "&asunto=" +
      encodeURIComponent("Cotización: " + name + " (" + sku + ")");
    return (
      '<article class="product-card catalog-card reveal" data-product-id="' +
      escapeAttr(String((p && p.id) || sku)) +
      '">' +
      '<a class="product-card-visual" href="producto.html?slug=' +
      encodeURIComponent(slug) +
      '" title="' +
      escapeAttr(name) +
      '">' +
      pictureHtml(img, name) +
      "</a>" +
      '<div class="product-card-body">' +
      '<div class="product-meta">' +
      '<span class="badge-category">' +
      escapeHtml(catLabel) +
      "</span>" +
      '<span class="badge-mode ' +
      (saleMode === "buy" ? "badge-buy" : "badge-quote") +
      '">' +
      (saleMode === "buy" ? "Comprar" : "Cotizar") +
      "</span></div>" +
      "<h3><a href=\"producto.html?slug=" +
      encodeURIComponent(slug) +
      '">' +
      escapeHtml(name) +
      "</a></h3>" +
      '<p class="product-sku"><span class="product-sku__label">SKU / Parte</span> ' +
      escapeHtml(sku) +
      "</p>" +
      '<div class="product-card-actions catalog-card-actions">' +
      '<a class="btn btn-primary btn-sm" href="' +
      quoteUrl +
      '">Pedir cotización</a>' +
      '<button type="button" class="btn btn-outline btn-sm" data-datasheet="' +
      escapeAttr(slug) +
      '" data-datasheet-name="' +
      escapeAttr(name) +
      '" data-datasheet-sku="' +
      escapeAttr(sku) +
      '">Descargar ficha técnica</button>' +
      "</div></div></article>"
    );
  }

  function emptyStateHtml() {
    var hasFilters = !!(state.category || state.brand || state.industry || state.mode);
    var parts = ["<div class='empty-state'>"];
    if (hasFilters) {
      parts.push("<p>No hay productos con esos filtros B2B.</p>");
      parts.push(
        "<p class='empty-actions'>" +
          "<button type='button' class='btn btn-primary btn-sm' id='clearCatalogFilters'>Ver todos los productos</button>" +
          "<a class='btn btn-outline btn-sm' href='cotizacion.html'>Pedir cotización</a>" +
          "</p>"
      );
    } else {
      parts.push("<p>Pronto publicaremos más ítems.</p>");
      parts.push(
        "<p class='empty-actions'><a class='btn btn-primary btn-sm' href='cotizacion.html'>Pedir cotización</a></p>"
      );
    }
    parts.push("</div>");
    return parts.join("");
  }

  function injectItemListJsonLd(products) {
    var origin = window.location.origin || "https://prueba1.lpaezsis.cl";
    var graph = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Catálogo de productos LPAEZsis",
      url: origin + "/catalogo.html" + window.location.search,
      numberOfItems: products.length,
      itemListElement: products.map(function (p, i) {
        var sku = productSku(p);
        var img = localImageSrc(p);
        var absImg = /^https?:/i.test(img) ? img : origin + "/" + String(img).replace(/^\//, "");
        return {
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: p.name,
            sku: sku,
            productID: String(p.id),
            description: (p.description || "").slice(0, 300),
            image: absImg,
            url: origin + "/producto.html?slug=" + encodeURIComponent(p.slug),
            category: p.category_name || p.category_slug || undefined,
            brand: p.brand_name
              ? { "@type": "Brand", name: p.brand_name }
              : { "@type": "Brand", name: "Sonic Air Systems" },
            offers: {
              "@type": "Offer",
              url: origin + "/cotizacion.html?sku=" + encodeURIComponent(p.slug),
              priceCurrency: "CLP",
              availability:
                p.stock_status === "in_stock"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/PreOrder",
              price: p.price_clp != null ? String(p.price_clp) : undefined,
            },
          },
        };
      }),
    };
    var json = JSON.stringify(graph);
    if (ldScript) {
      ldScript.textContent = json;
    } else {
      Lpaez.injectJsonLd(graph);
    }
  }

  function renderPager(total, page, pages) {
    if (!pager) return;
    if (total <= PAGE_SIZE) {
      pager.hidden = true;
      pager.innerHTML = "";
      return;
    }
    pager.hidden = false;
    var buttons = [];
    buttons.push(
      '<button type="button" class="btn btn-outline btn-sm" data-page="' +
        (page - 1) +
        '"' +
        (page <= 1 ? " disabled" : "") +
        ">Anterior</button>"
    );
    buttons.push(
      '<span class="catalog-pager__status" aria-live="polite">Página ' +
        page +
        " de " +
        pages +
        "</span>"
    );
    buttons.push(
      '<button type="button" class="btn btn-outline btn-sm" data-page="' +
        (page + 1) +
        '"' +
        (page >= pages ? " disabled" : "") +
        ">Siguiente</button>"
    );
    pager.innerHTML = buttons.join("");
  }

  function openDatasheetModal(slug, name, sku) {
    if (!datasheetDialog || !datasheetBody) {
      window.location.href = "producto.html?slug=" + encodeURIComponent(slug);
      return;
    }
    var pdfPath = "img/fichas/" + encodeURIComponent(slug) + ".pdf";
    datasheetBody.innerHTML =
      "<h3>Ficha técnica</h3>" +
      "<p><strong>" +
      escapeHtml(name) +
      "</strong></p>" +
      '<p class="product-sku">SKU / Parte: ' +
      escapeHtml(sku) +
      "</p>" +
      "<p>Descarga la ficha técnica en PDF o solicita el envío con tu cotización.</p>" +
      '<div class="empty-actions">' +
      '<a class="btn btn-primary" id="datasheetPdfLink" href="' +
      pdfPath +
      '" download target="_blank" rel="noopener">Descargar PDF</a>' +
      '<a class="btn btn-outline" href="cotizacion.html?sku=' +
      encodeURIComponent(slug) +
      '">Pedir cotización con ficha</a>' +
      "</div>" +
      '<p class="catalog-hint" id="datasheetHint">Si el PDF aún no está publicado, te lo enviamos al cotizar.</p>';
    if (typeof datasheetDialog.showModal === "function") {
      datasheetDialog.showModal();
    } else {
      datasheetDialog.setAttribute("open", "");
    }
    var link = document.getElementById("datasheetPdfLink");
    if (link) {
      link.addEventListener(
        "click",
        function () {
          var hint = document.getElementById("datasheetHint");
          if (hint) {
            hint.innerHTML =
              "Si el archivo no abre, el PDF aún no está publicado: usa <strong>Pedir cotización con ficha</strong>.";
          }
        },
        { once: true }
      );
    }
  }

  function renderCatalog() {
    try {
      forceHideLoader();
      renderIndustryTabs();
      renderCategoryChips();
      renderBrandSelect();
      syncModeChips();
      writeUrlState();

      var products = filteredProducts();
      products = Array.isArray(products) ? products : MOCK_PRODUCTS.slice();
      var pages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * PAGE_SIZE;
      var pageItems = products.slice(start, start + PAGE_SIZE);

      if (catalogCount) {
        catalogCount.hidden = false;
        catalogCount.textContent =
          products.length === 1 ? "1 producto" : products.length + " productos";
      }

      if (!products.length) {
        grid.innerHTML = emptyStateHtml();
        renderPager(0, 1, 1);
        injectItemListJsonLd([]);
        var clearBtn = document.getElementById("clearCatalogFilters");
        if (clearBtn) {
          clearBtn.addEventListener("click", function () {
            state.category = "";
            state.brand = "";
            state.industry = "";
            state.mode = "";
            state.page = 1;
            renderCatalog();
          });
        }
        if (Lpaez.observeReveals) Lpaez.observeReveals();
        return;
      }

      grid.innerHTML = pageItems.map(b2bCardHtml).join("");
      renderPager(products.length, state.page, pages);
      injectItemListJsonLd(pageItems);
      if (Lpaez.observeReveals) Lpaez.observeReveals();
    } catch (err) {
      logDevError("renderCatalog", err);
      try {
        var fallback = Array.isArray(MOCK_PRODUCTS) ? MOCK_PRODUCTS : [];
        grid.innerHTML = fallback.map(b2bCardHtml).join("") || outageEmptyHtml();
        if (!fallback.length) bindOutageActions();
      } catch (e2) {
        grid.innerHTML = outageEmptyHtml();
        bindOutageActions();
      }
    } finally {
      forceHideLoader();
    }
  }

  function bindKeyboardGroup(container, itemSelector, onActivate) {
    if (!container) return;
    container.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(container.querySelectorAll(itemSelector));
      var current = document.activeElement;
      var idx = items.indexOf(current);
      if (idx < 0) return;
      var next = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % items.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + items.length) % items.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = items.length - 1;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate(current);
        return;
      }
      if (next < 0) return;
      e.preventDefault();
      items[next].focus();
    });
  }

  // Events
  if (industryTabs) {
    industryTabs.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-industry]");
      if (!btn) return;
      state.industry = btn.getAttribute("data-industry") || "";
      state.category = "";
      state.page = 1;
      renderCatalog();
    });
    bindKeyboardGroup(industryTabs, ".industry-tab", function (btn) {
      state.industry = btn.getAttribute("data-industry") || "";
      state.category = "";
      state.page = 1;
      renderCatalog();
    });
  }

  filterChips.addEventListener("click", function (e) {
    var chip = e.target.closest(".filter-chip");
    if (!chip) return;
    state.category = chip.getAttribute("data-cat") || "";
    state.page = 1;
    renderCatalog();
  });
  bindKeyboardGroup(filterChips, ".filter-chip", function (chip) {
    state.category = chip.getAttribute("data-cat") || "";
    state.page = 1;
    renderCatalog();
  });

  if (modeChips) {
    modeChips.addEventListener("click", function (e) {
      var chip = e.target.closest(".filter-chip");
      if (!chip) return;
      state.mode = chip.getAttribute("data-mode") || "";
      state.page = 1;
      renderCatalog();
    });
    bindKeyboardGroup(modeChips, ".filter-chip", function (chip) {
      state.mode = chip.getAttribute("data-mode") || "";
      state.page = 1;
      renderCatalog();
    });
  }

  if (brandSelect) {
    brandSelect.addEventListener("change", function () {
      state.brand = brandSelect.value || "";
      state.page = 1;
      renderCatalog();
    });
  }

  if (pager) {
    pager.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      var page = parseInt(btn.getAttribute("data-page"), 10);
      if (!page || page < 1) return;
      state.page = page;
      writeUrlState();
      renderCatalog();
      grid.focus({ preventScroll: false });
      window.scrollTo({ top: grid.offsetTop - 80, behavior: "smooth" });
    });
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-datasheet]");
    if (!btn) return;
    openDatasheetModal(
      btn.getAttribute("data-datasheet"),
      btn.getAttribute("data-datasheet-name") || "",
      btn.getAttribute("data-datasheet-sku") || ""
    );
  });

  var datasheetClose = document.getElementById("datasheetClose");
  if (datasheetClose && datasheetDialog) {
    datasheetClose.addEventListener("click", function () {
      if (typeof datasheetDialog.close === "function") datasheetDialog.close();
      else datasheetDialog.removeAttribute("open");
    });
  }

  // Boot — async safe init with finally that always hides loader
  initCatalog(false);
})();
