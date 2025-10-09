function setupCookieModal() {
  const cookieModal = document.querySelector("cookie-modal");
  if (!cookieModal) return;

  const loadAnalytics = () => {
    console.log("Cookies aceitos. Carregando scripts de análise...");
    // Scripts de análise seriam adicionados aqui.
  };

  // Lida com a escolha do usuário vinda do Web Component
  cookieModal.addEventListener("cookie-choice", (e) => {
    const choice = e.detail;
    localStorage.setItem("cookies_choice", choice);
    if (choice === "accepted") {
      loadAnalytics();
    }
  });

  // Mostra o modal na primeira visita do usuário (ou se a escolha não foi feita).
  const showModalOnFirstVisit = () => {
    const userChoice = localStorage.getItem("cookies_choice");

    if (userChoice === "accepted") {
      loadAnalytics();
    } else if (!userChoice) {
      const hasBeenShown = sessionStorage.getItem("cookie_modal_shown");
      if (!hasBeenShown) {
        setTimeout(() => {
          cookieModal.show();
          sessionStorage.setItem("cookie_modal_shown", "true");
        }, 2500);
      }
    }
  };

  showModalOnFirstVisit();
}

function setupFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  if (faqItems.length === 0) return;

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    const answerContent = answer.firstElementChild;

    question.addEventListener("click", () => {
      const isOpen = question.getAttribute("aria-expanded") === "true";

      question.setAttribute("aria-expanded", !isOpen);
      answer.classList.toggle("is-open");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Garante que o setup só rode depois que o componente <cookie-modal> for definido
  customElements.whenDefined("cookie-modal").then(setupCookieModal);
  setupFaqAccordion();
});
