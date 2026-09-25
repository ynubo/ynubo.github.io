const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const toTop = document.getElementById("toTop");
const topbar = document.querySelector(".topbar");

const savedTheme = localStorage.getItem("ynubo-theme");
if (savedTheme === "light") body.classList.add("light");

themeToggle.addEventListener("click", () => {
  body.classList.toggle("light");
  localStorage.setItem("ynubo-theme", body.classList.contains("light") ? "light" : "dark");
});

window.addEventListener("scroll", () => {
  topbar.classList.toggle("scrolled", window.scrollY > 8);
  toTop.classList.toggle("visible", window.scrollY > 500);
}, { passive: true });

toTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".nav-item")];

const observer = new IntersectionObserver(entries => {
  const visible = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) return;

  navLinks.forEach(link => link.classList.remove("active"));
  const current = document.querySelector(`.nav-item[href="#${visible.target.id}"]`);
  if (current) current.classList.add("active");
}, { rootMargin: "-35% 0px -55% 0px", threshold: [0, .2, .5, 1] });

sections.forEach(section => observer.observe(section));
