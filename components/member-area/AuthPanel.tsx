import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, User } from 'lucide-react';
import { InputField } from './FieldControls';

import type { FormEvent } from 'react';

interface AuthPanelProps {
  isSignUp: boolean;
  loading: boolean;
  fullName: string;
  email: string;
  password: string;
  error: string | null;
  successMsg: string | null;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onToggleMode: () => void;
}

export const AuthPanel = ({
  isSignUp,
  loading,
  fullName,
  email,
  password,
  error,
  successMsg,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
}: AuthPanelProps) => (
  <div className="min-h-[70vh] flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
      <h2 className="text-2xl font-black text-center text-slate-800 mb-2">
        {isSignUp ? 'Criar conta de membro' : 'Entrar na área de membros'}
      </h2>
      <p className="text-center text-sm text-slate-500 mb-6">Após cada refresh o login é solicitado novamente.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignUp && (
          <InputField
            label="Nome completo"
            value={fullName}
            onChange={onFullNameChange}
            icon={<User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
          />
        )}

        <InputField
          label="E-mail"
          value={email}
          onChange={onEmailChange}
          icon={<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
          type="email"
        />

        <InputField
          label="Senha"
          value={password}
          onChange={onPasswordChange}
          icon={<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
          type="password"
        />

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSignUp ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <button
        type="button"
        onClick={onToggleMode}
        className="w-full mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        {isSignUp ? 'Já tem conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
      </button>
    </div>
  </div>
);
