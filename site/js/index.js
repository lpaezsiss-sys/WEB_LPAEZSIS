/**
 * Home — carrusel de productos destacados
 */
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function getScroller() {
    var track = $("featuredProductsTrack");
    if (!track) return null;
    var wrapper = track.closest(".products-carousel-wrapper");
    return wrapper || track;
  }

  function updateButtons(scroller, prev, next) {
    if (!scroller || !prev || !next) return;
    var max = Math.max(0, scroller.scrollWidth - scroller.clientWidth - 2);
    prev.disabled = scroller.scrollLeft <= 2;
    next.disabled = scroller.scrollLeft >= max;
  }

  function cardStep(scroller) {
    var track = $("featuredProductsTrack");
    var card = track && track.querySelector(".product-card, article");
    if (!card) return Math.max(240, Math.floor(scroller.clientWidth * 0.85));
    var gap = 20;
    if (track) {
      var style = window.getComputedStyle(track);
      gap = parseFloat(style.columnGap || style.gap || "20") || 20;
    }
    return card.getBoundingClientRect().width + gap;
  }

  function initFeaturedCarousel() {
    var track = $("featuredProductsTrack");
    var prev = $("featuredPrev");
    var next = $("featuredNext");
    var scroller = getScroller();
    if (!track || !prev || !next || !scroller) return;

    function refresh() {
      updateButtons(scroller, prev, next);
    }

    prev.addEventListener("click", function () {
      scroller.scrollBy({ left: -cardStep(scroller), behavior: "smooth" });
    });
    next.addEventListener("click", function () {
      scroller.scrollBy({ left: cardStep(scroller), behavior: "smooth" });
    });

    scroller.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("resize", refresh);

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next.click();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev.click();
      }
    });

    window.__lpaezFeaturedCarouselRefresh = refresh;
    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFeaturedCarousel);
  } else {
    initFeaturedCarousel();
  }
})();
