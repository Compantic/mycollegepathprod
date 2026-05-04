/**
 * App shell layout — injected synchronously in root layout <head> so staging/Safari
 * never paints without grid/sidebar rules (streamed HTML + late globals chunk caused
 * full-width stacked nav + visible mobile chrome on desktop).
 */
export const APP_SHELL_LAYOUT_CSS = `
.app-shell-root {
  min-height: 100vh;
  background-color: #f7f9fb;
}
@media (min-width: 1024px) {
  .app-shell-root {
    display: grid;
    grid-template-columns: 18rem minmax(0, 1fr);
    align-items: stretch;
  }
}
@media (max-width: 1023px) {
  .app-shell-root {
    display: flex;
    flex-direction: column;
  }
}

.app-shell-sidebar {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 18rem;
  flex-shrink: 0;
  height: 100vh;
}
@media (max-width: 1023px) {
  .app-shell-sidebar[data-open="false"] {
    display: none !important;
  }
  .app-shell-sidebar[data-open="true"] {
    display: flex !important;
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 61;
    width: min(20rem, 88vw);
  }
}
@media (min-width: 1024px) {
  .app-shell-sidebar {
    display: flex !important;
    position: relative;
    z-index: 30;
  }
}

.app-shell-main {
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.app-shell-backdrop {
  display: block;
}
@media (min-width: 1024px) {
  .app-shell-backdrop {
    display: none !important;
  }
}

.app-shell-only-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (min-width: 1024px) {
  .app-shell-only-mobile {
    display: none !important;
  }
}

/* If streaming/hydration ever emits a second nav aside as a sibling, keep only the first. */
.app-shell-root > aside.app-shell-sidebar ~ aside.app-shell-sidebar {
  display: none !important;
}
`.trim();
