const topbar = document.querySelector(".topbar");
const revealTargets = document.querySelectorAll(".section, .card, .hero-card, .gallery img, .footer");

async function hydrateEditableContent() {
  try {
    const response = await fetch("/api/content");
    if (!response.ok) return;

    const data = await response.json();
    const content = data.content || {};

    Object.entries(content).forEach(([key, value]) => {
      if (typeof value !== "string") return;
      const el = document.querySelector(`[data-edit-key="${key}"]`);
      if (el) {
        if (el.tagName === "A" && key.toLowerCase().includes("link")) {
          el.setAttribute("href", value.trim());
        } else {
          el.textContent = value;
        }
      }

      const srcEl = document.querySelector(`[data-edit-key-src="${key}"]`);
      if (srcEl && value.trim()) {
        srcEl.setAttribute("src", value.trim());
        const video = srcEl.closest("video");
        if (video) video.load();
      }
    });

    const pageName = (() => {
      const path = window.location.pathname;
      if (path === "/" || path === "") return "index.html";
      return path.split("/").pop() || "index.html";
    })();

    const selectorOverrides =
      (content.selectorOverrides && content.selectorOverrides[pageName]) || {};

    Object.entries(selectorOverrides).forEach(([selector, value]) => {
      if (typeof value !== "string") return;
      const el = document.querySelector(selector);
      if (!el) return;
      el.textContent = value;
    });
  } catch {
    // Keep default page copy when API is unavailable.
  }
}

hydrateEditableContent();

const updateTopbar = () => {
  if (!topbar) return;
  topbar.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateTopbar();
window.addEventListener("scroll", updateTopbar, { passive: true });

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealTargets.forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
}

const autoCarousels = document.querySelectorAll("[data-auto-carousel]");
autoCarousels.forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  if (!track) return;

  const slides = Array.from(track.children);
  if (slides.length <= 1) return;

  const intervalMs = Number(carousel.getAttribute("data-interval")) || 5000;
  let index = 0;

  const renderCarousel = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
  };

  const startAutoplay = () =>
    setInterval(() => {
      index = (index + 1) % slides.length;
      renderCarousel();
    }, intervalMs);

  let autoplay = startAutoplay();

  carousel.addEventListener("mouseenter", () => clearInterval(autoplay));
  carousel.addEventListener("mouseleave", () => {
    clearInterval(autoplay);
    autoplay = startAutoplay();
  });

  renderCarousel();
});
