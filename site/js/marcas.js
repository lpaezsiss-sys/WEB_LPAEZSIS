/**
 * marcas.js — hidratación de datos sobre plantilla HTML estática.
 * Catálogo de marca separado en Equipos y Repuestos.
 */
document.addEventListener("DOMContentLoaded", function () {
  initBrandPage();
});

function escapeHtml(str) {
  if (window.Lpaez && typeof Lpaez.escapeHtml === "function") {
    return Lpaez.escapeHtml(str);
  }
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, "&#96;");
}

function productTipoOf(p) {
  if (!p) return "equipo";
  if (p.tipo === "repuesto" || p.tipo === "equipo") return p.tipo;
  if (p.sale_mode === "buy") return "repuesto";
  return "equipo";
}

async function initBrandPage() {
  var urlParams = new URLSearchParams(window.location.search);
  var currentSlug = urlParams.get("slug");

  try {
    var brandsRes = await fetch("api/marcas.php", { credentials: "same-origin" });
    if (!brandsRes.ok) throw new Error("Error al consultar la API de marcas");
    var brandsData = await brandsRes.json();

    var activeBrands = (Array.isArray(brandsData)
      ? brandsData
      : brandsData.marcas || brandsData.brands || []
    ).filter(function (b) {
      return b && (b.activo == 1 || b.is_active == 1 || b.activo === true || b.is_active === true);
    });

    var currentBrand = activeBrands.find(function (b) {
      return b.slug === currentSlug;
    });
    if (!currentBrand && activeBrands.length > 0) {
      currentBrand =
        activeBrands.find(function (b) {
          return b.slug === "sonic-air-systems" || /sonic/i.test(b.nombre || b.name || "");
        }) || activeBrands[0];
      if (currentBrand.slug && history.replaceState) {
        history.replaceState(
          null,
          "",
          "marcas.html?slug=" + encodeURIComponent(currentBrand.slug)
        );
      }
      currentSlug = currentBrand.slug;
    }

    renderBrandSelector(activeBrands, currentSlug);

    if (currentBrand) {
      updateBrandHero(currentBrand);
      loadBrandDetailExtras(currentBrand.slug);
      loadBrandProducts(currentBrand.id || currentBrand.slug, currentBrand);
    } else {
      var eqGrid = document.getElementById("brandEquiposGrid");
      var rpSec = document.getElementById("brandRepuestosSection");
      if (eqGrid) {
        eqGrid.innerHTML =
          '<p class="no-products">No hay marcas activas por ahora.</p>';
      }
      if (rpSec) rpSec.style.display = "none";
    }
  } catch (error) {
    console.error("Error inicializando la página de marcas:", error);
    var eqGridErr = document.getElementById("brandEquiposGrid");
    var rpSecErr = document.getElementById("brandRepuestosSection");
    if (eqGridErr) {
      eqGridErr.innerHTML =
        '<p class="no-products">No se pudieron cargar las marcas. Intenta recargar.</p>';
    }
    if (rpSecErr) rpSecErr.style.display = "none";
  }
}

function renderBrandSelector(brands, activeSlug) {
  var container = document.getElementById("brandSelectorGrid");
  if (!container) return;

  container.className = "brand-selector-grid";
  if (!brands.length) {
    container.innerHTML =
      '<p class="empty-state">No hay marcas activas por ahora.</p>';
    return;
  }

  container.innerHTML = brands
    .map(function (b) {
      var slug = b.slug || "";
      var nombre = b.nombre || b.name || slug;
      var logo = b.logo_url || b.imagen || "";
      var active = slug && slug === activeSlug ? " is-active" : "";
      var img = logo
        ? '<img src="' +
          escapeAttr(logo) +
          '" alt="' +
          escapeAttr(nombre) +
          '" loading="lazy">'
        : escapeHtml(nombre);
      return (
        '<a href="marcas.html?slug=' +
        encodeURIComponent(slug) +
        '" class="brand-card-item' +
        active +
        '" title="' +
        escapeAttr(nombre) +
        '">' +
        img +
        "</a>"
      );
    })
    .join("");
}

function updateBrandHero(brand) {
  var titleEl = document.getElementById("brandTitle");
  var descEl = document.getElementById("brandDescription");
  var nombre = brand.nombre || brand.name || "";
  var desc = brand.descripcion || brand.description || "";

  if (titleEl) titleEl.textContent = nombre;
  if (descEl) descEl.textContent = desc;
  document.title = (nombre || "Marca") + " | LPAEZsis";

  var canonical = document.getElementById("brandCanonical");
  if (canonical && brand.slug) {
    canonical.setAttribute(
      "href",
      "https://lpaezsis.cl/marcas.html?slug=" + encodeURIComponent(brand.slug)
    );
  }
  var quoteCta = document.getElementById("brandQuoteCta");
  if (quoteCta && brand.slug) {
    quoteCta.href = "cotizacion.html?brand=" + encodeURIComponent(brand.slug);
  }

  updateSectionTitles(nombre);
}

function updateSectionTitles(nombre) {
  var eqTitle = document.getElementById("brandEquiposTitle");
  var rpTitle = document.getElementById("brandRepuestosTitle");
  if (eqTitle) {
    eqTitle.textContent = nombre ? "Equipos " + nombre : "Equipos";
  }
  if (rpTitle) {
    rpTitle.textContent = nombre
      ? "Repuestos y Consumibles " + nombre
      : "Repuestos y Consumibles";
  }
}

