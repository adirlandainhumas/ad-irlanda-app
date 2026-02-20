
import React, { useEffect, useState } from 'react';
import { BookOpen, Instagram, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { DevotionalData } from '../types';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Devotional: React.FC = () => {
  const [data, setData] = useState<DevotionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDevotional();
  }, []);

  const fetchDevotional = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setData({
        title: "O Senhor é o meu Pastor",
        reference: "Salmos 23:1",
        text: "O Salmo 23 é um dos textos mais conhecidos e amados da Bíblia. Ele nos lembra da providência e do cuidado constante de Deus. Quando dizemos 'nada me faltará', não significa ausência de problemas, mas a certeza de que a presença do Pastor supre todas as nossas necessidades emocionais e espirituais. Hoje, descanse na certeza de que você não está sozinho em sua jornada."
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleShareWhatsApp = () => {
    if (!data) return;
    const msg = `*Devocional do Dia - AD Irlanda*\n\n📖 *${data.title}*\n_${data.reference}_\n\n${data.text}\n\n🙏 *Momento de Oração:* Senhor Jesus, obrigado pelo Teu cuidado. Guia meus passos hoje e enche meu coração de paz. Amém.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyToClipboard = () => {
    if (!data) return;
    const text = `${data.title}\n${data.reference}\n\n${data.text}\n\n🙏 AD Irlanda`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInstagram = () => {
    window.open('https://www.instagram.com/ad_irlanda/', '_blank');
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-blue-900">Devocional Diário</h2>
        <p className="text-slate-500 text-sm">Uma palavra de esperança para começar o seu dia.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <BookOpen className="w-24 h-24 text-blue-900" />
             </div>
             
             <div className="relative z-10">
               <h3 className="text-2xl font-bold text-blue-900 mb-2 leading-tight">{data.title}</h3>
               <p className="text-blue-600 font-bold text-sm mb-6 flex items-center gap-2">
                 <Sparkles className="w-4 h-4" />
                 {data.reference}
               </p>
               <div className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                 {data.text}
               </div>
             </div>
          </div>

          <section className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
              <span className="text-xl">🙏</span>
              Momento de Oração
            </h4>
            <p className="text-blue-900 leading-relaxed font-medium">
              Senhor, entrego este dia em Tuas mãos. Que a Tua palavra seja lâmpada para os meus pés e luz para o meu caminho. Fortalece a minha fé e ajuda-me a testemunhar do Teu amor por onde eu passar. Amém.
            </p>
          </section>

          <div className="flex flex-col gap-3 pb-6">
            <button
              onClick={handleShareWhatsApp}
              aria-label="Compartilhar no WhatsApp"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-4 rounded-full shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              <WhatsAppIcon className="w-6 h-6" />
              Compartilhar no WhatsApp
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-200 active:scale-[0.98] transition-all"
              >
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
              <button
                onClick={openInstagram}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                <Instagram className="w-5 h-5" />
                Instagram
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-slate-400 py-20">Não foi possível carregar o devocional. Tente novamente mais tarde.</p>
      )}
    </div>
  );
};

export default Devotional;
