const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Apenas POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, body, url } = JSON.parse(event.body ?? '{}');

    if (!title || !body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'title e body são obrigatórios' }) };
    }

    // Configura VAPID
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // Conecta ao Supabase com service_role para leitura/exclusão
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Busca todas as subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription');

    if (error) throw error;

    if (!subs || subs.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ sent: 0, message: 'Nenhum inscrito' }) };
    }

    const payload = JSON.stringify({ title, body, url: url ?? '/avisos' });

    // Envia para todos em paralelo — remove subscriptions expiradas (410)
    const results = await Promise.allSettled(
      subs.map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription, payload);
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription inválida — remove do banco
            await supabase.from('push_subscriptions').delete().eq('id', row.id);
          }
        }
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent, total: subs.length }),
    };
  } catch (err) {
    console.error('send-push error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
