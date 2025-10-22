// Define a URL base para a nossa API local.
const API_BASE_URL = "/api/posts";

/**
 * Formata uma data no formato 'YYYY-MM-DD' para 'DD de Mês de YYYY'.
 * @param {string} dateString - A data em formato de string.
 * @returns {string} A data formatada.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  };
  return date.toLocaleDateString("pt-BR", options);
}

/**
 * Busca posts na API local.
 * @returns {Promise<Array>} Uma promessa que resolve para um array de posts.
 */
async function fetchPosts() {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`Erro na rede: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Falha ao buscar posts:", error);
    return [];
  }
}

/**
 * Renderiza uma lista de posts em um container HTML.
 * @param {Array} posts - Array de posts a serem renderizados.
 * @param {HTMLElement} container - O elemento container onde os posts serão inseridos.
 */
function renderPosts(posts, container) {
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = "<p>Nenhum post encontrado.</p>";
    return;
  }

  container.innerHTML = posts
    .map((post) => {
      const imageUrl = post.imageUrl || "assets/images/placeholder-blog.jpg";
      const summary =
        post.summary ||
        post.content.substring(0, 100).replace(/<[^>]*>?/gm, "") + "...";

      const tagsHtml =
        post.tags && post.tags.length > 0
          ? `<div class="tags-container">
              ${post.tags
                .map((tag) => `<span class="tag">${tag}</span>`)
                .join("")}
           </div>`
          : "";

      return `
        <a href="post.html?slug=${post.slug}" class="post-card">
            <div class="post-card-image" style="background-image: url('${imageUrl}')"></div>
            <div class="post-card-body">
                ${tagsHtml}
                <h3>${post.title}</h3>
                <div>${summary}</div>
            </div>
        </a>
      `;
    })
    .join("");
}

let allPostsCache = [];
let currentPage = 1;
const postsPerPage = 6; // Defina quantos posts por página

/**
 * Exibe uma página específica de posts.
 * @param {number} page - O número da página a ser exibida.
 * @param {Array} posts - O array completo de posts.
 */
function displayPage(page, posts) {
  currentPage = page;
  const container = document.getElementById("blog-posts-container");
  if (!container) return;

  const start = (page - 1) * postsPerPage;
  const end = start + postsPerPage;
  const paginatedPosts = posts.slice(start, end);

  renderPosts(paginatedPosts, container);
  setupPagination(posts);
  window.scrollTo({ top: container.offsetTop - 100, behavior: "smooth" });
}

/**
 * Configura e renderiza os controles de paginação.
 * @param {Array} posts - O array completo de posts para calcular o total de páginas.
 */
function setupPagination(posts) {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) return;

  const pageCount = Math.ceil(posts.length / postsPerPage);
  paginationContainer.innerHTML = "";

  if (pageCount <= 1) return; // Não mostra paginação se houver apenas 1 página

  // Botão "Anterior"
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "&laquo; Anterior";
  prevButton.className = "pagination-btn";
  if (currentPage === 1) prevButton.classList.add("disabled");
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      displayPage(currentPage - 1, posts);
    }
  });
  paginationContainer.appendChild(prevButton);

  // Números das páginas
  for (let i = 1; i <= pageCount; i++) {
    const pageNumberButton = document.createElement("button");
    pageNumberButton.textContent = i;
    pageNumberButton.className = "page-number";
    if (i === currentPage) pageNumberButton.classList.add("active");
    pageNumberButton.addEventListener("click", () => displayPage(i, posts));
    paginationContainer.appendChild(pageNumberButton);
  }

  // Botão "Próximo"
  const nextButton = document.createElement("button");
  nextButton.innerHTML = "Próximo &raquo;";
  nextButton.className = "pagination-btn";
  if (currentPage === pageCount) nextButton.classList.add("disabled");
  nextButton.addEventListener("click", () => {
    if (currentPage < pageCount) {
      displayPage(currentPage + 1, posts);
    }
  });
  paginationContainer.appendChild(nextButton);
}

/**
 * Carrega e exibe os posts na página principal do blog.
 */
async function loadBlogPage() {
  const featuredContainer = document.getElementById("featured-post-container");
  const postsContainer = document.getElementById("blog-posts-container");
  if (!postsContainer || !featuredContainer) return;

  featuredContainer.innerHTML = "<p>Carregando destaque...</p>";
  postsContainer.innerHTML = "<p>Carregando posts...</p>";

  allPostsCache = await fetchPosts();
  const allPosts = allPostsCache;

  if (allPosts.length > 0) {
    const featuredPost = allPosts[0];
    const featuredImageUrl =
      featuredPost.imageUrl || "assets/images/placeholder-blog.jpg";
    const featuredSummary =
      featuredPost.summary ||
      featuredPost.content.substring(0, 150).replace(/<[^>]*>?/gm, "") + "...";

    featuredContainer.innerHTML = `
      <a href="post.html?slug=${featuredPost.slug}" class="featured-post">
        <div class="featured-post-image" style="background-image: url('${featuredImageUrl}')"></div>
        <div class="featured-post-body">
          <h2>${featuredPost.title}</h2>
          <div>${featuredSummary}</div>
        </div>
      </a>
    `;

    const otherPosts = allPosts.slice(1);
    displayPage(1, otherPosts); // Exibe a primeira página dos outros posts
  } else {
    featuredContainer.innerHTML = "";
    postsContainer.innerHTML = "<p>Nenhum post foi encontrado.</p>";
  }

  const searchForm = document.getElementById("blog-search-form");
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const searchTerm = document
      .getElementById("blog-search-input")
      .value.toLowerCase();
    featuredContainer.style.display = "none";
    postsContainer.innerHTML = `<p>Buscando por "${searchTerm}"...</p>`;

    const filteredPosts = allPostsCache.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        (post.tags &&
          post.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
    );

    displayPage(1, filteredPosts); // Exibe a primeira página dos resultados da busca
  });
}

/**
 * Renderiza o conteúdo de um post na página.
 * @param {object} post - O objeto do post com title, content, author, etc.
 */
function renderPostContent(post) {
  const authorName = post.author || "Dr. Gabriel Marcondes";
  const summary =
    post.summary ||
    (post.content
      ? post.content.substring(0, 160).replace(/<[^>]*>?/gm, "")
      : "");

  document.title = `${post.title} - Dr. Gabriel Marcondes`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", summary);
  }

  const postTitleEl = document.getElementById("post-title");
  if (postTitleEl) postTitleEl.innerHTML = post.title;

  const postMetaEl = document.getElementById("post-meta");
  if (postMetaEl) {
    postMetaEl.textContent = `Publicado por ${authorName} em ${formatDate(
      post.date
    )}`;
  }

  const postTagsContainer = document.getElementById("post-tags-container");
  if (postTagsContainer) {
    if (post.tags && post.tags.length > 0) {
      postTagsContainer.innerHTML = post.tags
        .map(
          (tag) =>
            `<a href="blog.html?tag=${encodeURIComponent(
              tag
            )}" class="tag">${tag}</a>`
        )
        .join("");
    } else {
      postTagsContainer.innerHTML = "";
    }
  }

  const postContentEl = document.getElementById("post-content");
  if (postContentEl) {
    let contentHtml = "";
    // Use post.imageUrl for preview, post.image for saved posts
    const coverImage = post.imageUrl || post.image;
    if (coverImage) {
      contentHtml += `<img src="${post.imageUrl}" alt="${post.title}" class="post-cover-image">`;
    }
    contentHtml += post.content;
    postContentEl.innerHTML = contentHtml;
  }
}

