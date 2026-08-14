(function () {
  "use strict";

  var API = "/api/admin";
  var TOKEN_KEY = "lpaezsis_admin_token";
  var categoriesCache = [];
  var brandsCache = [];
  var productsCache = [];
  var selectedCategoryId = null;

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
    showTab("products");
  }

  function showTab(tab) {
    document.querySelectorAll(".app-tab").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tab") === tab);
    });
    ["products", "brands", "orders", "quotes", "contacts", "settings"].forEach(function (name) {
      var view = document.getElementById(name + "View");
      if (view) view.hidden = name !== tab;
    });
    if (tab === "products") loadProducts();
    if (tab === "brands") loadBrands();
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

  function countProductsInCategory(catId) {
    return productsCache.filter(function (p) {
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
    var list = document.getElementById("catSidebarList");
    if (!list) return;
    var allCount = productsCache.length;
    var html =
      '<button type="button" class="cat-item' +
      (selectedCategoryId == null ? " is-active" : "") +
      '" data-cat-id="">' +
      '<span class="cat-item__name">Todas</span>' +
      '<span class="cat-item__count">' +
      allCount +
      " productos</span></button>";
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
          " producto" +
          (n === 1 ? "" : "s") +
          "</span></button>"
        );
      })
      .join("");
    list.innerHTML = html;
  }

  function renderCatalogHead() {
    var cat = selectedCategory();
    var title = document.getElementById("catalogTitle");
    var meta = document.getElementById("catalogMeta");
    var editBtn = document.getElementById("editCategoryBtn");
    if (cat) {
      title.textContent = cat.name;
      meta.textContent =
        "Slug: " +
        (cat.slug || "—") +
        " · Orden: " +
        (cat.sort_order != null ? cat.sort_order : 0) +
        " · " +
        countProductsInCategory(cat.id) +
        " productos";
      editBtn.hidden = false;
    } else {
      title.textContent = "Todos los productos";
      meta.textContent = productsCache.length + " productos en catálogo";
      editBtn.hidden = true;
    }
  }

  function renderProductRows() {
    var list = document.getElementById("productsList");
    var rows = productsCache.filter(function (p) {
      if (selectedCategoryId == null) return true;
      return String(p.category_id) === String(selectedCategoryId);
    });
    if (!rows.length) {
      list.innerHTML = '<p class="empty-hint">No hay productos en esta categoría.</p>';
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
    return Promise.all([api("/categories"), api("/brands"), api("/products")]).then(function (results) {
      categoriesCache = (results[0].data && results[0].data.categories) || [];
      brandsCache = (results[1].data && results[1].data.brands) || [];
      productsCache = (results[2].data && results[2].data.products) || [];
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
  }

  function fillSelects() {
    return Promise.all([api("/categories"), api("/brands")]).then(function (results) {
      categoriesCache = (results[0].data && results[0].data.categories) || [];
      brandsCache = (results[1].data && results[1].data.brands) || [];
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

  document.getElementById("catSidebarList").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cat-id]");
    if (!btn) return;
    var id = btn.getAttribute("data-cat-id");
    selectedCategoryId = id === "" ? null : id;
    renderCatSidebar();
    renderCatalogHead();
    renderProductRows();
  });

  document.getElementById("editCategoryBtn").addEventListener("click", function () {
    var cat = selectedCategory();
    if (cat) openSimpleDialog("categories", cat);
  });

  document.getElementById("productsList").addEventListener("click", function (e) {
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
    if (del && confirm("¿Eliminar producto?")) {
      api("/products/" + del, { method: "DELETE" }).then(function () {
        showToast("Producto eliminado");
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
        showToast(pActive.is_active ? "Producto oculto" : "Producto visible");
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
  });

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

  function openProductDialog(product) {
    var form = document.getElementById("productForm");
    form.reset();
    form.id.value = product && product.id ? product.id : "";
    if (product) {
      form.name.value = product.name || "";
      form.slug.value = product.slug || "";
      form.category_id.value = product.category_id || "";
      form.brand_id.value = product.brand_id || "";
      form.sale_mode.value = product.sale_mode || "quote";
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
      form.is_featured.checked = !!product.is_featured;
      form.is_active.checked = product.is_active !== false;
    } else {
      form.is_active.checked = true;
      setFormImagePreview("");
    }
    document.getElementById("productDialogTitle").textContent = product ? "Editar producto" : "Nuevo producto";
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

  document.getElementById("addProductBtn").addEventListener("click", function () {
    fillSelects().then(function () {
      openProductDialog(null);
      if (selectedCategoryId != null) {
        document.getElementById("productForm").category_id.value = selectedCategoryId;
      }
    });
  });
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
      sale_mode: form.sale_mode.value,
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
            (b.is_active ? "chip-on" : "chip-off") +
            '">' +
            (b.is_active ? "Activa" : "Off") +
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
    form.is_active.checked = !item || item.is_active !== false;
    var logoField = document.getElementById("simpleLogoField");
    var contentField = document.getElementById("simpleContentField");
    var seoFields = document.getElementById("simpleSeoFields");
    if (kind === "brands") {
      logoField.hidden = false;
      contentField.hidden = false;
      seoFields.hidden = true;
      document.getElementById("brandContentHtml").value = (item && item.content_html) || "";
      if (item && item.logo_url) {
        setBrandLogoPreview(item.logo_url);
      } else if (item) {
        setBrandLogoPreview(resolveBrandLogo(item));
        document.getElementById("brandLogoUrl").value = item.logo_url || "";
      } else {
        setBrandLogoPreview("");
        document.getElementById("brandContentHtml").value = "";
      }
    } else {
      logoField.hidden = true;
      contentField.hidden = true;
      seoFields.hidden = false;
      setBrandLogoPreview("");
      document.getElementById("brandContentHtml").value = "";
    }
    document.getElementById("simpleDialogTitle").textContent =
      (item ? "Editar " : "Nueva ") + (kind === "categories" ? "categoría" : "marca");
    document.getElementById("simpleDialog").showModal();
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

  document.getElementById("addCategoryBtn").addEventListener("click", function () {
    openSimpleDialog("categories", null);
  });
  document.getElementById("addBrandBtn").addEventListener("click", function () {
    openSimpleDialog("brands", null);
  });
  document.getElementById("simpleCancel").addEventListener("click", function () {
    document.getElementById("simpleDialog").close();
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
      is_active: form.is_active.checked,
    };
    if (kind === "brands") {
      body.logo_url = document.getElementById("brandLogoUrl").value.trim() || null;
      body.content_html = document.getElementById("brandContentHtml").value;
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
