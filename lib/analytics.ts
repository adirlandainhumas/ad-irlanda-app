/**
 * AOGIM Conect — Google Analytics 4 helpers
 * Measurement ID: G-YPH16S453P
 */

declare function gtag(...args: unknown[]): void;

const GA_ID = "G-YPH16S453P";

// ─── Page View ────────────────────────────────────────────────────────────────
/**
 * Envia um page_view para o GA4.
 * Chame toda vez que a rota mudar (HashRouter).
 */
export function trackPageView(path: string, title?: string) {
  if (typeof gtag === "undefined") return;
  gtag("config", GA_ID, {
    page_path: path,
    page_title: title ?? document.title,
  });
}

// ─── Custom Events ────────────────────────────────────────────────────────────
/**
 * Envia um evento personalizado para o GA4.
 * @param eventName  Nome do evento (ex: "pix_copy_click")
 * @param params     Parâmetros extras (ex: { platform: "instagram" })
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof gtag === "undefined") return;
  gtag("event", eventName, params ?? {});
}

// ─── Eventos pré-definidos ────────────────────────────────────────────────────

/** Clique no botão "Copiar chave PIX" */
export const trackPixCopy = () =>
  trackEvent("pix_copy_click", { event_category: "engagement", event_label: "PIX" });

/** Clique em link de rede social */
export const trackSocialClick = (platform: "instagram" | "youtube" | "tiktok") =>
  trackEvent("social_click", { event_category: "outbound", event_label: platform });

/** Clique em link externo (WhatsApp, Maps, etc.) */
export const trackOutboundClick = (label: string) =>
  trackEvent("outbound_click", { event_category: "outbound", event_label: label });