async function loadBrandDetailExtras(slug) {
  if (!slug) return;
  var contentEl = document.getElementById("brandContent");
  var galleryEl = document.getElementById("brandGallery");
  try {
    if (!(window.Lpaez && typeof Lpaez.api === "function")) return;
    var packed = await Lpaez.api("/api/brands/" + encodeURIComponent(slug));
    if (!packed.ok) return;
    var brand = (packed.data && packed.data.brand) || packed.data || {};
    if (!brand) return;

    if (contentEl) {
      var html = brand.content_html || "";
      if (html && String(html).trim()) {
        contentEl.innerHTML = html;
        contentEl.querySelectorAll("img").forEach(function (img) {
          var real =
            img.getAttribute("data-src") ||
            img.getAttribute("data-lazy-src") ||
            img.getAttribute("data-original");
          if (real) {
            img.setAttribute("src", real);
            img.removeAttribute("data-src");
            img.removeAttribute("data-lazy-src");
          }
          if ((img.getAttribute("src") || "").indexOf("data:image") === 0) {
            img.remove();
          }
        });
        contentEl.hidden = false;
      } else {
        contentEl.innerHTML = "";
        contentEl.hidden = true;
      }
    }

    if (galleryEl) {
      var urls = brand.gallery || [];
      if (urls && urls.length) {
        galleryEl.hidden = false;
        galleryEl.innerHTML = urls
          .map(function (u) {
            return (
              '<a class="brand-gallery-item" href="' +
              escapeAttr(u) +
              '" target="_blank" rel="noopener">' +
              '<img src="' +
              escapeAttr(u) +
              '" alt="" loading="lazy"></a>'
            );
          })
          .join("");
      } else {
        galleryEl.hidden = true;
        galleryEl.innerHTML = "";
      }
    }
  } catch (err) {
    console.error("Error cargando ficha de la marca:", err);
  }
}

function renderProductCardHtml(p) {
  if (window.Lpaez && typeof Lpaez.productCardHtml === "function") {
    return Lpaez.productCardHtml(p);
  }
  var name = escapeHtml(p.name || p.nombre || "Producto");
  var slug = p.slug || "";
  return (
    '<article class="product-card catalog-card">' +
    '<div class="product-card-body"><h3><a href="producto.html?slug=' +
    encodeURIComponent(slug) +
    '">' +
    name +
    "</a></h3></div></article>"
  );
}

async function loadBrandProducts(brandIdentifier, brandOrName) {
  var equiposGrid = document.getElementById("brandEquiposGrid");
  var repuestosGrid = document.getElementById("brandRepuestosGrid");
  var equiposSection = document.getElementById("brandEquiposSection");
  var repuestosSection = document.getElementById("brandRepuestosSection");

  var brandName =
    typeof brandOrName === "string"
      ? brandOrName
      : (brandOrName && (brandOrName.nombre || brandOrName.name)) ||
        (document.getElementById("brandTitle") &&
          document.getElementById("brandTitle").textContent) ||
        "";

  if (!equiposGrid || !repuestosGrid) return;

  try {
    var res = await fetch(
      "api/productos.php?brand=" + encodeURIComponent(brandIdentifier),
      { credentials: "same-origin" }
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    var products = await res.json();
    if (products && !Array.isArray(products) && Array.isArray(products.products)) {
      products = products.products;
    }

    if (!Array.isArray(products) || products.length === 0) {
      equiposGrid.innerHTML =
        '<p class="no-products">No hay productos disponibles para esta marca.</p>';
      if (repuestosSection) repuestosSection.style.display = "none";
      if (equiposSection) equiposSection.style.display = "block";
      var eqCountEmpty = document.getElementById("equiposCount");
      var rpCountEmpty = document.getElementById("repuestosCount");
      if (eqCountEmpty) eqCountEmpty.textContent = "0 equipos";
      if (rpCountEmpty) rpCountEmpty.textContent = "0 repuestos";
      return;
    }

    // Filtrar por tipo (fallback sale_mode si tipo no viene)
    var equipos = products.filter(function (p) {
      return productTipoOf(p) === "equipo";
    });
    var repuestos = products.filter(function (p) {
      return productTipoOf(p) === "repuesto";
    });

    // Actualizar títulos
    var eqTitle = document.getElementById("brandEquiposTitle");
    var rpTitle = document.getElementById("brandRepuestosTitle");
    var eqCount = document.getElementById("equiposCount");
    var rpCount = document.getElementById("repuestosCount");
    if (eqTitle) eqTitle.textContent = "Equipos " + brandName;
    if (rpTitle) rpTitle.textContent = "Repuestos y Consumibles " + brandName;
    if (eqCount) eqCount.textContent = equipos.length + " equipos";
    if (rpCount) rpCount.textContent = repuestos.length + " repuestos";

    // Renderizar Equipos
    if (equipos.length > 0) {
      equiposGrid.innerHTML = equipos.map(renderProductCardHtml).join("");
      if (equiposSection) equiposSection.style.display = "block";
    } else if (equiposSection) {
      equiposSection.style.display = "none";
    }

    // Renderizar Repuestos
    if (repuestos.length > 0) {
      repuestosGrid.innerHTML = repuestos.map(renderProductCardHtml).join("");
      if (repuestosSection) repuestosSection.style.display = "block";
    } else if (repuestosSection) {
      repuestosSection.style.display = "none";
    }

    if (window.Lpaez && typeof Lpaez.observeReveals === "function") {
      Lpaez.observeReveals();
    }
  } catch (err) {
    console.error("Error cargando catálogo de la marca:", err);
    equiposGrid.innerHTML =
      '<p class="no-products">No se pudo cargar el catálogo de esta marca.</p>';
    if (repuestosSection) repuestosSection.style.display = "none";
  }
}
