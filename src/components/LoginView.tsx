import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';
import { AttachLogo } from './AttachLogo';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      // Required credentials check: admin@admin.cl / 1234
      if (email.trim().toLowerCase() === 'admin@admin.cl' && password.trim() === '1234') {
        const user: UserSession = {
          isAuthenticated: true,
          email: 'admin@admin.cl',
          name: 'Supervisor Attach',
          role: 'Supervisor Técnico Senior',
          companyName: 'Attach • Reportabilidad Inteligente',
          rut: '15.489.321-K'
        };
        onLoginSuccess(user);
      } else {
        setErrorMsg('Credenciales incorrectas. Verifique usuario o contraseña.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleFillDemo = () => {
    setEmail('admin@admin.cl');
    setPassword('1234');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F7FA] dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      {/* Background soft styling element */}
      <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-[#5E5365] to-transparent opacity-80 -z-0 pointer-events-none" />

      <div
        id="login-card-container"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 relative z-10 animate-fade-in"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <AttachLogo variant="full" size="md" showSlogan={true} className="mx-auto" />
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div
            id="login-error-alert"
            className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-shake"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@admin.cl"
                className="w-full min-h-[52px] pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="login-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full min-h-[52px] pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
              />
            </div>
          </div>

          {/* Submit Button (min 56px height) */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[56px] bg-[#CC8B79] hover:bg-[#b87665] active:scale-98 text-white rounded-xl text-sm sm:text-base font-bold shadow-lg shadow-[#CC8B79]/25 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Iniciar Sesión en Terreno</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Shortcut Box */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Credenciales de acceso para evaluación:
          </p>
          <button
            id="login-autofill-btn"
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-slate-800 hover:bg-purple-100 text-[#5E5365] dark:text-[#CC8B79] text-xs font-bold border border-purple-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#CC8B79]" />
            <span>Autocompletar (admin@admin.cl / 1234)</span>
          </button>
        </div>
      </div>

      <footer className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Attach • Reportabilidad inteligente • Modo Offline-First Habilitado
      </footer>
    </div>
  );
};
