import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Users, UserPlus, CheckCircle2, Database } from 'lucide-react';
import { UserSession } from '../types';
import { AttachLogo } from './AttachLogo';
import { findUserByCredentials } from '../data/users';
import {
  getSupabaseConfig,
  signInWithSupabase,
  signUpWithSupabase
} from '../lib/supabase';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Supervisor Técnico Senior');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabaseConfig = getSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Por favor ingrese su correo electrónico y contraseña.');
      return;
    }

    if (cleanEmail.includes('supabase.co') || cleanEmail.startsWith('http://') || cleanEmail.startsWith('https://')) {
      setErrorMsg('Ha ingresado una dirección web en lugar de un correo. Utilice uno de los usuarios habilitados: leni@leni.cl, admin1@admin1.cl o admin2@admin2.cl');
      return;
    }

    // Shorthand resolution
    if (cleanEmail.toLowerCase() === 'leni') cleanEmail = 'leni@leni.cl';
    if (cleanEmail.toLowerCase() === 'admin1') cleanEmail = 'admin1@admin1.cl';
    if (cleanEmail.toLowerCase() === 'admin2') cleanEmail = 'admin2@admin2.cl';

    setIsLoading(true);

    try {
      if (mode === 'register') {
        // Sign up with Supabase Auth
        if (supabaseConfig.isConfigured) {
          const { userSession, error, needsEmailConfirmation } = await signUpWithSupabase(
            cleanEmail,
            cleanPassword,
            {
              name: name.trim() || cleanEmail.split('@')[0],
              role: role.trim() || 'Supervisor Técnico',
              companyName: 'Attach • Reportabilidad Inteligente'
            }
          );

          if (error) {
            setErrorMsg(`Error al registrar en Supabase: ${error}`);
            setIsLoading(false);
            return;
          }

          if (needsEmailConfirmation) {
            setSuccessMsg('¡Cuenta creada! Se ha enviado un correo de confirmación. Verifique su bandeja de entrada.');
            setIsLoading(false);
            return;
          }

          if (userSession) {
            onLoginSuccess(userSession);
            return;
          }
        } else {
          // If Supabase is not configured yet, register as local session
          const localUser: UserSession = {
            id: `usr-${Date.now().toString(36)}`,
            userId: `usr-${Date.now().toString(36)}`,
            isAuthenticated: true,
            email: cleanEmail,
            name: name.trim() || cleanEmail.split('@')[0],
            role: role.trim() || 'Supervisor Técnico',
            companyName: 'Attach • Reportabilidad Inteligente'
          };
          onLoginSuccess(localUser);
          return;
        }
      } else {
        // First check standard configured users (Leni, Admin1, Admin2)
        const demoUser = findUserByCredentials(cleanEmail, cleanPassword);

        // Sign in with Supabase Auth if available
        if (supabaseConfig.isConfigured) {
          const { userSession } = await signInWithSupabase(cleanEmail, cleanPassword);

          if (userSession) {
            onLoginSuccess(userSession);
            return;
          }

          // If Supabase failed or user is not in Supabase yet, but matches known user:
          if (demoUser) {
            // Attempt background auto-registration in Supabase
            signUpWithSupabase(cleanEmail, cleanPassword, {
              name: demoUser.name,
              role: demoUser.role,
              companyName: demoUser.companyName
            }).catch(() => {});

            onLoginSuccess({
              ...demoUser,
              id: `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
              userId: `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
            });
            return;
          }

          setErrorMsg('Credenciales incorrectas. Verifique correo y contraseña o haga clic en los usuarios de acceso rápido abajo.');
          setIsLoading(false);
          return;
        } else {
          // Local credentials verification
          if (demoUser) {
            onLoginSuccess({
              ...demoUser,
              id: `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
              userId: `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
            });
          } else {
            // Allow general email login in local mode
            const genericUser: UserSession = {
              id: `usr-${Date.now().toString(36)}`,
              userId: `usr-${Date.now().toString(36)}`,
              isAuthenticated: true,
              email: cleanEmail,
              name: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              role: 'Supervisor Técnico Senior',
              companyName: 'Attach • Reportabilidad Inteligente'
            };
            onLoginSuccess(genericUser);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado durante la autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMsg(null);
    setSuccessMsg(null);
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
          
          {/* Supabase Cloud Auth Status Badge */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              supabaseConfig.isConfigured
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}>
              <Database className="w-3 h-3" />
              <span>{supabaseConfig.isConfigured ? 'Supabase Auth Conectado' : 'Modo Offline / Local'}</span>
            </span>
          </div>
        </div>

        {/* Mode Toggle (Login vs Register) */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 min-h-[38px] py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-[#CC8B79] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 min-h-[38px] py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-[#5E5365] dark:text-[#CC8B79] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Crear Cuenta Supabase
          </button>
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

        {/* Success Alert Message */}
        {successMsg && (
          <div
            id="login-success-alert"
            className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-start gap-2.5 animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Nombre Completo / Cargo
              </label>
              <div className="relative">
                <input
                  id="register-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Leni Powell - Supervisor Senior"
                  className="w-full min-h-[52px] px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E5365]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Correo Electrónico (Supabase Auth)
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                id="login-email-input"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@empresa.com / leni@leni.cl"
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
                placeholder="••••••••"
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
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Registrar en Supabase</span>
              </>
            ) : (
              <>
                <span>Iniciar Sesión en Terreno</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Access Accounts */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#CC8B79]" />
              <span>Accesos Rápidos</span>
            </span>
            <span className="text-[10px] text-slate-400">Clic para autocompletar</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Super Usuario */}
            <button
              id="login-quick-super-btn"
              type="button"
              onClick={() => handleSelectAccount('leni@leni.cl', '456789')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                email === 'leni@leni.cl'
                  ? 'bg-purple-50 dark:bg-slate-800 border-[#CC8B79] text-[#5E5365] dark:text-[#CC8B79]'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-purple-50/50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">Super Usuario:</span>
                  <span className="text-xs font-mono font-semibold">leni@leni.cl</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Clave: <code className="font-bold text-[#CC8B79]">456789</code> • Leni Powell
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#CC8B79] text-white shrink-0">
                Super
              </span>
            </button>

            {/* Administrador 1 */}
            <button
              id="login-quick-admin1-btn"
              type="button"
              onClick={() => handleSelectAccount('admin1@admin1.cl', '123456')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                email === 'admin1@admin1.cl'
                  ? 'bg-purple-50 dark:bg-slate-800 border-[#CC8B79] text-[#5E5365] dark:text-[#CC8B79]'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-purple-50/50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">Admin 1:</span>
                  <span className="text-xs font-mono font-semibold">admin1@admin1.cl</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Clave: <code className="font-bold text-[#CC8B79]">123456</code> • Administrador 1
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5E5365] text-white shrink-0">
                Admin 1
              </span>
            </button>

            {/* Administrador 2 */}
            <button
              id="login-quick-admin2-btn"
              type="button"
              onClick={() => handleSelectAccount('admin2@admin2.cl', '789456')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                email === 'admin2@admin2.cl'
                  ? 'bg-purple-50 dark:bg-slate-800 border-[#CC8B79] text-[#5E5365] dark:text-[#CC8B79]'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-purple-50/50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">Admin 2:</span>
                  <span className="text-xs font-mono font-semibold">admin2@admin2.cl</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Clave: <code className="font-bold text-[#CC8B79]">789456</code> • Administrador 2
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5E5365] text-white shrink-0">
                Admin 2
              </span>
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Attach • Reportabilidad inteligente • Conexión Supabase Auth & Offline-First
      </footer>
    </div>
  );
};

