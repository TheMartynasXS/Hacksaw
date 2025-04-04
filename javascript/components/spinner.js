//write web component that adds a spinner to the whole page
class PageSpinner extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const spinnerContainer = document.createElement('div');
    spinnerContainer.style.position = 'fixed';
    spinnerContainer.style.top = '0';
    spinnerContainer.style.left = '0';
    spinnerContainer.style.width = '100%';
    spinnerContainer.style.height = '100%';
    spinnerContainer.style.display = 'flex';
    spinnerContainer.style.justifyContent = 'center';
    spinnerContainer.style.alignItems = 'center';
    spinnerContainer.style.backgroundColor = 'var(--shadow)';
    spinnerContainer.style.zIndex = '9999';

    const spinner = document.createElement('div');
    spinner.style.border = '8px solid transparent';
    spinner.style.borderTop = '8px solid var(--accent)';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '120px';
    spinner.style.height = '120px';
    spinner.style.animation = 'spin 2s linear infinite';

    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    spinnerContainer.appendChild(spinner);
    shadow.appendChild(style);
    shadow.appendChild(spinnerContainer);
  }
}

customElements.define('page-spinner', PageSpinner);