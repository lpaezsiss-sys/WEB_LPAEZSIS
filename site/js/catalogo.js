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

  function escapeHtml(s) {
    return Lpaez.escapeHtml(s);
  }
  function escapeAttr(s) {
    return Lpaez.escapeAttr(s);
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
        '<div class="product-card-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line btn"></div></div></article>'
      );
    }).join("");
    return '<p class="catalog-loading-label">Cargando productos…</p>' + cards;
  }

  function productSku(p) {
    var desc = String(p.description || "");
    var m = desc.match(/Cod(?:igo|igo|\.?)\s*([A-Z0-9\-./]+)/i) || desc.match(/\b([A-Z]?\d{4,})\b/);
    if (m) return m[1];
    return String(p.slug || p.id || "").toUpperCase();
  }

  function localImageSrc(p) {
    var src = Lpaez.resolveProductImage(p) || "";
    // Prefer local mirror of legacy WP uploads
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
    return src;
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
    var industrySet = industryCategorySet();
    return allProducts.filter(function (p) {
      if (state.category && p.category_slug !== state.category) return false;
      if (industrySet && !industrySet[p.category_slug]) return false;
      if (state.brand && p.brand_slug !== state.brand) return false;
      if (state.mode && p.sale_mode !== state.mode) return false;
      return true;
    });
  }

  function categoriesWithProducts() {
    var industrySet = industryCategorySet();
    var slugs = {};
    allProducts.forEach(function (p) {
      if (state.mode && p.sale_mode !== state.mode) return;
      if (state.brand && p.brand_slug !== state.brand) return;
      if (industrySet && !industrySet[p.category_slug]) return;
      if (p.category_slug) slugs[p.category_slug] = true;
    });
    return allCategories.filter(function (c) {
      return !!slugs[c.slug];
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
    var sku = productSku(p);
    var img = localImageSrc(p);
    var catLabel = p.category_name || CHIP_SHORT[p.category_slug] || "Producto";
    var quoteUrl =
      "cotizacion.html?sku=" +
      encodeURIComponent(p.slug) +
      "&asunto=" +
      encodeURIComponent("Cotización: " + p.name + " (" + sku + ")");
    return (
      '<article class="product-card catalog-card reveal" data-product-id="' +
      escapeAttr(String(p.id)) +
      '">' +
      '<a class="product-card-visual" href="producto.html?slug=' +
      encodeURIComponent(p.slug) +
      '" title="' +
      escapeAttr(p.name) +
      '">' +
      pictureHtml(img, p.name) +
      "</a>" +
      '<div class="product-card-body">' +
      '<div class="product-meta">' +
      '<span class="badge-category">' +
      escapeHtml(catLabel) +
      "</span>" +
      '<span class="badge-mode ' +
      (p.sale_mode === "buy" ? "badge-buy" : "badge-quote") +
      '">' +
      (p.sale_mode === "buy" ? "Comprar" : "Cotizar") +
      "</span></div>" +
      "<h3><a href=\"producto.html?slug=" +
      encodeURIComponent(p.slug) +
      '">' +
      escapeHtml(p.name) +
      "</a></h3>" +
      '<p class="product-sku"><span class="product-sku__label">SKU / Parte</span> ' +
      escapeHtml(sku) +
      "</p>" +
      '<div class="product-card-actions catalog-card-actions">' +
      '<a class="btn btn-primary btn-sm" href="' +
      quoteUrl +
      '">Pedir cotización</a>' +
      '<button type="button" class="btn btn-outline btn-sm" data-datasheet="' +
      escapeAttr(p.slug) +
      '" data-datasheet-name="' +
      escapeAttr(p.name) +
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
    renderIndustryTabs();
    renderCategoryChips();
    renderBrandSelect();
    syncModeChips();
    writeUrlState();

    var products = filteredProducts();
    var pages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PAGE_SIZE;
    var pageItems = products.slice(start, start + PAGE_SIZE);

    catalogCount.hidden = false;
    catalogCount.textContent =
      products.length === 1 ? "1 producto" : products.length + " productos";

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
      Lpaez.observeReveals();
      return;
    }

    grid.innerHTML = pageItems.map(b2bCardHtml).join("");
    renderPager(products.length, state.page, pages);
    injectItemListJsonLd(pageItems);
    Lpaez.observeReveals();
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

  // Boot
  grid.innerHTML = skeletonHtml();
  grid.classList.add("catalog-loading");
  grid.setAttribute("aria-busy", "true");
  readUrlState();

  Promise.all([
    Lpaez.api("/api/categories"),
    Lpaez.api("/api/products"),
    Lpaez.api("/api/brands"),
  ])
    .then(function (results) {
      allCategories = (results[0].data && results[0].data.categories) || [];
      allProducts = (results[1].data && results[1].data.products) || [];
      allBrands = (results[2].data && results[2].data.brands) || [];
      grid.classList.remove("catalog-loading");
      grid.setAttribute("aria-busy", "false");
      renderCatalog();
    })
    .catch(function () {
      grid.classList.remove("catalog-loading");
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML =
        "<p class='empty-state'>No se pudo conectar con la API. Revisa el servidor.</p>";
    });
})();
