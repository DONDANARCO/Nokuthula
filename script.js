const topbar = document.querySelector(".topbar");
const revealTargets = document.querySelectorAll(".section, .card, .hero-card, .gallery img, .footer");

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

const carousel = document.querySelector("[data-carousel]");
if (carousel) {
  const track = carousel.querySelector("[data-carousel-track]");
  const slides = Array.from(track.children);
  let index = 0;

  const renderCarousel = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
  };

  let autoplay = setInterval(() => {
    index = (index + 1) % slides.length;
    renderCarousel();
  }, 5000);

  carousel.addEventListener("mouseenter", () => clearInterval(autoplay));
  carousel.addEventListener("mouseleave", () => {
    autoplay = setInterval(() => {
      index = (index + 1) % slides.length;
      renderCarousel();
    }, 5000);
  });

  renderCarousel();
}
