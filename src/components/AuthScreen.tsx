import React, { useState } from 'react';
import { useAuth, mapAuthErrorToFriendlyMessage } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthScreen: React.FC = () => {
  const { loginUser, registerUser, resetUserPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetFormState();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Preencha seu e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginUser(cleanEmail, password);
    } catch (err: any) {
      setErrorMessage(mapAuthErrorToFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMessage('Informe o seu nome completo.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.') || cleanEmail.length < 5) {
      setErrorMessage('Digite um e-mail válido.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Crie uma senha de no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser(cleanName, cleanEmail, password);
    } catch (err: any) {
      setErrorMessage(mapAuthErrorToFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.') || cleanEmail.length < 5) {
      setErrorMessage('Digite um e-mail válido para recuperação.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetUserPassword(cleanEmail);
      setSuccessMessage('Enviamos as instruções para redefinir sua senha para o e-mail informado.');
    } catch (err: any) {
      setErrorMessage(mapAuthErrorToFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f4f4f5] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Subtle brand ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/20 border border-red-500/30">
              <span className="text-white font-black text-xl tracking-tight">V</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              VINI <span className="text-red-500">CODE</span>
            </span>
          </div>
          <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-medium">
            QR Codes inteligentes. Links que evoluem.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Error & Success notifications */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* Form: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">ENTRAR NA PLATAFORMA</h2>
                <p className="text-xs text-[#a1a1aa]">Acesse sua conta para gerenciar seus QR Codes.</p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5" htmlFor="login-email">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#a1a1aa]" htmlFor="login-password">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <span>ENTRAR</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-[#27272a] text-center">
                <p className="text-xs text-[#a1a1aa]">
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-red-400 font-medium hover:text-red-300 ml-1 transition-colors"
                  >
                    Criar conta
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Form: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">CRIAR UMA NOVA CONTA</h2>
                <p className="text-xs text-[#a1a1aa]">Cadastre-se para gerar e monitorar seus links dinâmicos.</p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5" htmlFor="register-name">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5" htmlFor="register-email">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5" htmlFor="register-password">
                    Senha (mínimo 6 caracteres)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5" htmlFor="register-confirm-password">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-confirm-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                id="btn-register-submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Criando conta...</span>
                  </>
                ) : (
                  <>
                    <span>CRIAR CONTA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-[#27272a] text-center">
                <p className="text-xs text-[#a1a1aa]">
                  Já possui uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-red-400 font-medium hover:text-red-300 ml-1 transition-colors"
                  >
                    Entrar
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Form: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">ESQUECI MINHA SENHA</h2>
                <p className="text-xs text-[#a1a1aa]">
                  Digite seu e-mail cadastrado para receber o link de recuperação.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5" htmlFor="forgot-email">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-forgot-submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enviando recuperação...</span>
                  </>
                ) : (
                  <span>ENVIAR RECUPERAÇÃO</span>
                )}
              </button>

              <div className="pt-4 border-t border-[#27272a] text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs text-[#a1a1aa] hover:text-white transition-colors"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[#71717a] text-xs">
          <ShieldCheck className="w-4 h-4 text-red-500/80" />
          <span>Autenticação segura & Banco Cloud Firestore</span>
        </div>
      </div>
    </div>
  );
};
