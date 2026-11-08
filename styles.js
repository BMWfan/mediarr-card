// styles.js
export const styles = `
  :root {
    --card-padding: 0;
    --section-spacing: 8px;
    --item-spacing: 4px;
    --border-radius: 4px;
    --transition-duration: 0.3s;
    
    /* Colors */
    --overlay-gradient: linear-gradient(
      180deg,
      rgba(8, 12, 20, 0.15) 0%,
      rgba(8, 12, 20, 0.88) 42%,
      rgba(8, 12, 20, 0.96) 100%
    );
    --hero-scrim: linear-gradient(
      90deg,
      rgba(8, 12, 20, 0.88) 0%,
      rgba(8, 12, 20, 0.58) 45%,
      rgba(8, 12, 20, 0.28) 100%
    );
    --media-text-color: #ffffff;
    --media-muted-text-color: rgba(255, 255, 255, 0.92);
    --section-text-color: rgba(255, 255, 255, 0.9);
    --section-icon-color: rgba(255, 255, 255, 0.82);
    --section-header-bg: rgba(7, 10, 18, 0.28);
    --section-hover-bg: color-mix(in srgb, var(--card-background-color, #000) 86%, var(--primary-text-color, #fff) 14%);
    --section-border-color: color-mix(in srgb, var(--card-background-color, #000) 92%, var(--primary-text-color, #fff) 8%);
    --card-scrim-color: rgba(6, 8, 14, 0.28);
    --shadow-strong: 0 2px 10px rgba(0, 0, 0, 0.95), 0 0 1px rgba(0, 0, 0, 0.9);
    --shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.95);
    --status-pending-bg: #ffa726;
    --status-approved-bg: #66bb6a;
    --status-declined-bg: #ef5350;
    --status-available-bg: #29b6f6;
    --status-unknown-bg: #9e9e9e;
    --modal-bg: var(--card-background-color, #1c1c1c);
    --modal-text: var(--primary-text-color, #fff);
    --toast-success: var(--success-color, #43a047);
    --toast-error: var(--error-color, #e53935);
    --toast-info: var(--primary-color, #03a9f4);
    
    /* Shadows */
    --card-shadow: 0 2px 4px rgba(0,0,0,0.1);
    --hover-shadow: 0 4px 8px rgba(0,0,0,0.2);
    
    /* Typography */
    --title-size: 1.2em;
    --subtitle-size: 0.9em;
    --caption-size: 0.75em;
  }

  /* Card Structure */
  ha-card {
    overflow: hidden;
    padding: var(--card-padding);
    position: relative;
    background: transparent;
    margin: 0;
    width: 100%;
  }

  .card-content {
    position: relative;
    z-index: 1;
    padding: 0;
  }

  .card-content.contrast-dark {
    --overlay-gradient: linear-gradient(
      180deg,
      rgba(8, 12, 20, 0.12) 0%,
      rgba(8, 12, 20, 0.82) 42%,
      rgba(8, 12, 20, 0.94) 100%
    );
    --hero-scrim: linear-gradient(
      90deg,
      rgba(8, 12, 20, 0.84) 0%,
      rgba(8, 12, 20, 0.5) 45%,
      rgba(8, 12, 20, 0.2) 100%
    );
    --media-text-color: #ffffff;
    --media-muted-text-color: rgba(255, 255, 255, 0.9);
    --section-text-color: rgba(255, 255, 255, 0.8);
    --section-icon-color: rgba(255, 255, 255, 0.72);
    --section-header-bg: rgba(7, 10, 18, 0.24);
    --section-hover-bg: rgba(255, 255, 255, 0.08);
    --section-border-color: rgba(255, 255, 255, 0.06);
    --card-scrim-color: rgba(6, 8, 14, 0.3);
    --shadow-strong: 0 2px 10px rgba(0, 0, 0, 0.95), 0 0 1px rgba(0, 0, 0, 0.9);
    --shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.95);
  }

  .card-content.contrast-light {
    --overlay-gradient: linear-gradient(
      180deg,
      rgba(8, 12, 20, 0.14) 0%,
      rgba(8, 12, 20, 0.84) 42%,
      rgba(8, 12, 20, 0.95) 100%
    );
    --hero-scrim: linear-gradient(
      90deg,
      rgba(8, 12, 20, 0.86) 0%,
      rgba(8, 12, 20, 0.52) 45%,
      rgba(8, 12, 20, 0.22) 100%
    );
    --media-text-color: #ffffff;
    --media-muted-text-color: rgba(255, 255, 255, 0.92);
    --section-text-color: rgba(255, 255, 255, 0.9);
    --section-icon-color: rgba(255, 255, 255, 0.82);
    --section-header-bg: rgba(8, 12, 20, 0.42);
    --section-hover-bg: rgba(255, 255, 255, 0.1);
    --section-border-color: rgba(255, 255, 255, 0.1);
    --card-scrim-color: rgba(6, 8, 14, 0.28);
    --shadow-strong: 0 2px 10px rgba(0, 0, 0, 0.95), 0 0 1px rgba(0, 0, 0, 0.9);
    --shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.95);
  }

  /* Background Layers */
  .card-background,
  .media-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    transition: opacity 0.5s ease;
    will-change: opacity;
    isolation: isolate;
  }

  .card-background {
    filter: blur(20px) brightness(0.7);
    transform: scale(1.2);
    z-index: 0;
    background-color: #080c14;
  }

  ha-card {
    background: #080c14;
  }

  ha-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--card-scrim-color);
    z-index: 0;
    pointer-events: none;
  }

  .media-background {
    filter: blur(var(--blur-radius, 0px));
    transform: scale(1.1);
    background-color: #080c14;
  }

  /* Media Content Area */
  .media-content {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;
    margin-bottom: var(--section-spacing);
    cursor: pointer;
    background: #080c14;
  }

  .media-content::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--hero-scrim);
    z-index: 1;
    pointer-events: none;
  }

  /* Keep both crossfade layers at the same scale on hover. */
  .media-details-panel {
    position: relative;
    margin: 0 0 var(--section-spacing, 8px);
    background: rgba(8, 12, 20, 0.94);
    color: #fff;
    font-size: 0.9em;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .media-details-panel[hidden] { display: none; }

  .media-details-panel summary {
    padding: 12px;
    cursor: pointer;
    font-weight: 600;
  }

  .media-details-panel summary:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: -2px;
  }

  .media-details-body { padding: 0 12px 12px; }
  .media-details-body h3 { margin: 0 0 4px; font-size: 1em; }
  .media-details-body p { margin: 0 0 12px; white-space: pre-line; }
  .media-details-body dl { margin: 0; }
  .media-details-body dl > div { margin-top: 8px; }
  .media-details-body dt { font-weight: 600; color: #ccd4df; }
  .media-details-body dd { margin: 0; }

  .media-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px;
    background: var(--overlay-gradient);
    color: var(--media-text-color);
    z-index: 2;
    backdrop-filter: blur(2px);
  }

  .media-info .title,
  .media-info .details,
  .media-info .metadata,
  .media-info .overview,
  .media-info .type,
  .media-info .status,
  .media-info ha-icon {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95);
  }

  /* Section Headers */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0px 8px;
    cursor: pointer;
    user-select: none;
    border-radius: var(--border-radius);
    transition: background-color var(--transition-duration) ease;
    margin-bottom: 0px;
    border: 1px solid var(--section-border-color);
    background: var(--section-header-bg);
  }

  .section-header:hover {
    background-color: var(--section-hover-bg);
    border-color: var(--section-border-color);
  }

  .section-header-content {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .section-toggle-icon {
    transition: transform var(--transition-duration) ease;
    color: var(--section-icon-color);
  }

  .section-label {
    font-weight: 700;
    font-size: 10px;
    color: var(--section-text-color);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 1;
    text-shadow: var(--shadow-medium);
  }

  .section-header .section-label,
  .section-header .section-toggle-icon {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95);
  }

  /* Section Content */
  .section-content {
    max-height: 200px;
    transition: max-height var(--transition-duration) cubic-bezier(0.4, 0, 0.2, 1),
                opacity var(--transition-duration) cubic-bezier(0.4, 0, 0.2, 1),
                transform var(--transition-duration) cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    transform-origin: top;
    opacity: 1;
  }

  .section-content.collapsed {
    max-height: 0;
    opacity: 0;
    transform: scaleY(0);
  }

  /* Media Lists - Shared */
  [class*="-list"] {
    padding: 0px 4px;
    display: flex;
    flex-wrap: nowrap;
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: thin;
    margin-bottom: 0px;
    -webkit-overflow-scrolling: touch;
    margin-top: 0px;
  }

  /* Scrollbar Styling */
  [class*="-list"]::-webkit-scrollbar {
    height: 2px;
  }

  *::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }

  *::-webkit-scrollbar-thumb {
    background: var(--primary-color);
    border-radius: 2px;
  }
  /* Hide scrollbars on mobile */
  @media (max-width: 600px) {
    [class*="-list"] {
        scrollbar-width: none;  /* Firefox */
        -ms-overflow-style: none;  /* IE and Edge */
    }
    
    [class*="-list"]::-webkit-scrollbar {
        display: none;  /* Chrome, Safari and Opera */
    }
  }

  /* Media Items */
  .media-item {
    flex: 0 0 auto;
    width: 85px;
    height: 135px;
    position: relative;
    cursor: pointer;
    transform: translateY(0);
    transition: transform var(--transition-duration) ease-out, 
                box-shadow var(--transition-duration) ease-out;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    margin: 0px 2px;
  }

  .media-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  .media-item.selected {
    box-shadow: 0 0 0 2px var(--primary-color);
  }

  .media-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  .media-item::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(transparent, rgba(0,0,0,0.9));
    pointer-events: none;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  .media-item-title {
    position: absolute;
    bottom: 6px;
    left: 6px;
    right: 6px;
    font-size: 0.75em;
    color: white;
    z-index: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    font-weight: 500;
  }

  /* Content Typography */
  .title {
    font-size: var(--title-size);
    font-weight: 700;
    margin-bottom: 0;
    color: var(--media-text-color);
    text-shadow: var(--shadow-strong);
  }

  .details {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1em;
    margin-bottom: 2px;
    color: var(--media-muted-text-color);
    opacity: 1;
    text-shadow: var(--shadow-medium);
  }

  .metadata {
    font-size: var(--subtitle-size);
    color: var(--media-muted-text-color);
    opacity: 1;
    text-shadow: var(--shadow-medium);
  }

  .overview {
    margin-top: 2px;
    font-size: var(--subtitle-size);
    color: var(--media-muted-text-color);
    opacity: 1;
    text-shadow: var(--shadow-medium);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Empty State */
  .empty-section-content {
    flex: 0 0 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60px;
    padding: 16px;
    text-align: center;
    color: var(--secondary-text-color, rgba(255, 255, 255, 0.78));
  }

  .empty-message {
    font-size: var(--subtitle-size);
    opacity: 0.85;
    text-shadow: var(--shadow-medium);
  }

  /* Status Indicators */
  .status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: var(--border-radius);
    font-size: var(--subtitle-size);
    cursor: pointer;
    transition: transform var(--transition-duration) ease,
                box-shadow var(--transition-duration) ease;
  }

  .status:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .status:active {
    transform: translateY(0);
  }

  .status-pending { background: var(--status-pending-bg); }
  .status-approved { background: var(--status-approved-bg); }
  .status-declined { background: var(--status-declined-bg); }
  .status-available { background: var(--status-available-bg); }
  .status-unknown { background: var(--status-unknown-bg); }

  /* Request Button */
  .request-button-container {
    margin: 0;
  }

  .request-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--subtitle-size);
  }

  .request-button:hover {
    background: var(--primary-color-light, #35baf6);
  }

  .request-button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .request-button ha-icon {
    --mdc-icon-size: 18px;
  }

  .request-button-secondary {
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  .request-button-secondary:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .detail-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: var(--caption-size);
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
  }

  .immaculaterr-note {
    margin-top: 8px;
    font-size: var(--caption-size);
    color: rgba(255, 255, 255, 0.84);
  }

  /* Now Playing Section */
  .now-playing {
    position: relative;
    width: 100%;
    height: 60px;
    overflow: hidden;
    margin-bottom: var(--section-spacing);
    border-radius: var(--border-radius);
  }

  .now-playing-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    filter: blur(10px) brightness(0.3);
    transform: scale(1.2);
  }

  .now-playing-content {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    height: 44px;
    color: white;
  }

  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(255,255,255,0.2);
  }

  .progress-bar-fill {
    height: 100%;
    background: var(--primary-color);
    width: 0%;
    transition: width 1s linear;
  }

  /* Client Modal */
  .client-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .client-modal-content {
    background: var(--modal-bg);
    border-radius: var(--border-radius);
    width: 90%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .client-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .client-modal-title {
    font-size: var(--title-size);
    font-weight: 500;
  }

  .client-modal-close {
    cursor: pointer;
    opacity: 0.7;
    transition: opacity var(--transition-duration) ease;
  }

  .client-modal-close:hover {
    opacity: 1;
  }

  .client-list {
    padding: 8px;
  }

  .client-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    cursor: pointer;
    border-radius: var(--border-radius);
    transition: background-color var(--transition-duration) ease;
  }

  .client-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .client-item-info {
    flex: 1;
  }

  .client-item-name {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .client-item-details {
    font-size: var(--caption-size);
    opacity: 0.7;
  }

  /* Utility Classes */
  .hidden {
    display: none !important;
  }

  .mediarr-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
  }

  .mediarr-modal {
    position: relative;
    width: min(92vw, 420px);
    background: var(--modal-bg);
    color: var(--modal-text);
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
  }

  .mediarr-modal-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
  }

  .mediarr-modal-title {
    margin: 0 0 12px;
    padding-right: 24px;
    font-size: 0.95rem;
  }

  .mediarr-modal-select {
    width: 100%;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
    background: var(--ha-card-background, var(--card-background-color, #111));
    color: var(--primary-text-color, #fff);
    margin-bottom: 12px;
  }

  .mediarr-modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .mediarr-btn {
    border: 0;
    border-radius: 8px;
    padding: 8px 12px;
    color: #fff;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .mediarr-btn-confirm {
    background: var(--toast-success);
  }

  .mediarr-btn-cancel {
    background: #d9534f;
  }

  .mediarr-toast {
    position: fixed;
    left: 50%;
    bottom: 18px;
    transform: translate(-50%, 8px);
    opacity: 0;
    z-index: 2100;
    padding: 10px 14px;
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .mediarr-toast.show {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  .mediarr-toast-success {
    background: var(--toast-success);
  }

  .mediarr-toast-error {
    background: var(--toast-error);
  }

  .mediarr-toast-info {
    background: var(--toast-info);
  }

  /* Responsive Design */
  @media (min-width: 600px) {
    .media-content {
      height: 140px;
    }
  }

  @media (max-width: 600px) {
    .overview {
      -webkit-line-clamp: 1;
    }

    .section-header {
      padding: 6px;
    }

    .media-item {
      width: 85px;
      height: 128px;
    }
    
    .request-button {
      padding: 8px 14px;
    }
  }

  /* Keep card contrast stable regardless of browser color-scheme preferences */
  @media (prefers-color-scheme: dark) {
    .client-modal-content {
      background: #1c1c1c;
    }
  }

  @media (prefers-color-scheme: light) {
    .client-modal-content {
      background: #ffffff;
    }
  }

  .mediarr-result-summary { display: none; }

  .mediarr-open-button {
    display: block;
    margin: 12px 12px 12px auto;
    border: 1px solid var(--divider-color, #526170);
    border-radius: 8px;
    background: transparent;
    color: var(--primary-color, #03a9f4);
    padding: 10px 14px;
    font: inherit;
    cursor: pointer;
  }

  .mediarr-open-button:focus-visible,
  .mediarr-overlay-close:focus-visible,
  .mediarr-search:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }

  .mediarr-overlay-dialog {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    border: 0;
    background: var(--primary-background-color, #111820);
    color: var(--primary-text-color, #fff);
    font: 16px/1.5 var(--ha-font-family-body, Roboto, sans-serif);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .mediarr-overlay-dialog:not([open]) { display: none; }
  .mediarr-overlay-dialog::backdrop { background: rgba(0, 0, 0, 0.8); }

  .mediarr-overlay-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: max(12px, env(safe-area-inset-top)) 16px 12px;
    border-bottom: 1px solid var(--divider-color, #39424c);
  }

  .mediarr-overlay-close {
    color: inherit;
    border: 0;
    border-radius: 6px;
    background: transparent;
    font: inherit;
    padding: 8px;
    cursor: pointer;
  }

  .mediarr-overlay-content {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 20px max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
  }

  .mediarr-expanded { display: block; max-width: 1600px; margin: 0 auto; }
  .mediarr-expanded ha-card { background: transparent; overflow: visible; }
  .mediarr-expanded .card-background,
  .mediarr-expanded ha-card::after { display: none; }
  .mediarr-expanded .card-content { padding: 0; }
  .mediarr-search {
    width: 100%;
    box-sizing: border-box;
    padding: 14px;
    border: 1px solid var(--divider-color, #526170);
    border-radius: 10px;
    color: inherit;
    background: var(--card-background-color, #1c2530);
    font: inherit;
  }
  .mediarr-search-status { margin: 8px 0; min-height: 24px; }
  .mediarr-workspace { display: grid; grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.4fr); gap: 24px; align-items: start; }
  .mediarr-browser, .mediarr-focus { min-width: 0; }
  .mediarr-focus {
    position: sticky;
    top: 0;
    overflow: hidden;
    border-radius: 14px;
    background: #080c14;
    color: #fff;
  }
  .mediarr-expanded .media-content {
    height: 380px;
    margin-bottom: 0;
    border-radius: 0;
    background: transparent;
  }
  /* Both crossfade layers dissolve into the same surface as the details. */
  .mediarr-expanded .media-background {
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 35%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 35%, transparent 100%);
  }
  .mediarr-expanded .media-content::before {
    background: linear-gradient(to bottom, rgba(8, 12, 20, 0) 25%, rgba(8, 12, 20, 0.35) 60%, #080c14 100%);
  }
  .mediarr-expanded .media-info {
    padding: 24px 24px 12px;
    background: transparent;
    backdrop-filter: none;
  }
  .mediarr-expanded .media-info .title {
    font-size: clamp(1.6rem, 3vw, 2.5rem);
    line-height: 1.15;
    margin-bottom: 10px;
    overflow-wrap: anywhere;
  }
  .mediarr-expanded .media-details-panel {
    margin: 0;
    border-radius: 0;
    background: transparent;
    font-size: 1em;
  }
  .mediarr-expanded .media-details-panel summary { padding: 12px 24px; }
  .mediarr-expanded .media-details-body { padding: 0 24px 24px; }
  .mediarr-expanded .section-header { background: var(--card-background-color, #1c2530); }
  .mediarr-expanded .section-label,
  .mediarr-expanded .section-toggle-icon {
    color: var(--primary-text-color, #fff) !important;
    -webkit-text-fill-color: var(--primary-text-color, #fff) !important;
    text-shadow: none;
  }
  .mediarr-expanded .section-label { font-size: 12px; }
  .mediarr-expanded .section-content:not(.collapsed) { max-height: none; }
  .mediarr-expanded .section-content > [class*="-list"] { display: flex; flex-direction: column; gap: 8px; padding: 4px; }
  .mediarr-expanded .media-item {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    gap: 8px 14px;
    width: 100%;
    height: auto;
    min-height: 120px;
    box-sizing: border-box;
    margin: 0;
    padding: 10px;
    background: var(--card-background-color, #1c2530);
    transform: none;
  }
  .mediarr-expanded .media-item[hidden],
  .mediarr-expanded .section[hidden] { display: none; }
  .mediarr-expanded .media-item img { grid-column: 1; grid-row: 1 / 3; width: 80px; height: 120px; }
  .mediarr-expanded .media-item::after { display: none; }
  .mediarr-expanded .media-item-title {
    position: static;
    grid-column: 2;
    grid-row: 1;
    white-space: normal;
    font-size: 1em;
    line-height: 1.4;
    color: var(--primary-text-color, #fff);
    text-shadow: none;
  }
  .mediarr-expanded .mediarr-result-summary {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    line-height: 1.45;
    max-height: 5.8em;
    align-self: start;
    overflow: hidden;
    grid-column: 2;
    grid-row: 2;
    font-size: 0.85em;
    color: var(--secondary-text-color, #b8c5d6);
  }
  @media (max-width: 700px) {
    .mediarr-overlay-content { padding: 12px; }
    .mediarr-workspace { grid-template-columns: minmax(0, 1fr); gap: 16px; }
    .mediarr-focus { position: static; }
    .mediarr-expanded .media-content { height: 280px; }
    .mediarr-expanded .media-info { padding: 20px 16px 12px; }
    .mediarr-expanded .media-details-panel summary { padding: 12px 16px; }
    .mediarr-expanded .media-details-body { padding: 0 16px 20px; }
  }

  /* Unified library: user-facing stages rather than integration sections. */
  .mediarr-overlay-dialog { background: #090f18; color: #f4f7fc; }
  .mediarr-overlay-header { border-color: #283342; }
  .mediarr-expanded ha-card { border: 0; box-shadow: none; }
  .mediarr-library { --primary-text-color: #f4f7fc; --secondary-text-color: #aab8cc; --card-background-color: #111c2a; }
  .library-search-label { display: block; }
  .library-search-label > span { display: block; margin-bottom: 6px; font-size: .8rem; color: #aab8cc; }
  .mediarr-library .mediarr-search { background: #172130; color: #f4f7fc; border-color: #344359; }
  .mediarr-library .mediarr-search::placeholder { color: #aab8cc; }
  .library-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
  .library-tabs button, .library-request {
    border: 1px solid #34465a; border-radius: 24px; background: transparent;
    color: #c6d3e4; padding: 10px 16px; font: inherit; cursor: pointer;
  }
  .library-tabs button[aria-pressed=true] { border-color: #2bc9f3; color: #6cdcff; background: #0b2c40; }
  .library-tabs button:focus-visible, .library-request:focus-visible, .library-result:focus-visible {
    outline: 2px solid #5adaff; outline-offset: 3px;
  }
  .library-workspace { display: grid; grid-template-columns: minmax(260px, .8fr) minmax(0, 1.6fr); gap: 28px; align-items: start; }
  .mediarr-library .mediarr-search-status { color: #aab8cc; }
  .library-results, .library-focus { min-width: 0; }
  .library-focus { position: sticky; top: 0; scroll-margin-top: 12px; }
  .library-results { display: grid; gap: 10px; align-content: start; }
  .mediarr-expanded .media-item.library-result {
    width: 100%; min-height: 160px; padding: 12px; margin: 0; text-align: left;
    display: grid; grid-template-columns: 84px minmax(0, 1fr); grid-template-rows: auto auto 1fr auto;
    gap: 6px 14px; border: 1px solid #263549; border-radius: 12px;
    background: linear-gradient(120deg, #152334, #0d1520); color: #f4f7fc;
    box-shadow: none; font: inherit; transform: none;
  }
  .mediarr-expanded .media-item.library-result.selected { border-color: #2bc9f3; box-shadow: 0 0 0 1px #2bc9f3; }
  .library-result-poster { grid-column: 1; grid-row: 1/5; min-height: 128px; border-radius: 7px; background: #1d3045; display: grid; place-items: center; overflow: hidden; }
  .mediarr-expanded .library-result-poster img { display: block; width: 100%; height: 100%; min-height: 128px; object-fit: cover; border-radius: 0; }
  .mediarr-expanded .library-result .media-item-title { color: #f4f7fc; font-size: 1rem; line-height: 1.4; font-weight: 600; }
  .library-result-meta { grid-column: 2; grid-row: 2; color: #b4c1d3; font-size: .78rem; }
  .mediarr-expanded .library-result .mediarr-result-summary { grid-column: 2; grid-row: 3; font-size: .82rem; line-height: 1.45; max-height: 4.35em; -webkit-line-clamp: 3; color: #b4c1d3; }
  .library-status { font-size: .78rem; color: #aab8cc; }
  .library-result .library-status { grid-column: 2; grid-row: 4; }
  .library-status-ready { color: #86ddb6; }
  .library-status-waiting { color: #e7c783; }
  .library-empty { padding: 24px; color: #aab8cc; }
  .mediarr-expanded .media-details-panel.library-detail { background: #090f18; color: #f4f7fc; border-radius: 0; margin: 0; overflow: hidden; }
  .library-hero { position: relative; min-height: 430px; display: flex; align-items: end; padding-top: 180px; box-sizing: border-box; }
  .library-backdrop { position: absolute; inset: 0; background-size: cover; background-position: center top; opacity: .95; }
  .library-backdrop::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #090f18 0%, transparent 22%), linear-gradient(180deg, transparent 15%, rgba(9,15,24,.2) 42%, #090f18 100%); }
  .library-title-row { display: grid; grid-template-columns: clamp(100px, 12vw, 175px) minmax(0, 1fr); gap: 24px; align-items: end; position: relative; width: 100%; }
  .library-poster { aspect-ratio: 2/3; border: 1px solid #526075; border-radius: 8px; overflow: hidden; background: #142335; display: grid; place-items: center; }
  .library-poster img { width: 100%; height: 100%; object-fit: cover; }
  .library-heading { min-width: 0; padding: 12px 0; }
  .library-heading h1 { font-size: clamp(1.8rem, 3.3vw, 3rem); line-height: 1.12; margin: 0 0 14px; font-weight: 750; overflow-wrap: anywhere; text-shadow: 0 2px 12px #000; }
  .library-metadata { color: #d4ddeb; line-height: 1.6; margin: 0 0 14px; }
  .library-heading .library-status { margin: 0 0 14px; }
  .library-request { border-color: #2bc9f3; color: #63daff; border-radius: 8px; margin-top: 4px; }
  .library-request:disabled { opacity: .55; cursor: default; }
  .library-heading small { display: block; margin-top: 8px; color: #aab8cc; }
  .library-action-message { color: #ffb5b5; font-size: .85rem; }
  .library-action-message:empty { display: none; }
  .library-detail-body { padding: 24px 0; line-height: 1.7; }
  .library-detail-body h2 { font-size: 1.2rem; margin: 0 0 12px; }
  .library-detail-body p { color: #bfccdd; margin: 0 0 24px; }
  .media-details-synopsis { white-space: pre-line; overflow-wrap: anywhere; }
  .library-cast { display: flex; flex-wrap: wrap; gap: 16px; padding-bottom: 24px; }
  .library-person { width: 112px; display: flex; flex-direction: column; gap: 4px; font-size: .82rem; }
  .library-person img, .library-person-placeholder { width: 112px; height: 140px; object-fit: cover; border-radius: 8px; background: linear-gradient(140deg, #28435a, #172132); }
  .library-person-placeholder { display: grid; place-items: center; color: #a4cee4; font-size: 1.7rem; }
  .library-person small { color: #aab8cc; }
  .library-sources { border-top: 1px solid #273346; padding-top: 14px; color: #8f9fb5; font-size: .8rem; }
  .library-sources summary { cursor: pointer; }
  @media (max-width: 700px) {
    .library-workspace { grid-template-columns: minmax(0, 1fr); gap: 24px; }
    .library-focus { position: static; }
    .library-tabs { gap: 6px; }
    .library-tabs button { padding: 8px 10px; font-size: .8rem; }
    .library-hero { min-height: 340px; padding-top: 140px; }
    .library-title-row { grid-template-columns: 94px minmax(0, 1fr); gap: 14px; }
    .library-heading h1 { font-size: 1.65rem; }
    .library-metadata { font-size: .82rem; }
    .library-person { width: 92px; }
    .library-person img, .library-person-placeholder { width: 92px; height: 116px; }
  }

  .mediarr-compact ha-card {
    background: var(--ha-card-background, var(--card-background-color, #142130));
    border: 1px solid var(--divider-color, #334254);
    border-radius: var(--ha-card-border-radius, 12px);
  }
  .mediarr-compact ha-card::after { display: none; }
  .compact-media { position: relative; z-index: 1; padding: 16px; color: var(--primary-text-color, #f4f7fc); }
  .compact-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .compact-header ha-icon { color: var(--primary-color, #2bc9f3); --mdc-icon-size: 28px; }
  .compact-header h2 { margin: 0; font-size: 1.2rem; font-weight: 650; }
  .compact-subtitle { margin: 3px 0 0; font-size: .83rem; color: var(--secondary-text-color, #aab8cc); }
  .compact-media h3 { margin: 0 0 12px; font-size: .9rem; font-weight: 600; }
  .compact-posters, .compact-watchlist-posters { display: grid; grid-auto-flow: column; gap: 10px; overflow-x: auto; padding: 3px 2px 8px; scrollbar-width: thin; scroll-snap-type: x proximity; }
  .compact-posters { grid-auto-columns: minmax(64px, calc((100% - 30px) / 4)); }
  .compact-watchlist-posters { grid-auto-columns: 56px; gap: 8px; }
  .compact-poster { display: block; min-width: 0; padding: 0; border: 0; border-radius: 8px; color: inherit; background: transparent; font: inherit; text-align: left; cursor: pointer; scroll-snap-align: start; }
  .compact-poster-art { position: relative; display: grid; place-items: center; aspect-ratio: 2 / 3; overflow: hidden; border-radius: 8px; background: linear-gradient(145deg, #28435a, #101c2a); color: #b6d0df; }
  .compact-poster-art img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .compact-kind { position: absolute; left: 5px; top: 6px; padding: 3px 6px; border-radius: 6px; background: #0a111bd9; color: #f4f7fc; font-size: .65rem; }
  .compact-poster-title { display: block; margin-top: 8px; font-size: .78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .compact-watchlist { margin-top: 20px; }
  .compact-watchlist-link { display: block; width: 100%; padding: 0 0 12px; background: transparent; color: inherit; font: inherit; font-size: .9rem; text-align: left; cursor: pointer; border: 0; }
  .compact-empty { color: var(--secondary-text-color, #aab8cc); font-size: .83rem; white-space: normal; grid-column: 1 / -1; min-width: 200px; margin: 0; padding: 8px 0; }
  .compact-media .mediarr-open-button {
    display: flex; align-items: center; gap: 14px; width: 100%; box-sizing: border-box;
    margin: 18px 0 0; padding: 14px 16px; text-align: left; border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 45%, transparent);
    color: var(--primary-text-color, #f4f7fc);
    background: linear-gradient(115deg, color-mix(in srgb, var(--primary-color, #03a9f4) 20%, var(--card-background-color, #142130)), var(--card-background-color, #142130));
    transition: border-color .18s ease, box-shadow .18s ease;
  }
  .compact-media .mediarr-open-button:hover {
    border-color: var(--primary-color, #03a9f4);
    box-shadow: 0 0 18px color-mix(in srgb, var(--primary-color, #03a9f4) 15%, transparent);
  }
  .mediarr-open-icon { display: grid; place-items: center; width: 42px; height: 42px; flex-shrink: 0; border-radius: 12px; background: var(--primary-color, #03a9f4); color: #071722; }
  .mediarr-open-copy { display: grid; gap: 3px; flex: 1; min-width: 0; }
  .mediarr-open-copy strong { font-size: 1rem; font-weight: 650; }
  .mediarr-open-copy > span { font-size: .78rem; color: var(--secondary-text-color, #aab8cc); }
  .mediarr-open-arrow { flex-shrink: 0; color: var(--primary-color, #03a9f4); }
  /* Desktop: keep controls visible and give each column its own viewport. */
  @media (min-width: 701px) {
    .mediarr-overlay-content { overflow: hidden; }
    .mediarr-expanded, .mediarr-expanded ha-card, .mediarr-expanded .card-content { height: 100%; min-height: 0; }
    .mediarr-expanded .mediarr-library { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto auto auto minmax(0, 1fr) auto; }
    .library-search-label { grid-row: 1; }
    .library-tabs { grid-row: 2; }
    .mediarr-search-status { grid-row: 3; }
    .library-catalog-status { grid-row: 4; }
    .library-workspace { grid-row: 5; }
    .library-load-more { grid-row: 6; justify-self: start; }
    .library-workspace { min-height: 0; align-items: stretch; }
    .library-results, .library-focus { min-height: 0; overflow-y: auto; overscroll-behavior-y: contain; scrollbar-width: thin; scrollbar-color: #526b82 transparent; scrollbar-gutter: stable; }
    .library-results { padding: 3px 8px 8px 3px; }
    .library-focus { position: static; padding-right: 8px; }
    .library-results:focus-visible, .library-focus:focus-visible { outline: 2px solid #5adaff; outline-offset: -2px; }
  }
  .mediarr-page { box-sizing: border-box; display: block; padding: 16px; max-width: none; background: #090f18; color: #f4f7fc; }
  @media (min-width: 701px) { .mediarr-expanded.mediarr-page { height: calc(100dvh - var(--header-height, 56px) - 32px); min-height: 360px; } }
  @media (max-width: 700px) { .mediarr-page { min-height: calc(100dvh - var(--header-height, 56px)); padding: 12px; } }
  .library-catalog-status { margin: 0 0 10px; color: #aab8cc; font-size: .85rem; }
  .library-load-more { margin-top: 10px; border: 1px solid #34465a; border-radius: 8px; padding: 8px 16px; background: #172130; color: #6cdcff; cursor: pointer; font: inherit; }
  .library-load-more[hidden], .library-catalog-status[hidden] { display: none; }
  .compact-poster:focus-visible, .compact-watchlist-link:focus-visible { outline: 2px solid var(--primary-color, #2bc9f3); outline-offset: 2px; }
  .library-detail-body .library-metadata-status { color: #b9ccdf; font-size: .85rem; }
  .library-metadata-status:empty { display: none; }
  .library-streaming { margin-bottom: 24px; }
  .library-streaming p { margin-bottom: 10px; }
  .streaming-provider { display: inline-block; margin: 3px; padding: 3px 9px; border: 1px solid #34465a; border-radius: 8px; color: #d5e9fa; }
  .library-streaming a { color: #6cdcff; }
  .library-result-poster, .library-poster { position: relative; }
  .media-download-badge { position: absolute; z-index: 2; bottom: 0; left: 0; right: 0; padding: 6px; background: rgba(3,14,25,.92); color: #d4f5ff; font-size: .65rem; line-height: 1.25; display: grid; gap: 5px; }
  .media-download-track { display: block; height: 4px; background: #435669; border-radius: 4px; overflow: hidden; }
  .media-download-track > span { display: block; height: 100%; background: #2bc9f3; }
  .compact-watchlist-posters .media-download-badge { font-size: .55rem; padding: 4px; }
  .library-metadata-retry { border: 1px solid #34465a; border-radius: 6px; color: #6cdcff; background: transparent; padding: 7px 10px; margin-bottom: 16px; cursor: pointer; }
`;
