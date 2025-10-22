document.addEventListener("DOMContentLoaded", () => {
  // --- Auth Check ---
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/login.html";
    return; // Stop script execution
  }

  // --- Quill Editor Setup ---
  let quill; // Variável para guardar a instância do Quill
  const editorElement = document.getElementById("editor");
  if (editorElement) {
    const toolbarOptions = [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link", "image", "video"],
      ["clean"],
    ];

    quill = new Quill(editorElement, {
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            image: imageHandler, // Associamos nosso handler personalizado
          },
        },
      },
      theme: "snow",
      placeholder: "Comece a escrever o conteúdo do seu post aqui...",
    });
  }

  // --- Element Selectors ---
  const postForm = document.getElementById("post-form");
  const postSlugHidden = document.getElementById("post-slug-hidden");
  const postTitleInput = document.getElementById("post-title-input");
  const postSummaryInput = document.getElementById("post-summary-input");
  const postTagsInput = document.getElementById("post-tags-input");
  const postAuthorInput = document.getElementById("post-author-input");
  const postDateInput = document.getElementById("post-date-input");
  const postImageInput = document.getElementById("post-image-input");
  const imagePreview = document.getElementById("image-preview");
  const postImageUrlHidden = document.getElementById("post-image-url-hidden");
  const previewBtn = document.getElementById("preview-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const editorHeading = document.getElementById("editor-heading");
  const openGalleryBtn = document.getElementById("open-gallery-btn");
  const mediaModal = document.getElementById("media-gallery-modal");
  const closeGalleryBtn = document.getElementById("close-gallery-btn");
  const mediaGrid = document.getElementById("media-gallery-grid");

  const API_BASE_URL = "/api"; // Corrigido para o caminho base da API

  // --- Helper Functions ---

  function showToast(message, type = "success", duration = 4000) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
  }

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

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await fetchAuth(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Image upload failed");
      return data.filePath;
    } catch (error) {
      showToast(`Erro no upload da imagem: ${error.message}`, "error");
      return null;
    }
  }

  function resetPostForm() {
    postForm.reset();
    postSlugHidden.value = "";
    imagePreview.style.display = "none";
    imagePreview.src = "";
    postImageUrlHidden.value = "";
    if (quill) quill.root.innerHTML = "";
    if (editorHeading) editorHeading.textContent = "Criar Novo Post";
    postDateInput.value = new Date().toISOString().split("T")[0];
    window.history.replaceState({}, document.title, "/editor.html");
  }

  let imageSelectionCallback = null;

  // Abre a galeria e define o que fazer quando uma imagem for selecionada
  async function openGallery(callback) {
    imageSelectionCallback = callback;
    mediaGrid.innerHTML = "<p>Carregando imagens...</p>";
    mediaModal.classList.add("is-visible");

    try {
      const response = await fetchAuth(`${API_BASE_URL}/uploads`);
      if (!response.ok) throw new Error("Falha ao carregar a galeria.");
      const imageUrls = await response.json();

      if (imageUrls.length === 0) {
        mediaGrid.innerHTML =
          "<p>Nenhuma imagem na galeria. Envie uma nova imagem para começar.</p>";
        return;
      }

      mediaGrid.innerHTML = imageUrls
        .map(
          (url) => `
        <div class="media-item" data-url="${url}" tabindex="0" role="button" aria-label="Selecionar imagem">
          <img src="${url}" alt="Imagem da galeria" loading="lazy" />
        </div>
      `
        )
        .join("");
    } catch (error) {
      mediaGrid.innerHTML = `<p>${error.message}</p>`;
    }
  }

  function closeGallery() {
    mediaModal.classList.remove("is-visible");
    imageSelectionCallback = null;
  }

  function imageHandler() {
    // Ao clicar no ícone de imagem do Quill, abre a galeria
    openGallery((imageUrl) => {
      if (imageUrl) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, "image", imageUrl);
        quill.setSelection(range.index + 1);
        closeGallery();
      }
    });
  }

  async function loadPostForEditing(slug) {
    try {
      const response = await fetch(`/api/posts/${slug}`); // Public endpoint
      if (!response.ok) throw new Error("Post not found");
      const post = await response.json();

      postSlugHidden.value = slug;
      postTitleInput.value = post.title;
      postSummaryInput.value = post.summary;
      postTagsInput.value = post.tags ? post.tags.join(", ") : "";
      quill.root.innerHTML = post.content;
      postAuthorInput.value = post.author;
      postDateInput.value = post.date;
      postImageUrlHidden.value = post.imageUrl || ""; // Corrigido de 'image' para 'imageUrl'

      if (post.imageUrl) {
        imagePreview.src = post.imageUrl; // Corrigido de 'image' para 'imageUrl'
        imagePreview.style.display = "block";
      } else {
        imagePreview.style.display = "none";
      }

      editorHeading.textContent = `Editando: ${post.title}`;
    } catch (error) {
      showToast(`Erro ao carregar post para edição: ${error.message}`, "error");
      window.location.href = "/admin.html";
    }
  }

  // --- Event Listeners ---

  openGalleryBtn.addEventListener("click", () => {
    // Abre a galeria para selecionar a imagem de capa
    openGallery((imageUrl) => {
      if (imageUrl) {
        imagePreview.src = imageUrl;
        imagePreview.style.display = "block";
        postImageUrlHidden.value = imageUrl;
        postImageInput.value = ""; // Limpa a seleção de arquivo
        closeGallery();
      }
    });
  });

  closeGalleryBtn.addEventListener("click", closeGallery);
  mediaModal.addEventListener("click", (e) => {
    if (e.target === mediaModal) closeGallery();
  });

  cancelBtn.addEventListener("click", () => {
    if (postSlugHidden.value) {
      // If editing, just reload the data
      loadPostForEditing(postSlugHidden.value);
    } else {
      // If creating, clear the form
      resetPostForm();
    }
  });

  mediaGrid.addEventListener("click", (e) => {
    const item = e.target.closest(".media-item");
    if (item && imageSelectionCallback) {
      const url = item.dataset.url;
      imageSelectionCallback(url);
    }
  });

  previewBtn.addEventListener("click", async () => {
    const imageFile = postImageInput.files[0];
    let imageUrl = postImageUrlHidden.value;

    if (imageFile) {
      try {
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(imageFile);
        });
      } catch (error) {
        showToast("Não foi possível gerar o preview da imagem.", "error");
        return;
      }
    }

    const previewData = {
      title: postTitleInput.value || "Seu Título Aqui",
      content: quill.root.innerHTML,
      author: postAuthorInput.value,
      date: postDateInput.value,
      imageUrl: imageUrl,
      summary: postSummaryInput.value,
    };

    sessionStorage.setItem("postPreviewData", JSON.stringify(previewData));
    window.open("/post.html?preview=true", "_blank");
  });

  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Formulário de post enviado."); // DEBUG: Confirma que o evento de submit foi acionado

    // --- Validação dos Campos Obrigatórios ---
    const title = postTitleInput.value.trim();
    if (!title) {
      showToast("O campo Título é obrigatório.", "error");
      postTitleInput.focus();
      return; // Impede o envio do formulário
    }

    // Verifica se o conteúdo do Quill não está vazio (considerando apenas texto)
    const contentText = quill.getText().trim();
    if (contentText.length === 0) {
      showToast("O campo Conteúdo não pode estar vazio.", "error");
      quill.focus();
      return; // Impede o envio do formulário
    }

    let imageUrl = postImageUrlHidden.value;
    const imageFile = postImageInput.files[0];

    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) return;
    }

    const tagsValue = postTagsInput.value.trim();
    const tags = tagsValue
      ? tagsValue
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    const postData = {
      title: title, // Usa a variável já validada
      summary: postSummaryInput.value,
      content: quill.root.innerHTML,
      author: postAuthorInput.value,
      date: postDateInput.value,
      tags: tags,
      imageUrl: imageUrl, // Changed from 'image' to 'imageUrl' for consistency with server
    };

    const slug = postSlugHidden.value;
    const method = slug ? "PUT" : "POST";
    const url = slug
      ? `${API_BASE_URL}/posts/${slug}`
      : `${API_BASE_URL}/posts`;

    try {
      console.log(
        "Enviando requisição para:",
        url,
        "com método:",
        method,
        "e dados:",
        postData
      ); // DEBUG: Mostra os dados sendo enviados
      const response = await fetchAuth(url, {
        method: method,
        body: JSON.stringify(postData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save post");

      console.log("Post salvo com sucesso. Resposta do servidor:", data); // DEBUG: Confirma o sucesso e a resposta
      showToast(`Post "${postData.title}" salvo com sucesso!`);

      // DEBUG: Verifica se o slug foi retornado, essencial para o redirecionamento
      if (!data.slug)
        throw new Error(
          "Slug do post não retornado pelo servidor após salvar."
        );

      // Após salvar, abre o post em uma nova aba e decide o que fazer com a aba atual.
      setTimeout(() => {
        // 1. Abre o post salvo em uma nova aba.
        window.open(`/post.html?slug=${data.slug}`, "_blank");

        // 2. Redireciona a aba do editor para o painel de administração.
        // Isso é útil tanto para criação quanto para edição, pois permite ver a lista atualizada.
        window.location.href = "/admin.html";
      }, 1000);
    } catch (error) {
      showToast(`Erro ao salvar post: ${error.message || error}`, "error"); // Melhor tratamento para erros genéricos
    }
  });

  postImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imagePreview.src = event.target.result;
        imagePreview.style.display = "block";
        postImageUrlHidden.value = "";
      };
      reader.readAsDataURL(file);
    }
  });

  // --- Initial Load ---
  const params = new URLSearchParams(window.location.search);
  const postSlugToEdit = params.get("slug");

  if (postSlugToEdit) {
    loadPostForEditing(postSlugToEdit);
  } else {
    resetPostForm();
  }
});
