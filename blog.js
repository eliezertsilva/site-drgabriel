const POSTS_JSON_URL = "posts.json";

/**
 * Formata uma data no formato 'YYYY-MM-DD' para 'DD de Mês de YYYY'.
 * @param {string} dateString - A data em formato de string.
 * @returns {string} A data formatada.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("pt-BR", options);
}

/**
 * Carrega e exibe a lista de posts na página do blog.
 */
async function loadBlogPosts() {
  const container = document.getElementById("blog-posts-container");
  if (!container) return;

  try {
    const response = await fetch(POSTS_JSON_URL);
    if (!response.ok)
      throw new Error(
        "Não foi possível carregar os posts. Verifique o arquivo posts.json."
      );
    const data = await response.json();
    const posts = data.posts || []; // Os posts estão dentro de um array "posts"

    // Ordena os posts por data, do mais recente para o mais antigo
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!posts || posts.length === 0) {
      container.innerHTML = "<p>Nenhum post encontrado.</p>";
      return;
    }

    container.innerHTML = posts
      .map(
        (post) => `
            <a href="post.html?slug=${post.slug}" class="post-card">
                <div class="post-card-image" style="background-image: url('${post.image}')"></div>
                <div class="post-card-body">
                    <h3>${post.title}</h3>
                    <p>${post.summary}</p>
                </div>
            </a>
        `
      )
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
    const response = await fetch(POSTS_JSON_URL);
    if (!response.ok) throw new Error("Não foi possível carregar o post.");
    const data = await response.json();
    const post = (data.posts || []).find((p) => p.slug === postSlug);

    if (!post) {
      throw new Error("Post não encontrado.");
    }

    document.title = `${post.title} - Dr. Gabriel Marcondes`;
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", post.summary);
    document.getElementById("post-title").textContent = post.title;
    document.getElementById("post-meta").textContent = `Publicado por ${
      post.author
    } em ${formatDate(post.date)}`;
    // O conteúdo já vem em HTML do editor Rich Text
    postContent.innerHTML = post.body;
  } catch (error) {
    postContent.innerHTML = `<p>Ocorreu um erro ao carregar o post. Tente novamente mais tarde.</p>`;
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadBlogPosts();
  loadSinglePost();
});
