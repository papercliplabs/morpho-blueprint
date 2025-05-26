/**
 * PoweredByMorpho Web Component
 *
 * @element powered-by-morpho
 *
 * @attr {string} theme - Set to "dark" for dark theme and "light" for light theme
 * @attr {string} placement - Tooltip placement: "center", "bottom-left", "bottom-right", "top-left", "top-right"
 */
(function RegisterPoweredByMorphoWebComponent() {
  let isRegistered = false;

  if (isRegistered || typeof window === "undefined") {
    return;
  }
  class PoweredByMorphoWebComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      this.render();
    }

    render() {
      if (!this.shadowRoot) {
        return;
      }

      this.shadowRoot.innerHTML = `
    <style>
      :host {
				--tooltip-bg: rgba(67, 76, 83, 0.08);
        --tooltip-bg-active: #ECEDEE;
				--text: #434c53f2;
				--text-secondary: #434c53b2;
				--svg-text: #000000;
				--svg-logo: #2470ff;
				--transition-duration: 300ms;
				--transition-timing-function: ease;

				display: block;
      }
  
      :host * {
				box-sizing: border-box;
      }
  
      :host([theme="dark"]) {
				--tooltip-bg: rgba(250, 250, 250, 0.10);
        --tooltip-bg-active: #222529;
				--text: #fffffff2;
				--text-secondary: #ffffffb2;
				--svg-text: #ffffff;
				--svg-logo: #ffffff;
      }
      
      .powered-by-morpho {
        position: relative;
        font-family: sans-serif, arial;
      }
  
      .powered-by-morpho--trigger-svg-text {
				fill: var(--svg-text);
        transition: fill var(--transition-duration) var(--transition-timing-function);
      }
      
      .powered-by-morpho--trigger-svg-logo {
				fill: var(--svg-logo);
        transition: fill var(--transition-duration) var(--transition-timing-function);
      }
      
      .powered-by-morpho--tooltip {
				position: absolute;
				bottom: 63px;
				left: 50%;
				transform: translateX(-50%) translateY(3px);
				opacity: 0;
				visibility: hidden;
				pointer-events: none;
				transition-duration: var(--transition-duration);
				transition-timing-function: var(--transition-timing-function);
				transition-property: opacity, visibility, transform, background-color;
				text-align: center;
				font-style: normal;
				font-weight: 400;
				line-height: 1.6;
				border-radius: 20px;
				color: var(--text);
				background-color: var(--tooltip-bg);
				width: max-content;
				max-width: 309px;
				padding: 32px 20px;
      }
      
      .powered-by-morpho--tooltip-main-paragraph {
				font-size: 13px;
      }
      
      .powered-by-morpho--tooltip-disclaimer-paragraph {
				font-size: 10px;
				margin-top: 10px;
				color: var(--text-secondary);
      }
      
      .powered-by-morpho--trigger:hover + .powered-by-morpho--tooltip {
				opacity: 1;
				visibility: visible;
				pointer-events: auto;
				transform: translateX(-50%) translateY(0);
        background-color: var(--tooltip-bg-active);
      }
  
      /* Center placement (default) */
      :host([placement="center"]) .powered-by-morpho--tooltip {
				bottom: 63px;
				left: 50%;
				transform: translateX(-50%) translateY(3px);
      }
  
      :host([placement="center"]) .powered-by-morpho--trigger:hover + .powered-by-morpho--tooltip {
				transform: translateX(-50%) translateY(0);
      }
  
      /* Bottom-left placement */
      :host([placement="bottom-left"]) .powered-by-morpho--tooltip {
				bottom: 63px;
				left: 0;
				transform: translateX(0) translateY(3px);
      }
  
      :host([placement="bottom-left"]) .powered-by-morpho--trigger:hover + .powered-by-morpho--tooltip {
				transform: translateX(0) translateY(0);
      }
  
      /* Bottom-right placement */
      :host([placement="bottom-right"]) .powered-by-morpho--tooltip {
				bottom: 63px;
				left: auto;
				right: 0;
				transform: translateX(0) translateY(3px);
      }
  
      :host([placement="bottom-right"]) .powered-by-morpho--trigger:hover + .powered-by-morpho--tooltip {
				transform: translateX(0) translateY(0);
      }
  
      /* Top-left placement */
      :host([placement="top-left"]) .powered-by-morpho--tooltip {
				bottom: auto;
				top: 63px;
				left: 0;
				transform: translateX(0) translateY(-3px);
      }
  
      :host([placement="top-left"]) .powered-by-morpho--trigger:hover + .powered-by-morpho--tooltip {
				transform: translateX(0) translateY(0);
      }
  
      /* Top-right placement */
      :host([placement="top-right"]) .powered-by-morpho--tooltip {
				bottom: auto;
				top: 63px;
				left: auto;
				right: 0;
				transform: translateX(0) translateY(-3px);
      }
  
      :host([placement="top-right"]) .powered-by-morpho--trigger:hover + .powered-by-morpho--tooltip {
				transform: translateX(0) translateY(0);
      }
    </style>
      
    <div class="powered-by-morpho">
      <div class="powered-by-morpho--trigger">
        <svg
        width="231"
        height="43"
        viewBox="0 0 231 43"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        >
        <rect
					y="0.689453"
					width="230.303"
					height="42"
					rx="21"
        />
        <path
					d="M25.4165 13.7549C27.59 13.7549 29.3236 15.0314 29.3236 17.317C29.3236 19.6026 27.59 20.8964 25.4165 20.8964H21.5697V26.1749H20V13.7549H25.4165ZM21.5697 19.5595H25.175C26.7275 19.5595 27.7625 18.7487 27.7625 17.3256C27.7625 15.8939 26.7275 15.0917 25.175 15.0917H21.5697V19.5595ZM30.0662 21.7847C30.0662 18.8177 31.8688 17.179 34.5426 17.179C37.2077 17.179 39.0189 18.8177 39.0189 21.7847C39.0189 24.7431 37.2077 26.3819 34.5426 26.3819C31.8688 26.3819 30.0662 24.7431 30.0662 21.7847ZM31.6014 21.7847C31.6014 23.9582 32.7831 25.1399 34.5426 25.1399C36.2934 25.1399 37.4751 23.9582 37.4751 21.7847C37.4751 19.6026 36.2934 18.4296 34.5426 18.4296C32.7831 18.4296 31.6014 19.6026 31.6014 21.7847ZM40.0045 17.386H41.4535L43.2389 24.4412H43.3855L45.5245 17.386H47.2064L49.354 24.4412H49.492L51.2688 17.386H52.6746V17.6447L50.3718 26.1749H48.5519L46.4129 19.1455H46.2749L44.1359 26.1749H42.3074L40.0045 17.6447V17.386ZM53.6838 21.7761C53.6838 18.7919 55.3398 17.179 57.9446 17.179C60.558 17.179 61.9983 18.8091 61.9983 21.3966V22.1556H55.1501C55.1846 23.9841 56.2368 25.1571 57.9446 25.1571C59.5661 25.1571 60.3165 24.2342 60.4545 23.4235H61.8172V23.6822C61.6188 24.7604 60.6011 26.3819 57.9618 26.3819C55.3571 26.3819 53.6838 24.769 53.6838 21.7761ZM55.176 20.9567H60.5493C60.5321 19.456 59.6437 18.3951 57.936 18.3951C56.2627 18.3951 55.2967 19.4732 55.176 20.9567ZM63.9805 17.386H65.4468V18.4382H65.5848C65.8866 17.8172 66.4386 17.3515 67.7583 17.3515H68.983V18.6625H67.7928C66.1454 18.6625 65.4985 19.5681 65.4985 21.3535V26.1749H63.9805V17.386ZM69.8052 21.7761C69.8052 18.7919 71.4612 17.179 74.066 17.179C76.6794 17.179 78.1197 18.8091 78.1197 21.3966V22.1556H71.2715C71.306 23.9841 72.3582 25.1571 74.066 25.1571C75.6875 25.1571 76.4379 24.2342 76.5759 23.4235H77.9386V23.6822C77.7402 24.7604 76.7225 26.3819 74.0832 26.3819C71.4785 26.3819 69.8052 24.769 69.8052 21.7761ZM71.2974 20.9567H76.6707C76.6535 19.456 75.7651 18.3951 74.0574 18.3951C72.3841 18.3951 71.4181 19.4732 71.2974 20.9567ZM88.1921 13.7549V26.1749H86.7172V24.9674H86.5792C85.9151 25.9765 84.8542 26.3732 83.6036 26.3732C81.318 26.3732 79.5757 24.8207 79.5757 21.7847C79.5757 18.7401 81.318 17.1876 83.6036 17.1876C84.8283 17.1876 85.8806 17.5757 86.5361 18.5504H86.6741V13.7549H88.1921ZM81.1023 21.7847C81.1023 23.9151 82.2408 25.114 83.9141 25.114C85.596 25.114 86.7345 23.9151 86.7345 21.7847C86.7345 19.6457 85.596 18.4469 83.9141 18.4469C82.2408 18.4469 81.1023 19.6457 81.1023 21.7847ZM95.3472 13.7549H96.8652V18.5504H97.0032C97.6587 17.5757 98.7199 17.1876 99.9357 17.1876C102.222 17.1876 103.972 18.7401 103.972 21.7847C103.972 24.8207 102.222 26.3732 99.9357 26.3732C98.6937 26.3732 97.6242 25.9765 96.9687 24.9674H96.8307V26.1749H95.3472V13.7549ZM96.8134 21.7847C96.8134 23.9151 97.9519 25.114 99.6252 25.114C101.307 25.114 102.446 23.9151 102.446 21.7847C102.446 19.6457 101.307 18.4469 99.6252 18.4469C97.9519 18.4469 96.8134 19.6457 96.8134 21.7847ZM104.818 17.386H106.362L109.096 24.3636H109.234L111.968 17.386H113.469V17.6447L108.51 29.6249H107V29.3661L108.354 26.1921L104.818 17.6447V17.386Z"
					class="powered-by-morpho--trigger-svg-text"
        />
        <path
					opacity="0.8"
					d="M122.748 24.921V30.1603C122.748 30.4828 123.021 30.6167 123.106 30.6471C123.191 30.6836 123.476 30.7627 123.731 30.5254L127.694 26.7165C128.032 26.3921 128.357 26.0512 128.602 25.6523C128.717 25.4648 128.765 25.3591 128.765 25.3591C129.008 24.8663 129.008 24.3916 128.771 23.917C128.42 23.2111 127.522 22.4931 126.169 21.8115L123.858 23.1016C123.173 23.491 122.748 24.1786 122.748 24.921Z"
					class="powered-by-morpho--trigger-svg-logo"
        />
        <path
					d="M120.469 13.2675V18.7624C120.469 19.45 120.93 20.0585 121.585 20.2532C123.817 20.8982 127.705 22.2856 128.645 24.3241C128.767 24.5919 128.839 24.8535 128.864 25.1274C129.489 23.9895 129.774 22.6812 129.64 21.3546C129.458 19.4743 128.463 17.7644 126.911 16.6752L121.373 12.799C121.275 12.726 121.16 12.6895 121.045 12.6895C120.948 12.6895 120.863 12.7077 120.772 12.7564C120.59 12.8598 120.469 13.0485 120.469 13.2675Z"
					class="powered-by-morpho--trigger-svg-logo"
        />
        <path
					opacity="0.8"
					d="M137.489 24.921V30.1603C137.489 30.4828 137.216 30.6167 137.131 30.6471C137.046 30.6836 136.761 30.7627 136.506 30.5254L132.451 26.6279C132.175 26.3625 131.911 26.0819 131.703 25.7603C131.538 25.5058 131.472 25.3591 131.472 25.3591C131.229 24.8663 131.229 24.3916 131.466 23.917C131.818 23.2111 132.715 22.4931 134.068 21.8115L136.379 23.1016C137.07 23.491 137.489 24.1786 137.489 24.921Z"
					class="powered-by-morpho--trigger-svg-logo"
        />
        <path
					d="M139.772 13.2675V18.7624C139.772 19.45 139.311 20.0585 138.656 20.2532C136.424 20.8982 132.536 22.2856 131.595 24.3241C131.474 24.5919 131.401 24.8535 131.377 25.1274C130.752 23.9895 130.467 22.6812 130.601 21.3546C130.782 19.4743 131.777 17.7644 133.33 16.6752L138.868 12.799C138.965 12.726 139.08 12.6895 139.196 12.6895C139.293 12.6895 139.378 12.7077 139.469 12.7564C139.651 12.8598 139.772 13.0485 139.772 13.2675Z"
					class="powered-by-morpho--trigger-svg-logo"
        />
        <path
					d="M147.771 14.8193H149.781L154.438 25.5919H154.576L159.234 14.8193H161.209V27.2393H159.743V17.3551H159.605L155.335 27.2393H153.645L149.376 17.3551H149.238V27.2393H147.771V14.8193ZM163.346 22.8492C163.346 19.8822 165.149 18.2434 167.823 18.2434C170.487 18.2434 172.299 19.8822 172.299 22.8492C172.299 25.8076 170.487 27.4463 167.823 27.4463C165.149 27.4463 163.346 25.8076 163.346 22.8492ZM164.881 22.8492C164.881 25.0227 166.063 26.2043 167.823 26.2043C169.573 26.2043 170.755 25.0227 170.755 22.8492C170.755 20.6671 169.573 19.4941 167.823 19.4941C166.063 19.4941 164.881 20.6671 164.881 22.8492ZM174.266 18.4504H175.732V19.5027H175.87C176.172 18.8817 176.724 18.4159 178.044 18.4159H179.268V19.7269H178.078C176.43 19.7269 175.784 20.6326 175.784 22.4179V27.2393H174.266V18.4504ZM180.954 30.6893V18.4504H182.437V19.6666H182.575C183.231 18.6488 184.3 18.2521 185.542 18.2521C187.827 18.2521 189.579 19.8046 189.579 22.8492C189.579 25.8852 187.827 27.4377 185.542 27.4377C184.326 27.4377 183.265 27.0496 182.61 26.0749H182.472V30.6893H180.954ZM182.42 22.8492C182.42 24.9796 183.558 26.1784 185.232 26.1784C186.913 26.1784 188.052 24.9796 188.052 22.8492C188.052 20.7102 186.913 19.5113 185.232 19.5113C183.558 19.5113 182.42 20.7102 182.42 22.8492ZM191.55 14.8193H193.068V19.5372H193.206C193.835 18.6057 194.879 18.2521 196.112 18.2521C198.156 18.2521 199.45 19.2871 199.45 21.4347V27.2393H197.932V21.5813C197.932 20.1496 197.147 19.5199 195.776 19.5199C194.275 19.5199 193.068 20.4083 193.068 22.3317V27.2393H191.55V14.8193ZM201.35 22.8492C201.35 19.8822 203.152 18.2434 205.826 18.2434C208.491 18.2434 210.303 19.8822 210.303 22.8492C210.303 25.8076 208.491 27.4463 205.826 27.4463C203.152 27.4463 201.35 25.8076 201.35 22.8492ZM202.885 22.8492C202.885 25.0227 204.066 26.2043 205.826 26.2043C207.577 26.2043 208.758 25.0227 208.758 22.8492C208.758 20.6671 207.577 19.4941 205.826 19.4941C204.066 19.4941 202.885 20.6671 202.885 22.8492Z"
					class="powered-by-morpho--trigger-svg-text"
        />
        </svg>
      </div>

      <div class="powered-by-morpho--tooltip">
        <div class="powered-by-morpho--tooltip-main-paragraph">
					This application provides access to decentralized protocols governed by the Morpho DAO. When you perform actions—such as supplying assets to a vault—you are directly interacting with permissionless and immutable smart contracts deployed on the blockchain.
        </div>
        <div class="powered-by-morpho--tooltip-disclaimer-paragraph">
					Disclaimer: This application is independently developed and maintained by a third party. It is not operated, maintained, or audited by the Morpho DAO or any related entity. As such, no Morpho entity bears responsibility or liability for the functionality, security, or reliability of this application.
        </div>
      </div>
    </div>
    `;
    }
  }

  customElements.define("powered-by-morpho", PoweredByMorphoWebComponent);

  isRegistered = true;
})();
