
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Notice } from '../types';
import NoticeModal from '../components/NoticeModal';
import { Search, Loader2, Calendar as CalendarIcon } from 'lucide-react';

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (data) setNotices(data);
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-blue-900 tracking-tight">Avisos e Eventos</h2>
          <p className="text-slate-500 text-sm md:text-base">Fique por dentro de tudo que acontece na nossa igreja.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-100 px-4 py-2 rounded-full text-sm font-bold">
           <CalendarIcon className="w-4 h-4" />
           Atualizado hoje
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">Buscando atualizações...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((notice) => (
            <div 
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 active:scale-[0.99] transition-all cursor-pointer border-l-[6px] border-l-blue-600 group"
            >
              <div className="text-[10px] font-black text-blue-600 mb-3 uppercase tracking-[0.2em]">
                {new Date(notice.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
              <h4 className="font-bold text-slate-800 text-xl mb-3 leading-tight group-hover:text-blue-700 transition-colors">{notice.title}</h4>
              <p className="text-slate-600 text-sm line-clamp-4 leading-relaxed whitespace-pre-wrap font-medium">
                {notice.body}
              </p>
            </div>
          ))}

          {notices.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 text-center px-10">
              <Search className="w-16 h-16 mb-4 opacity-10" />
              <p className="font-bold text-lg">Nenhum aviso no momento.</p>
              <p className="text-sm">Volte mais tarde para novas atualizações.</p>
            </div>
          )}
        </div>
      )}

      <NoticeModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />
    </div>
  );
};

export default Notices;
