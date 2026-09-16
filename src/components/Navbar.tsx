import React from 'react';
import { QrCode, PlusCircle, Star, User, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'dashboard' | 'google_review' | 'account';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewQrModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenNewQrModal,
}) => {
  const { userProfile, logoutUser } = useAuth();

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-[#27272a] px-4 sm:px-8 py-3 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Slogan */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onTabChange('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-md shadow-red-600/20 border border-red-500/30">
              <span className="text-white font-black text-base tracking-tighter">V</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-base font-bold tracking-tight text-white">VINI</span>
                <span className="text-base font-bold tracking-tight text-red-500">CODE</span>
              </div>
              <p className="text-[10px] text-[#a1a1aa] hidden sm:block tracking-tight font-medium">
                QR Codes inteligentes. Links que evoluem.
              </p>
            </div>
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-[#18181b] text-white border border-[#3f3f46]'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-red-500" />
              <span>Meus QR Codes</span>
            </button>

            <button
              onClick={() => onTabChange('google_review')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                currentTab === 'google_review'
                  ? 'bg-[#18181b] text-white border border-[#3f3f46]'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Avaliação Google</span>
            </button>

            <button
              onClick={() => onTabChange('account')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                currentTab === 'account'
                  ? 'bg-[#18181b] text-white border border-[#3f3f46]'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50'
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Minha Conta</span>
            </button>
          </nav>

          {/* Action Button & User Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenNewQrModal}
              id="btn-navbar-new-qr"
              className="bg-red-600 hover:bg-red-500 text-white font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>+ NOVO QR CODE</span>
            </button>

            <button
              onClick={() => onTabChange('account')}
              title="Minha Conta"
              className="w-8 h-8 rounded-full bg-[#18181b] border border-[#27272a] text-[#f4f4f5] hover:border-red-500/50 flex items-center justify-center text-xs font-semibold transition-colors"
            >
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0c]/95 backdrop-blur-lg border-t border-[#27272a] px-3 py-1.5">
        <div className="flex items-center justify-around">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-h-[44px] ${
              currentTab === 'dashboard' ? 'text-red-500 font-semibold' : 'text-[#a1a1aa]'
            }`}
          >
            <QrCode className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">QR Codes</span>
          </button>

          <button
            onClick={onOpenNewQrModal}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-lg min-h-[44px] text-white"
          >
            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-red-400 font-medium mt-0.5">Novo</span>
          </button>

          <button
            onClick={() => onTabChange('google_review')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-h-[44px] ${
              currentTab === 'google_review' ? 'text-amber-400 font-semibold' : 'text-[#a1a1aa]'
            }`}
          >
            <Star className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Avaliação</span>
          </button>

          <button
            onClick={() => onTabChange('account')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-h-[44px] ${
              currentTab === 'account' ? 'text-red-500 font-semibold' : 'text-[#a1a1aa]'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Conta</span>
          </button>
        </div>
      </div>
    </>
  );
};
