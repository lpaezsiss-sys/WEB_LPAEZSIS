/**
 * Vista B2B de Repuestos e Insumos — búsqueda por código OEM / filtros.
 */
(function () {
  "use strict";

  var API_URL = "/api/repuestos.php";
  var FALLBACK_IMG = "img/products/A07-10015.jpg";
  var PLACEHOLDER_IMG = "img/placeholder-logo.png";

  var TIPO_INSUMO = [
    { id: "cuchillas", label: "Cuchillas de aire", match: /cuchill|air\s*knife|knife/i },
    { id: "filtros", label: "Filtros", match: /filtro|filter|cartucho\s*filtro/i },
    { id: "correas", label: "Correas", match: /correa|belt|tensor/i },
    { id: "valvulas", label: "Válvulas", match: /v[aá]lvula|valve/i },
    { id: "sellos", label: "Sellos", match: /sello|seal|oring|o-ring/i },
    { id: "rodamientos", label: "Rodamientos", match: /rodamiento|bearing/i },
    { id: "impulsores", label: "Impulsores / Impellers", match: /impeller|impulsor/i },
    { id: "otros", label: "Otros insumos", match: null },
  ];

  var EQUIPO_OPTS = [
    { id: "secadores", label: "Secadores", match: /secador|dryer|sonic\s*(75|85|100|150|70)|soplador/i },
    { id: "paletizadores", label: "Paletizadores", match: /paletiz|pallet/i },
    { id: "depaletizadores", label: "Depaletizadores", match: /depaletiz|depallet/i },
    { id: "transportadores", label: "Transportadores", match: /transport|conveyor|movex/i },
    { id: "etiquetadoras", label: "Etiquetadoras", match: /etiqueta|label/i },
    { id: "generico", label: "Equipos Sonic / Genéricos", match: /sonic|equipos?\s*sonic|modelos?\s*s\s*\d/i },
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function extractSku(prod) {
    if (prod && prod.sku) return String(prod.sku).trim();
    var desc = String((prod && prod.description) || "");
    var m = desc.match(/Cod(?:igo|igo|\.?)\s*([A-Z0-9\-./]+)/i);
    if (m) return m[1];
    var slug = String((prod && prod.slug) || "");
    var fromSlug = slug.match(/(A07[-_]?\d{4,}|[A-Z]?\d{4,})/i);
    if (fromSlug) return fromSlug[1].toUpperCase();
    return slug ? slug.toUpperCase() : "N/A";
  }

  function extractCompat(prod) {
    var desc = String((prod && prod.description) || "");
    var name = String((prod && prod.name) || "");
    var blob = desc + " " + name;
    var models = [];
    var m1 = blob.match(/Equipos?\s+SONIC[^\n.]{0,40}/i);
    if (m1) models.push(m1[0].replace(/\s+/g, " ").trim());
    var m2 = blob.match(/Modelos?\s+S?\s*\d{2,3}(?:\s*\/\s*S?\s*\d{2,3})*/i);
    if (m2) models.push(m2[0].replace(/\s+/g, " ").trim());
    var m3 = blob.match(/S\s?\d{2,3}\s*\/\s*S?\s*\d{2,3}/i);
    if (m3 && models.join(" ").indexOf(m3[0]) === -1) models.push(m3[0]);
    if (!models.length && /todos\s+los\s+modelos/i.test(blob)) {
      models.push("Todos los modelos Sonic");
    }
    if (!models.length) {
      models.push((prod && prod.brand_name) || "Consultar compatibilidad");
    }
    return models.join(" · ");
  }

  function classifyTipo(prod) {
    var blob = ((prod && prod.name) || "") + " " + ((prod && prod.description) || "");
    for (var i = 0; i < TIPO_INSUMO.length; i++) {
      var t = TIPO_INSUMO[i];
      if (t.match && t.match.test(blob)) return t.id;
    }
    return "otros";
  }

  function classifyEquipo(prod) {
    var blob = ((prod && prod.name) || "") + " " + ((prod && prod.description) || "");
    var hits = [];
    for (var i = 0; i < EQUIPO_OPTS.length; i++) {
      var e = EQUIPO_OPTS[i];
      if (e.match && e.match.test(blob)) hits.push(e.id);
    }
    return hits.length ? hits : ["generico"];
  }

  function stockLabel(status) {
    var map = {
      in_stock: "Stock Local",
      on_request: "Bajo Pedido",
      out_of_stock: "Sin stock",
      discontinued: "Descontinuado",
    };
    return map[status] || "Bajo Pedido";
  }

  function stockClass(status) {
    return status === "in_stock" ? "is-stock" : "is-request";
  }

  function normalizeImage(url) {
    var rawImg = String(url || "").trim();
    if (/wp-content\/uploads/i.test(rawImg)) {
      var file = rawImg.match(/\/([^\/?#]+\.(jpe?g|png|webp|gif))$/i);
      if (file) rawImg = "img/products/" + file[1];
    }
    return rawImg ? rawImg.replace(/^(\/\/|\/)/, "") : "img/placeholder.jpg";
  }

  function normalizeProduct(raw) {
    var prod = raw || {};
    var sku = extractSku(prod);
    return {
      id: prod.id,
      slug: prod.slug || "",
      name: prod.name || "Repuesto",
      description: prod.description || "",
      sku: sku,
      brand_slug: prod.brand_slug || "",
      brand_name: prod.brand_name || "",
      stock_status: prod.stock_status || "on_request",
      image_url: normalizeImage(prod.imagen_url || prod.image_url || prod.image),
      compat: extractCompat(prod),
      tipo_insumo: classifyTipo(prod),
      equipos: classifyEquipo(prod),
      search_blob: (
        (prod.name || "") +
        " " +
        (prod.slug || "") +
        " " +
        (prod.description || "") +
        " " +
        sku +
        " " +
        (prod.brand_name || "")
      ).toLowerCase(),
    };
  }

  var state = {
    q: "",
    brand: "",
    tipo: "",
    equipo: "",
    items: [],
  };

  function cardHtml(p) {
    var rawImg = p.imagen_url || p.image_url || "";
    var finalSrc = rawImg
      ? String(rawImg).replace(/^(\/\/|\/)/, "")
      : "img/placeholder.jpg";
    var onerror =
      "this.onerror=null;this.src='img/placeholder.jpg';";
    return (
      '<article class="product-card catalog-card repuesto-card reveal" data-id="' +
      escapeAttr(p.id) +
      '">' +
      '<a class="product-card__media product-card-visual" href="producto.html?slug=' +
      encodeURIComponent(p.slug) +
      '" title="' +
      escapeAttr(p.name) +
      '">' +
      '<span class="badge-type badge-type--repuesto">REPUESTO</span>' +
      '<img src="' +
      escapeAttr(finalSrc) +
      '" alt="' +
      escapeAttr(p.nombre || p.name) +
      '" class="img-fluid" loading="lazy" decoding="async" width="480" height="480" onerror="' +
      onerror +
      '">' +
      "</a>" +
      '<div class="product-card-body">' +
      "<h3><a href=\"producto.html?slug=" +
      encodeURIComponent(p.slug) +
      '">' +
      escapeHtml(p.name) +
      "</a></h3>" +
      '<p class="product-sku"><span class="product-sku__label">SKU / Cod:</span> ' +
      escapeHtml(p.sku) +
      "</p>" +
      '<p class="repuesto-compat"><span class="repuesto-compat__label">Compatible con:</span> ' +
      escapeHtml(p.compat) +
      "</p>" +
      '<p class="repuesto-stock ' +
      stockClass(p.stock_status) +
      '">' +
      escapeHtml(stockLabel(p.stock_status)) +
      "</p>" +
      '<div class="product-card-actions">' +
      '<button type="button" class="btn btn-primary" data-cotizar-repuesto="' +
      escapeAttr(p.id) +
      '">Cotizar Repuesto</button>' +
      "</div></div></article>"
    );
  }

  function filtered() {
    return state.items.filter(function (p) {
      if (state.brand && p.brand_slug !== state.brand) return false;
      if (state.tipo && p.tipo_insumo !== state.tipo) return false;
      if (state.equipo && p.equipos.indexOf(state.equipo) === -1) return false;
      if (state.q) {
        var q = state.q.toLowerCase();
        if (p.search_blob.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function fillFilters() {
    var brandSel = $("repuestoBrandFilter");
    var tipoSel = $("repuestoTipoFilter");
    var equipoSel = $("repuestoEquipoFilter");
    var brands = {};
    var tiposUsed = {};
    var equiposUsed = {};
    state.items.forEach(function (p) {
      if (p.brand_slug) brands[p.brand_slug] = p.brand_name || p.brand_slug;
      tiposUsed[p.tipo_insumo] = true;
      (p.equipos || []).forEach(function (e) {
        equiposUsed[e] = true;
      });
    });
    if (brandSel) {
      brandSel.innerHTML =
        '<option value="">Todas las marcas</option>' +
        Object.keys(brands)
          .sort()
          .map(function (slug) {
            return (
              '<option value="' +
              escapeAttr(slug) +
              '"' +
              (state.brand === slug ? " selected" : "") +
              ">" +
              escapeHtml(brands[slug]) +
              "</option>"
            );
          })
          .join("");
    }
    if (tipoSel) {
      tipoSel.innerHTML =
        '<option value="">Todos los tipos</option>' +
        TIPO_INSUMO.filter(function (t) {
          return tiposUsed[t.id];
        })
          .map(function (t) {
            return (
              '<option value="' +
              escapeAttr(t.id) +
              '"' +
              (state.tipo === t.id ? " selected" : "") +
              ">" +
              escapeHtml(t.label) +
              "</option>"
            );
          })
          .join("");
    }
    if (equipoSel) {
      equipoSel.innerHTML =
        '<option value="">Todos los equipos</option>' +
        EQUIPO_OPTS.filter(function (e) {
          return equiposUsed[e.id];
        })
          .map(function (e) {
            return (
              '<option value="' +
              escapeAttr(e.id) +
              '"' +
              (state.equipo === e.id ? " selected" : "") +
              ">" +
              escapeHtml(e.label) +
              "</option>"
            );
          })
          .join("");
    }
  }

  function render() {
    var grid = $("repuestoGrid");
    var count = $("repuestoCount");
    var loader = $("repuestoLoader");
    if (loader) loader.hidden = true;
    if (!grid) return;
    var list = filtered();
    if (count) {
      count.hidden = false;
      count.textContent =
        list.length + (list.length === 1 ? " repuesto" : " repuestos");
    }
    grid.setAttribute("aria-busy", "false");
    if (!list.length) {
      grid.innerHTML =
        '<div class="empty-state"><p>No encontramos repuestos con esos criterios.</p>' +
        '<p class="empty-actions"><button type="button" class="btn btn-outline btn-sm" id="clearRepuestoFilters">Limpiar filtros</button>' +
        '<a class="btn btn-primary btn-sm" href="https://wa.me/56968232745?text=Hola%2C%20necesito%20cotizar%20un%20repuesto..." target="_blank" rel="noopener">Consultar por WhatsApp</a></p></div>';
      var clearBtn = $("clearRepuestoFilters");
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          state.q = "";
          state.brand = "";
          state.tipo = "";
          state.equipo = "";
          var input = $("repuestoSearchInput");
          if (input) input.value = "";
          fillFilters();
          render();
        });
      }
      return;
    }
    grid.innerHTML = list.map(cardHtml).join("");
    if (window.Lpaez && typeof Lpaez.observeReveals === "function") {
      Lpaez.observeReveals();
    }
  }

  function cotizarRepuesto(id) {
    var prod = null;
    for (var i = 0; i < state.items.length; i++) {
      if (String(state.items[i].id) === String(id)) {
        prod = state.items[i];
        break;
      }
    }
    if (!prod) {
      window.location.href = "contacto.html";
      return;
    }
    var msg =
      "Necesito cotizar el repuesto: " +
      prod.name +
      " (SKU/Cod: " +
      prod.sku +
      ").";
    var url =
      "contacto.html?name=&empresa=&message=" +
      encodeURIComponent(msg) +
      "&quote=" +
      encodeURIComponent(prod.id) +
      "&sku=" +
      encodeURIComponent(prod.slug || prod.sku);
    window.location.href = url;
  }

  window.cotizarRepuesto = cotizarRepuesto;

  function loadRepuestos() {
    var loader = $("repuestoLoader");
    var grid = $("repuestoGrid");
    if (loader) loader.hidden = false;
    if (grid) grid.setAttribute("aria-busy", "true");

    var url = API_URL + "?tipo=repuesto";
    if (state.q) url += "&q=" + encodeURIComponent(state.q);
    if (state.brand) url += "&brand=" + encodeURIComponent(state.brand);

    return fetch(url, { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var rows = Array.isArray(data)
          ? data
          : data && Array.isArray(data.products)
            ? data.products
            : data && Array.isArray(data.items)
              ? data.items
              : [];
        // Defensa: solo tipo=repuesto
        rows = rows.filter(function (p) {
          return !p.tipo || p.tipo === "repuesto";
        });
        state.items = rows.map(normalizeProduct);
        fillFilters();
        render();
      })
      .catch(function (err) {
        console.warn("[REPUESTOS]", err);
        if (loader) loader.hidden = true;
        if (grid) {
          grid.setAttribute("aria-busy", "false");
          grid.innerHTML =
            '<div class="empty-state"><p>No pudimos cargar el catálogo de repuestos.</p>' +
            '<p class="empty-actions"><a class="btn btn-primary btn-sm" href="catalogo.html?tipo=repuesto">Ver en catálogo</a></p></div>';
        }
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      var params = new URLSearchParams(window.location.search);
      state.q = params.get("q") || params.get("search") || "";
      state.brand = params.get("brand") || params.get("marca") || "";
      state.tipo = params.get("tipo_insumo") || "";
      state.equipo = params.get("equipo") || "";
      var input = $("repuestoSearchInput");
      if (input && state.q) input.value = state.q;
    } catch (_) {
      /* ignore */
    }

    var form = $("repuestoSearchForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = $("repuestoSearchInput");
        state.q = (input && input.value.trim()) || "";
        loadRepuestos();
      });
    }

    ["repuestoBrandFilter", "repuestoTipoFilter", "repuestoEquipoFilter"].forEach(
      function (id) {
        var el = $(id);
        if (!el) return;
        el.addEventListener("change", function () {
          if (id === "repuestoBrandFilter") {
            state.brand = el.value || "";
            loadRepuestos();
            return;
          }
          if (id === "repuestoTipoFilter") state.tipo = el.value || "";
          if (id === "repuestoEquipoFilter") state.equipo = el.value || "";
          render();
        });
      }
    );

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cotizar-repuesto]");
      if (!btn) return;
      e.preventDefault();
      cotizarRepuesto(btn.getAttribute("data-cotizar-repuesto"));
    });

    loadRepuestos();
  });
})();
