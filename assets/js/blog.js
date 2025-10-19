// URL da sua API REST do WordPress local.
// Corresponde à pasta da sua instalação do WordPress no XAMPP.
const WP_API_BASE_URL = "http://localhost/drgabriel/wp-json/wp/v2";

/**
 * Formata uma data no formato 'YYYY-MM-DD' para 'DD de Mês de YYYY'.
 * @param {string} dateString - A data em formato de string.
 * @returns {string} A data formatada.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  // Define o fuso horário para evitar problemas de data "um dia antes".
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  };
  return date.toLocaleDateString("pt-BR", options);
}

/**
 * Busca posts na API do WordPress.
 * @param {string} [searchTerm=''] - Termo opcional para busca.
 * @returns {Promise<Array>} Uma promessa que resolve para um array de posts.
 */
async function fetchPosts(searchTerm = "") {
  // Adiciona o parâmetro de busca se um termo for fornecido.
  const searchParam = searchTerm
    ? `&search=${encodeURIComponent(searchTerm)}`
    : "";
  const url = `${WP_API_BASE_URL}/posts?_embed&status=publish${searchParam}`;

  try {
    const response = await fetch(url);
    // Se a resposta da rede não for bem-sucedida, lança um erro.
    if (!response.ok) {
      throw new Error("Não foi possível carregar os posts do WordPress.");
    }
    const posts = await response.json();

    return posts;
  } catch (error) {
    // Em caso de erro na rede ou na conversão, exibe no console e retorna uma lista vazia.
    console.error(error);
    return []; // Retorna array vazio em caso de erro
  }
}

/**
 * Renderiza uma lista de posts em um container.
 * @param {Array} posts - Array de posts a serem renderizados.
 * @param {HTMLElement} container - O elemento container onde os posts serão inseridos.
 */
function renderPosts(posts, container) {
  if (!container) return;

  // Se não houver posts, exibe uma mensagem.
  if (posts.length === 0) {
    container.innerHTML = "<p>Nenhum post encontrado para esta busca.</p>";
    return;
  }

  container.innerHTML = posts
    // Mapeia cada objeto de post para um card HTML.
    .map((post) => {
      const imageUrl =
        post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        "assets/images/placeholder-blog.jpg"; // Caminho corrigido
      // Remove tags HTML do resumo para uma exibição mais limpa e segura.
      const summary = post.excerpt.rendered.replace(/<[^>]*>?/gm, "");

      return `
        <a href="post.html?slug=${post.slug}" class="post-card">
            <div class="post-card-image" style="background-image: url('${imageUrl}')"></div>
            <div class="post-card-body">
                <h3>${post.title.rendered}</h3>
                <div>${summary}</div>
            </div>
        </a>
      `;
    })
    .join("");
}

/**
 * Carrega e exibe a lista de posts na página do blog, com destaque.
 */
async function loadBlogPage() {
  const featuredContainer = document.getElementById("featured-post-container");
  const postsContainer = document.getElementById("blog-posts-container");
  if (!postsContainer || !featuredContainer) return;

  // Exibe mensagens de carregamento enquanto os dados são buscados.
  featuredContainer.innerHTML = "<p>Carregando destaque...</p>";
  postsContainer.innerHTML = "<p>Carregando posts...</p>";

  const allPosts = await fetchPosts();

  if (allPosts.length > 0) {
    // Post em destaque (o primeiro da lista)
    const featuredPost = allPosts[0]; // Pega o post mais recente como destaque.
    const featuredImageUrl =
      featuredPost._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
      "assets/images/placeholder-blog.jpg"; // Caminho corrigido
    // Limpa o resumo do post em destaque para evitar erros e garantir consistência.
    const featuredSummary = featuredPost.excerpt.rendered.replace(
      /<[^>]*>?/gm,
      ""
    );

    featuredContainer.innerHTML = `
      <a href="post.html?slug=${featuredPost.slug}" class="featured-post">
        <div class="featured-post-image" style="background-image: url('${featuredImageUrl}')"></div>
        <div class="featured-post-body">
          <h2>${featuredPost.title.rendered}</h2>
          <div>${featuredSummary}</div>
        </div>
      </a>
    `;

    // Renderiza os posts restantes (todos, exceto o primeiro).
    const otherPosts = allPosts.slice(1);
    renderPosts(otherPosts, postsContainer);
  } else {
    // Se nenhum post for retornado pela API.
    featuredContainer.innerHTML = "";
    postsContainer.innerHTML = "<p>Nenhum post encontrado.</p>";
  }

  // Configura o formulário de busca para filtrar os posts.
  const searchForm = document.getElementById("blog-search-form");
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const searchTerm = document.getElementById("blog-search-input").value;
    featuredContainer.style.display = "none"; // Esconde o destaque ao buscar
    postsContainer.innerHTML = `<p>Buscando por "${searchTerm}"...</p>`;
    const searchResults = await fetchPosts(searchTerm);
    renderPosts(searchResults, postsContainer);
  });
}

/**
 * Carrega e exibe o conteúdo de um post individual.
 */
async function loadSinglePost() {
  // Garante que o conteúdo seja exibido apenas quando o post for encontrado.
  const postContent = document.getElementById("post-content");
  if (!postContent) return;

  // Pega o "slug" (identificador do post) da URL da página.
  const params = new URLSearchParams(window.location.search);
  const postSlug = params.get("slug");

  // Se não houver slug na URL, exibe uma mensagem de erro.
  if (!postSlug) {
    // Se nenhum 'slug' for encontrado na URL, exibe uma mensagem de erro clara.
    document.title = "Post não encontrado - Dr. Gabriel Marcondes";
    postContent.innerHTML =
      '<p>Post não encontrado. <a href="blog.html">Voltar para o blog</a>.</p>';
    return;
  }

  try {
    // Busca o post específico pelo seu slug.
    const response = await fetch(
      `${WP_API_BASE_URL}/posts?slug=${postSlug}&_embed`
    );
    if (!response.ok) {
      throw new Error("Não foi possível carregar o post.");
    }
    const posts = await response.json();

    if (!posts || posts.length === 0) {
      throw new Error("Post não encontrado.");
    }

    const post = posts[0];

    // Extrai dados do post para usar na página.
    const authorName =
      post._embedded?.author?.[0]?.name || "Dr. Gabriel Marcondes";
    const summary = post.excerpt.rendered.replace(/<[^>]*>?/gm, ""); // Remove tags HTML do resumo

    // Atualiza o título da página e a meta description
    document.title = `${post.title.rendered} - Dr. Gabriel Marcondes`;
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", summary);

    // Insere o título, metadados e conteúdo do post no HTML.
    const postTitleEl = document.getElementById("post-title");
    if (postTitleEl) postTitleEl.innerHTML = post.title.rendered;

    const postMetaEl = document.getElementById("post-meta");
    if (postMetaEl)
      postMetaEl.textContent = `Publicado por ${authorName} em ${formatDate(
        post.date
      )}`;

    // O conteúdo principal do post já vem formatado em HTML do WordPress.
    postContent.innerHTML = post.content.rendered;
  } catch (error) {
    postContent.innerHTML = `<p>Ocorreu um erro ao carregar o post. Tente novamente mais tarde.</p>`;
    console.error(error);
  }
}

// Executa as funções quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  // Verifica em qual página estamos para chamar a função correta
  if (document.getElementById("post-content")) {
    loadSinglePost();
  } else if (document.getElementById("blog-posts-container")) {
    // Garante que só rode na página principal do blog
    loadBlogPage();
  }
});
