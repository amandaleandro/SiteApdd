const form = document.getElementById("leadForm");
const feedback = document.getElementById("formFeedback");
const blogGrid = document.getElementById("blogGrid");
const blogEmpty = document.getElementById("blogEmpty");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  feedback.textContent = "Enviando...";

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      feedback.textContent = result.error || "Erro ao enviar. Tente novamente.";
      return;
    }

    feedback.textContent = result.message || "Mensagem enviada com sucesso!";
    form.reset();
  } catch (error) {
    feedback.textContent = "Erro de conexão. Tente novamente.";
  }
});

const renderPosts = (posts) => {
  if (!blogGrid || !blogEmpty) return;
  blogGrid.innerHTML = "";
  if (!posts.length) {
    blogEmpty.style.display = "block";
    return;
  }
  blogEmpty.style.display = "none";

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "blog-card";
    const cover = post.coverImage || "/images/2025_APDD_LOGO_COLOR__ALTA_PNG.png";
    card.innerHTML = `
      <img src="${cover}" alt="${post.title}" />
      <div>
        <p class="blog-tag">${post.category || "Tecnologia"}</p>
        <h3>${post.title}</h3>
        <p>${post.excerpt || ""}</p>
        <a href="/post.html?id=${post.id}">Ler artigo completo →</a>
      </div>
    `;
    blogGrid.appendChild(card);
  });
};

const loadPosts = async () => {
  try {
    const response = await fetch("/api/posts?published=1");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Erro ao carregar");
    renderPosts(result.posts || []);
  } catch {
    renderPosts([]);
  }
};

loadPosts();

// Botão voltar ao topo
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTop?.classList.add("visible");
  } else {
    backToTop?.classList.remove("visible");
  }
});

backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Animações ao scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, observerOptions);

document.querySelectorAll(".section, .card, .blog-card, .case-card").forEach((el) => {
  el.classList.add("fade-in");
  observer.observe(el);
});
