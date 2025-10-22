document.addEventListener("DOMContentLoaded", () => {
  // Lógica para o sistema de abas
  const tabLinks = document.querySelectorAll(".admin-nav .tab-link");
  const tabContents = document.querySelectorAll(".tab-content");

  function switchTab(tabId) {
    // Remove a classe 'active' de todos os links e painéis
    tabLinks.forEach((l) => {
      l.classList.remove("active");
      l.setAttribute("aria-selected", "false");
    });
    tabContents.forEach((c) => c.classList.remove("active"));

    // Adiciona a classe 'active' ao link e ao painel correspondentes
    const linkToActivate = document.querySelector(
      `.tab-link[data-tab="${tabId}"]`
    );
    const panelToActivate = document.getElementById(tabId);

    if (linkToActivate && panelToActivate) {
      linkToActivate.classList.add("active");
      linkToActivate.setAttribute("aria-selected", "true");
      panelToActivate.classList.add("active");
    }
  }

  tabLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const tabId = link.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // --- Auth Check ---
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/login.html";
    return; // Stop script execution
  }

  // --- Element Selectors ---
  const postsListContainer = document.getElementById("posts-list-container");
  const goToCreateBtn = document.getElementById("go-to-create-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // User form
  const addUserForm = document.getElementById("add-user-form");
  const newUsernameInput = document.getElementById("new-username");
  const newPasswordInput = document.getElementById("new-password");
  const userListContainer = document.getElementById("user-list-container");

  const API_BASE_URL = "/api";

  // --- Helper Functions ---

  /**
   * Exibe uma mensagem de toast na tela.
   * @param {string} message - A mensagem a ser exibida.
   * @param {string} type - O tipo de toast ('success' ou 'error').
   * @param {number} duration - A duração em milissegundos.
   */
  function showToast(message, type = "success", duration = 4000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger the animation
    setTimeout(() => toast.classList.add("show"), 10);

    // Hide and remove the toast after the duration
    setTimeout(() => {
      toast.classList.remove("show");
      toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
  }

  // Authenticated fetch
  async function fetchAuth(url, options = {}) {
    const headers = { ...options.headers, Authorization: `Bearer ${token}` };
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("authToken");
      window.location.href = "/login.html";
      throw new Error("Authentication failed");
    }
    return response;
  }

  // --- Post Management ---
  async function loadPosts() {
    try {
      const response = await fetch(`${API_BASE_URL}/posts`); // Use fetch normal, pois a rota é pública
      if (!response.ok) throw new Error("Failed to fetch posts");
      const posts = await response.json();

      postsListContainer.innerHTML = "";
      posts.forEach((post) => {
        const postItem = document.createElement("div");
        postItem.className = "post-item";
        postItem.innerHTML = `
                    <span class="post-item-title">${post.title}</span>
                    <div class="post-actions">
                        <button class="btn btn-primary edit-post-btn" data-slug="${post.slug}" aria-label="Editar post: ${post.title}">Editar</button>
                        <button class="btn btn-danger delete-post-btn" data-slug="${post.slug}" aria-label="Excluir post: ${post.title}">Excluir</button>
                    </div>
                `;
        postsListContainer.appendChild(postItem);
      });
    } catch (error) {
      postsListContainer.innerHTML = `<p>Erro ao carregar posts: ${error.message}</p>`;
    }
  }

  // --- User Management ---
  async function loadUsers() {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const users = await response.json();

      userListContainer.innerHTML = "";
      users.forEach((user) => {
        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.innerHTML = `
                    <span>${user.username}</span>
                    <div class="user-actions">
                    ${
                      user.username !== "Gabriel" // Agora esconde o botão para o usuário "Gabriel" (com G maiúsculo)
                        ? `<button class="btn btn-danger delete-user-btn" data-username="${user.username}" aria-label="Excluir usuário: ${user.username}">Excluir</button>`
                        : ""
                    }
                    </div>
                `;
        userListContainer.appendChild(userItem);
      });
    } catch (error) {
      userListContainer.innerHTML = `<p>Erro ao carregar usuários: ${error.message}</p>`;
    }
  }

  // --- Event Listeners ---

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login.html";
  });

  // Go to create post button
  goToCreateBtn.addEventListener("click", () => {
    window.location.href = "/editor.html";
  });

  // Post list clicks (edit/delete)
  postsListContainer.addEventListener("click", async (e) => {
    const target = e.target;
    const slug = target.dataset.slug;

    if (target.classList.contains("edit-post-btn")) {
      window.location.href = `/editor.html?slug=${slug}`;
    }

    if (target.classList.contains("delete-post-btn")) {
      const postItem = target.closest(".post-item");
      const postTitle = postItem
        ? postItem.querySelector(".post-item-title").textContent
        : "este post"; // Obtém o título do post
      if (
        confirm(`Tem certeza que deseja excluir o post "${postTitle}"?`) // Usa o título na mensagem
      ) {
        try {
          const response = await fetchAuth(`${API_BASE_URL}/posts/${slug}`, {
            method: "DELETE",
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Failed to delete post");
          }
          showToast(data.message);
          await loadPosts();
        } catch (error) {
          showToast(`Erro ao excluir post: ${error.message}`, "error");
        }
      }
    }
  });

  // Add user form submission
  addUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = newUsernameInput.value;
    const password = newPasswordInput.value;

    try {
      const response = await fetchAuth(`${API_BASE_URL}/users`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create user");
      }
      showToast(`Usuário "${username}" criado com sucesso.`);
      addUserForm.reset();
      await loadUsers();
    } catch (error) {
      showToast(`Erro ao criar usuário: ${error.message}`, "error");
    }
  });

  // User list clicks (delete)
  userListContainer.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-user-btn")) {
      const username = e.target.dataset.username;
      if (confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) {
        try {
          const response = await fetchAuth(
            `${API_BASE_URL}/users/${username}`,
            { method: "DELETE" }
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Failed to delete user");
          }
          showToast(data.message);
          await loadUsers();
        } catch (error) {
          showToast(`Erro ao excluir usuário: ${error.message}`, "error");
        }
      }
    }
  });

  // --- Initial Load ---
  loadPosts();
  loadUsers();
});
