/**
 * App shell layout — injected synchronously in root layout <head> so staging/Safari
 * never paints without grid/sidebar rules (streamed HTML + late globals chunk caused
 * full-width stacked nav + visible mobile chrome on desktop).
 */
export const APP_SHELL_LAYOUT_CSS = `
.app-shell-root {
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #f7f9fb;
}
@media (min-width: 1024px) {
  .app-shell-root {
    display: block !important;
    grid-template-columns: none !important;
    align-items: initial !important;
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
  height: 100dvh;
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
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    height: 100dvh !important;
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
@media (min-width: 1024px) {
  .app-shell-main {
    margin-left: 18rem !important;
    min-height: 100vh !important;
    width: calc(100% - 18rem) !important;
  }
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

/* If streaming/hydration ever emits a second nav aside inside one shell, keep only the first. */
.app-shell-root > aside.app-shell-sidebar ~ aside.app-shell-sidebar {
  display: none !important;
}

/*
 * Safety guard for malformed/nested shells inside main content (observed on some production streams):
 * flatten nested shell wrapper and neutralize its layout offsets so content cannot shift right.
 */
.app-shell-main .app-shell-root {
  display: contents !important;
}
.app-shell-main .app-shell-root > aside.app-shell-sidebar {
  display: none !important;
}
.app-shell-main .app-shell-root > .app-shell-main {
  margin-left: 0 !important;
  width: 100% !important;
  min-height: 0 !important;
}

@media (max-width: 1023px) {
  .app-shell-main .app-shell-main header.app-shell-only-mobile {
    display: none !important;
  }
}

.app-shell-main > header.app-shell-only-mobile {
  justify-content: flex-start;
}

`.trim();
