class CustomHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const pathParts = window.location.pathname.split("/");
    const isSubPage = pathParts.includes("especialidades");
    const basePath = isSubPage ? "../" : "./";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #556b2f;
          --text-white: #ffffff;
          --text-dark: #26301e;
          display: block;
        }
        
        .site-header {
          background: var(--primary);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 24px;
          position: relative;
          height: 78px; /* Altura fixa para o header */
        }

        .brand { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-img { width: 160px; height: auto; display: block; }
        
        .menu-toggle, .mobile-nav-container { display: none; }

        ul.menu { list-style: none; display: flex; gap: 18px; align-items: center; margin: 0; padding: 0; }
        li { position: relative; }
        a { text-decoration: none; color: var(--text-white); font-weight: 500; padding: 8px 4px; display: flex; align-items: center; gap: 4px; transition: opacity 0.2s; }
        a:hover { opacity: 0.8; }
        .submenu-toggle-icon { width: 16px; height: 16px; transition: transform 0.2s; }
        
        .submenu {
            list-style: none; position: absolute; top: 100%; left: 0; background: #fff;
            border-radius: 8px; box-shadow: 0 4px 12px #00000026; min-width: 200px;
            padding: 8px 0; margin: 12px 0 0; display: none; z-index: 10;
        }
        .submenu a { color: var(--text-dark); padding: 10px 18px; font-weight: 400; }
        .submenu a:hover { background: #f3f4f6; opacity: 1; }

        @media (min-width: 1081px) {
            .has-submenu:hover > .submenu,
            .has-submenu:focus-within > .submenu {
                display: block;
            }
            .has-submenu:hover > a > .submenu-toggle-icon {
                transform: rotate(180deg);
            }
        }
        
        .social-desktop { display: flex; gap: 10px; }
        .icon-link { color: #ffffffcc; display: inline-flex; }
        .icon-link:hover { transform: scale(1.1); color: var(--text-white); }
        svg { width: 22px; height: 22px; fill: currentColor; }
        
        body.menu-open { overflow: hidden; }

        @media (max-width: 1080px) {
            .header-content {
                height: 70px; /* Altura ajustada para mobile */
                padding: 10px 16px;
            }
            .main-nav, .social-desktop { display: none; }
            .menu-toggle, .mobile-nav-container { display: block; }

            .logo-img { width: 140px; }

            .menu-toggle {
                display: grid; /* Usado para centralizar o ícone interno */
                place-items: center;
                background: none; border: none;
                color: var(--text-white);
                cursor: pointer; padding: 0;
                z-index: 1001;
                position: absolute;
                top: 50%;
                right: 16px;
                transform: translateY(-50%);
                width: 48px; height: 48px;
            }

            .nav-icon {
                width: 24px; height: 20px;
                position: relative;
            }
            .nav-icon span {
                background-color: var(--text-white);
                position: absolute; border-radius: 2px;
                transition: .3s cubic-bezier(.8, .5, .2, 1.4);
                width: 100%; height: 3px;
                left: 0;
            }
            .nav-icon span:nth-child(1) { top: 0; }
            .nav-icon span:nth-child(2) { top: 8px; }
            .nav-icon span:nth-child(3) { bottom: 0; }

            .menu-toggle.is-active .nav-icon span { background-color: var(--text-dark); }
            .menu-toggle.is-active .nav-icon span:nth-child(1) { transform: rotate(45deg); top: 8px; }
            .menu-toggle.is-active .nav-icon span:nth-child(2) { opacity: 0; }
            .menu-toggle.is-active .nav-icon span:nth-child(3) { transform: rotate(-45deg); top: 8px; }

            .menu-overlay {
                display: none; position: fixed; inset: 0;
                background: rgba(0,0,0,0.5); z-index: 999;
            }
            .menu-overlay.is-active { display: block; }

            .mobile-menu {
                display: flex; /* Mude para flex para usar flex-direction */
                flex-direction: column;
                position: fixed; top: 0; right: -100%;
                width: min(300px, 80vw); height: 100%;
                background: #fff;
                z-index: 1000;
                transition: right 0.35s ease-in-out;
                overflow-y: auto;
            }
            .mobile-menu.is-active { right: 0; box-shadow: -5px 0 15px rgba(0,0,0,0.1); }
            
            .mobile-menu-header {
                padding: 10px 16px;
                height: 70px;
                display: flex;
                align-items: center;
                justify-content: flex-end;
            }
            
            .mobile-menu ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .mobile-menu a {
                padding: 16px 24px; color: var(--text-dark);
                width: 100%; display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .mobile-menu li + li { border-top: 1px solid #f3f4f6; }
            
            .mobile-menu .submenu {
                position: static; box-shadow: none; border-radius: 0;
                border-top: 1px solid #f3f4f6;
                margin: 0; padding: 0; background: #f8f9fa;
                min-width: auto;
                display: none; /* Inicia fechado */
            }
            .mobile-menu .submenu.is-open { display: block; }
            .mobile-menu .submenu a { padding-left: 40px; }
            .mobile-menu .has-submenu > a { cursor: pointer; }
            .mobile-menu .has-submenu > a[aria-expanded="true"] > .submenu-toggle-icon { transform: rotate(180deg); }
            
            .mobile-social-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                padding: 20px;
                border-top: 1px solid #f3f4f6;
            }
            .mobile-social-links .icon-link { color: var(--text-dark); }
        }
      </style>
      
      <header class="site-header">
        <div class="header-content">
          <a href="${basePath}index.html" class="brand" aria-label="Página inicial">
            <img class="logo-img" src="${basePath}assets/images/logo.svg" alt="Logo Dr. Gabriel Marcondes" />
          </a>

          <nav class="main-nav" aria-label="Principal">
            <ul id="menu" class="menu">
              <li><a href="${basePath}index.html">Início</a></li>
              <li class="has-submenu">
                <a href="${basePath}index.html#dr-gabriel">A Clínica <svg class="submenu-toggle-icon" viewBox="0 0 16 16"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                <ul class="submenu">
                  <li><a href="${basePath}index.html#dr-gabriel">Dr. Gabriel</a></li>
                  <li><a href="${basePath}index.html#atendimento">Atendimento</a></li>
                </ul>
              </li>
              <li class="has-submenu">
                <a href="${basePath}index.html#especialidades">Especialidades <svg class="submenu-toggle-icon" viewBox="0 0 16 16"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                <ul class="submenu">
                  <li><a href="${basePath}especialidades/pre-natal.html">Pré-Natal</a></li>
                  <li><a href="${basePath}especialidades/parto-humanizado.html">Parto Humanizado</a></li>
                  <li><a href="${basePath}especialidades/endometriose.html">Endometriose</a></li>
                  <li><a href="${basePath}especialidades/cirurgia-ginecologica.html">Cirurgia Ginecológica</a></li>
                  <li><a href="${basePath}especialidades/cirurgia-intima.html">Cirurgia Íntima</a></li>
                  <li><a href="${basePath}especialidades/menopausa.html">Menopausa</a></li>
                  <li><a href="${basePath}especialidades/implantes-hormonais.html">Implantes Hormonais</a></li>
                  <li><a href="${basePath}especialidades/planejamento-familiar.html">Planejamento Familiar</a></li>
                  <li><a href="${basePath}especialidades/exames-preventivos.html">Exames Preventivos</a></li>
                </ul>
              </li>
              <li><a href="${basePath}blog.html">Blog</a></li>
              <li><a href="#contato">Contato</a></li>
            </ul>
          </nav>
          
          <div class="social-desktop" aria-label="Redes sociais">
             <a href="https://instagram.com/drgabrielmarcondes" target="_blank" rel="noopener" class="icon-link"><svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm6-2.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0z"/></svg></a>
             <a href="https://www.facebook.com/profile.php?id=61566031122324" target="_blank" rel="noopener" class="icon-link"><svg viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg></a>
             <a href="https://www.youtube.com/@dr.gabrielmarcondes" target="_blank" rel="noopener" class="icon-link"><svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1c.4-1.9.5-3.9.5-5.8s-.1-3.9-.5-5.8zM9.8 15.5V8.5L15.8 12l-6 3.5z"/></svg></a>
          </div>

          <!-- Mobile Navigation Elements -->
          <div class="mobile-nav-container">
            <button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-menu">
                <div class="nav-icon">
                    <span></span><span></span><span></span>
                </div>
            </button>
            <div class="menu-overlay"></div>
            <div id="mobile-menu" class="mobile-menu" role="dialog" aria-modal="true">
                <div class="mobile-menu-header">
                     <!-- O botão de fechar agora é o próprio .menu-toggle que se transforma em X -->
                </div>
                <ul>
                  <li><a href="${basePath}index.html">Início</a></li>
                  <li class="has-submenu">
                    <a href="#" class="submenu-toggle" role="button" aria-haspopup="true" aria-expanded="false">A Clínica <svg class="submenu-toggle-icon" viewBox="0 0 16 16"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                    <ul class="submenu">
                      <li><a href="${basePath}index.html#dr-gabriel">Dr. Gabriel</a></li>
                      <li><a href="${basePath}index.html#atendimento">Atendimento</a></li>
                    </ul>
                  </li>
                  <li class="has-submenu">
                    <a href="#" class="submenu-toggle" role="button" aria-haspopup="true" aria-expanded="false">Especialidades <svg class="submenu-toggle-icon" viewBox="0 0 16 16"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
                    <ul class="submenu">
                      <li><a href="${basePath}especialidades/pre-natal.html">Pré-Natal</a></li>
                      <li><a href="${basePath}especialidades/parto-humanizado.html">Parto Humanizado</a></li>
                      <li><a href="${basePath}especialidades/endometriose.html">Endometriose</a></li>
                      <li><a href="${basePath}especialidades/cirurgia-ginecologica.html">Cirurgia Ginecológica</a></li>
                      <li><a href="${basePath}especialidades/cirurgia-intima.html">Cirurgia Íntima</a></li>
                      <li><a href="${basePath}especialidades/menopausa.html">Menopausa</a></li>
                      <li><a href="${basePath}especialidades/implantes-hormonais.html">Implantes Hormonais</a></li>
                      <li><a href="${basePath}especialidades/planejamento-familiar.html">Planejamento Familiar</a></li>
                      <li><a href="${basePath}especialidades/exames-preventivos.html">Exames Preventivos</a></li>
                    </ul>
                  </li>
                  <li><a href="${basePath}blog.html">Blog</a></li>
                  <li><a href="#contato">Contato</a></li>
                </ul>
                <div class="mobile-social-links" aria-label="Redes sociais">
                    <a href="https://instagram.com/drgabrielmarcondes" target="_blank" rel="noopener" class="icon-link"><svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm6-2.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0z"/></svg></a>
                    <a href="https://www.facebook.com/profile.php?id=61566031122324" target="_blank" rel="noopener" class="icon-link"><svg viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg></a>
                    <a href="https://www.youtube.com/@dr.gabrielmarcondes" target="_blank" rel="noopener" class="icon-link"><svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1c.4-1.9.5-3.9.5-5.8s-.1-3.9-.5-5.8zM9.8 15.5V8.5L15.8 12l-6 3.5z"/></svg></a>
                </div>
            </div>
          </div>
        </div>
      </header>
    `;
    this.init();
  }

  init() {
    const menuToggle = this.shadowRoot.querySelector(".menu-toggle");
    const mobileMenu = this.shadowRoot.querySelector(".mobile-menu");
    const menuOverlay = this.shadowRoot.querySelector(".menu-overlay");

    const openMenu = () => {
      menuToggle.classList.add("is-active");
      menuToggle.setAttribute("aria-expanded", "true");
      mobileMenu.classList.add("is-active");
      menuOverlay.classList.add("is-active");
      document.body.classList.add("menu-open");
    };

    const closeMenu = () => {
      menuToggle.classList.remove("is-active");
      menuToggle.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("is-active");
      menuOverlay.classList.remove("is-active");
      document.body.classList.remove("menu-open");
      // Fecha todos os submenus ao fechar o menu principal
      this.shadowRoot
        .querySelectorAll(".mobile-menu .submenu.is-open")
        .forEach((submenu) => {
          submenu.classList.remove("is-open");
          submenu.previousElementSibling.setAttribute("aria-expanded", "false");
        });
    };

    menuToggle.addEventListener("click", () => {
      if (mobileMenu.classList.contains("is-active")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menuOverlay.addEventListener("click", closeMenu);

    mobileMenu.addEventListener("click", (e) => {
      const target = e.target.closest("a");
      if (!target) return;

      const isSubmenuToggle = target.classList.contains("submenu-toggle");

      if (isSubmenuToggle) {
        e.preventDefault();
        const submenu = target.nextElementSibling;
        const isOpen = submenu.classList.toggle("is-open");
        target.setAttribute("aria-expanded", isOpen);
      } else {
        // Se não for um toggle de submenu, fecha o menu principal ao navegar
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1080) {
        closeMenu();
      }
    });
  }
}

class CustomFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const pathParts = window.location.pathname.split("/");
    const isSubPage = pathParts.includes("especialidades");
    const basePath = isSubPage ? "../" : "./";

    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --border: #e6eadf;
                    --text-soft: #4c5840;
                    --primary: #556b2f;
                    --muted: #8b927f;
                    display: block;
                    background: #fff;
                    border-top: 1px solid var(--border);
                    color: var(--text-soft);
                    margin-top: auto; /* Empurra o footer para o final */
                }
                .footer-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 1fr 1fr 1fr;
                    gap: 32px;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px 24px;
                }
                .logo-img { width: 160px; height: auto; margin-bottom: 8px; }
                .footer-brand p { margin: 8px 0 0; font-size: 0.9rem; }
                .footer-brand a { color: var(--text-soft); text-decoration: none; }
                .footer-brand a:hover { color: var(--primary); text-decoration: underline; }

                .footer-nav h4 { font-size: 1rem; margin-bottom: 12px; color: #2a2438; }
                .footer-nav ul, .contact-list { list-style: none; display: grid; gap: 8px; padding: 0; margin: 0; }
                .footer-nav a, .contact-list li, .legal a {
                    color: var(--text-soft);
                    text-decoration: none;
                    cursor: pointer; 
                }
                .footer-nav a:hover, .legal a:hover { color: var(--primary); text-decoration: underline; }
                
                .legal { border-top: 1px solid var(--border); background: #fcfbfe;}
                .legal .container { padding: 16px 24px; color: var(--muted); font-size: 0.8rem; text-align: center; max-width: 100%; margin: 0 auto; }
                
                @media (max-width: 1080px) {
                    .footer-grid { grid-template-columns: 1fr 1fr; }
                }
                 @media (max-width: 768px) {
                    .footer-grid { 
                        grid-template-columns: 1fr; 
                        gap: 28px; 
                        padding: 32px 20px; 
                        text-align: center;
                        font-size; 10px;
                    }
                    .footer-brand, .footer-nav, .footer-contact { 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                    }
                    .legal .container { 
                        text-align: left; 
                        font-size: 10px;    
                    }
                    .footer-nav ul, .footer-contact ul {
                        display: flex;
                        align-items: center;
                        flex-wrap: wrap;
                        justify-content: center;
                        width: 100%;
                        gap: 20px;
                    }
                 }
            </style>
            <footer id="contato" class="site-footer">
              <div class="footer-grid">
                 <div class="footer-brand">
                    <a href="${basePath}index.html" aria-label="Página inicial">
                      <img class="logo-img" src="${basePath}assets/images/logo-black.svg" alt="Logo Dr. Gabriel Marcondes" />
                    </a>
                 </div>

                <nav class="footer-nav" aria-label="Secundário">
                    <h4>Menu</h4>
                    <ul>
                        <li><a href="${basePath}index.html#dr-gabriel">Dr. Gabriel</a></li>
                        <li><a href="${basePath}index.html#atendimento">Atendimento</a></li>
                        <li><a href="${basePath}blog.html">Blog</a></li>
                        <li><a href="${basePath}faq.html">FAQ</a></li>
                    </ul>
                </nav>

                <div class="footer-contact">
                    <h4>Contato</h4>
                     <ul class="contact-list">
                        <li>(67) 99826-8281</li>
                        <li>dr.gabrielmarcondes@gmail.com</li>
                     </ul>
                </div>
              </div>

              <div class="legal">
                <div class="container">
                   <p>Responsável Técnico: Dr. Gabriel Marcondes - CRM - 7608 / RQE - 5624 • 
                      <a href="https://www.google.com/maps/search/?api=1&amp;query=Av.+Jo%C3%A3o+Pedro+Fernandes,+2770+-+Centro,+Maracaju+-+MS,+79150-000" target="_blank" rel="noopener">
                        Endereço: Av. João Pedro Fernandes, 2770 - Centro, Maracaju - MS, 79150-000
                      </a> • © 2025 Todos os direitos reservados Dr. Gabriel Marcondes • <a href="${basePath}terms.html">Termos de Uso</a> • <a href="${basePath}privacy.html">Política de Privacidade</a> • <a id="cookies-prefs-link" href="#">Preferências de Cookies</a></p>
                </div>
              </div>
            </footer>
        `;
  }

  connectedCallback() {
    this.shadowRoot
      .getElementById("cookies-prefs-link")
      .addEventListener("click", (e) => {
        e.preventDefault();
        const cookieModal = document.querySelector("cookie-modal");
        if (cookieModal) {
          cookieModal.show();
        }
      });
  }
}

customElements.define("custom-header", CustomHeader);
customElements.define("custom-footer", CustomFooter);

class CookieModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #556b2f; /* Cor principal do site */
          --text-white: #ffffff;
          --text-dark: #26301e;
          --surface-color: #f8f9fa;
          --border-color: #e6eadf;

          /* Fontes do site */
          --font-body: 'Inter', sans-serif;
          --font-display: 'Playfair Display', serif;

          display: none; 
        }

        :host(.is-visible) {
          display: block;
        }

        .backdrop {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 100;
          background: var(--primary);
          color: var(--text-white);

          /* Animação */
          transform: translateY(100%);
          transition: transform 0.3s ease-in-out;
        }

        :host(.is-visible) .backdrop {
            transform: translateY(0);
        }

        .modal-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        
        .modal-text {
            flex-grow: 1;
        }

        .modal-content h3 {
          font-family: var(--font-display);
          color: var(--text-white);
          margin: 0 0 8px 0;
          font-weight: 600;
          font-size: 1.25rem;
        }
        
        .modal-content p {
            font-family: var(--font-body);
            margin: 0;
            font-size: 0.95rem;
            line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }

        .btn-link {
          color: var(--text-white);
          text-decoration: underline;
          opacity: 0.9;
          transition: opacity 0.2s;
        }
        .btn-link:hover {
            opacity: 1;
        }
        
        .btn-decline, .btn-accept {
            font-family: var(--font-body);
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            border: 1px solid transparent;
            transition: background-color 0.2s, color 0.2s, opacity 0.2s;
        }

        .btn-decline {
            background-color: transparent;
            color: var(--text-white);
            border-color: var(--text-white);
         }
        .btn-decline:hover {
            background-color: rgba(255,255,255,0.1);
        }

        .btn-accept {
             background-color: var(--text-white);
             color: var(--primary);
             border-color: var(--text-white);
        }
        .btn-accept:hover {
            opacity: 0.9;
        }

        @media (max-width: 768px) {
            .modal-content {
                flex-direction: column;
                text-align: center;
                gap: 16px;
            }
            .modal-actions {
                width: 100%;
                justify-content: center;
            }
        }
      </style>
      <div class="backdrop">
        <div class="modal-content">
          <div class="modal-text">
            <h3>Sua Privacidade é Importante</h3>
            <p>
              Utilizamos cookies para oferecer a melhor experiência. Ao continuar, você concorda com nossa <a href="/privacy.html" class="btn-link">Política de Privacidade</a>.
            </p>
          </div>
          <div class="modal-actions">
            <button id="decline" class="btn-decline">Recusar</button>
            <button id="accept" class="btn-accept">Aceitar</button>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot
      .getElementById("accept")
      .addEventListener("click", () => this.handleChoice("accepted"));
    this.shadowRoot
      .getElementById("decline")
      .addEventListener("click", () => this.handleChoice("declined"));
  }

  handleChoice(choice) {
    this.dispatchEvent(new CustomEvent("cookie-choice", { detail: choice }));
    this.hide();
  }

  show() {
    this.classList.add("is-visible");
  }

  hide() {
    this.classList.remove("is-visible");
  }
}

customElements.define("cookie-modal", CookieModal);

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

function setupSpecialtiesCarousel() {
  // Verifica se a classe Swiper está disponível
  if (typeof Swiper === "undefined") return;

  new Swiper(".specialties-carousel", {
    // Parâmetros
    slidesPerView: 1,
    spaceBetween: 16,
    loop: true,

    // Autoplay
    autoplay: {
      delay: 10000, // 10 segundos
      disableOnInteraction: false, // Continua o autoplay mesmo após interação do usuário
    },

    // Paginação
    pagination: {
      el: ".carousel-container .swiper-pagination",
      clickable: true,
    },

    // Botões de navegação
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },

    // Breakpoints para responsividade
    breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 24,
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Garante que o setup só rode depois que o componente <cookie-modal> for definido
  customElements.whenDefined("cookie-modal").then(setupCookieModal);
  setupFaqAccordion();
  setupSpecialtiesCarousel();
});
