
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Image as ImageIcon, BookOpen, Quote } from 'lucide-react';
import { supabase, STORAGE_BASE_URL } from '../lib/supabase';
import { Notice } from '../types';
import NoticeModal from '../components/NoticeModal';

const Home: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: noticesData } = await supabase
      .from('notices')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3);
    
    if (noticesData) setNotices(noticesData);

    const { data: files } = await supabase.storage.from('galeria').list('ultimo-culto', { limit: 4 });
    if (files) {
      const photoUrls = files
        .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
        .map(f => STORAGE_BASE_URL + f.name);
      setPhotos(photoUrls);
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-700">
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes float-reverse {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 50px) scale(1.1); }
          66% { transform: translate(20px, -20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 25s ease-in-out infinite; }
        .bg-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
      `}</style>

      <section className="relative w-full h-[70vh] md:h-[80vh] flex flex-col items-center justify-center bg-[#070b14] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b14] via-[#0f172a] to-[#1e3a8a]"></div>
        <div className="absolute inset-0 bg-grid opacity-30"></div>
        
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px] opacity-20 animate-float"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-700 rounded-full blur-[100px] opacity-25 animate-float-reverse"></div>

        <div className="relative z-10 w-full px-6 flex flex-col items-center text-center space-y-10 md:space-y-14 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
            <img 
               src="https://llevczjsjurdfejwcqpo.supabase.co/storage/v1/object/public/assets/branding/logo.png" 
               alt="Logo AD" 
               className="relative z-10 h-[80px] md:h-[140px] w-auto object-contain animate-in fade-in zoom-in-95 duration-1000"
             />
          </div>

          <div className="space-y-6 max-w-2xl">
            <h2 className="text-4xl md:text-7xl font-[900] tracking-tight leading-[1.1] text-white">
              Um lugar de <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-blue-200 via-blue-100 to-white bg-clip-text text-transparent">
                fé e comunhão.
              </span>
            </h2>
            
            <div className="flex flex-col items-center gap-4">
              <Quote className="w-5 h-5 text-blue-400 opacity-30" />
              <p className="text-blue-100/70 text-base md:text-2xl italic font-medium leading-relaxed px-4 max-w-lg">
                "Oh! como é bom e quão suave é que os irmãos vivam em união."
              </p>
              <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-black text-blue-400/60">
                - Salmos 133:1
              </span>
            </div>
          </div>
          
          <Link 
            to="/avisos" 
            className="group relative flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-10 py-4 md:px-14 md:py-6 rounded-full text-base md:text-lg font-bold shadow-2xl hover:bg-white hover:text-blue-900 hover:scale-105 active:scale-95 transition-all duration-500"
          >
            <span className="relative z-10 flex items-center gap-2">
              Nossa programação
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </section>

      <div className="p-4 md:p-8 space-y-16 py-12 bg-white rounded-t-[3rem] md:rounded-t-[4rem] -mt-10 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Link to="/devocional" className="flex flex-col items-center justify-center p-6 md:p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all active:scale-[0.98] group">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 md:w-10 md:h-10 text-blue-600" />
            </div>
            <span className="text-xs md:text-sm font-black text-slate-800 tracking-tight">Devocional</span>
          </Link>
          <Link to="/galeria" className="flex flex-col items-center justify-center p-6 md:p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all active:scale-[0.98] group">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-7 h-7 md:w-10 md:h-10 text-amber-600" />
            </div>
            <span className="text-xs md:text-sm font-black text-slate-800 tracking-tight">Fotos do Culto</span>
          </Link>
          {/* Outros atalhos poderiam entrar aqui no desktop */}
        </div>

        <section className="space-y-6 px-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              Avisos Recentes
            </h3>
            <Link to="/avisos" className="text-blue-600 text-sm md:text-base font-black flex items-center gap-1 hover:gap-2 transition-all">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {notices.map((notice) => (
              <div 
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-blue-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">{notice.title}</h4>
                  <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed font-medium">
                    {notice.body}
                  </p>
                </div>
                <div className="mt-6 flex items-center text-blue-600 font-bold text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                  Ler aviso completo <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 px-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              Último Culto
            </h3>
            <Link to="/galeria" className="text-blue-600 text-sm md:text-base font-black flex items-center gap-1 hover:gap-2 transition-all">
              Galeria completa <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {photos.map((url, i) => (
              <Link key={i} to="/galeria" className="aspect-square rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-sm border border-slate-200 bg-slate-100 group">
                <img 
                  src={url} 
                  alt={`Destaque ${i}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  loading="lazy" 
                />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <NoticeModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />
    </div>
  );
};

export default Home;