/**
 * Carrega e exibe o conteúdo de um post individual.
 */
async function loadSinglePost() {
  const postContent = document.getElementById("post-content");
  if (!postContent) return;

  const params = new URLSearchParams(window.location.search);
  const postSlug = params.get("slug");
  const tagFilter = params.get("tag");
  const isPreview = params.get("preview") === "true";

  if (isPreview) {
    const previewData = sessionStorage.getItem("postPreviewData");
    if (previewData) {
      const post = JSON.parse(previewData);
      document.title = `[PREVIEW] ${post.title} - Dr. Gabriel Marcondes`;
      renderPostContent(post);
    } else {
      postContent.innerHTML =
        "<p>Nenhum dado de preview encontrado. Volte e tente novamente.</p>";
    }
    return;
  }

  // This logic is for blog.html, but we centralize it here
  if (tagFilter) {
    const postsContainer = document.getElementById("blog-posts-container");
    const featuredContainer = document.getElementById(
      "featured-post-container"
    );
    if (postsContainer) {
      document.title = `Posts sobre "${tagFilter}" - Dr. Gabriel Marcondes`;
      if (featuredContainer) featuredContainer.style.display = "none";
      postsContainer.innerHTML = `<p>Buscando posts com a tag "${tagFilter}"...</p>`;
      const allPosts = await fetchPosts();
      const filteredPosts = allPosts.filter(
        (p) =>
          p.tags &&
          p.tags.map((t) => t.toLowerCase()).includes(tagFilter.toLowerCase())
      );
      renderPosts(filteredPosts, postsContainer);
    }
    return;
  }

  if (!postSlug) {
    document.title = "Post não encontrado - Dr. Gabriel Marcondes";
    postContent.innerHTML =
      '<p>Post não encontrado. <a href="blog.html">Voltar para o blog</a>.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${postSlug}`);
    if (!response.ok) throw new Error("Não foi possível carregar o post.");
    const post = await response.json();

    if (!post) throw new Error("Post não encontrado.");

    renderPostContent(post);
  } catch (error) {
    console.error("Falha ao carregar o post:", error);
    postContent.innerHTML = `<p>Ocorreu um erro ao carregar o post. Tente novamente mais tarde.</p>`;
  }
}

// Executa a função correta dependendo da página atual.
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("post-content")) {
    loadSinglePost();
  } else if (document.getElementById("blog-posts-container")) {
    const params = new URLSearchParams(window.location.search);
    const tagFilter = params.get("tag");
    if (tagFilter) {
      loadSinglePost(); // Re-route to the tag filtering logic inside loadSinglePost
    } else {
      loadBlogPage();
    }
  }
});
