const POSTS_INDEX_URL = "posts-index.json";
const POSTS_DIR = "_posts/";

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
 * Extrai o slug do nome do arquivo.
 * Ex: "2024-05-25-meu-post.json" -> "meu-post"
 * @param {string} filename - O nome do arquivo do post.
 * @returns {string} O slug do post.
 */
function getSlugFromFilename(filename) {
  // Remove a data (YYYY-MM-DD-) e a extensão (.json)
  return filename.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.json$/, "");
}

/**
 * Carrega e exibe a lista de posts na página do blog.
 */
async function loadBlogPosts() {
  const container = document.getElementById("blog-posts-container");
  if (!container) return;

  container.innerHTML = "<p>Carregando posts...</p>";

  try {
    // 1. Busca o índice de arquivos de posts
    const indexResponse = await fetch(POSTS_INDEX_URL);
    if (!indexResponse.ok)
      throw new Error(
        "Não foi possível carregar o índice de posts. Verifique o arquivo posts-index.json."
      );
    const indexData = await indexResponse.json();
    const postFiles = indexData.post_files || [];

    // 2. Busca o conteúdo de cada arquivo de post
    const postPromises = postFiles.map(async (file) => {
      const postRes = await fetch(`${POSTS_DIR}${file}`);
      const postData = await postRes.json();
      postData.slug = getSlugFromFilename(file); // Adiciona o slug dinamicamente
      return postData;
    });

    const posts = await Promise.all(postPromises);

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
    // Para carregar um post, precisamos saber o nome completo do arquivo.
    // Como não temos essa informação aqui, vamos buscar o índice novamente.
    const indexResponse = await fetch(POSTS_INDEX_URL);
    const indexData = await indexResponse.json();
    const postFilename = (indexData.post_files || []).find(
      (file) => getSlugFromFilename(file) === postSlug
    );

    if (!postFilename) {
      throw new Error("Post não encontrado.");
    }

    const postResponse = await fetch(`${POSTS_DIR}${postFilename}`);
    const post = await postResponse.json();

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
