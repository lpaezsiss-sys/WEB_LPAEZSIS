(function () {
  "use strict";

  var API = "/api/admin";
  var TOKEN_KEY = "lpaezsis_admin_token";
  var categoriesCache = [];
  var brandsCache = [];
  var industriasCache = [];
  var productsCache = [];
  var selectedCategoryId = null;
  var productListTipo = "equipo"; // equipo | repuesto

  var loginView = document.getElementById("loginView");
  var appView = document.getElementById("appView");
  var toast = document.getElementById("toast");

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isActiveFlag(value) {
    if (value === false || value === 0 || value === "0" || value === "false" || value === null) {
      return false;
    }
    if (value === true || value === 1 || value === "1") {
      return true;
    }
    if (value === undefined || value === "") {
      return true;
    }
    return Boolean(Number(value));
  }

  function coerceBool(value, defaultValue) {
    if (value === false || value === 0 || value === "0" || value === "false" || value === null) {
      return false;
    }
    if (value === true || value === 1 || value === "1") {
      return true;
    }
    if (value === undefined || value === "") {
      return !!defaultValue;
    }
    return Boolean(Number(value));
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }
  function setToken(token) {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function showToast(msg) {
    toast.hidden = false;
    toast.textContent = msg;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.hidden = true;
    }, 2800);
  }

  function api(path, options) {
    var opts = options || {};
    var headers = Object.assign({}, opts.headers || {});
    var body = undefined;
    if (opts.formData) {
      body = opts.formData;
    } else {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      body = opts.body ? JSON.stringify(opts.body) : undefined;
    }
    if (path !== "/login") {
      var token = getToken();
      if (token) headers.Authorization = "Bearer " + token;
    }
    return fetch(API + path, {
      method: opts.method || "GET",
      headers: headers,
      body: body,
    }).then(function (res) {
      return res.json().then(function (data) {
        if (res.status === 401 && path !== "/login") {
          setToken(null);
          showLogin();
        }
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  }

  function showLogin() {
    loginView.hidden = false;
    appView.hidden = true;
  }

  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
    showTab("equipos");
  }

  function showTab(tab) {
    document.querySelectorAll(".app-tab").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tab") === tab);
    });
    ["equipos", "repuestos", "brands", "clientes", "soluciones", "sectores", "banners", "orders", "quotes", "contacts", "settings"].forEach(function (name) {
      var view = document.getElementById(name + "View");
      if (view) view.hidden = name !== tab;
    });
    if (tab === "equipos") {
      productListTipo = "equipo";
      loadProducts();
    }
    if (tab === "repuestos") {
      productListTipo = "repuesto";
      loadProducts();
    }
    if (tab === "brands") loadBrands();
    if (tab === "clientes") loadClientes();
    if (tab === "soluciones") loadSoluciones();
    if (tab === "sectores") loadSectores();
    if (tab === "banners") loadBanners();
    if (tab === "orders") loadOrders();
    if (tab === "quotes") loadQuotes();
    if (tab === "contacts") loadContacts();
    if (tab === "settings") loadSettings();
  }

  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("loginError");
    api("/login", { method: "POST", body: { password: document.getElementById("password").value } }).then(function (res) {
      if (!res.ok) {
        err.hidden = false;
        err.textContent = (res.data && res.data.error) || "Error";
        return;
      }
      setToken(res.data.token);
      showApp();
    });
  });

  document.getElementById("logoutBtn").addEventListener("click", function () {
    setToken(null);
    showLogin();
  });

  document.getElementById("appTabs").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-tab]");
    if (btn) showTab(btn.getAttribute("data-tab"));
  });

  function stockLabel(status) {
    if (status === "in_stock") return "En stock";
    if (status === "out_of_stock") return "Agotado";
    if (status === "discontinued") return "Descontinuado";
    return "Bajo pedido";
  }

  function productTipoOf(p) {
    if (p && (p.tipo === "repuesto" || p.tipo === "equipo")) return p.tipo;
    return p && p.sale_mode === "buy" ? "repuesto" : "equipo";
  }

  function productsOfCurrentTipo() {
    return productsCache.filter(function (p) {
      return productTipoOf(p) === productListTipo;
    });
  }

  function countProductsInCategory(catId) {
    return productsOfCurrentTipo().filter(function (p) {
      return String(p.category_id) === String(catId);
    }).length;
  }

  function selectedCategory() {
    if (selectedCategoryId == null) return null;
    return (
      categoriesCache.find(function (c) {
        return String(c.id) === String(selectedCategoryId);
      }) || null
    );
  }

  function renderCatSidebar() {
    var listId = productListTipo === "repuesto" ? "catSidebarListRepuestos" : "catSidebarList";
    var list = document.getElementById(listId);
    if (!list) return;
    var scoped = productsOfCurrentTipo();
    var allCount = scoped.length;
    var label = productListTipo === "repuesto" ? "repuestos" : "equipos";
    var html =
      '<button type="button" class="cat-item' +
      (selectedCategoryId == null ? " is-active" : "") +
      '" data-cat-id="">' +
      '<span class="cat-item__name">Todas</span>' +
      '<span class="cat-item__count">' +
      allCount +
      " " +
      label +
      "</span></button>";
    html += categoriesCache
      .map(function (c) {
        var n = countProductsInCategory(c.id);
        return (
          '<button type="button" class="cat-item' +
          (String(selectedCategoryId) === String(c.id) ? " is-active" : "") +
          '" data-cat-id="' +
          escapeAttr(c.id) +
          '">' +
          '<span class="cat-item__name">' +
          escapeHtml(c.name) +
          "</span>" +
          '<span class="cat-item__count">' +
          n +
          " " +
          (n === 1 ? label.replace(/s$/, "") : label) +
          "</span></button>"
        );
      })
      .join("");
    list.innerHTML = html;
  }

  function renderCatalogHead() {
    var isRep = productListTipo === "repuesto";
    var title = document.getElementById(isRep ? "catalogTitleRepuestos" : "catalogTitle");
    var meta = document.getElementById(isRep ? "catalogMetaRepuestos" : "catalogMeta");
    var editBtn = document.getElementById("editCategoryBtn");
    if (!title || !meta) return;
    var cat = selectedCategory();
    var scoped = productsOfCurrentTipo();
    var noun = isRep ? "repuestos" : "equipos";
    if (cat) {
      title.textContent = cat.name;
      meta.textContent =
        "Slug: " +
        (cat.slug || "—") +
        " · " +
        countProductsInCategory(cat.id) +
        " " +
        noun;
      if (editBtn) editBtn.hidden = isRep;
    } else {
      title.textContent = isRep ? "Todos los repuestos" : "Todos los equipos";
      meta.textContent = scoped.length + " " + noun + " en catálogo";
      if (editBtn) editBtn.hidden = true;
    }
  }

  function renderProductRows() {
    var list = document.getElementById(
      productListTipo === "repuesto" ? "repuestosList" : "productsList"
    );
    if (!list) return;
    var rows = productsOfCurrentTipo().filter(function (p) {
      if (selectedCategoryId == null) return true;
      return String(p.category_id) === String(selectedCategoryId);
    });
    if (!rows.length) {
      list.innerHTML =
        '<p class="empty-hint">No hay ' +
        (productListTipo === "repuesto" ? "repuestos" : "equipos") +
        " en esta categoría.</p>";
      return;
    }
    list.innerHTML = rows
      .map(function (p) {
        var src = resolveProductImage(p);
        var thumb =
          '<img class="product-row__thumb" src="' +
          escapeAttr(src) +
          '" alt="" width="88" height="88" loading="lazy" data-pick-image="' +
          escapeAttr(p.id) +
          '" title="Cambiar imagen" onerror="this.onerror=null;this.src=\'' +
          escapeAttr(PRODUCT_FALLBACKS[0]) +
          '\'">';
        var desc = (p.description || "").trim();
        var price =
          p.price_clp != null ? "$" + Number(p.price_clp).toLocaleString("es-CL") : "Sin precio";
        return (
          '<article class="product-row">' +
          thumb +
          '<div class="product-row__info">' +
          "<h3>" +
          escapeHtml(p.name) +
          "</h3>" +
          (desc
            ? '<p class="product-row__desc">' + escapeHtml(desc) + "</p>"
            : "") +
          '<div class="product-row__chips">' +
          '<span class="chip">' +
          escapeHtml(price) +
          "</span>" +
          '<span class="chip ' +
          (p.sale_mode === "buy" ? "chip-buy" : "chip-quote") +
          '">' +
          escapeHtml(p.sale_mode === "buy" ? "Comprar" : "Cotizar") +
          "</span>" +
          '<span class="chip ' +
          (p.is_active ? "chip-on" : "chip-off") +
          '">' +
          (p.is_active ? "Visible" : "Oculto") +
          "</span>" +
          '<span class="chip">' +
          escapeHtml(stockLabel(p.stock_status)) +
          "</span></div></div>" +
          '<div class="product-row__actions">' +
          '<button type="button" class="ghost" data-toggle-active="' +
          escapeAttr(p.id) +
          '">' +
          (p.is_active ? "Ocultar" : "Mostrar") +
          "</button>" +
          '<button type="button" class="ghost" data-toggle-stock="' +
          escapeAttr(p.id) +
          '">' +
          (p.stock_status === "in_stock" ? "Sin stock" : "En stock") +
          "</button>" +
          '<button type="button" data-edit-product="' +
          escapeAttr(p.id) +
          '">Editar</button>' +
          '<button type="button" class="danger" data-del-product="' +
          escapeAttr(p.id) +
          '">Eliminar</button></div></article>'
        );
      })
      .join("");
  }

  function loadProducts() {
    return Promise.all([api("/categories"), api("/brands"), api("/industrias"), api("/products")]).then(function (results) {
      categoriesCache = (results[0].data && results[0].data.categories) || [];
      brandsCache = (results[1].data && results[1].data.brands) || [];
      industriasCache = (results[2].data && results[2].data.industrias) || [];
      productsCache = (results[3].data && results[3].data.products) || [];
      fillSelectsFromCache();
      if (
        selectedCategoryId != null &&
        !categoriesCache.some(function (c) {
          return String(c.id) === String(selectedCategoryId);
        })
      ) {
        selectedCategoryId = null;
      }
      renderCatSidebar();
      renderCatalogHead();
      renderProductRows();
    });
  }

  function fillSelectsFromCache() {
    var catSel = document.getElementById("productCategory");
    var brandSel = document.getElementById("productBrand");
    var indSel = document.getElementById("productoIndustria");
    if (!catSel || !brandSel) return;
    catSel.innerHTML = categoriesCache
      .map(function (c) {
        return '<option value="' + escapeAttr(c.id) + '">' + escapeHtml(c.name) + "</option>";
      })
      .join("");
    brandSel.innerHTML =
      '<option value="">—</option>' +
      brandsCache
        .map(function (b) {
          return '<option value="' + escapeAttr(b.id) + '">' + escapeHtml(b.name) + "</option>";
        })
        .join("");
    if (indSel) {
      indSel.innerHTML =
        '<option value="">-- Seleccionar Industria --</option>' +
        industriasCache
          .map(function (i) {
            return (
              '<option value="' +
              escapeAttr(i.id) +
              '">' +
              escapeHtml(i.nombre || i.name || i.slug) +
              "</option>"
            );
          })
          .join("");
    }
  }

  function fillSelects() {
    return Promise.all([api("/categories"), api("/brands"), api("/industrias")]).then(function (results) {
      categoriesCache = (results[0].data && results[0].data.categories) || [];
      brandsCache = (results[1].data && results[1].data.brands) || [];
      industriasCache = (results[2].data && results[2].data.industrias) || [];
      fillSelectsFromCache();
    });
  }

  var PRODUCT_IMAGES = {
    "secador-botellas-sonic": "/img/hero/cans.jpg",
    "turbina-soplado-sonic-100": "/img/products/vt-sonic.jpg",
    "correa-sonic-70-85": "/img/products/A07-10015.jpg",
    "filtro-poliester-s-75-85-100": "/img/products/A07-10976.jpg",
  };

  var PRODUCT_FALLBACKS = [
    "/img/products/A07-10015.jpg",
    "/img/products/A07-10976.jpg",
    "/img/products/A07-13474.jpg",
    "/img/products/A07-10317.jpg",
    "/img/products/A07-14452.jpg",
    "/img/products/A07-13455.png",
    "/img/products/vt-sonic.jpg",
    "/img/products/sonic-comp.png",
  ];

  function toSitePath(url) {
    if (!url) return "";
    url = String(url).trim();
    if (!url) return "";
    // Prefer local copies of legacy WP uploads when filename matches.
    var wp = url.match(/\/wp-content\/uploads\/[^?\s]*\/([^\/?#]+\.(jpe?g|png|webp|gif))$/i);
    if (wp) return "/img/products/" + wp[1];
    if (/^https?:\/\//i.test(url)) return url;
    if (url.charAt(0) === "/") return url;
    return "/" + url.replace(/^\.\//, "");
  }

  function resolveProductImage(p) {
    if (!p) return PRODUCT_FALLBACKS[0];
    if (p.image_url) return toSitePath(p.image_url);
    if (PRODUCT_IMAGES[p.slug]) return PRODUCT_IMAGES[p.slug];
    var idx = Math.abs(Number(p.id) || 0) % PRODUCT_FALLBACKS.length;
    return PRODUCT_FALLBACKS[idx];
  }

  function onCatSidebarClick(e) {
    var btn = e.target.closest("[data-cat-id]");
    if (!btn) return;
    var id = btn.getAttribute("data-cat-id");
    selectedCategoryId = id === "" ? null : id;
    renderCatSidebar();
    renderCatalogHead();
    renderProductRows();
  }
  document.getElementById("catSidebarList").addEventListener("click", onCatSidebarClick);
  var catSidebarRepuestos = document.getElementById("catSidebarListRepuestos");
  if (catSidebarRepuestos) catSidebarRepuestos.addEventListener("click", onCatSidebarClick);

  document.getElementById("editCategoryBtn").addEventListener("click", function () {
    var cat = selectedCategory();
    if (cat) openSimpleDialog("categories", cat);
  });

  function onProductListClick(e) {
    var pick = e.target.getAttribute("data-pick-image");
    var edit = e.target.getAttribute("data-edit-product");
    var del = e.target.getAttribute("data-del-product");
    var toggleActive = e.target.getAttribute("data-toggle-active");
    var toggleStock = e.target.getAttribute("data-toggle-stock");
    if (pick) {
      var pImg = productsCache.find(function (p) {
        return String(p.id) === String(pick);
      });
      openImagePicker({
        productId: pick,
        currentUrl: pImg ? resolveProductImage(pImg) : "",
        onApply: function (url) {
          return api("/products/" + pick, { method: "PUT", body: { image_url: url } }).then(function (res) {
            if (!res.ok) {
              showToast((res.data && res.data.error) || "No se pudo guardar la imagen");
              return Promise.reject();
            }
            showToast("Imagen actualizada");
            return loadProducts();
          });
        },
      });
      return;
    }
    if (edit) {
      api("/products/" + edit).then(function (res) {
        if (!res.ok) return;
        openProductDialog(res.data);
      });
      return;
    }
    if (del && confirm(productListTipo === "repuesto" ? "¿Eliminar repuesto?" : "¿Eliminar equipo?")) {
      api("/products/" + del, { method: "DELETE" }).then(function () {
        showToast(productListTipo === "repuesto" ? "Repuesto eliminado" : "Equipo eliminado");
        loadProducts();
      });
      return;
    }
    if (toggleActive) {
      var pActive = productsCache.find(function (p) {
        return String(p.id) === String(toggleActive);
      });
      if (!pActive) return;
      api("/products/" + toggleActive, {
        method: "PUT",
        body: { is_active: !pActive.is_active },
      }).then(function (res) {
        if (!res.ok) {
          showToast((res.data && res.data.error) || "Error");
          return;
        }
        showToast(pActive.is_active ? "Ítem oculto" : "Ítem visible");
        loadProducts();
      });
      return;
    }
    if (toggleStock) {
      var pStock = productsCache.find(function (p) {
        return String(p.id) === String(toggleStock);
      });
      if (!pStock) return;
      var nextStock = pStock.stock_status === "in_stock" ? "out_of_stock" : "in_stock";
      api("/products/" + toggleStock, {
        method: "PUT",
        body: { stock_status: nextStock },
      }).then(function (res) {
        if (!res.ok) {
          showToast((res.data && res.data.error) || "Error");
          return;
        }
        showToast("Stock actualizado");
        loadProducts();
      });
    }
  }
  document.getElementById("productsList").addEventListener("click", onProductListClick);
  var repuestosListEl = document.getElementById("repuestosList");
  if (repuestosListEl) repuestosListEl.addEventListener("click", onProductListClick);

  function setFormImagePreview(url) {
    var img = document.getElementById("productImagePreview");
    var hint = document.getElementById("productImageHint");
    var field = document.getElementById("productImageUrl");
    field.value = url || "";
    if (url) {
      img.hidden = false;
      img.src = toSitePath(url) || url;
      hint.hidden = true;
    } else {
      img.hidden = true;
      img.removeAttribute("src");
      hint.hidden = false;
    }
  }

  function setDialogImagePreview(url) {
    var img = document.getElementById("imageDialogPreview");
    var hint = document.getElementById("imageDialogHint");
    if (url) {
      img.hidden = false;
      img.src = toSitePath(url) || url;
      hint.hidden = true;
    } else {
      img.hidden = true;
      img.removeAttribute("src");
      hint.hidden = false;
    }
  }

  var imagePickerContext = null;
  var videoPickerContext = null;

  function openImagePicker(ctx) {
    imagePickerContext = ctx || {};
    var err = document.getElementById("imageError");
    err.hidden = true;
    err.textContent = "";
    document.getElementById("imageTargetProductId").value = imagePickerContext.productId || "";
    document.getElementById("imageFileInput").value = "";
    document.getElementById("imageUrlField").value = imagePickerContext.currentUrl || "";
    setDialogImagePreview(imagePickerContext.currentUrl || "");
    document.getElementById("imageDialog").showModal();
  }

  function normalizeVideoUrl(url) {
    var u = String(url || "").trim();
    if (!u) return u;
    if (/^https?:\/\//i.test(u) || u.indexOf("//") === 0) return u;
    // Rutas relativas sin "/" se resolverían bajo <base href="/admin/"> → forzar raíz del sitio
    if (u.charAt(0) !== "/") {
      u = "/" + u.replace(/^\.\//, "");
    }
    return u;
  }

  function toVideoEmbedUrl(raw) {
    var url = normalizeVideoUrl(String(raw || "").trim());
    if (!url) return null;
    var yt =
      url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i) ||
      url.match(/[?&]v=([A-Za-z0-9_-]{6,})/i);
    if (yt) {
      return { type: "embed", src: "https://www.youtube.com/embed/" + yt[1] };
    }
    var vim = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vim) {
      return { type: "embed", src: "https://player.vimeo.com/video/" + vim[1] };
    }
    if (/\.(mp4|webm)(\?|#|$)/i.test(url) || /\/img\/uploads\//i.test(url)) {
      return { type: "file", src: url };
    }
    if (/^https?:\/\//i.test(url) || url.charAt(0) === "/") {
      return { type: "file", src: url };
    }
    return null;
  }

  function setVideoApplyLoading(loading) {
    var btn = document.getElementById("videoApply");
    if (!btn) return;
    if (!btn.dataset.label) btn.dataset.label = btn.textContent || "Insertar video";
    btn.disabled = !!loading;
    btn.setAttribute("aria-busy", loading ? "true" : "false");
    btn.textContent = loading ? "Insertando…" : btn.dataset.label;
  }

  function closeVideoModal() {
    setVideoApplyLoading(false);
    var dlg = document.getElementById("videoDialog");
    if (dlg && typeof dlg.close === "function") {
      try {
        if (dlg.open) dlg.close();
      } catch (closeErr) {
        console.error("[VIDEO ERROR]", closeErr);
      }
    }
  }

  function openVideoPicker(ctx) {
    var quill = ctx && ctx.quill;
    var savedIndex = 0;
    if (quill) {
      try {
        var sel = quill.getSelection(true);
        savedIndex = sel && typeof sel.index === "number" ? sel.index : quill.getLength();
      } catch (e) {
        savedIndex = quill.getLength();
      }
    }
    videoPickerContext = {
      quill: quill,
      index: savedIndex,
    };
    var err = document.getElementById("videoError");
    err.hidden = true;
    err.textContent = "";
    document.getElementById("videoFileInput").value = "";
    document.getElementById("videoUrlField").value = (ctx && ctx.currentUrl) || "";
    setVideoApplyLoading(false);
    document.getElementById("videoDialog").showModal();
  }

  /**
   * Whitelist <video> en Quill vía BlockEmbed (evita que el sanitizer borre el HTML).
   * Debe ejecutarse ANTES de `new Quill(...)`.
   */
  function registerHTML5VideoBlot() {
    if (typeof Quill === "undefined" || Quill.__lpaezHtml5Video) return;
    var BlockEmbed = Quill.import("blots/block/embed");

    class HTML5Video extends BlockEmbed {
      static create(value) {
        var node = super.create();
        var src = normalizeVideoUrl(typeof value === "string" ? value : (value && value.src) || "");
        node.setAttribute("controls", "true");
        node.setAttribute("controlslist", "nodownload");
        node.setAttribute("width", "100%");
        node.setAttribute("preload", "metadata");
        node.setAttribute("src", src);
        node.setAttribute("playsinline", "true");
        node.style.maxWidth = "100%";
        node.style.height = "auto";
        node.style.display = "block";
        node.style.margin = "10px 0";
        return node;
      }

      static value(node) {
        return node.getAttribute("src") || "";
      }
    }

    HTML5Video.blotName = "html5video";
    HTML5Video.tagName = "video";
    HTML5Video.className = "ql-html5video";
    Quill.register(HTML5Video, true);
    Quill.__lpaezHtml5Video = true;
    console.log("[VIDEO] HTML5Video blot registered");
  }

  function insertVideoIntoQuill(activeQuillInstance, parsed) {
    if (!activeQuillInstance) {
      throw new Error("Editor Quill activo no disponible");
    }
    if (!parsed || !parsed.src) {
      throw new Error("URL de video vacía");
    }
    registerHTML5VideoBlot();

    var url = normalizeVideoUrl(String(parsed.src));
    var index =
      videoPickerContext && typeof videoPickerContext.index === "number"
        ? videoPickerContext.index
        : null;
    if (index == null) {
      try {
        var range = activeQuillInstance.getSelection(true);
        index = range && typeof range.index === "number" ? range.index : activeQuillInstance.getLength();
      } catch (e) {
        index = activeQuillInstance.getLength();
      }
    }

    var mime = /\.webm(\?|#|$)/i.test(url) ? "video/webm" : "video/mp4";
    var videoHtml =
      '<p><video class="ql-html5video" controls width="100%" style="max-width:100%; height:auto;" src="' +
      escapeAttr(url) +
      '"><source src="' +
      escapeAttr(url) +
      '" type="' +
      mime +
      '"></video></p>';
    console.log("HTML inyectado:", videoHtml);

    // Cerrar modal y devolver foco al editor ANTES de insertar (evita rangos inválidos
    // con <dialog> anidados — síntoma: addRange() / video no visible).
    closeVideoModal();
    try {
      activeQuillInstance.focus();
    } catch (focusErr) {
      console.error("[VIDEO ERROR]", focusErr);
    }

    if (parsed.type === "embed") {
      activeQuillInstance.insertEmbed(index, "video", url, "user");
    } else {
      try {
        activeQuillInstance.insertEmbed(index, "html5video", url, "user");
      } catch (embedErr) {
        console.error("[VIDEO ERROR]", embedErr);
        // Fallback: pegar HTML con matcher de VIDEO → html5video
        activeQuillInstance.clipboard.dangerouslyPasteHTML(index, videoHtml, "user");
      }
    }

    if (typeof activeQuillInstance.update === "function") {
      activeQuillInstance.update("user");
    }

    var videos = activeQuillInstance.root.querySelectorAll("video");
    console.log("[VIDEO] videos en editor tras insert:", videos.length, activeQuillInstance.root.innerHTML.slice(0, 500));
    if (parsed.type !== "embed" && !videos.length) {
      // Último recurso: inyectar en el DOM del editor (se serializa vía root.innerHTML al guardar)
      activeQuillInstance.root.insertAdjacentHTML("beforeend", videoHtml);
      videos = activeQuillInstance.root.querySelectorAll("video");
      console.log("[VIDEO] fallback DOM videos:", videos.length);
    }
    if (parsed.type !== "embed" && !videos.length) {
      throw new Error("El video no se pudo mostrar en el editor");
    }

    try {
      activeQuillInstance.setSelection(
        Math.min(index + 1, activeQuillInstance.getLength()),
        0,
        "silent"
      );
    } catch (selErr) {
      /* ignore invalid selection after nested dialogs */
    }
  }

  // Registrar blot lo antes posible (Quill ya está cargado en esta página).
  if (typeof Quill !== "undefined") {
    registerHTML5VideoBlot();
  }

  function openProductDialog(product) {
    var form = document.getElementById("productForm");
    form.reset();
    form.id.value = product && product.id ? product.id : "";
    if (product) {
      form.name.value = product.name || "";
      form.slug.value = product.slug || "";
      form.category_id.value = product.category_id || "";
      form.brand_id.value = product.brand_id || "";
      if (form.industria_id) {
        form.industria_id.value = product.industria_id || "";
      }
      form.sale_mode.value = product.sale_mode || (productListTipo === "repuesto" ? "buy" : "quote");
      form.tipo.value = product.tipo || productListTipo;
      form.stock_status.value = product.stock_status || "on_request";
      form.price_clp.value = product.price_clp != null ? product.price_clp : "";
      form.description.value = product.description || "";
      if (product.image_url) {
        setFormImagePreview(product.image_url);
      } else {
        setFormImagePreview(resolveProductImage(product));
        document.getElementById("productImageUrl").value = "";
      }
      form.seo_title.value = product.seo_title || "";
      form.seo_description.value = product.seo_description || "";
      form.is_featured.checked = coerceBool(product.is_featured, false);
      form.is_active.checked = coerceBool(product.is_active, true);
    } else {
      form.is_active.checked = true;
      form.tipo.value = productListTipo;
      form.sale_mode.value = productListTipo === "repuesto" ? "buy" : "quote";
      if (form.industria_id) form.industria_id.value = "";
      setFormImagePreview("");
    }
    document.getElementById("productDialogTitle").textContent = product
      ? productListTipo === "repuesto"
        ? "Editar repuesto"
        : "Editar equipo"
      : productListTipo === "repuesto"
        ? "Nuevo repuesto"
        : "Nuevo equipo";
    document.getElementById("productDialog").showModal();
  }

  document.getElementById("productImagePick").addEventListener("click", function () {
    openImagePicker({
      currentUrl: document.getElementById("productImageUrl").value || document.getElementById("productImagePreview").src || "",
      onApply: function (url) {
        setFormImagePreview(url);
        return Promise.resolve();
      },
    });
  });

  document.getElementById("imageCancel").addEventListener("click", function () {
    document.getElementById("imageDialog").close();
  });

  document.getElementById("imageFileInput").addEventListener("change", function () {
    var file = this.files && this.files[0];
    var err = document.getElementById("imageError");
    err.hidden = true;
    if (!file) return;
    var fd = new FormData();
    fd.append("file", file);
    api("/upload", { method: "POST", formData: fd }).then(function (res) {
      if (!res.ok) {
        err.hidden = false;
        err.textContent = (res.data && res.data.error) || "No se pudo subir la imagen";
        return;
      }
      var url = res.data && res.data.url;
      document.getElementById("imageUrlField").value = url || "";
      setDialogImagePreview(url || "");
      showToast("Imagen subida — pulsa «Usar imagen»");
      // If picker was opened to save logo directly, apply immediately.
      if (url && imagePickerContext && imagePickerContext.autoApply) {
        var apply = imagePickerContext.onApply;
        Promise.resolve(apply ? apply(url) : null).then(function () {
          document.getElementById("imageDialog").close();
        }).catch(function () {});
      }
    });
  });

  document.getElementById("imageUrlField").addEventListener("input", function () {
    setDialogImagePreview(this.value.trim());
  });

  document.getElementById("imageForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("imageError");
    err.hidden = true;
    var url = document.getElementById("imageUrlField").value.trim();
    if (!url) {
      err.hidden = false;
      err.textContent = "Elige un archivo o indica una URL";
      return;
    }
    var apply = imagePickerContext && imagePickerContext.onApply;
    Promise.resolve(apply ? apply(url) : null).then(function () {
      document.getElementById("imageDialog").close();
    }).catch(function () {
      /* toast already shown */
    });
  });

  document.getElementById("videoCancel").addEventListener("click", function () {
    closeVideoModal();
  });

  document.getElementById("videoFileInput").addEventListener("change", function () {
    var file = this.files && this.files[0];
    var err = document.getElementById("videoError");
    err.hidden = true;
    if (!file) return;
    // Si el campo URL ya tiene valor (p. ej. subida previa), no re-subir automáticamente
    // solo cuando el usuario elige un archivo nuevo.
    if (file.size > 50 * 1024 * 1024) {
      err.hidden = false;
      err.textContent = "El video supera 50 MB";
      return;
    }
    var fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "video");
    setVideoApplyLoading(true);
    showToast("Subiendo video…");
    api("/upload", { method: "POST", formData: fd })
      .then(function (res) {
        if (!res.ok) {
          err.hidden = false;
          err.textContent = (res.data && res.data.error) || "No se pudo subir el video";
          return;
        }
        var url = res.data && res.data.url;
        // Deja la URL lista (normalizada a ruta absoluta del sitio).
        document.getElementById("videoUrlField").value = normalizeVideoUrl(url || "");
        document.getElementById("videoFileInput").value = "";
        showToast("Video subido — pulsa «Insertar video»");
      })
      .catch(function (uploadErr) {
        console.error("[VIDEO ERROR]", uploadErr);
        err.hidden = false;
        err.textContent = "Error de red al subir el video";
      })
      .then(function () {
        setVideoApplyLoading(false);
      });
  });

  document.getElementById("videoForm").addEventListener("submit", function (e) {
    e.preventDefault();
    e.stopPropagation();
    var errEl = document.getElementById("videoError");
    errEl.hidden = true;
    errEl.textContent = "";
    setVideoApplyLoading(true);
    try {
      // URL del input (subida previa o enlace externo) — nunca re-subir aquí.
      var raw = document.getElementById("videoUrlField").value.trim();
      if (!raw) {
        throw new Error("Sube un archivo o indica una URL de YouTube/Vimeo");
      }
      var parsed = toVideoEmbedUrl(raw);
      if (!parsed || !parsed.src) {
        throw new Error("URL no válida. Usa YouTube, Vimeo, MP4/WEBM o /img/uploads/…");
      }
      var quill = videoPickerContext && videoPickerContext.quill;
      if (!quill) {
        throw new Error("Editor Quill activo no disponible");
      }
      // insertVideoIntoQuill cierra el modal antes de insertar (foco/selección).
      insertVideoIntoQuill(quill, parsed);
      showToast("Video insertado");
    } catch (err) {
      console.error("[VIDEO ERROR]", err);
      setVideoApplyLoading(false);
      errEl.hidden = false;
      errEl.textContent = (err && err.message) || "No se pudo insertar el video";
      showToast((err && err.message) || "Error al insertar video");
      // Si el modal ya se cerró en el intento de insert, reabrir no es necesario;
      // el toast informa el fallo.
    }
  });

  document.getElementById("videoDialog").addEventListener("cancel", function () {
    setVideoApplyLoading(false);
  });

  document.getElementById("addProductBtn").addEventListener("click", function () {
    fillSelects().then(function () {
      productListTipo = "equipo";
      openProductDialog(null);
      if (selectedCategoryId != null) {
        document.getElementById("productForm").category_id.value = selectedCategoryId;
      }
    });
  });
  var addRepuestoBtn = document.getElementById("addRepuestoBtn");
  if (addRepuestoBtn) {
    addRepuestoBtn.addEventListener("click", function () {
      fillSelects().then(function () {
        productListTipo = "repuesto";
        openProductDialog(null);
        if (selectedCategoryId != null) {
          document.getElementById("productForm").category_id.value = selectedCategoryId;
        }
      });
    });
  }
  document.getElementById("productCancel").addEventListener("click", function () {
    document.getElementById("productDialog").close();
  });

  document.getElementById("productForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var body = {
      name: form.name.value.trim(),
      slug: form.slug.value.trim() || undefined,
      category_id: Number(form.category_id.value),
      brand_id: form.brand_id.value ? Number(form.brand_id.value) : null,
      industria_id: form.industria_id && form.industria_id.value ? Number(form.industria_id.value) : null,
      sale_mode: form.sale_mode.value,
      tipo: form.tipo.value,
      stock_status: form.stock_status.value,
      price_clp: form.price_clp.value === "" ? null : Number(form.price_clp.value),
      description: form.description.value,
      image_url: form.image_url.value.trim(),
      seo_title: form.seo_title.value.trim(),
      seo_description: form.seo_description.value.trim(),
      is_featured: form.is_featured.checked,
      is_active: form.is_active.checked,
    };
    var id = form.id.value;
    var req = id
      ? api("/products/" + id, { method: "PUT", body: body })
      : api("/products", { method: "POST", body: body });
    req.then(function (res) {
      if (!res.ok) {
        showToast((res.data && res.data.error) || "Error");
        return;
      }
      document.getElementById("productDialog").close();
      showToast("Producto guardado");
      loadProducts();
    });
  });

  function loadBrands() {
    api("/brands").then(function (res) {
      var list = document.getElementById("brandsList");
      var items = (res.data && res.data.brands) || [];
      brandsCache = items;
      list.innerHTML = items
        .map(function (b) {
          var src = resolveBrandLogo(b);
          var desc = (b.description || "").trim();
          return (
            '<article class="brand-row">' +
            '<img class="brand-row__logo" src="' +
            escapeAttr(src) +
            '" alt="" width="88" height="88" loading="lazy" data-pick-brand-logo="' +
            escapeAttr(b.id) +
            '" title="Cambiar logo" onerror="this.onerror=null;this.src=\'' +
            escapeAttr("/img/brand/logo.png") +
            '\'">' +
            '<div class="brand-row__info">' +
            "<h3>" +
            escapeHtml(b.name) +
            "</h3>" +
            '<div class="meta"><span>' +
            escapeHtml(b.slug) +
            "</span>" +
            '<span class="chip ' +
            (isActiveFlag(b.is_active) ? "chip-on" : "chip-off") +
            '">' +
            (isActiveFlag(b.is_active) ? "Activa" : "Off") +
            "</span></div>" +
            (desc ? '<p class="product-row__desc">' + escapeHtml(desc) + "</p>" : "") +
            "</div>" +
            '<div class="brand-row__actions">' +
            '<button type="button" data-edit-brand="' +
            escapeAttr(b.id) +
            '">Editar</button>' +
            '<button type="button" class="danger" data-del-brand="' +
            escapeAttr(b.id) +
            '">Eliminar</button></div></article>'
          );
        })
        .join("") || '<p class="empty-hint">No hay marcas.</p>';
    });
  }

  var clientesCache = [];

  function setClienteLogoPreview(url) {
    var wrap = document.getElementById("clienteLogoPreviewWrap");
    var img = document.getElementById("clienteLogoPreview");
    var field = document.getElementById("clienteLogoUrl");
    if (field) field.value = url || "";
    if (url) {
      wrap.hidden = false;
      img.src = url;
    } else {
      wrap.hidden = true;
      img.removeAttribute("src");
    }
  }

  function resetClienteForm() {
    var form = document.getElementById("formCliente");
    if (!form) return;
    form.reset();
    document.getElementById("clienteId").value = "";
    document.getElementById("clienteOrden").value = "0";
    document.getElementById("clienteActivo").checked = true;
    document.getElementById("clienteLogo").value = "";
    setClienteLogoPreview("");
    var err = document.getElementById("clienteFormError");
    err.hidden = true;
    err.textContent = "";
    document.getElementById("clienteSaveBtn").textContent = "Guardar Cliente";
  }

  function loadClientes() {
    api("/clientes").then(function (res) {
      var tbody = document.getElementById("adminClientesList");
      if (!tbody) return;
      var items = (res.data && res.data.clientes) || [];
      clientesCache = items;
      if (!items.length) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="empty-hint">No hay clientes registrados.</td></tr>';
        return;
      }
      tbody.innerHTML = items
        .map(function (c) {
          var active = coerceBool(c.activo, true);
          var logo = c.logo_url || "/img/brand/logo-mark.png";
          return (
            "<tr data-cliente-id=\"" +
            escapeAttr(c.id) +
            '">' +
            '<td><img class="admin-table__logo" src="' +
            escapeAttr(logo) +
            '" alt="" width="72" height="36" loading="lazy"></td>' +
            "<td>" +
            escapeHtml(c.nombre) +
            "</td>" +
            "<td>" +
            escapeHtml(c.orden != null ? c.orden : 0) +
            "</td>" +
            '<td><span class="chip ' +
            (active ? "chip-on" : "chip-off") +
            '">' +
            (active ? "Activo" : "Off") +
            "</span></td>" +
            '<td class="admin-table__actions">' +
            '<button type="button" data-edit-cliente="' +
            escapeAttr(c.id) +
            '">Editar</button> ' +
            '<button type="button" class="ghost" data-toggle-cliente="' +
            escapeAttr(c.id) +
            '">' +
            (active ? "Ocultar" : "Mostrar") +
            "</button> " +
            '<button type="button" class="danger" data-del-cliente="' +
            escapeAttr(c.id) +
            '">Eliminar</button>' +
            "</td></tr>"
          );
        })
        .join("");
    });
  }

  function uploadClienteLogo(file) {
    var fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "image");
    return api("/upload", { method: "POST", formData: fd }).then(function (res) {
      if (!res.ok) {
        return Promise.reject((res.data && res.data.error) || "No se pudo subir el logo");
      }
      return (res.data && res.data.url) || "";
    });
  }

  document.getElementById("clienteResetBtn").addEventListener("click", function () {
    resetClienteForm();
  });

  document.getElementById("clienteLogo").addEventListener("change", function () {
    var file = this.files && this.files[0];
    var err = document.getElementById("clienteFormError");
    err.hidden = true;
    if (!file) return;
    uploadClienteLogo(file)
      .then(function (url) {
        setClienteLogoPreview(url);
        showToast("Logo subido");
      })
      .catch(function (msg) {
        err.hidden = false;
        err.textContent = msg;
        showToast(msg);
      });
  });

  document.getElementById("formCliente").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("clienteFormError");
    err.hidden = true;
    var id = document.getElementById("clienteId").value.trim();
    var nombre = document.getElementById("clienteNombre").value.trim();
    var orden = Number(document.getElementById("clienteOrden").value) || 0;
    var activo = document.getElementById("clienteActivo").checked;
    var logoUrl = document.getElementById("clienteLogoUrl").value.trim();
    var fileInput = document.getElementById("clienteLogo");
    var file = fileInput.files && fileInput.files[0];

    function save(logo) {
      if (!logo) {
        err.hidden = false;
        err.textContent = "Sube un logo (PNG, WEBP, SVG o JPG)";
        return Promise.reject();
      }
      var body = { nombre: nombre, logo_url: logo, orden: orden, activo: activo };
      var req = id
        ? api("/clientes/" + id, { method: "PUT", body: body })
        : api("/clientes", { method: "POST", body: body });
      return req.then(function (res) {
        if (!res.ok) {
          err.hidden = false;
          err.textContent = (res.data && res.data.error) || "No se pudo guardar";
          return Promise.reject();
        }
        showToast(id ? "Cliente actualizado" : "Cliente creado");
        resetClienteForm();
        loadClientes();
      });
    }

    var chain = Promise.resolve(logoUrl);
    if (file && !logoUrl) {
      chain = uploadClienteLogo(file);
    } else if (file && logoUrl) {
      // Ya se subió en change; si el usuario cambió de nuevo sin esperar, re-subir
      chain = uploadClienteLogo(file);
    }

    chain
      .then(function (url) {
        return save(url || logoUrl);
      })
      .catch(function (msg) {
        if (typeof msg === "string") {
          err.hidden = false;
          err.textContent = msg;
        }
      });
  });

  document.getElementById("adminClientesList").addEventListener("click", function (e) {
    var editId = e.target.getAttribute("data-edit-cliente");
    var delId = e.target.getAttribute("data-del-cliente");
    var toggleId = e.target.getAttribute("data-toggle-cliente");
    if (editId) {
      var item = clientesCache.find(function (c) {
        return String(c.id) === String(editId);
      });
      if (!item) return;
      document.getElementById("clienteId").value = item.id;
      document.getElementById("clienteNombre").value = item.nombre || "";
      document.getElementById("clienteOrden").value = item.orden != null ? item.orden : 0;
      document.getElementById("clienteActivo").checked = coerceBool(item.activo, true);
      document.getElementById("clienteLogo").value = "";
      setClienteLogoPreview(item.logo_url || "");
      document.getElementById("clienteSaveBtn").textContent = "Actualizar Cliente";
      document.getElementById("formCliente").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (toggleId) {
      var row = clientesCache.find(function (c) {
        return String(c.id) === String(toggleId);
      });
      if (!row) return;
      var next = !coerceBool(row.activo, true);
      api("/clientes/" + toggleId, { method: "PUT", body: { activo: next } }).then(function (res) {
        if (!res.ok) {
          showToast((res.data && res.data.error) || "No se pudo actualizar");
          return;
        }
        showToast(next ? "Cliente visible" : "Cliente oculto");
        loadClientes();
      });
      return;
    }
    if (delId && confirm("¿Eliminar este cliente?")) {
      api("/clientes/" + delId, { method: "DELETE" }).then(function (res) {
        if (!res.ok) {
          showToast((res.data && res.data.error) || "No se pudo eliminar");
          return;
        }
        showToast("Cliente eliminado");
        if (document.getElementById("clienteId").value === String(delId)) resetClienteForm();
        loadClientes();
      });
    }
  });

  var solucionesCache = [];

  function setSolucionImagenPreview(url) {
    var wrap = document.getElementById("solucionImagenPreviewWrap");
    var img = document.getElementById("solucionImagenPreview");
    var field = document.getElementById("solucionImagenUrl");
    if (field) field.value = url || "";
    if (!wrap || !img) return;
    if (url) {
      wrap.hidden = false;
      img.src = url;
    } else {
      wrap.hidden = true;
      img.removeAttribute("src");
    }
  }

  function resetSolucionForm() {
    var form = document.getElementById("formSolucion");
    if (!form) return;
    form.reset();
    document.getElementById("solucionId").value = "";
    document.getElementById("solucionOrden").value = "0";
    document.getElementById("solucionActivo").checked = true;
    document.getElementById("solucionImagen").value = "";
    setSolucionImagenPreview("");
    var err = document.getElementById("solucionFormError");
    err.hidden = true;
    err.textContent = "";
    document.getElementById("solucionSaveBtn").textContent = "Guardar Solución";
  }

  function loadSoluciones() {
    api("/soluciones").then(function (res) {
      var tbody = document.getElementById("adminSolucionesList");
      if (!tbody) return;
      var items = (res.data && res.data.soluciones) || [];
      solucionesCache = items;
      if (!items.length) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="empty-hint">No hay soluciones registradas.</td></tr>';
        return;
      }
      tbody.innerHTML = items
        .map(function (s) {
          var active = coerceBool(s.activo, true);
          var img = s.imagen_url || "/img/brand/logo-mark.png";
          return (
            '<tr data-solucion-id="' +
            escapeAttr(s.id) +
            '">' +
            '<td><img class="admin-table__logo" src="' +
            escapeAttr(img) +
            '" alt="" width="72" height="36" loading="lazy"></td>' +
            "<td>" +
            escapeHtml(s.titulo) +
            "</td>" +
            "<td><code>" +
            escapeHtml(s.slug) +
            "</code></td>" +
            "<td>" +
            escapeHtml(s.orden != null ? s.orden : 0) +
            "</td>" +
            '<td><span class="chip ' +
            (active ? "chip-on" : "chip-off") +
            '">' +
            (active ? "Activo" : "Off") +
            "</span></td>" +
            '<td class="admin-table__actions">' +
            '<button type="button" data-edit-solucion="' +
            escapeAttr(s.id) +
            '">Editar</button> ' +
            '<button type="button" class="ghost" data-toggle-solucion="' +
            escapeAttr(s.id) +
            '">' +
            (active ? "Ocultar" : "Mostrar") +
            "</button> " +
            '<button type="button" class="danger" data-del-solucion="' +
            escapeAttr(s.id) +
            '">Eliminar</button>' +
            "</td></tr>"
          );
        })
        .join("");
    });
  }

  function uploadSolucionImagen(file) {
    var fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "image");
    return api("/upload", { method: "POST", formData: fd }).then(function (res) {
      if (!res.ok) {
        return Promise.reject((res.data && res.data.error) || "No se pudo subir la imagen");
      }
      return (res.data && res.data.url) || "";
    });
  }

  document.getElementById("solucionResetBtn").addEventListener("click", function () {
    resetSolucionForm();
  });

  document.getElementById("solucionImagen").addEventListener("change", function () {
    var file = this.files && this.files[0];
    var err = document.getElementById("solucionFormError");
    err.hidden = true;
    if (!file) return;
    uploadSolucionImagen(file)
      .then(function (url) {
        setSolucionImagenPreview(url);
        showToast("Imagen subida");
      })
      .catch(function (msg) {
        err.hidden = false;
        err.textContent = msg;
        showToast(msg);
      });
  });

  document.getElementById("formSolucion").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("solucionFormError");
    err.hidden = true;
    var id = document.getElementById("solucionId").value.trim();
    var body = {
      titulo: document.getElementById("solucionTitulo").value.trim(),
      slug: document.getElementById("solucionSlug").value.trim(),
      bullet_1: document.getElementById("solucionBullet1").value.trim(),
      bullet_2: document.getElementById("solucionBullet2").value.trim(),
      bullet_3: document.getElementById("solucionBullet3").value.trim(),
      cta_texto: document.getElementById("solucionCtaTexto").value.trim(),
      cta_url: document.getElementById("solucionCtaUrl").value.trim(),
      orden: Number(document.getElementById("solucionOrden").value) || 0,
      activo: document.getElementById("solucionActivo").checked,
      imagen_url: document.getElementById("solucionImagenUrl").value.trim(),
    };
    var fileInput = document.getElementById("solucionImagen");
    var file = fileInput.files && fileInput.files[0];

    function save(imagen) {
      body.imagen_url = imagen || body.imagen_url || null;
      var req = id
        ? api("/soluciones/" + id, { method: "PUT", body: body })
        : api("/soluciones", { method: "POST", body: body });
      return req.then(function (res) {
        if (!res.ok) {
          err.hidden = false;
          err.textContent = (res.data && res.data.error) || "No se pudo guardar";
          return Promise.reject();
        }
        showToast(id ? "Solución actualizada" : "Solución creada");
        resetSolucionForm();
        loadSoluciones();
      });
    }

    var chain = Promise.resolve(body.imagen_url);
    if (file) {
      chain = uploadSolucionImagen(file);
    }

    chain
      .then(function (url) {
        return save(url || body.imagen_url);
      })
      .catch(function (msg) {
        if (typeof msg === "string") {
          err.hidden = false;
          err.textContent = msg;
        }
      });
  });

  document.getElementById("adminSolucionesList").addEventListener("click", function (e) {
    var editId = e.target.getAttribute("data-edit-solucion");
    var delId = e.target.getAttribute("data-del-solucion");
    var toggleId = e.target.getAttribute("data-toggle-solucion");
    if (editId) {
      var item = solucionesCache.find(function (s) {
        return String(s.id) === String(editId);
      });
      if (!item) return;
      document.getElementById("solucionId").value = item.id;
      document.getElementById("solucionTitulo").value = item.titulo || "";
      document.getElementById("solucionSlug").value = item.slug || "";
      document.getElementById("solucionBullet1").value = item.bullet_1 || "";
      document.getElementById("solucionBullet2").value = item.bullet_2 || "";
      document.getElementById("solucionBullet3").value = item.bullet_3 || "";
      document.getElementById("solucionCtaTexto").value = item.cta_texto || "";
      document.getElementById("solucionCtaUrl").value = item.cta_url || "";
      document.getElementById("solucionOrden").value = item.orden != null ? item.orden : 0;
      document.getElementById("solucionActivo").checked = coerceBool(item.activo, true);
      document.getElementById("solucionImagen").value = "";
      setSolucionImagenPreview(item.imagen_url || "");
      document.getElementById("solucionSaveBtn").textContent = "Actualizar Solución";
      document.getElementById("formSolucion").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (toggleId) {
      var row = solucionesCache.find(function (s) {
        return String(s.id) === String(toggleId);
      });
      if (!row) return;
      var next = !coerceBool(row.activo, true);
      api("/soluciones/" + toggleId, { method: "PUT", body: { activo: next } }).then(function (res) {
        if (!res.ok) {
          showToast((res.data && res.data.error) || "No se pudo actualizar");
          return;
        }
        showToast(next ? "Solución visible" : "Solución oculta");
        loadSoluciones();
      });
      return;
    }
    if (delId && confirm("¿Eliminar esta solución?")) {
      api("/soluciones/" + delId, { method: "DELETE" }).then(function (res) {
        if (!res.ok) {
          showToast((res.data && res.data.error) || "No se pudo eliminar");
          return;
        }
        showToast("Solución eliminada");
        if (document.getElementById("solucionId").value === String(delId)) resetSolucionForm();
        loadSoluciones();
      });
    }
  });

  /* —— Sectores (home) —— */
  var sectoresCache = [];

  function sectorImgSrc(url) {
    var u = String(url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u) || u.charAt(0) === "/") return u;
    return "/" + u.replace(/^\.\//, "");
  }

  function loadSectores() {
    var wrap = document.getElementById("sectoresCards");
    var err = document.getElementById("sectoresFormError");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    api("/sectores").then(function (res) {
      if (!wrap) return;
      if (!res.ok) {
        wrap.innerHTML =
          '<p class="empty-hint">' +
          ((res.data && res.data.error) || "No se pudieron cargar los sectores") +
          "</p>";
        return;
      }
      var items = (res.data && res.data.sectores) || [];
      sectoresCache = items;
      if (!items.length) {
        wrap.innerHTML = '<p class="empty-hint">No hay sectores. La API creará el seed al primer GET público.</p>';
        return;
      }
      wrap.innerHTML = items
        .map(function (s) {
          var id = String(s.id || "");
          var img = sectorImgSrc(s.imagen_url);
          return (
            '<form class="card admin-form sector-admin-card" data-sector-id="' +
            id +
            '">' +
            '<div class="sector-admin-preview">' +
            (img
              ? '<img src="' +
                escapeHtml(img) +
                '" alt="' +
                escapeHtml(s.nombre || "") +
                '">'
              : '<span class="empty-hint">Sin imagen</span>') +
            "</div>" +
            '<div class="form-group"><label>Nombre del Sector</label>' +
            '<input type="text" name="nombre" value="' +
            escapeAttr(s.nombre || "") +
            '" required maxlength="150"></div>' +
            '<div class="form-group"><label>Enlace de Destino</label>' +
            '<input type="text" name="link_url" value="' +
            escapeAttr(s.link_url || "") +
            '" placeholder="catalogo.html?category=…" maxlength="500"></div>' +
            '<div class="form-group"><label>Nueva imagen</label>' +
            '<input type="file" name="imagen" accept="image/*">' +
            '<p class="hint-text">Si no eliges archivo, se conserva la imagen actual.</p></div>' +
            '<input type="hidden" name="slug" value="' +
            escapeAttr(s.slug || "") +
            '">' +
            '<input type="hidden" name="orden" value="' +
            escapeAttr(String(s.orden != null ? s.orden : 0)) +
            '">' +
            '<div class="dialog-actions" style="justify-content:flex-start;margin-top:0.5rem">' +
            '<button type="submit" class="btn btn-primary">Guardar Cambios</button>' +
            "</div>" +
            "</form>"
          );
        })
        .join("");
    });
  }

  var sectoresCardsEl = document.getElementById("sectoresCards");
  if (sectoresCardsEl) {
    sectoresCardsEl.addEventListener("submit", function (e) {
      var form = e.target.closest("form[data-sector-id]");
      if (!form) return;
      e.preventDefault();
      var id = form.getAttribute("data-sector-id");
      var err = document.getElementById("sectoresFormError");
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      var fd = new FormData(form);
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      api("/sectores/" + id, { method: "POST", formData: fd }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res.ok) {
          var msg = (res.data && res.data.error) || "No se pudo guardar";
          if (err) {
            err.hidden = false;
            err.textContent = msg;
          }
          showToast(msg);
          return;
        }
        showToast("Sector actualizado");
        loadSectores();
      });
    });
  }

  /* —— Banners Hero —— */
  var bannersCache = [];

  function setBannerImagenPreview(url) {
    var wrap = document.getElementById("bannerImagenPreviewWrap");
    var img = document.getElementById("bannerImagenPreview");
    var field = document.getElementById("bannerImagenUrl");
    var src = sectorImgSrc(url);
    if (field) field.value = url || "";
    if (!wrap || !img) return;
    if (!src) {
      wrap.hidden = true;
      img.removeAttribute("src");
      return;
    }
    img.src = src;
    wrap.hidden = false;
  }

  function resetBannerForm() {
    var form = document.getElementById("formBanner");
    if (!form) return;
    form.hidden = true;
    document.getElementById("bannerId").value = "";
    document.getElementById("bannerTitulo").value = "";
    document.getElementById("bannerSubtitulo").value = "";
    document.getElementById("bannerTextoBtn1").value = "Pedir Cotización";
    document.getElementById("bannerLinkBtn1").value = "contacto.html";
    document.getElementById("bannerTextoBtn2").value = "Evaluar Mi Aplicación";
    document.getElementById("bannerLinkBtn2").value = "catalogo.html?tipo=equipo";
    document.getElementById("bannerOrden").value = "0";
    document.getElementById("bannerActivo").checked = true;
    document.getElementById("bannerImagen").value = "";
    setBannerImagenPreview("");
    document.getElementById("bannerSaveBtn").textContent = "Guardar Slide";
    var err = document.getElementById("bannerFormError");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
  }

  function showBannerForm(item) {
    var form = document.getElementById("formBanner");
    if (!form) return;
    form.hidden = false;
    if (!item) {
      document.getElementById("bannerId").value = "";
      document.getElementById("bannerTitulo").value = "";
      document.getElementById("bannerSubtitulo").value = "";
      document.getElementById("bannerTextoBtn1").value = "Pedir Cotización";
      document.getElementById("bannerLinkBtn1").value = "contacto.html";
      document.getElementById("bannerTextoBtn2").value = "Evaluar Mi Aplicación";
      document.getElementById("bannerLinkBtn2").value = "catalogo.html?tipo=equipo";
      document.getElementById("bannerOrden").value = String((bannersCache.length + 1) * 10);
      document.getElementById("bannerActivo").checked = true;
      document.getElementById("bannerImagen").value = "";
      setBannerImagenPreview("");
      document.getElementById("bannerSaveBtn").textContent = "Crear Slide";
    } else {
      document.getElementById("bannerId").value = item.id || "";
      document.getElementById("bannerTitulo").value = item.titulo || "";
      document.getElementById("bannerSubtitulo").value = item.subtitulo || "";
      document.getElementById("bannerTextoBtn1").value = item.texto_btn_1 || "";
      document.getElementById("bannerLinkBtn1").value = item.link_btn_1 || "";
      document.getElementById("bannerTextoBtn2").value = item.texto_btn_2 || "";
      document.getElementById("bannerLinkBtn2").value = item.link_btn_2 || "";
      document.getElementById("bannerOrden").value = item.orden != null ? item.orden : 0;
      document.getElementById("bannerActivo").checked = coerceBool(item.activo, true);
      document.getElementById("bannerImagen").value = "";
      setBannerImagenPreview(item.imagen_url || "");
      document.getElementById("bannerSaveBtn").textContent = "Actualizar Slide";
    }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function loadBanners() {
    var tbody = document.getElementById("adminBannersList");
    api("/banners").then(function (res) {
      if (!tbody) return;
      if (!res.ok) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="empty-hint">' +
          ((res.data && res.data.error) || "No se pudieron cargar los banners") +
          "</td></tr>";
        return;
      }
      var items = (res.data && res.data.banners) || [];
      bannersCache = items;
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-hint">No hay slides. Crea el primero.</td></tr>';
        return;
      }
      tbody.innerHTML = items
        .map(function (b) {
          var img = sectorImgSrc(b.imagen_url);
          var active = coerceBool(b.activo, true);
          return (
            '<tr data-banner-id="' +
            escapeAttr(String(b.id)) +
            '">' +
            "<td>" +
            (img
              ? '<img class="admin-thumb" src="' + escapeHtml(img) + '" alt="">'
              : '<span class="empty-hint">—</span>') +
            "</td>" +
            "<td><strong>" +
            escapeHtml(b.titulo || "") +
            "</strong></td>" +
            "<td>" +
            escapeHtml(String(b.orden != null ? b.orden : 0)) +
            "</td>" +
            "<td>" +
            (active ? '<span class="badge-on">Activo</span>' : '<span class="badge-off">Inactivo</span>') +
            "</td>" +
            "<td class="table-actions">" +
            '<button type="button" data-edit-banner="' +
            escapeAttr(String(b.id)) +
            '">Editar</button> ' +
            '<button type="button" class="ghost" data-toggle-banner="' +
            escapeAttr(String(b.id)) +
            '">' +
            (active ? "Desactivar" : "Activar") +
            "</button> " +
            '<button type="button" class="danger" data-del-banner="' +
            escapeAttr(String(b.id)) +
            '">Eliminar</button>' +
            "</td></tr>"
          );
        })
        .join("");
    });
  }

  var bannerNewBtn = document.getElementById("bannerNewBtn");
  if (bannerNewBtn) {
    bannerNewBtn.addEventListener("click", function () {
      showBannerForm(null);
    });
  }
  var bannerResetBtn = document.getElementById("bannerResetBtn");
  if (bannerResetBtn) {
    bannerResetBtn.addEventListener("click", resetBannerForm);
  }
  var bannerImagenInput = document.getElementById("bannerImagen");
  if (bannerImagenInput) {
    bannerImagenInput.addEventListener("change", function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var url = URL.createObjectURL(file);
      setBannerImagenPreview(url);
    });
  }
  var formBanner = document.getElementById("formBanner");
  if (formBanner) {
    formBanner.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("bannerFormError");
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      var id = document.getElementById("bannerId").value.trim();
      var fd = new FormData(formBanner);
      if (!document.getElementById("bannerActivo").checked) {
        fd.set("activo", "0");
      } else {
        fd.set("activo", "1");
      }
      var btn = document.getElementById("bannerSaveBtn");
      if (btn) btn.disabled = true;
      var path = id ? "/banners/" + id : "/banners";
      api(path, { method: "POST", formData: fd }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res.ok) {
          var msg = (res.data && res.data.error) || "No se pudo guardar";
          if (err) {
            err.hidden = false;
            err.textContent = msg;
          }
          showToast(msg);
          return;
        }
        showToast(id ? "Slide actualizado" : "Slide creado");
        resetBannerForm();
        loadBanners();
      });
    });
  }
  var bannersList = document.getElementById("adminBannersList");
  if (bannersList) {
    bannersList.addEventListener("click", function (e) {
      var editId = e.target.getAttribute("data-edit-banner");
      var toggleId = e.target.getAttribute("data-toggle-banner");
      var delId = e.target.getAttribute("data-del-banner");
      if (editId) {
        var item = bannersCache.find(function (b) {
          return String(b.id) === String(editId);
        });
        if (item) showBannerForm(item);
        return;
      }
      if (toggleId) {
        var row = bannersCache.find(function (b) {
          return String(b.id) === String(toggleId);
        });
        if (!row) return;
        var next = !coerceBool(row.activo, true);
        api("/banners/" + toggleId, { method: "PUT", body: { activo: next } }).then(function (res) {
          if (!res.ok) {
            showToast((res.data && res.data.error) || "No se pudo actualizar");
            return;
          }
          showToast(next ? "Slide activo" : "Slide oculto");
          loadBanners();
        });
        return;
      }
      if (delId && confirm("¿Eliminar este slide del Hero?")) {
        api("/banners/" + delId, { method: "DELETE" }).then(function (res) {
          if (!res.ok) {
            showToast((res.data && res.data.error) || "No se pudo eliminar");
            return;
          }
          showToast("Slide eliminado");
          if (document.getElementById("bannerId").value === String(delId)) resetBannerForm();
          loadBanners();
        });
      }
    });
  }

  var BRAND_LOGOS = {
    "sonic-air-systems": "/img/brand/sonic-air.png",
    lyc: "/img/brand/lyc.png",
    movex: "/img/brand/movex.png",
    isodur: "/img/brand/isodur.png",
    combi: "/img/brand/combi.png",
    haida: "/img/brand/haida.png",
  };

  function resolveBrandLogo(b) {
    if (!b) return "/img/brand/logo.png";
    // DB logo always wins (including /img/uploads/... from admin).
    if (b.logo_url) {
      var u = String(b.logo_url).trim();
      if (u) return toSitePath(u) || u;
    }
    if (BRAND_LOGOS[b.slug]) return BRAND_LOGOS[b.slug];
    return "/img/brand/logo.png";
  }

  function setBrandLogoPreview(url) {
    var img = document.getElementById("brandLogoPreview");
    var hint = document.getElementById("brandLogoHint");
    var field = document.getElementById("brandLogoUrl");
    field.value = url || "";
    if (url) {
      img.hidden = false;
      img.src = toSitePath(url) || url;
      hint.hidden = true;
    } else {
      img.hidden = true;
      img.removeAttribute("src");
      hint.hidden = false;
    }
  }

  /* ——— Brand ficha: dynamic sections + Quill ——— */
  var brandSectionsState = [];
  var brandQuills = {};
  var brandSectionSeq = 0;

  function newSectionId() {
    brandSectionSeq += 1;
    return "sec-" + Date.now().toString(36) + "-" + brandSectionSeq;
  }

  function isEmptyQuillHtml(html) {
    if (!html) return true;
    var t = String(html)
      .replace(/<p><br\s*\/?><\/p>/gi, "")
      .replace(/<p>\s*<\/p>/gi, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    return !t;
  }

  function destroyBrandQuills() {
    Object.keys(brandQuills).forEach(function (id) {
      try {
        var q = brandQuills[id];
        if (q && q.root && q.root.parentNode) {
          q.root.innerHTML = "";
        }
      } catch (err) {
        /* ignore */
      }
    });
    brandQuills = {};
  }

  function syncBrandSectionsFromDom() {
    brandSectionsState.forEach(function (sec) {
      var card = document.querySelector('[data-section-id="' + sec.id + '"]');
      if (!card) return;
      var titleInput = card.querySelector(".section-card__title");
      if (titleInput) sec.title = titleInput.value;
      var q = brandQuills[sec.id];
      if (q) {
        sec.html = q.root.innerHTML;
      } else {
        var fallback = card.querySelector("[data-section-fallback]");
        if (fallback) sec.html = fallback.value;
      }
    });
  }

  function serializeBrandSections() {
    syncBrandSectionsFromDom();
    return brandSectionsState
      .filter(function (sec) {
        return (sec.title && sec.title.trim()) || !isEmptyQuillHtml(sec.html);
      })
      .map(function (sec) {
        var title = (sec.title || "").trim() || "Sección";
        return (
          '<section class="brand-section">' +
          "<h3>" +
          escapeHtml(title) +
          "</h3>\n" +
          (sec.html || "") +
          "\n</section>"
        );
      })
      .join("\n");
  }

  function parseBrandContentHtml(html) {
    if (!html || !String(html).trim()) {
      return [{ id: newSectionId(), title: "", html: "", collapsed: false }];
    }
    var wrap = document.createElement("div");
    wrap.innerHTML = String(html);
    var nodes = wrap.querySelectorAll("section.brand-section");
    if (nodes.length) {
      return Array.prototype.map.call(nodes, function (sec) {
        var h3 = sec.querySelector("h3");
        var title = h3 ? h3.textContent.trim() : "";
        if (h3) h3.parentNode.removeChild(h3);
        return {
          id: newSectionId(),
          title: title,
          html: sec.innerHTML.trim(),
          collapsed: false,
        };
      });
    }
    // Compat: contenido legado sin secciones → una sola sección
    var firstH3 = wrap.querySelector("h3");
    if (firstH3 && wrap.children.length > 1) {
      var parts = [];
      var cur = { title: "", htmlParts: [] };
      Array.prototype.forEach.call(wrap.childNodes, function (node) {
        if (node.nodeType === 1 && node.tagName === "H3") {
          if (cur.title || cur.htmlParts.length) {
            parts.push({
              id: newSectionId(),
              title: cur.title,
              html: cur.htmlParts.join(""),
              collapsed: false,
            });
          }
          cur = { title: (node.textContent || "").trim(), htmlParts: [] };
        } else if (node.nodeType === 1 || (node.nodeType === 3 && String(node.textContent).trim())) {
          if (node.nodeType === 1) cur.htmlParts.push(node.outerHTML);
          else cur.htmlParts.push("<p>" + escapeHtml(node.textContent) + "</p>");
        }
      });
      if (cur.title || cur.htmlParts.length) {
        parts.push({
          id: newSectionId(),
          title: cur.title,
          html: cur.htmlParts.join(""),
          collapsed: false,
        });
      }
      if (parts.length) return parts;
    }
    return [
      {
        id: newSectionId(),
        title: "Contenido",
        html: String(html).trim(),
        collapsed: false,
      },
    ];
  }

  function createSectionQuill(editorEl, sectionId, initialHtml) {
    if (typeof Quill === "undefined") {
      editorEl.innerHTML =
        '<textarea class="section-fallback" rows="6" data-section-fallback="' +
        sectionId +
        '">' +
        escapeHtml(initialHtml || "") +
        "</textarea>";
      return null;
    }
    registerHTML5VideoBlot();
    var quill = new Quill(editorEl, {
      theme: "snow",
      placeholder: "Escribe el contenido de esta sección…",
      modules: {
        toolbar: {
          container: [
            [{ header: [2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image", "video"],
            ["clean"],
          ],
          handlers: {
            image: function () {
              var q = this.quill;
              openImagePicker({
                currentUrl: "",
                onApply: function (url) {
                  var range = q.getSelection(true) || { index: q.getLength() };
                  q.insertEmbed(range.index, "image", url, "user");
                  q.setSelection(range.index + 1);
                  return Promise.resolve();
                },
              });
            },
            video: function () {
              var q = this.quill;
              openVideoPicker({
                quill: q,
              });
            },
          },
        },
      },
    });
    var Delta = Quill.import("delta");
    quill.clipboard.addMatcher("VIDEO", function (node) {
      var source = node.querySelector("source");
      var src = normalizeVideoUrl(
        node.getAttribute("src") || (source && source.getAttribute("src")) || ""
      );
      if (!src) return new Delta();
      return new Delta().insert({ html5video: src });
    });
    if (initialHtml) {
      quill.clipboard.dangerouslyPasteHTML(0, initialHtml, "silent");
    }
    brandQuills[sectionId] = quill;
    return quill;
  }

  function renderBrandSections() {
    var container = document.getElementById("brandSections");
    if (!container) return;
    syncBrandSectionsFromDom();
    destroyBrandQuills();
    if (!brandSectionsState.length) {
      container.innerHTML =
        '<p class="brand-sections__empty">Sin secciones. Pulsa “+ Agregar Sección” para crear la primera.</p>';
      return;
    }
    container.innerHTML = brandSectionsState
      .map(function (sec, idx) {
        return (
          '<div class="section-card' +
          (sec.collapsed ? " is-collapsed" : "") +
          '" data-section-id="' +
          escapeAttr(sec.id) +
          '">' +
          '<div class="section-card__head">' +
          '<button type="button" class="section-card__toggle" data-toggle-section="' +
          escapeAttr(sec.id) +
          '" aria-expanded="' +
          (sec.collapsed ? "false" : "true") +
          '" title="Expandir / contraer">' +
          '<span class="section-card__chevron" aria-hidden="true">▼</span>' +
          "</button>" +
          '<input type="text" class="section-card__title" value="' +
          escapeAttr(sec.title || "") +
          '" placeholder="Título de la sección (ej: Especificaciones Técnicas)" aria-label="Título de la sección">' +
          '<div class="section-card__actions">' +
          '<button type="button" data-move-section="up" data-section-id="' +
          escapeAttr(sec.id) +
          '" title="Subir" ' +
          (idx === 0 ? "disabled" : "") +
          ">↑</button>" +
          '<button type="button" data-move-section="down" data-section-id="' +
          escapeAttr(sec.id) +
          '" title="Bajar" ' +
          (idx === brandSectionsState.length - 1 ? "disabled" : "") +
          ">↓</button>" +
          '<button type="button" class="section-remove" data-remove-section="' +
          escapeAttr(sec.id) +
          '" title="Eliminar sección">Eliminar</button>' +
          "</div></div>" +
          '<div class="section-card__body">' +
          "<label>Contenido</label>" +
          '<div class="section-quill"><div class="quill-mount" data-quill-for="' +
          escapeAttr(sec.id) +
          '"></div></div>' +
          "</div></div>"
        );
      })
      .join("");

    brandSectionsState.forEach(function (sec) {
      var mount = container.querySelector('[data-quill-for="' + sec.id + '"]');
      if (mount) createSectionQuill(mount, sec.id, sec.html || "");
    });
  }

  function addBrandSection(prefill) {
    syncBrandSectionsFromDom();
    brandSectionsState.forEach(function (s) {
      s.collapsed = true;
    });
    brandSectionsState.push({
      id: newSectionId(),
      title: (prefill && prefill.title) || "",
      html: (prefill && prefill.html) || "",
      collapsed: false,
    });
    renderBrandSections();
  }

  function resetBrandSections(html) {
    destroyBrandQuills();
    brandSectionsState = parseBrandContentHtml(html || "");
    renderBrandSections();
    document.getElementById("brandContentHtml").value = html || "";
  }

  function openSimpleDialog(kind, item) {
    var form = document.getElementById("simpleForm");
    form.reset();
    form.kind.value = kind;
    form.id.value = item && item.id ? item.id : "";
    form.name.value = (item && item.name) || "";
    form.slug.value = (item && item.slug) || "";
    form.description.value = (item && item.description) || "";
    form.seo_title.value = (item && item.seo_title) || "";
    form.seo_description.value = (item && item.seo_description) || "";
    form.sort_order.value = (item && item.sort_order) || 0;
    form.is_active.checked = item ? coerceBool(item.is_active, true) : true;
    var logoField = document.getElementById("simpleLogoField");
    var contentField = document.getElementById("simpleContentField");
    var seoFields = document.getElementById("simpleSeoFields");
    var dialog = document.getElementById("simpleDialog");
    if (kind === "brands") {
      logoField.hidden = false;
      contentField.hidden = false;
      seoFields.hidden = true;
      dialog.classList.add("dialog--wide");
      resetBrandSections((item && item.content_html) || "");
      if (item && item.logo_url) {
        setBrandLogoPreview(item.logo_url);
      } else if (item) {
        setBrandLogoPreview(resolveBrandLogo(item));
        document.getElementById("brandLogoUrl").value = item.logo_url || "";
      } else {
        setBrandLogoPreview("");
      }
    } else {
      logoField.hidden = true;
      contentField.hidden = true;
      seoFields.hidden = false;
      dialog.classList.remove("dialog--wide");
      destroyBrandQuills();
      brandSectionsState = [];
      setBrandLogoPreview("");
      document.getElementById("brandContentHtml").value = "";
      var sectionsEl = document.getElementById("brandSections");
      if (sectionsEl) sectionsEl.innerHTML = "";
    }
    document.getElementById("simpleDialogTitle").textContent =
      (item ? "Editar " : "Nueva ") + (kind === "categories" ? "categoría" : "marca");
    dialog.showModal();
  }

  document.getElementById("brandLogoPick").addEventListener("click", function () {
    openImagePicker({
      currentUrl: document.getElementById("brandLogoUrl").value || "",
      onApply: function (url) {
        setBrandLogoPreview(url);
        return Promise.resolve();
      },
    });
  });

  document.getElementById("addSectionBtn").addEventListener("click", function () {
    addBrandSection();
  });

  document.getElementById("brandSections").addEventListener("click", function (e) {
    var toggleId = e.target.closest && e.target.closest("[data-toggle-section]");
    if (toggleId) {
      var tid = toggleId.getAttribute("data-toggle-section");
      syncBrandSectionsFromDom();
      brandSectionsState.forEach(function (s) {
        if (s.id === tid) s.collapsed = !s.collapsed;
      });
      renderBrandSections();
      return;
    }
    var removeBtn = e.target.closest && e.target.closest("[data-remove-section]");
    if (removeBtn) {
      var rid = removeBtn.getAttribute("data-remove-section");
      if (!confirm("¿Eliminar esta sección?")) return;
      syncBrandSectionsFromDom();
      brandSectionsState = brandSectionsState.filter(function (s) {
        return s.id !== rid;
      });
      renderBrandSections();
      return;
    }
    var moveBtn = e.target.closest && e.target.closest("[data-move-section]");
    if (moveBtn) {
      var mid = moveBtn.getAttribute("data-section-id");
      var dir = moveBtn.getAttribute("data-move-section");
      syncBrandSectionsFromDom();
      var idx = -1;
      for (var i = 0; i < brandSectionsState.length; i++) {
        if (brandSectionsState[i].id === mid) {
          idx = i;
          break;
        }
      }
      if (idx < 0) return;
      var swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= brandSectionsState.length) return;
      var tmp = brandSectionsState[idx];
      brandSectionsState[idx] = brandSectionsState[swap];
      brandSectionsState[swap] = tmp;
      renderBrandSections();
    }
  });

  document.getElementById("addCategoryBtn").addEventListener("click", function () {
    openSimpleDialog("categories", null);
  });
  document.getElementById("addBrandBtn").addEventListener("click", function () {
    openSimpleDialog("brands", null);
  });
  document.getElementById("simpleCancel").addEventListener("click", function () {
    destroyBrandQuills();
    document.getElementById("simpleDialog").classList.remove("dialog--wide");
    document.getElementById("simpleDialog").close();
  });

  document.getElementById("simpleDialog").addEventListener("close", function () {
    destroyBrandQuills();
    document.getElementById("simpleDialog").classList.remove("dialog--wide");
  });

  document.getElementById("brandsList").addEventListener("click", function (e) {
    var pickLogo = e.target.getAttribute("data-pick-brand-logo");
    var edit = e.target.getAttribute("data-edit-brand");
    var del = e.target.getAttribute("data-del-brand");
    if (pickLogo) {
      var brand = brandsCache.find(function (b) {
        return String(b.id) === String(pickLogo);
      });
      openImagePicker({
        currentUrl: brand && brand.logo_url ? brand.logo_url : "",
        autoApply: true,
        onApply: function (url) {
          return api("/brands/" + pickLogo, { method: "PUT", body: { logo_url: url } }).then(function (res) {
            if (!res.ok) {
              showToast((res.data && res.data.error) || "No se pudo guardar el logo");
              return Promise.reject();
            }
            showToast("Logo actualizado");
            return loadBrands();
          });
        },
      });
      return;
    }
    if (edit) {
      var item = brandsCache.find(function (b) {
        return String(b.id) === String(edit);
      });
      openSimpleDialog("brands", item);
    }
    if (del && confirm("¿Eliminar marca?")) {
      api("/brands/" + del, { method: "DELETE" }).then(function () {
        loadBrands();
      });
    }
  });

  document.getElementById("simpleForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var kind = form.kind.value;
    var body = {
      name: form.name.value.trim(),
      slug: form.slug.value.trim() || undefined,
      description: form.description.value,
      seo_title: form.seo_title.value.trim(),
      seo_description: form.seo_description.value.trim(),
      sort_order: Number(form.sort_order.value) || 0,
      is_active: !!form.is_active.checked,
    };
    if (kind === "brands") {
      body.logo_url = document.getElementById("brandLogoUrl").value.trim() || null;
      var serialized = serializeBrandSections();
      document.getElementById("brandContentHtml").value = serialized;
      body.content_html = serialized;
    }
    var id = form.id.value;
    var req = id
      ? api("/" + kind + "/" + id, { method: "PUT", body: body })
      : api("/" + kind, { method: "POST", body: body });
    req.then(function (res) {
      if (!res.ok) {
        showToast((res.data && res.data.error) || "Error");
        return;
      }
      document.getElementById("simpleDialog").close();
      if (kind === "categories") {
        loadProducts();
      } else loadBrands();
      showToast("Guardado");
    });
  });

  function statusSelect(current, options, attr) {
    return (
      "<select " +
      attr +
      ">" +
      options
        .map(function (s) {
          return (
            '<option value="' +
            escapeAttr(s) +
            '"' +
            (s === current ? " selected" : "") +
            ">" +
            escapeHtml(s) +
            "</option>"
          );
        })
        .join("") +
      "</select>"
    );
  }

  function loadOrders() {
    api("/orders").then(function (res) {
      var list = document.getElementById("ordersList");
      var items = (res.data && res.data.orders) || [];
      list.innerHTML = items
        .map(function (o) {
          return (
            '<article class="card"><h3>' +
            escapeHtml(o.public_code) +
            " — " +
            escapeHtml(o.customer_name) +
            '</h3><div class="meta"><span>' +
            escapeHtml(o.customer_email) +
            "</span><span>$" +
            Number(o.subtotal_clp).toLocaleString("es-CL") +
            "</span></div>" +
            statusSelect(
              o.status,
              ["received", "confirmed", "paid", "shipped", "completed", "cancelled"],
              'data-order-status="' + escapeAttr(o.id) + '"'
            ) +
            "</article>"
          );
        })
        .join("") || "<p>Sin pedidos</p>";
    });
  }

  document.getElementById("ordersList").addEventListener("change", function (e) {
    var id = e.target.getAttribute("data-order-status");
    if (!id) return;
    api("/orders/" + id, { method: "PUT", body: { status: e.target.value } }).then(function () {
      showToast("Pedido actualizado");
    });
  });

  function loadQuotes() {
    api("/quotes").then(function (res) {
      var list = document.getElementById("quotesList");
      var items = (res.data && res.data.quotes) || [];
      list.innerHTML = items
        .map(function (q) {
          return (
            '<article class="card"><h3>' +
            escapeHtml(q.public_code) +
            " — " +
            escapeHtml(q.customer_name) +
            '</h3><div class="meta"><span>' +
            escapeHtml(q.customer_email) +
            "</span><span>" +
            escapeHtml(q.company_name || "") +
            "</span></div>" +
            statusSelect(
              q.status,
              ["new", "in_progress", "sent", "won", "lost", "closed"],
              'data-quote-status="' + escapeAttr(q.id) + '"'
            ) +
            "</article>"
          );
        })
        .join("") || "<p>Sin cotizaciones</p>";
    });
  }

  document.getElementById("quotesList").addEventListener("change", function (e) {
    var id = e.target.getAttribute("data-quote-status");
    if (!id) return;
    api("/quotes/" + id, { method: "PUT", body: { status: e.target.value } }).then(function () {
      showToast("Cotización actualizada");
    });
  });

  function loadContacts() {
    api("/contacts").then(function (res) {
      var list = document.getElementById("contactsList");
      var items = (res.data && (res.data.contacts || res.data.messages)) || [];
      list.innerHTML = items
        .map(function (m) {
          return (
            '<article class="card"><h3>' +
            escapeHtml(m.subject || m.name) +
            '</h3><div class="meta"><span>' +
            escapeHtml(m.email) +
            "</span><span>" +
            escapeHtml(m.status) +
            "</span></div><p>" +
            escapeHtml(m.message || "") +
            "</p>" +
            statusSelect(
              m.status,
              ["new", "read", "replied", "archived"],
              'data-contact-status="' + escapeAttr(m.id) + '"'
            ) +
            "</article>"
          );
        })
        .join("") || "<p>Sin mensajes</p>";
    });
  }

  document.getElementById("contactsList").addEventListener("change", function (e) {
    var id = e.target.getAttribute("data-contact-status");
    if (!id) return;
    api("/contacts/" + id, { method: "PUT", body: { status: e.target.value } }).then(function () {
      showToast("Mensaje actualizado");
    });
  });

  function loadSettings() {
    api("/settings").then(function (res) {
      if (!res.ok) return;
      var form = document.getElementById("settingsForm");
      var data = res.data || {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && data[el.name] != null) el.value = data[el.name];
      });
    });
  }

  document.getElementById("settingsForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var body = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) body[el.name] = el.value;
    });
    api("/settings", { method: "PUT", body: body }).then(function (res) {
      showToast(res.ok ? "Ajustes guardados" : "Error al guardar");
    });
  });

  document.getElementById("passwordForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("passwordError");
    err.hidden = true;
    var current = document.getElementById("currentPassword").value;
    var next = document.getElementById("newPassword").value;
    var confirmPw = document.getElementById("confirmPassword").value;
    if (next !== confirmPw) {
      err.hidden = false;
      err.textContent = "La confirmación no coincide";
      return;
    }
    if (next.length < 10) {
      err.hidden = false;
      err.textContent = "La nueva contraseña debe tener al menos 10 caracteres";
      return;
    }
    api("/change-password", {
      method: "POST",
      body: {
        current_password: current,
        new_password: next,
        confirm_password: confirmPw,
      },
    }).then(function (res) {
      if (!res.ok) {
        err.hidden = false;
        err.textContent = (res.data && res.data.error) || "No se pudo cambiar la contraseña";
        return;
      }
      if (res.data && res.data.token) {
        setToken(res.data.token);
      }
      document.getElementById("passwordForm").reset();
      showToast("Contraseña actualizada");
    });
  });

  if (getToken()) {
    api("/me").then(function (res) {
      if (res.ok) showApp();
      else showLogin();
    });
  } else {
    showLogin();
  }
})();
