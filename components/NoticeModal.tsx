
import React from 'react';
import { X } from 'lucide-react';
import { Notice } from '../types';

interface NoticeModalProps {
  notice: Notice | null;
  onClose: () => void;
}

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

const NoticeModal: React.FC<NoticeModalProps> = ({ notice, onClose }) => {
  if (!notice) return null;

  const handleShareWhatsApp = () => {
    const message = `*${notice.title}*\n\n${notice.body}\n\n📍 Av. Maria José de Paula, Setor Amélio Alves - Inhumas\nAD Ministério Irlanda • Inhumas - GO`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 top-16 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-blue-900 leading-tight pr-4">
            {notice.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar">
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
            {notice.body}
          </div>
          
          <div className="mt-8 pt-4 border-t text-sm text-slate-500 italic">
            <p>📍 Av. Maria José de Paula, Setor Amélio Alves - Inhumas</p>
            <p>AD Ministério Irlanda • Inhumas - GO</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex flex-col gap-2">
          <button
            onClick={handleShareWhatsApp}
            aria-label="Compartilhar no WhatsApp"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-4 px-4 rounded-full transition-all shadow-md hover:scale-[1.03] active:scale-[0.98]"
          >
            <WhatsAppIcon className="w-6 h-6" />
            Compartilhar no WhatsApp
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-slate-500 text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeModal;
