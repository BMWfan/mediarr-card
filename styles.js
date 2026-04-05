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
    transition: all var(--transition-duration) ease-in-out;
  }

  .card-background {
    filter: blur(20px) brightness(0.7);
    transform: scale(1.2);
    z-index: 0;
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
  }

  /* Media Content Area */
  .media-content {
    position: relative;
    width: 100%;
    height: 120px;
    overflow: hidden;
    margin-bottom: var(--section-spacing);
    cursor: pointer;
  }

  .media-content::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--hero-scrim);
    z-index: 1;
    pointer-events: none;
  }

  .media-content:hover .media-background {
    transform: scale(1.15);
  }

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
    transition: all var(--transition-duration) cubic-bezier(0.4, 0, 0.2, 1);
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

  .section-header:hover {
    background-color: var(--section-hover-bg) !important;
    border-color: var(--section-border-color) !important;
  }

  /* Empty State */
  .empty-section-content {
    padding: 16px;
    text-align: center;
    color: rgba(255, 255, 255, 0.78);
  }

  .empty-message {
    font-size: var(--subtitle-size);
    opacity: 1;
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
`;
