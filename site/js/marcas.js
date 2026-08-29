/**
 * marcas.js — hidratación de datos sobre plantilla HTML estática.
 * Catálogo de marca separado en Equipos y Repuestos.
 * Usa api/marcas.php[?slug=] → { marca, todas } o { marcas, brands }.
 */
document.addEventListener("DOMContentLoaded", function () {
  initMarcasPage();
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

/** Prefiere hermano .webp bajo img/{brand,uploads,products,hero,marcas}/.
 *  Devuelve "" si no aplica conversión (ya es webp, externo o ruta no elegible).
 */
function preferWebpUrl(url) {
  var src = String(url || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return "";
  if (
    /(\/|^)img\/(products|hero|uploads|brand|marcas)\//i.test(src) &&
    /\.(jpe?g|png)$/i.test(src)
  ) {
    return src.replace(/\.(jpe?g|png)$/i, ".webp");
  }
  return "";
}

/** <picture> con source webp opcional + img raster (evita 404 de webp en prod). */
function brandLogoPictureHtml(src, alt, placeholder) {
  var raster = String(src || "").trim();
  if (!raster) {
    return (
      '<span class="industrial-brand-card__name">' + escapeHtml(alt || "") + "</span>"
    );
  }
  var webp = preferWebpUrl(raster);
  var ph = placeholder || "img/placeholder-logo.png";
  var onerr =
    "if(!this.dataset.fb){this.dataset.fb=1;this.src='" +
    ph.replace(/'/g, "\\'") +
    "';}else{this.style.display='none';}";
  var img =
    '<img src="' +
    escapeAttr(raster) +
    '" alt="' +
    escapeAttr(alt || "") +
    '" loading="lazy" decoding="async" width="140" height="60" onerror="' +
    onerr +
    '">';
  if (!webp || webp === raster) return img;
  return (
    "<picture>" +
    '<source type="image/webp" srcset="' +
    escapeAttr(webp) +
    '">' +
    img +
    "</picture>"
  );
}

/**
 * Extrae y normaliza el logo de marca (hero + carrusel).
 * Fallbacks: logo_url → imagen_logo → imagen → logo → img/marcas/{slug}.jpg → img/brand/{slug}.png
 */
function resolveBrandLogoUrl(brand) {
  brand = brand || {};
  var slug = String(brand.slug || "").trim();
  var logoUrl =
    brand.logo_url ||
    brand.imagen_logo ||
    brand.imagen ||
    brand.logo ||
    (slug ? "img/marcas/" + slug + ".jpg" : "") ||
    (slug ? "img/brand/" + slug + ".png" : "") ||
    "";
  logoUrl = String(logoUrl || "").trim();
  if (!logoUrl) return "";

  // Absolutos http(s) sin tocar
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
  // Protocol-relative → https
  if (logoUrl.indexOf("//") === 0) return "https:" + logoUrl;

  // Quitar slash inicial (p.ej. /img/brand/sonic-air.png → img/brand/...)
  var logoNormalizado = logoUrl.replace(/^(\/\/|\/)/, "");
  return logoNormalizado;
}

var LOGO_BY_SLUG = {
  "sonic-air-systems": "img/brand/sonic-air.png",
  sonic: "img/brand/sonic-air.png",
  lyc: "img/brand/lyc.png",
  movex: "img/brand/movex.png",
  isodur: "img/brand/isodur.png",
  combi: "img/brand/combi.png",
  haida: "img/brand/haida.png",
  "columbia-machine": "img/uploads/p-57c09a0440925f86.png",
  "columbia-okura": "img/uploads/p-57c09a0440925f86.png",
  "cmc-klebetechnik": "img/uploads/p-4123e04f38ce02ea.png",
};

function resolveBrandLogoWithSlugFallback(brand) {
  var src = resolveBrandLogoUrl(brand);
  var slug = String((brand && brand.slug) || "").trim();
  if (src && !/^img\/marcas\//i.test(src)) return src;
  // Si solo quedó el guess img/marcas/... o vacío, usar mapa local conocido
  if (slug && LOGO_BY_SLUG[slug]) return LOGO_BY_SLUG[slug];
  if (slug) {
    var guess = slug.toLowerCase().replace(/-systems$/i, "");
    if (LOGO_BY_SLUG[guess]) return LOGO_BY_SLUG[guess];
  }
  // img/marcas/{slug}.jpg solo si no hay mejor opción
  return src;
}

function productTipoOf(p) {
  if (!p) return "equipo";
  if (p.tipo === "repuesto" || p.tipo === "equipo") return p.tipo;
  if (p.sale_mode === "buy") return "repuesto";
  return "equipo";
}

function isBrandActive(b) {
  if (!b) return false;
  return (
    b.activo == 1 ||
    b.is_active == 1 ||
    b.activo === true ||
    b.is_active === true ||
    /* listados públicos ya vienen filtrados por activo */
    (b.activo === undefined && b.is_active === undefined)
  );
}

async function initMarcasPage() {
  var urlParams = new URLSearchParams(window.location.search);
  var currentSlug = urlParams.get("slug") || "";

  var selectorContainer =
    document.getElementById("brandSelectorGrid") ||
    document.querySelector(".brand-selector");
  var loaderEl = document.getElementById("brandLoadingText");

  try {
    var url =
      "api/marcas.php" +
      (currentSlug ? "?slug=" + encodeURIComponent(currentSlug) : "");
    var res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("HTTP " + res.status + " al cargar marcas");

    var data = await res.json();

    // Contrato: array plano | { todas|marcas|brands } + opcional { marca }
    var activeBrands = (
      Array.isArray(data)
        ? data
        : data.todas || data.marcas || data.brands || []
    ).filter(isBrandActive);

    var currentBrand = Array.isArray(data)
      ? data[0]
      : data.marca || null;

    if (
      currentBrand &&
      currentSlug &&
      currentBrand.slug &&
      currentBrand.slug !== currentSlug
    ) {
      // slug pedido no coincide; preferir match en listado
      currentBrand =
        activeBrands.find(function (b) {
          return b.slug === currentSlug;
        }) || currentBrand;
    }

    if (!currentBrand && activeBrands.length > 0) {
      currentBrand =
        activeBrands.find(function (b) {
          return b.slug === currentSlug;
        }) ||
        activeBrands.find(function (b) {
          return b.slug === "sonic-air-systems" || /sonic/i.test(b.nombre || b.name || "");
        }) ||
        activeBrands[0];

      if (!currentSlug && currentBrand.slug && history.replaceState) {
        history.replaceState(
          null,
          "",
          "marcas.html?slug=" + encodeURIComponent(currentBrand.slug)
        );
      }
      currentSlug = currentBrand.slug || currentSlug;
    }

    if (!activeBrands.length) {
      if (selectorContainer) {
        selectorContainer.innerHTML =
          '<p class="text-muted empty-state">No hay marcas disponibles actualmente.</p>';
      }
      var eqGridEmpty =
        document.getElementById("brandProductsGrid") ||
        document.getElementById("brandEquiposGrid");
      if (eqGridEmpty) {
        eqGridEmpty.innerHTML =
          '<p class="no-products">No hay marcas activas por ahora.</p>';
      }
      return;
    }

    renderBrandSelector(activeBrands, currentSlug || (currentBrand && currentBrand.slug) || "");

    if (currentBrand) {
      if (loaderEl) loaderEl.style.display = "none";
      updateBrandHero(currentBrand);
      loadBrandDetailExtras(currentBrand.slug);
      loadBrandProducts(
        currentBrand.id || currentBrand.slug,
        currentBrand.nombre || currentBrand.name || currentBrand
      );
    } else {
      var eqGrid =
        document.getElementById("brandProductsGrid") ||
        document.getElementById("brandEquiposGrid");
      var rpSec = document.getElementById("brandRepuestosSection");
      if (eqGrid) {
        eqGrid.innerHTML =
          '<p class="no-products">No hay marcas activas por ahora.</p>';
      }
      if (rpSec) rpSec.style.display = "none";
    }
  } catch (error) {
    console.error("Error en marcas.js:", error);
    if (selectorContainer) {
      selectorContainer.innerHTML =
        '<p class="text-muted">No se pudieron cargar las marcas. Intenta recargar la página.</p>';
    }
    var eqGridErr =
      document.getElementById("brandProductsGrid") ||
      document.getElementById("brandEquiposGrid");
    var rpSecErr = document.getElementById("brandRepuestosSection");
    if (eqGridErr) {
      eqGridErr.innerHTML =
        '<p class="no-products">No se pudieron cargar las marcas. Intenta recargar.</p>';
    }
    if (rpSecErr) rpSecErr.style.display = "none";
  }
}

function renderBrandSelector(brands, activeSlug) {
  var container =
    document.getElementById("brandSelectorGrid") ||
    document.querySelector(".logo-carousel-track.track-marcas-detail") ||
    document.querySelector(".brand-selector");
  if (!container) return;

  var PLACEHOLDER = "img/placeholder-logo.png";
  var list = (brands || []).filter(function (b) {
    var slug = b.slug || "";
    // "Otras marcas": excluir la marca activa de la vista de detalle
    return slug && slug !== activeSlug;
  });
  // Si por algún motivo queda vacío, mostrar todas
  if (!list.length) list = brands || [];

  if (!list.length) {
    container.innerHTML =
      '<p class="empty-state pm-empty-hint">No hay marcas activas por ahora.</p>';
    container.style.animation = "none";
    return;
  }

  var cards = list
    .map(function (b) {
      var slug = b.slug || "";
      var nombre = b.nombre || b.name || slug;
      var logo = resolveBrandLogoWithSlugFallback(b);
      var img = brandLogoPictureHtml(logo, nombre, PLACEHOLDER);
      return (
        '<a href="marcas.html?slug=' +
        encodeURIComponent(slug) +
        '" class="industrial-brand-card" role="listitem" title="' +
        escapeAttr(nombre) +
        '">' +
        img +
        "</a>"
      );
    })
    .join("");

  // Duplicar secuencia para carrusel continuo seamless
  container.innerHTML = cards + cards;
  container.style.animation = "";
  container.classList.add("is-ready");
}

function updateBrandHero(brand) {
  var titleEl = document.getElementById("brandTitle");
  var descEl =
    document.getElementById("brandShortDesc") ||
    document.getElementById("brandDescription");
  var logoEl = document.getElementById("brandHeroLogo");
  var nombre = brand.nombre || brand.name || "";
  var desc =
    brand.descripcion_corta ||
    brand.short_description ||
    brand.descripcion ||
    brand.description ||
    "";
  var slug = brand.slug || "";

  if (titleEl) titleEl.textContent = nombre || "Representaciones y Distribución";
  if (descEl) descEl.textContent = desc;
  var legacyDesc = document.getElementById("brandDescription");
  if (legacyDesc && legacyDesc !== descEl) legacyDesc.textContent = desc;
  document.title = (nombre || "Marca") + " | LPAEZsis";

  if (logoEl) {
    var logoBox = logoEl.closest
      ? logoEl.closest(".brand-intro-logo") ||
        logoEl.closest(".brand-hero-logo-box")
      : logoEl.parentElement;
    var WEBSITE_BY_SLUG = {
      "sonic-air-systems": "https://www.sonicairsystems.com",
      sonic: "https://www.sonicairsystems.com",
    };
    var src = resolveBrandLogoWithSlugFallback(brand);
    var websiteUrl = String(
      brand.website_url || brand.website || brand.url || ""
    ).trim();
    if (!websiteUrl && slug && WEBSITE_BY_SLUG[slug]) {
      websiteUrl = WEBSITE_BY_SLUG[slug];
    }
    if (!websiteUrl && slug) {
      var guessWeb = String(slug).toLowerCase().replace(/-systems$/i, "");
      if (WEBSITE_BY_SLUG[guessWeb]) websiteUrl = WEBSITE_BY_SLUG[guessWeb];
    }

    function unwrapLogoLink() {
      var node = logoEl;
      var pic = logoEl.parentElement;
      if (pic && pic.tagName === "PICTURE") node = pic;
      var parent = node.parentElement;
      if (
        parent &&
        parent.tagName === "A" &&
        parent.classList.contains("brand-logo-link")
      ) {
        parent.parentNode.insertBefore(node, parent);
        parent.remove();
      }
    }

    function ensureLogoLink(href) {
      var node = logoEl;
      if (logoEl.parentElement && logoEl.parentElement.tagName === "PICTURE") {
        node = logoEl.parentElement;
      }
      var parent = node.parentElement;
      var title =
        "Visitar sitio oficial de " + (nombre || slug || "la marca");
      if (
        parent &&
        parent.tagName === "A" &&
        parent.classList.contains("brand-logo-link")
      ) {
        parent.href = href;
        parent.target = "_blank";
        parent.rel = "noopener noreferrer";
        parent.title = title;
        return parent;
      }
      var a = document.createElement("a");
      a.className = "brand-logo-link";
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = title;
      node.parentNode.insertBefore(a, node);
      a.appendChild(node);
      return a;
    }

    function hideHeroLogo() {
      logoEl.onerror = null;
      logoEl.removeAttribute("src");
      logoEl.alt = "";
      logoEl.hidden = true;
      logoEl.style.display = "none";
      unwrapLogoLink();
      if (logoBox) logoBox.hidden = true;
    }
    function showHeroLogo(url) {
      var raster = String(url || "").trim();
      var webp = preferWebpUrl(raster);
      logoEl.onerror = function () {
        if (!logoEl.dataset.fb) {
          logoEl.dataset.fb = "1";
          var alt = slug && LOGO_BY_SLUG[slug] ? LOGO_BY_SLUG[slug] : "";
          if (alt && alt !== raster) {
            logoEl.src = alt;
            return;
          }
        }
        if (logoEl.dataset.fb === "1") {
          logoEl.dataset.fb = "2";
          logoEl.src = "img/placeholder-logo.png";
          return;
        }
        hideHeroLogo();
      };
      logoEl.src = raster;
      logoEl.alt = "Logo " + (nombre || slug || "marca");
      logoEl.hidden = false;
      logoEl.style.display = "";
      if (websiteUrl) ensureLogoLink(websiteUrl);
      else unwrapLogoLink();
      // picture alrededor del <img> (webp opcional; el raster evita huecos si 404)
      if (webp && webp !== raster) {
        var wrapParent = logoEl.parentElement;
        if (wrapParent && wrapParent.tagName !== "PICTURE") {
          var pic = document.createElement("picture");
          var source = document.createElement("source");
          source.type = "image/webp";
          source.srcset = webp;
          wrapParent.insertBefore(pic, logoEl);
          pic.appendChild(source);
          pic.appendChild(logoEl);
        }
      }
      if (logoBox) logoBox.hidden = false;
    }
    if (src) showHeroLogo(src);
    else hideHeroLogo();
  }

  var canonical = document.getElementById("brandCanonical");
  if (canonical && slug) {
    var origin = window.location.origin || "https://prueba1.lpaezsis.cl";
    canonical.setAttribute(
      "href",
      origin + "/marcas.html?slug=" + encodeURIComponent(slug)
    );
  }
  var quoteCta = document.getElementById("brandQuoteCta");
  if (quoteCta && slug) {
    quoteCta.href =
      "contacto.html?empresa=" +
      encodeURIComponent(nombre || slug) +
      "&motivo=cotizacion";
  }

  updateSectionTitles(nombre);
}

function updateSectionTitles(nombre) {
  var eqTitle = document.getElementById("brandEquiposTitle");
  var rpTitle = document.getElementById("brandRepuestosTitle");
  if (eqTitle) {
    eqTitle.textContent = nombre
      ? "Equipos y Soluciones de " + nombre
      : "Equipos y Soluciones";
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

/** Normaliza imagen de equipo/producto: imagen_url | image_url | placeholder. */
function resolveEquipImage(eq) {
  var eqImg = String(
    (eq && (eq.imagen_url || eq.image_url || eq.imagen || eq.image)) ||
      "img/placeholder.jpg"
  ).trim();
  if (!eqImg) eqImg = "img/placeholder.jpg";
  if (/^https?:\/\//i.test(eqImg)) return eqImg;
  if (eqImg.indexOf("//") === 0) return "https:" + eqImg;
  return eqImg.replace(/^(\/\/|\/)/, "") || "img/placeholder.jpg";
}

function renderProductCardHtml(p) {
  var eqImg = resolveEquipImage(p);
  // Propagar URL normalizada para Lpaez.productCardHtml / fallback local
  var normalized = Object.assign({}, p, {
    image_url: eqImg,
    imagen_url: eqImg,
    imagen: eqImg,
  });

  if (window.Lpaez && typeof Lpaez.productCardHtml === "function") {
    return Lpaez.productCardHtml(normalized);
  }
  var name = escapeHtml(normalized.name || normalized.nombre || "Producto");
  var slug = normalized.slug || "";
  var imgSrc = eqImg;
  var webp = preferWebpUrl(eqImg);
  var imgTag =
    '<img src="' +
    escapeAttr(imgSrc) +
    '" alt="' +
    escapeAttr(name) +
    '" loading="lazy" decoding="async" width="480" height="480" ' +
    'onerror="this.onerror=null;this.src=\'img/placeholder.jpg\';">';
  var visual = webp
    ? "<picture><source type=\"image/webp\" srcset=\"" +
      escapeAttr(webp) +
      '">' +
      imgTag +
      "</picture>"
    : imgTag;
  return (
    '<article class="product-card catalog-card">' +
    '<a class="product-card-visual" href="producto.html?slug=' +
    encodeURIComponent(slug) +
    '">' +
    visual +
    "</a>" +
    '<div class="product-card-body"><h3><a href="producto.html?slug=' +
    encodeURIComponent(slug) +
    '">' +
    name +
    "</a></h3></div></article>"
  );
}

async function loadBrandProducts(brandIdentifier, brandOrName) {
  var equiposGrid =
    document.getElementById("brandProductsGrid") ||
    document.getElementById("brandEquiposGrid");
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

    var equipos = products.filter(function (p) {
      return productTipoOf(p) === "equipo";
    });
    var repuestos = products.filter(function (p) {
      return productTipoOf(p) === "repuesto";
    });

    var eqTitle = document.getElementById("brandEquiposTitle");
    var rpTitle = document.getElementById("brandRepuestosTitle");
    var eqCount = document.getElementById("equiposCount");
    var rpCount = document.getElementById("repuestosCount");
    if (eqTitle) {
      eqTitle.textContent = brandName
        ? "Equipos y Soluciones de " + brandName
        : "Equipos y Soluciones";
    }
    if (rpTitle) rpTitle.textContent = "Repuestos y Consumibles " + brandName;
    if (eqCount) eqCount.textContent = equipos.length + " equipos";
    if (rpCount) rpCount.textContent = repuestos.length + " repuestos";

    if (equipos.length > 0) {
      equiposGrid.innerHTML = equipos.map(renderProductCardHtml).join("");
      if (equiposSection) equiposSection.style.display = "block";
    } else if (equiposSection) {
      equiposSection.style.display = "none";
    }

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
