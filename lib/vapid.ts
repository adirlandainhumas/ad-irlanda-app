/**
 * Chave pública VAPID — usada pelo browser para criar a push subscription.
 * A chave PRIVADA fica APENAS nas variáveis de ambiente do Netlify (server-side).
 */
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
