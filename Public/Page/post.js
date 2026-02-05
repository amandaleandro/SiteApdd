const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");
const postContent = document.getElementById("postContent");
const postTitle = document.getElementById("postTitle");
const postDescription = document.getElementById("postDescription");
const shareLinkedin = document.getElementById("shareLinkedin");
const shareTwitter = document.getElementById("shareTwitter");
const shareWhatsapp = document.getElementById("shareWhatsapp");

if (!postId) {
  postContent.innerHTML = '<div class="post-loading">Post não encontrado. <a href="/">Voltar ao site</a></div>';
} else {
  loadPost();
}

async function loadPost() {
  try {
    const response = await fetch(`/api/posts/${postId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erro ao carregar post");
    }

    const post = result.post;
    const date = new Date(post.createdAt).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    postTitle.textContent = `${post.title} - APDD`;
    postDescription.setAttribute("content", post.excerpt || post.title);

    const cover = post.coverImage ? `<img src="${post.coverImage}" alt="${post.title}" class="post-cover" />` : "";

    postContent.innerHTML = `
      <h1>${post.title}</h1>
      <div class="post-meta">
        <span class="post-category">${post.category || "Tecnologia"}</span>
        <span>${date}</span>
      </div>
      ${cover}
      <div class="post-content">
        ${formatContent(post.content)}
      </div>
    `;

    const currentUrl = window.location.href;
    const text = encodeURIComponent(post.title);
    const url = encodeURIComponent(currentUrl);

    shareLinkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    shareTwitter.href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    shareWhatsapp.href = `https://wa.me/?text=${text}%20${url}`;

  } catch (error) {
    postContent.innerHTML = `<div class="post-loading">Erro ao carregar post. <a href="/">Voltar ao site</a></div>`;
  }
}

function formatContent(content) {
  return content
    .split("\n")
    .map((line) => {
      line = line.trim();
      if (!line) return "<br>";
      if (line.startsWith("# ")) return `<h2>${line.slice(2)}</h2>`;
      if (line.startsWith("## ")) return `<h3>${line.slice(3)}</h3>`;
      if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
      return `<p>${line}</p>`;
    })
    .join("\n")
    .replace(/(<li>.*<\/li>\n)+/g, (match) => `<ul>${match}</ul>`);
}
