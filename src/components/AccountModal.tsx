import React, { useState } from 'react';
import { User, Mail, Shield, LogOut, KeyRound, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccountViewProps {
  onBackToDashboard: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ onBackToDashboard }) => {
  const { currentUser, userProfile, updateDisplayName, resetUserPassword, logoutUser } = useAuth();

  const [name, setName] = useState(userProfile?.name || currentUser?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSavingName(true);
    setFeedbackMessage(null);
    try {
      await updateDisplayName(name.trim());
      setFeedbackMessage({ type: 'success', text: 'Nome atualizado com sucesso!' });
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Não foi possível atualizar o nome.' });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSendReset = async () => {
    if (!currentUser?.email) return;

    setIsSendingReset(true);
    setFeedbackMessage(null);
    try {
      await resetUserPassword(currentUser.email);
      setFeedbackMessage({
        type: 'success',
        text: 'Enviamos as instruções para redefinir sua senha para seu e-mail cadastrado.',
      });
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Não foi possível enviar o e-mail de redefinição.' });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">MINHA CONTA</h1>
        <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1">
          Gerencie seus dados de acesso e preferências da plataforma VINI CODE.
        </p>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <Check className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-red-600/20 border border-red-500/30">
            {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{userProfile?.name || 'Usuário'}</h2>
            <p className="text-xs text-[#a1a1aa] font-mono">{currentUser?.email}</p>
          </div>
        </div>

        {/* Edit Name Form */}
        <form onSubmit={handleSaveName} className="space-y-4 pt-4 border-t border-[#27272a]">
          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5" htmlFor="account-name-input">
              Nome de Exibição
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="account-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingName || name.trim() === userProfile?.name}
              className="bg-[#18181b] hover:bg-[#27272a] text-white border border-[#27272a] text-xs font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-40"
            >
              {isSavingName ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>

        {/* Email display (read only) */}
        <div className="pt-4 border-t border-[#27272a]">
          <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
            E-mail Cadastrado
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              disabled
              value={currentUser?.email || ''}
              className="w-full bg-[#18181b]/60 border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-400 outline-none cursor-not-allowed"
            />
          </div>
        </div>

        {/* Security & Password reset */}
        <div className="pt-4 border-t border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-white block">Segurança da Senha</span>
            <span className="text-[11px] text-[#a1a1aa]">
              Receba um link em seu e-mail para redefinir sua senha com segurança.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSendReset}
            disabled={isSendingReset}
            className="self-start sm:self-auto bg-[#18181b] hover:bg-[#27272a] text-zinc-300 hover:text-white border border-[#27272a] text-xs font-medium px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSendingReset ? 'Enviando...' : 'Redefinir Senha'}</span>
          </button>
        </div>

        {/* Logout action */}
        <div className="pt-4 border-t border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#71717a]">
            <Shield className="w-4 h-4 text-red-500" />
            <span>Sessão ativa e protegida</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            id="btn-account-logout"
            className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-xs font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
