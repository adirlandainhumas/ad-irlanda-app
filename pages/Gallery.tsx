
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, STORAGE_BASE_URL } from '../lib/supabase';
import { Loader2, Download, ChevronLeft, ChevronRight, ImageIcon, ArrowLeft } from 'lucide-react';

const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('galeria').list('ultimo-culto', { 
      limit: 200,
      sortBy: { column: 'name', order: 'desc' }
    });

    if (data) {
      const validUrls = data
        .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
        .map(f => STORAGE_BASE_URL + f.name);
      setFiles(validUrls);
    }
    setLoading(false);
  };

  const changePhoto = useCallback((newIndex: number, dir: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setSelectedIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 350);
  }, [isAnimating]);

  const nextPhoto = useCallback(() => {
    if (files.length <= 1) return;
    const nextIdx = selectedIndex + 1 >= files.length ? 0 : selectedIndex + 1;
    changePhoto(nextIdx, 'next');
  }, [selectedIndex, files.length, changePhoto]);

  const prevPhoto = useCallback(() => {
    if (files.length <= 1) return;
    const prevIdx = selectedIndex - 1 < 0 ? files.length - 1 : selectedIndex - 1;
    changePhoto(prevIdx, 'prev');
  }, [selectedIndex, files.length, changePhoto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (files.length === 0) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files.length, nextPhoto, prevPhoto, navigate]);

  const downloadImage = async (url: string, index: number) => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Falha ao baixar imagem');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `AD-Irlanda-Culto-foto-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Erro no download:', error);
      window.open(url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-400 font-medium">Carregando galeria...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
          <ImageIcon className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Sem fotos disponíveis</h3>
        <p className="text-slate-500">Nenhuma foto disponível do último culto no momento.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg active:scale-95 transition-all"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#020617] animate-in fade-in duration-500 overflow-hidden">
      <style>{`
        @keyframes slideNext {
          from { opacity: 0; transform: translateX(20px) scale(0.98); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slidePrev {
          from { opacity: 0; transform: translateX(-20px) scale(0.98); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-slide-next { animation: slideNext 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-prev { animation: slidePrev 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .safe-pb { padding-bottom: max(2rem, env(safe-area-inset-bottom, 2rem)); }
      `}</style>

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img 
          src={files[selectedIndex]} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-10 blur-[80px] scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]"></div>
      </div>

      {/* Header */}
      <div className="relative z-30 p-4 md:p-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/70 hover:text-white transition-all active:scale-90"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-white text-xs md:text-sm font-black uppercase tracking-[0.3em]">Galeria Oficial</h2>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-0.5">AD Ministério Irlanda</p>
        </div>
        <div className="w-12 h-12 invisible" /> {/* Spacer */}
      </div>

      {/* Image Stage Area (The Fixed Viewer) */}
      <div className="relative flex-1 w-full h-[65vh] md:h-[75vh] flex items-center justify-center bg-black/20 overflow-hidden">
        
        {/* Navigation Overlays (Always Visible) */}
        <button 
          onClick={prevPhoto}
          disabled={isAnimating}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 transition-all active:scale-90"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        <button 
          onClick={nextPhoto}
          disabled={isAnimating}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 md:p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 transition-all active:scale-90"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* The Image Itself */}
        <div 
          key={selectedIndex}
          className={`relative z-20 w-full h-full p-4 flex items-center justify-center select-none ${
            direction === 'next' ? 'animate-slide-next' : 
            direction === 'prev' ? 'animate-slide-prev' : 'animate-in fade-in duration-500'
          }`}
        >
          <img 
            src={files[selectedIndex]} 
            alt={`Foto ${selectedIndex + 1}`} 
            className="max-w-full max-h-full object-contain rounded-xl md:rounded-3xl shadow-2xl border border-white/5"
          />
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="relative z-30 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 safe-pb px-6 pt-6">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-6">
          
          {/* Indicator */}
          <div className="flex flex-col">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Visualizando</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">{selectedIndex + 1}</span>
              <span className="text-blue-500/50 font-bold">/</span>
              <span className="text-lg font-bold text-white/40">{files.length}</span>
            </div>
          </div>

          {/* Download Button */}
          <button 
            onClick={() => downloadImage(files[selectedIndex], selectedIndex)}
            disabled={downloading}
            className={`flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 ${
              downloading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Baixar Foto</span>
            <span className="sm:hidden">Baixar</span>
          </button>
        </div>

        {/* Desktop Progress Bar */}
        <div className="hidden md:flex gap-1.5 mt-8 justify-center pb-4">
          {files.slice(0, 20).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === selectedIndex ? 'w-8 bg-blue-500' : 'w-1.5 bg-white/10'
              }`}
            />
          ))}
          {files.length > 20 && <div className="text-[8px] text-white/20 font-black flex items-center">...</div>}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
