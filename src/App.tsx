import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { GoogleReviewGenerator } from './components/GoogleReviewGenerator';
import { AccountView } from './components/AccountModal';
import { QrModal } from './components/QrModal';
import { DownloadModal } from './components/DownloadModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PublicRedirect } from './components/PublicRedirect';
import { QrCodeItem } from './types';
import { isFirebaseConfigured, firebaseMissingError } from './firebase';
import { AlertTriangle } from 'lucide-react';

// Extract public QR code from pathname (e.g. /q/KYS7G9ND or query param ?q=KYS7G9ND)
const getPublicQrCodeFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;

  // Path check: /q/CODE
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/q\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback query param check: ?q=CODE
  const searchParams = new URLSearchParams(window.location.search);
  const qParam = searchParams.get('q');
  if (qParam) {
    return qParam;
  }

  return null;
};

const AuthenticatedApp: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [editingQrItem, setEditingQrItem] = useState<QrCodeItem | null>(null);
  const [qrModalInitialData, setQrModalInitialData] = useState<{
    name?: string;
    destinationUrl?: string;
    type?: QrCodeItem['type'];
  } | null>(null);

  const [downloadModalItem, setDownloadModalItem] = useState<QrCodeItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<QrCodeItem | null>(null);

  // Loading state while Firebase Auth restores session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/20 mb-4 animate-pulse">
          <span className="text-white font-black text-xl">V</span>
        </div>
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-[#a1a1aa]">Verificando sessão segura...</p>
      </div>
    );
  }

  // If user is not authenticated, show Login/Register screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  const handleOpenNewQr = () => {
    setEditingQrItem(null);
    setQrModalInitialData(null);
    setIsQrModalOpen(true);
  };

  const handleEditQr = (item: QrCodeItem) => {
    setEditingQrItem(item);
    setQrModalInitialData(null);
    setIsQrModalOpen(true);
  };

  const handleCreateQrFromReview = (businessName: string, reviewUrl: string) => {
    setEditingQrItem(null);
    setQrModalInitialData({
      name: businessName,
      destinationUrl: reviewUrl,
      type: 'google_review',
    });
    setIsQrModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f4f4f5] flex flex-col font-sans pb-20 md:pb-8">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewQrModal={handleOpenNewQr}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            userId={currentUser.uid}
            onOpenNewQr={handleOpenNewQr}
            onOpenGoogleReview={() => setCurrentTab('google_review')}
            onEditQr={handleEditQr}
            onDownloadQr={(item) => setDownloadModalItem(item)}
            onDeleteQr={(item) => setDeleteModalItem(item)}
          />
        )}

        {currentTab === 'google_review' && (
          <GoogleReviewGenerator
            userId={currentUser.uid}
            onCreateQrFromReview={handleCreateQrFromReview}
          />
        )}

        {currentTab === 'account' && (
          <AccountView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}
      </main>

      {/* Modals */}
      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        userId={currentUser.uid}
        editItem={editingQrItem}
        initialData={qrModalInitialData}
        onSuccess={(createdItem) => {
          if (createdItem) {
            // Automatically prompt the download modal for the new dynamic QR!
            setDownloadModalItem(createdItem);
          }
        }}
      />

      <DownloadModal
        isOpen={Boolean(downloadModalItem)}
        onClose={() => setDownloadModalItem(null)}
        qrItem={downloadModalItem}
        onEdit={(item) => {
          setDownloadModalItem(null);
          handleEditQr(item);
        }}
        onDelete={(item) => {
          setDownloadModalItem(null);
          setDeleteModalItem(item);
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteModalItem)}
        onClose={() => setDeleteModalItem(null)}
        qrItem={deleteModalItem}
      />
    </div>
  );
};

export default function App() {
  // 1. Check if user is scanning a public QR code (/q/:code)
  const publicCode = getPublicQrCodeFromUrl();
  if (publicCode) {
    return <PublicRedirect code={publicCode} />;
  }

  // 2. Validate Firebase configuration
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111113] border border-red-500/30 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Configuração Firebase Incompleta</h2>
          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            {firebaseMissingError || 'Verifique as credenciais no arquivo firebase-applet-config.json.'}
          </p>
        </div>
      </div>
    );
  }

  // 3. Render main application inside AuthProvider
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
