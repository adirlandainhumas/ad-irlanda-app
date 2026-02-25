import { Camera, Upload, UserCircle } from 'lucide-react';

interface PhotoUploadFieldProps {
  photoUrl: string | null;
  onPhotoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PhotoUploadField = ({ photoUrl, onPhotoChange }: PhotoUploadFieldProps) => (
  <div className="space-y-2 border border-slate-300 rounded-xl p-4 bg-white">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Foto do membro</label>
    <div className="flex flex-wrap items-center gap-4">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt="Foto do membro" className="w-full h-full object-cover" />
        ) : (
          <UserCircle className="w-10 h-10 text-slate-500" />
        )}
      </div>

      <div className="flex-1 min-w-[220px]">
        <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700">
          <Upload className="w-4 h-4" />
          Enviar foto da galeria
          <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
        </label>
        <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 text-sm font-semibold text-slate-700 mt-2">
          <Camera className="w-4 h-4" />
          Capturar foto
          <input type="file" accept="image/*" capture="user" className="hidden" onChange={onPhotoChange} />
        </label>
      </div>
    </div>
  </div>
);
