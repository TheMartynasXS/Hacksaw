class NavBar extends HTMLElement {
    
    constructor() {
        super();
        let css = `
        :host{
            font-size: bigger;
        }
        .Icon {
            height: 2rem;
            width: 2rem;
            aspect-ratio: 1;
          }
          .NavButton:enabled .Icon {
            transition: transform 100ms ease-in-out;
            filter: grayscale(1);
          }
          
          .NavButton {
            display: flex;
            white-space: nowrap;
            background: none;
            text-align: start;
            padding-inline: 0.75rem;
            padding-block: 0.75rem;
            margin: 0.1rem;
            border: none;
            border-radius: 0.4rem;
            color: var(--text-primary);
          }
          
          .NavButton:last-of-type {
            margin-top: auto;
          }
          
          .NavButton:enabled:hover,
          .NavButton:disabled {
            background-color: var(--bg-300)
          }
          
          .NavButton:hover:enabled .Icon{
            transform: rotate(7deg) scale(1.1);
            filter: grayscale(0);
          }
          .TabTitle {
            flex: 1;
            margin: auto;
            margin-left: 1rem;
            display: block;
          }
          
          .Icon {
            height: 1.5rem;
            width: 1.5rem;
            display: grid;
            place-items: center;
          }
          `
        let tabs = [
            {
                "name": "Splash",
                "icon": "../css/svg/Paintroller.svg",
                "link": "binsplash.html"
            },
            {
                "name": "Stitch",
                "icon": "../css/svg/Stitch.svg",
                "link": "stitch.html"
            },
            {
                "name": "BinTex",
                "icon": "../css/svg/ListBox.svg",
                "link": "bintex.html"
            },
            {
                "name": "Particle Mover",
                "icon": "../css/svg/Transfer.svg",
                "link": "mover.html"
            },
            {
                "name": "Color Swap",
                "icon": "../css/svg/ColorWand.svg",
                "link": "colorswap.html"
            },
            {
                "name": "xrgba",
                "icon": "../css/svg/Swatch.svg",
                "link": "xrgba.html"
            },
            {
                "name": "Settings",
                "icon": "../css/svg/Cog.svg",
                "link": "settings.html"
            }
        ]
        this.attachShadow({mode: "open"});
        // let shadowstring = `<div class="NavBar Flex-Col">`
        this.shadowRoot.innerHTML = `<style>${css}</style>`
        tabs.forEach(tab => {
            this.shadowRoot.innerHTML+= `
            <button onclick="Tab('${tab.link}')" class="NavButton">
            <img class="Icon" src="${tab.icon}"></img>
            <div class="TabTitle">${tab.name}</div>
            </button>
            `
        });
    }
}
customElements.define("nav-bar",NavBar)