class CookieModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
    this.shadowRoot.getElementById('accept').addEventListener('click', () => this.handleChoice('accepted'));
    this.shadowRoot.getElementById('decline').addEventListener('click', () => this.handleChoice('declined'));
  }

  handleChoice(choice) {
    this.dispatchEvent(new CustomEvent('cookie-choice', { detail: choice }));
    this.hide();
  }

  show() {
    this.classList.add('is-visible');
  }

  hide() {
    this.classList.remove('is-visible');
  }
}

customElements.define('cookie-modal', CookieModal);
