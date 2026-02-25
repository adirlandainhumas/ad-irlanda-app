import React from "react";

type DevocionalData = {
  title: string;
  verseText: string;
  verseRef: string;
};

type Props = {
  data: DevocionalData;
  shareUrl: string;
  buildShareText: (dev: DevocionalData, shareUrl: string) => string;
};

export default function DevotionalShareActions({ data, shareUrl, buildShareText }: Props) {
  const shareText = buildShareText(data, shareUrl);

  const compartilharWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const compartilharTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const compartilharNativo = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `Devocional • ${data.title}`,
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // usuário cancelou
    }
  };

  const copiarMensagem = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Mensagem do devocional copiada!");
    } catch {
      prompt("Copie a mensagem:", shareText);
    }
  };

  return (
    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button
        onClick={compartilharWhatsApp}
        className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 text-sm font-semibold transition"
      >
        WhatsApp
      </button>
      <button
        onClick={compartilharTelegram}
        className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white py-2.5 text-sm font-semibold transition"
      >
        Telegram
      </button>
      <button
        onClick={copiarMensagem}
        className="rounded-xl bg-white/15 hover:bg-white/20 border border-white/25 text-white py-2.5 text-sm font-semibold transition"
      >
        Copiar
      </button>
      <button
        onClick={compartilharNativo}
        disabled={!navigator.share}
        className="rounded-xl bg-indigo-500/90 hover:bg-indigo-500 text-white py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Mais opções
      </button>
    </div>
  );
}
