(function () {
  "use strict";

  var CART_KEY = "lpaezsis_cart_v1";
  var QUOTE_KEY = "lpaezsis_quote_v1";
  var siteSettings = null;

  function $(id) {
    return document.getElementById(id);
  }

  function formatPrice(value) {
    if (value == null || Number.isNaN(Number(value))) return "Consultar";
    return "$" + Number(value).toLocaleString("es-CL");
  }

  function stockLabel(status) {
    var map = {
      in_stock: "En stock",
      on_request: "Bajo pedido",
      out_of_stock: "Agotado",
      discontinued: "Descontinuado",
    };
    return map[status] || status;
  }

  function loadJson(key) {
    try {
      var raw = localStorage.getItem(key);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveJson(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    updateBadges();
  }

  function getCart() {
    return loadJson(CART_KEY);
  }

  function getQuote() {
    return loadJson(QUOTE_KEY);
  }

  function updateBadges() {
    var cartCount = getCart().reduce(function (s, i) {
      return s + (i.qty || 1);
    }, 0);
    var quoteCount = getQuote().reduce(function (s, i) {
      return s + (i.qty || 1);
    }, 0);
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = String(cartCount);
      el.hidden = cartCount === 0;
    });
    document.querySelectorAll("[data-quote-count]").forEach(function (el) {
      el.textContent = String(quoteCount);
      el.hidden = quoteCount === 0;
    });
  }

  function showToast(message) {
    var toast = $("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.hidden = false;
    toast.textContent = message;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.hidden = true;
    }, 3200);
  }

  function addToCart(product, qty) {
    var isBuyable =
      product &&
      (product.sale_mode === "buy" || product.tipo === "repuesto");
    if (!isBuyable) {
      showToast("Este producto solo se cotiza.");
      return;
    }
    qty = Math.max(1, Math.floor(Number(qty) || 1));
    var cart = getCart();
    var existing = cart.find(function (i) {
      return i.id === product.id;
    });
    if (existing) existing.qty += qty;
    else {
      cart.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price_clp: product.price_clp,
        qty: qty,
      });
    }
    saveJson(CART_KEY, cart);
    updateBadges();
    showToast(product.name + " agregado al carrito");
  }

  function addToQuote(product, qty) {
    qty = Math.max(1, Math.floor(Number(qty) || 1));
    var list = getQuote();
    var existing = list.find(function (i) {
      return i.id === product.id;
    });
    if (existing) existing.qty += qty;
    else {
      list.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        sale_mode: product.sale_mode,
        qty: qty,
      });
    }
    saveJson(QUOTE_KEY, list);
    updateBadges();
    showToast(product.name + " agregado a cotización");
  }

  function setCartQty(id, qty) {
    var cart = getCart();
    if (qty <= 0) {
      cart = cart.filter(function (i) {
        return i.id !== id;
      });
    } else {
      cart.forEach(function (i) {
        if (i.id === id) i.qty = qty;
      });
    }
    saveJson(CART_KEY, cart);
  }

  function setQuoteQty(id, qty) {
    var list = getQuote();
    if (qty <= 0) {
      list = list.filter(function (i) {
        return i.id !== id;
      });
    } else {
      list.forEach(function (i) {
        if (i.id === id) i.qty = qty;
      });
    }
    saveJson(QUOTE_KEY, list);
  }

  function clearCart() {
    saveJson(CART_KEY, []);
  }

  function clearQuote() {
    saveJson(QUOTE_KEY, []);
  }

  function api(path, options) {
    return fetch(path, options).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  }

  function setMeta(settings) {
    if (!settings) return;
    var yearEl = $("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    document.querySelectorAll("[data-email]").forEach(function (el) {
      el.textContent = settings.email;
      if (el.tagName === "A") el.href = "mailto:" + settings.email;
    });
    function bindTel(selector, display) {
      document.querySelectorAll(selector).forEach(function (el) {
        if (!display) return;
        el.textContent = display;
        if (el.tagName === "A") {
          el.href = "tel:" + String(display).replace(/[^\d+]/g, "");
        }
      });
    }
    bindTel("[data-phone]", settings.phone_display);
    bindTel("[data-phone2]", settings.phone2_display);
    document.querySelectorAll("[data-wa]").forEach(function (el) {
      if (settings.whatsapp_number) {
        el.href =
          "https://wa.me/" +
          String(settings.whatsapp_number).replace(/\D/g, "") +
          "?text=" +
          encodeURIComponent("Hola LPAEZsis, quiero cotizar equipos industriales.");
        el.hidden = false;
        if (el.classList.contains("wa-float")) {
          el.target = "_blank";
          el.rel = "noopener noreferrer";
        }
      } else if (el.classList.contains("wa-float")) {
        el.hidden = true;
      }
    });
    ["linkedin", "instagram", "youtube"].forEach(function (net) {
      var url = settings[net + "_url"];
      var usable =
        url &&
        String(url).trim() &&
        String(url) !== "#" &&
        !/instagram\.com\/?$/i.test(url) &&
        !/youtube\.com\/?$/i.test(url);
      document.querySelectorAll("[data-" + net + "]").forEach(function (el) {
        if (usable) {
          el.href = url;
          var opt = el.closest("[data-social-optional]");
          if (opt) opt.hidden = false;
        } else {
          var hide = el.closest("[data-social-optional]");
          if (hide) hide.hidden = true;
        }
      });
    });
  }

  function injectJsonLd(obj) {
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(obj);
    document.head.appendChild(script);
  }

  function productPayload(p) {
    return encodeURIComponent(
      JSON.stringify({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price_clp: p.price_clp,
        sale_mode: p.sale_mode,
        tipo: p.tipo || (p.sale_mode === "buy" ? "repuesto" : "equipo"),
      })
    );
  }

  function productTipoOf(p) {
    if (p && (p.tipo === "repuesto" || p.tipo === "equipo")) return p.tipo;
    return p && p.sale_mode === "buy" ? "repuesto" : "equipo";
  }

  function productCardHtml(p, options) {
    var opts = options || {};
    var tipo = productTipoOf(p);
    var isRepuesto = tipo === "repuesto";
    var modeClass = isRepuesto ? "badge-buy" : "badge-quote";
    var modeLabel = isRepuesto ? "Comprar" : "Cotizar";
    var price =
      isRepuesto && p.price_clp != null
        ? formatPrice(p.price_clp)
        : isRepuesto
          ? "Consultar"
          : "Cotización";
    var img = resolveProductImage(p);
    var visual = img
      ? '<img src="' +
        img +
        '" alt="' +
        escapeAttr(p.name) +
        '" title="' +
        escapeAttr(p.name) +
        '" loading="lazy" decoding="async" width="480" height="480">'
      : "LPAEZ";
    var payload = productPayload(p);
    var quoteHref =
      "contacto.html?quote=" +
      encodeURIComponent(p.id || "") +
      "&sku=" +
      encodeURIComponent(p.slug || "") +
      "&name=" +
      encodeURIComponent(p.name || "");
    var fichaUrl = String(p.ficha_url || p.datasheet_url || "").trim();
    var fichaHtml = fichaUrl
      ? '<a href="' +
        escapeAttr(fichaUrl) +
        '" target="_blank" rel="noopener" class="btn btn-outline-spec">DESCARGAR FICHA TÉCNICA</a>'
      : opts.showDatasheetBadge
        ? '<a class="btn btn-outline-spec" href="producto.html?slug=' +
          encodeURIComponent(p.slug) +
          '">DESCARGAR FICHA TÉCNICA</a>'
        : "";
    var actionsHtml;
    if (isRepuesto) {
      actionsHtml =
        '<div class="product-card-actions">' +
        '<div class="action-buttons-group">' +
        '<button type="button" class="btn btn-buy" data-card-cart="' +
        payload +
        '">COMPRAR</button>' +
        '<a href="' +
        escapeAttr(quoteHref) +
        '" class="btn btn-quote-secondary">COTIZAR</a>' +
        "</div>" +
        fichaHtml +
        '<a class="product-card-link" href="producto.html?slug=' +
        encodeURIComponent(p.slug) +
        '">Ver detalle</a>' +
        "</div>";
    } else {
      actionsHtml =
        '<div class="product-card-actions">' +
        '<a href="' +
        escapeAttr(quoteHref) +
        '" class="btn btn-quote-primary">PEDIR COTIZACIÓN</a>' +
        fichaHtml +
        '<a class="product-card-link" href="producto.html?slug=' +
        encodeURIComponent(p.slug) +
        '">Ver detalle</a>' +
        "</div>";
    }
    return (
      '<article class="product-card reveal" data-tipo="' +
      escapeAttr(tipo) +
      '">' +
      '<a class="product-card-visual" href="producto.html?slug=' +
      encodeURIComponent(p.slug) +
      '" title="' +
      escapeAttr(p.name) +
      '">' +
      visual +
      "</a>" +
      '<div class="product-card-body">' +
      '<div class="product-meta">' +
      '<span class="badge-mode ' +
      modeClass +
      '">' +
      modeLabel +
      "</span>" +
      '<span class="badge-stock">' +
      stockLabel(p.stock_status) +
      "</span>" +
      "</div>" +
      "<h3><a href=\"producto.html?slug=" +
      encodeURIComponent(p.slug) +
      '">' +
      escapeHtml(p.name) +
      "</a></h3>" +
      '<p class="product-price">' +
      price +
      "</p>" +
      actionsHtml +
      "</div></article>"
    );
  }

  function bindProductCardActions() {
    if (document.documentElement.dataset.cardActionsBound) return;
    document.documentElement.dataset.cardActionsBound = "1";
    document.addEventListener("click", function (e) {
      var cartBtn = e.target.closest("[data-card-cart]");
      var quoteBtn = e.target.closest("[data-card-quote]");
      if (!cartBtn && !quoteBtn) return;
      e.preventDefault();
      try {
        var raw = (cartBtn || quoteBtn).getAttribute(
          cartBtn ? "data-card-cart" : "data-card-quote"
        );
        var product = JSON.parse(decodeURIComponent(raw));
        if (cartBtn) addToCart(product, 1);
        else addToQuote(product, 1);
        updateBadges();
      } catch (err) {
        showToast("No se pudo agregar el producto.");
      }
    });
  }

  var PRODUCT_IMAGES = {
    "secador-botellas-sonic": "img/hero/cans.jpg",
    "turbina-soplado-sonic-100": "img/products/vt-sonic.jpg",
    "correa-sonic-70-85": "img/products/A07-10015.jpg",
    "filtro-poliester-s-75-85-100": "img/products/A07-10976.jpg",
  };

  var PRODUCT_FALLBACKS = [
    "img/products/A07-10015.jpg",
    "img/products/A07-10976.jpg",
    "img/products/A07-13474.jpg",
    "img/products/A07-10317.jpg",
    "img/products/A07-14452.jpg",
    "img/products/A07-13455.png",
    "img/products/vt-sonic.jpg",
    "img/products/sonic-comp.png",
  ];

  var CATEGORY_IMAGES = {
    secadores: "img/hero/cans.jpg",
    "turbinas-soplado": "img/products/vt-sonic.jpg",
    "cuchillos-aire": "img/hero/conserves.jpg",
    repuestos: "img/products/A07-10015.jpg",
    "fin-de-linea": "img/hero/line.jpg",
    "salas-limpias": "img/hero/plant.jpg",
  };

  function resolveProductImage(p) {
    if (!p) return PRODUCT_FALLBACKS[0];
    if (p.image_url) return p.image_url;
    if (PRODUCT_IMAGES[p.slug]) return PRODUCT_IMAGES[p.slug];
    var idx = Math.abs(Number(p.id) || 0) % PRODUCT_FALLBACKS.length;
    return PRODUCT_FALLBACKS[idx];
  }

  function resolveCategoryImage(slug) {
    return CATEGORY_IMAGES[slug] || "img/hero/plant.jpg";
  }

  function observeReveals() {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function queryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function bindNav() {
    var toggle = $("navToggle");
    var nav = $("mainNav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.classList.toggle("nav-open", open);
    }

    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    // Event delegation so brand links added later also close the drawer.
    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link || !nav.contains(link)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 901px)").matches) setOpen(false);
    });
  }

  function loadSettings() {
    return api("/api/settings").then(function (res) {
      if (res.ok) {
        siteSettings = res.data;
        setMeta(siteSettings);
        injectJsonLd({
          "@context": "https://schema.org",
          "@type": ["Organization", "LocalBusiness"],
          name: siteSettings.business_name || "LPAEZsis",
          url: "https://lpaezsis.cl/",
          email: siteSettings.email,
          telephone: siteSettings.phone_display,
          image: "https://lpaezsis.cl/img/brand/logo.png",
          logo: "https://lpaezsis.cl/img/brand/logo.png",
          description:
            siteSettings.seo_description ||
            siteSettings.tagline ||
            "Equipos de soplado, secado y fin de línea industrial en Chile.",
          areaServed: { "@type": "Country", name: "Chile" },
          foundingDate: "2019",
          slogan: siteSettings.tagline || "Saving 1440 minutes a day",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Santiago",
            addressRegion: "RM",
            postalCode: "8441172",
            addressCountry: "CL",
          },
          sameAs: [
            siteSettings.linkedin_url ||
              "https://cl.linkedin.com/company/lpaez-blowers-secadores-latas-botellas-conveyors-paletizado-etiquetado-cintas-transportadoras",
            siteSettings.instagram_url,
            siteSettings.youtube_url,
          ].filter(Boolean),
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "sales",
              telephone: siteSettings.phone_display,
              email: siteSettings.email,
              availableLanguage: ["Spanish"],
            },
          ],
        });
      }
      return siteSettings;
    });
  }

  window.Lpaez = {
    api: api,
    formatPrice: formatPrice,
    stockLabel: stockLabel,
    getCart: getCart,
    getQuote: getQuote,
    addToCart: addToCart,
    addToQuote: addToQuote,
    setCartQty: setCartQty,
    setQuoteQty: setQuoteQty,
    clearCart: clearCart,
    clearQuote: clearQuote,
    showToast: showToast,
    productCardHtml: productCardHtml,
    productTipoOf: productTipoOf,
    resolveProductImage: resolveProductImage,
    resolveCategoryImage: resolveCategoryImage,
    observeReveals: observeReveals,
    queryParam: queryParam,
    escapeHtml: escapeHtml,
    injectJsonLd: injectJsonLd,
    updateBadges: updateBadges,
    getSettings: function () {
      return siteSettings;
    },
  };

  bindNav();
  bindProductCardActions();
  updateBadges();
  loadSettings()
    .catch(function () {})
    .finally(function () {
      observeReveals();
    });
})();
