// URL da sua API REST do WordPress local.
// A URL deve corresponder à pasta da sua instalação do WordPress no XAMPP.
const WP_API_BASE_URL = "http://localhost/drgabriel/wp-json/wp/v2";

/**
 * Formata uma data no formato 'YYYY-MM-DD' para 'DD de Mês de YYYY'.
 * @param {string} dateString - A data em formato de string.
 * @returns {string} A data formatada.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  // Adiciona o fuso horário para evitar problemas de data "um dia antes"
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  };
  return date.toLocaleDateString("pt-BR", options);
}

/**
 * Carrega e exibe a lista de posts na página do blog.
 */
async function loadBlogPosts() {
  const container = document.getElementById("blog-posts-container");
  if (!container) return;

  container.innerHTML = "<p>Carregando posts...</p>";

  try {
    // Busca os posts da API do WordPress. `_embed` inclui dados relacionados como imagem destacada e autor.
    const response = await fetch(`${WP_API_BASE_URL}/posts?_embed`);
    if (!response.ok) {
      throw new Error("Não foi possível carregar os posts do WordPress.");
    }
    const posts = await response.json();

    if (!posts || posts.length === 0) {
      container.innerHTML = "<p>Nenhum post encontrado.</p>";
      return;
    }

    container.innerHTML = posts
      .map((post) => {
        // Pega a imagem destacada do objeto `_embedded`
        const imageUrl =
          post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
          "assets/img/placeholder.jpg";
        const summary = post.excerpt.rendered;

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
  } catch (error) {
    container.innerHTML = `<p>Ocorreu um erro ao carregar o blog. Tente novamente mais tarde.</p>`;
    console.error(error);
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

  if (!postSlug) {
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

    // Pega o autor e o resumo (excerpt) do post
    const authorName =
      post._embedded?.author?.[0]?.name || "Dr. Gabriel Marcondes";
    const summary = post.excerpt.rendered.replace(/<[^>]*>?/gm, ""); // Remove tags HTML do resumo

    // Atualiza o título da página e a meta description
    document.title = `${post.title.rendered} - Dr. Gabriel Marcondes`;
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", summary);

    // Atualiza os elementos na página com o conteúdo do post
    const postTitleEl = document.getElementById("post-title");
    if (postTitleEl) postTitleEl.innerHTML = post.title.rendered;

    const postMetaEl = document.getElementById("post-meta");
    if (postMetaEl)
      postMetaEl.textContent = `Publicado por ${authorName} em ${formatDate(
        post.date
      )}`;

    // O conteúdo do post já vem em HTML do WordPress
    postContent.innerHTML = post.content.rendered;
  } catch (error) {
    postContent.innerHTML = `<p>Ocorreu um erro ao carregar o post. Tente novamente mais tarde.</p>`;
    console.error(error);
  }
}

// Executa as funções quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  // Verifica em qual página estamos para chamar a função correta
  if (document.getElementById("blog-posts-container")) {
    loadBlogPosts();
  }
  if (document.getElementById("post-content")) {
    loadSinglePost();
  }
});
