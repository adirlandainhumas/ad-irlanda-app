import { supabase } from './supabase';
import { VAPID_PUBLIC_KEY } from './vapid';

/** Converte a chave pública VAPID de base64url para Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Solicita permissão de notificação ao usuário,
 * inscreve no Push Manager e salva a subscription no Supabase.
 */
export async function subscribeUserToPush(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;

    // Verifica se já existe uma subscription ativa
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

    // Salva no Supabase (evita duplicar: tenta inserir silenciosamente)
    await supabase.from('push_subscriptions').insert({ subscription: sub.toJSON() });
  } catch {
    // Silencioso — erros de permissão ou subscrição não afetam o app
  }
}

/**
 * Envia uma notificação push para todos os membros inscritos.
 * Chama a Netlify Function send-push.
 */
export async function sendPushNotification(
  title: string,
  body: string,
  url: string = '/avisos'
): Promise<void> {
  try {
    await fetch('/.netlify/functions/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url }),
    });
  } catch {
    // Silencioso — falha no push não deve bloquear o fluxo do admin
  }
}
