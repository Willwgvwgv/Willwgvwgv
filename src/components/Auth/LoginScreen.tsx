import React, { useState } from 'react';
import { loginWithEmail, loginWithGoogle } from '../../lib/firebaseAuthService';
import { Calendar, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor, informe o e-mail e a senha.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await loginWithEmail(email.trim(), password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'E-mail ou senha incorretos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err?.message || 'Erro ao conectar com o Google Auth.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 antialiased selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-1 shadow-inner">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Ponto Chave</h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Agenda Comercial
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Painel Comercial & Gestão de Agendamentos (Firebase Active)
          </p>
        </div>

        {/* Google OAuth Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          Entrar com Google (Firebase)
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-700/80 w-full"></div>
          <span className="bg-slate-800 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
            ou acesse com e-mail e senha
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              E-mail corporativo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@pontochave.com.br"
                disabled={loading || googleLoading}
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 outline-hidden focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading || googleLoading}
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 outline-hidden focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Conectando ao Firebase...
              </>
            ) : (
              'Entrar com E-mail'
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800">
          Ponto Chave • Sistema Autenticado via Firebase Auth
        </div>
      </div>
    </div>
  );
};


