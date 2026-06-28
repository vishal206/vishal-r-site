// True only while the app is being rendered by the prerender script (headless
// Chrome). The flag is injected via page.evaluateOnNewDocument BEFORE any module
// runs, so this is safe to read at module-load time. Used to suppress analytics
// and Firestore writes so the build doesn't pollute real data with bot hits.
export const IS_PRERENDER =
  typeof window !== "undefined" &&
  !!(window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__;
