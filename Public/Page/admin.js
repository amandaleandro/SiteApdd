const loginForm = document.getElementById("loginForm");
const loginFeedback = document.getElementById("loginFeedback");
const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const logoutBtn = document.getElementById("logoutBtn");
const postForm = document.getElementById("postForm");
const postFeedback = document.getElementById("postFeedback");
const postsList = document.getElementById("postsList");
const leadsList = document.getElementById("leadsList");
const totalLeads = document.getElementById("totalLeads");
const leadsWeek = document.getElementById("leadsWeek");
const publishedPosts = document.getElementById("publishedPosts");
const totalPosts = document.getElementById("totalPosts");
const exportBtn = document.getElementById("exportBtn");
const leadsChart = document.getElementById("leadsChart");

let chartInstance = null;

const TOKEN_KEY = "apdd_blog_token";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const showDashboard = () => {
  loginCard.hidden = true;
  dashboard.hidden = false;
};

const showLogin = () => {
  loginCard.hidden = false;
  dashboard.hidden = true;
};

const api = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    clearToken();
    showLogin();
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro");
  return data;
};

const loadPosts = async () => {
  try {
    const data = await api("/api/posts");
    postsList.innerHTML = "";
    data.posts.forEach((post) => {
      const item = document.createElement("div");
      item.className = "admin-post";
      item.innerHTML = `
        <h4>${post.title}</h4>
        <p>${post.excerpt || ""}</p>
        <small>${post.published ? "Publicado" : "Rascunho"}</small>
        <div class="admin-post-actions">
          <button class="btn btn-ghost" data-edit>Editar</button>
          <button class="btn btn-ghost" data-toggle>${post.published ? "Despublicar" : "Publicar"}</button>
          <button class="btn btn-dark" data-delete>Excluir</button>
        </div>
      `;

      item.querySelector("[data-edit]").addEventListener("click", () => fillForm(post));
      item.querySelector("[data-toggle]").addEventListener("click", () => togglePost(post));
      item.querySelector("[data-delete]").addEventListener("click", () => deletePost(post));
      postsList.appendChild(item);
    });
  } catch (error) {
    postsList.innerHTML = `<p>${error.message}</p>`;
  }
};

const loadLeads = async () => {
  try {
    const data = await api("/api/admin/leads");
    leadsList.innerHTML = "";
    if (!data.leads.length) {
      leadsList.innerHTML = "<p>Nenhum lead recebido ainda.</p>";
      return;
    }
    data.leads.forEach((lead) => {
      const item = document.createElement("div");
      item.className = "lead-card";
      const date = new Date(lead.created_at).toLocaleString("pt-BR");
      item.innerHTML = `
        <h4>${lead.name} ${lead.company ? `• ${lead.company}` : ""}</h4>
        <p>📧 ${lead.email}</p>
        <div class="lead-message">${lead.message}</div>
        <small>Recebido em ${date}</small>
      `;
      leadsList.appendChild(item);
    });
  } catch (error) {
    leadsList.innerHTML = `<p>${error.message}</p>`;
  }
};

const loadStats = async () => {
  try {
    const data = await api("/api/admin/stats");
    totalLeads.textContent = data.stats.totalLeads;
    leadsWeek.textContent = data.stats.leadsLastWeek;
    publishedPosts.textContent = data.stats.publishedPosts;
    totalPosts.textContent = data.stats.totalPosts;
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error);
  }
};

const loadChart = async () => {
  try {
    const data = await api("/api/admin/chart-data");
    
    if (chartInstance) chartInstance.destroy();
    
    const ctx = leadsChart.getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.chartData.labels,
        datasets: [{
          label: "Leads por dia (últimos 30 dias)",
          data: data.chartData.values,
          borderColor: "#5b7cfa",
          backgroundColor: "rgba(91, 124, 250, 0.1)",
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  } catch (error) {
    console.error("Erro ao carregar gráfico:", error);
  }
};

const fillForm = (post) => {
  postForm.dataset.editId = post.id;
  postForm.title.value = post.title;
  postForm.excerpt.value = post.excerpt || "";
  postForm.category.value = post.category || "";
  postForm.coverImage.value = post.coverImage || "";
  postForm.content.value = post.content || "";
  postForm.published.checked = Boolean(post.published);
};

const resetForm = () => {
  postForm.reset();
  delete postForm.dataset.editId;
};

const togglePost = async (post) => {
  await api(`/api/admin/posts/${post.id}`, {
    method: "PUT",
    body: JSON.stringify({ published: !post.published })
  });
  await loadPosts();
};

const deletePost = async (post) => {
  if (!confirm("Deseja excluir este post?")) return;
  await api(`/api/admin/posts/${post.id}`, { method: "DELETE" });
  await loadPosts();
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginFeedback.textContent = "Entrando...";
  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setToken(data.token);
    loginFeedback.textContent = "";
    showDashboard();
    await Promise.all([loadStats(), loadChart(), loadLeads(), loadPosts()]);
  } catch (error) {
    loginFeedback.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", () => {
  clearToken();
  showLogin();
});

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  postFeedback.textContent = "Salvando...";
  const formData = new FormData(postForm);
  const payload = Object.fromEntries(formData.entries());
  payload.published = Boolean(payload.published);

  try {
    const editId = postForm.dataset.editId;
    if (editId) {
      await api(`/api/admin/posts/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await api("/api/admin/posts", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
    postFeedback.textContent = "Post salvo!";
    resetForm();
    await Promise.all([loadStats(), loadPosts()]);
  } catch (error) {
    postFeedback.textContent = error.message;
  }
});

if (getToken()) {
  showDashboard();
  Promise.all([loadStats(), loadChart(), loadLeads(), loadPosts()]);
}

exportBtn?.addEventListener("click", () => {
  const token = getToken();
  window.location.href = `/api/admin/leads/export?token=${token}`;
});
