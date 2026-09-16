import React, { useState, useEffect } from 'react';
import {
  Star,
  Search,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Building,
  Trash2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { GoogleBusinessItem, QrCodeItem } from '../types';
import {
  parseGoogleMapsInput,
  saveGoogleBusiness,
  deleteGoogleBusiness,
  subscribeUserGoogleBusinesses,
  ExtractedGoogleBusiness,
} from '../services/googleReviewService';

interface GoogleReviewGeneratorProps {
  userId: string;
  onCreateQrFromReview: (businessName: string, reviewUrl: string) => void;
}

export const GoogleReviewGenerator: React.FC<GoogleReviewGeneratorProps> = ({
  userId,
  onCreateQrFromReview,
}) => {
  const [googleLinkInput, setGoogleLinkInput] = useState('');
  const [previewBusiness, setPreviewBusiness] = useState<ExtractedGoogleBusiness | null>(null);
  const [confirmedBusiness, setConfirmedBusiness] = useState<ExtractedGoogleBusiness | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Saved companies list
  const [savedBusinesses, setSavedBusinesses] = useState<GoogleBusinessItem[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeUserGoogleBusinesses(userId, (items) => {
      setSavedBusinesses(items);
      setLoadingBusinesses(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleIdentifyBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfirmedBusiness(null);

    const input = googleLinkInput.trim();
    if (!input) {
      setErrorMessage('Cole o link do Google Maps ou informe o nome/Place ID da empresa.');
      return;
    }

    setIsProcessing(true);
    try {
      const extracted = parseGoogleMapsInput(input);
      if (!extracted) {
        setErrorMessage('Não foi possível identificar a empresa a partir deste link.');
        return;
      }
      setPreviewBusiness(extracted);
    } catch (err) {
      console.error('Error identifying business:', err);
      setErrorMessage('Ocorreu um erro ao processar o link. Verifique e tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmBusiness = async () => {
    if (!previewBusiness) return;
    setConfirmedBusiness(previewBusiness);

    // Save to Firestore automatically
    try {
      await saveGoogleBusiness(userId, {
        businessName: previewBusiness.businessName,
        address: previewBusiness.address,
        placeId: previewBusiness.placeId,
        reviewUrl: previewBusiness.reviewUrl,
      });
    } catch (err) {
      console.warn('Failed to save to My Businesses:', err);
    }

    setPreviewBusiness(null);
    setGoogleLinkInput('');
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTestLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteBusiness = async (id: string) => {
    try {
      await deleteGoogleBusiness(id);
    } catch (err) {
      console.error('Error deleting business:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>Google Review Integrator</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          GERADOR DE LINK PARA AVALIAÇÃO GOOGLE
        </h1>
        <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1 max-w-2xl leading-relaxed">
          Cole o link da empresa no Google e gere um acesso direto para seus clientes deixarem uma avaliação.
          Ideal para plaquinhas de balcão e tags NFC.
        </p>
      </div>

      {/* Input Generator Card */}
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleIdentifyBusiness} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] mb-2" htmlFor="google-link-input">
              LINK DA EMPRESA NO GOOGLE
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="google-link-input"
                type="text"
                value={googleLinkInput}
                onChange={(e) => setGoogleLinkInput(e.target.value)}
                placeholder="Cole aqui o link compartilhado do Google/Google Maps ou Place ID"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-[#71717a] outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-[#71717a] mt-2">
              Exemplos aceitos: links do Google Maps (maps.app.goo.gl, google.com/maps), Place ID ou nome da empresa.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            id="btn-generate-google-review"
            disabled={isProcessing}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs sm:text-sm py-2.5 px-6 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4 fill-black" />
            <span>⭐ GERAR LINK DE AVALIAÇÃO</span>
          </button>
        </form>

        {/* Step 2: IDENTIFY BUSINESS CONFIRMATION */}
        {previewBusiness && (
          <div className="mt-6 pt-6 border-t border-[#27272a] animate-fadeIn">
            <div className="bg-[#18181b] border border-amber-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-4 h-4" />
                <span>⭐ EMPRESA ENCONTRADA</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#a1a1aa] min-w-[70px]">Nome:</span>
                  <span className="font-semibold text-white text-sm">{previewBusiness.businessName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#a1a1aa] min-w-[70px]">Endereço:</span>
                  <span className="text-zinc-300">{previewBusiness.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#a1a1aa] min-w-[70px]">Place ID:</span>
                  <span className="font-mono text-zinc-400 text-[11px]">{previewBusiness.placeId}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={handleConfirmBusiness}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>✓ É ESTA EMPRESA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewBusiness(null)}
                  className="bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] hover:text-white text-xs font-medium px-4 py-2 rounded-xl transition-all"
                >
                  PROCURAR NOVAMENTE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: RESULT AND QUICK QR CODE CREATION */}
        {confirmedBusiness && (
          <div className="mt-6 pt-6 border-t border-[#27272a] animate-fadeIn">
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Check className="w-4 h-4" />
                  <span>✓ LINK DE AVALIAÇÃO CRIADO</span>
                </div>
                <span className="text-xs text-zinc-400">Salvo em Minhas Empresas</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {confirmedBusiness.businessName}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">{confirmedBusiness.address}</p>
              </div>

              <div className="bg-[#111113] p-3 rounded-lg border border-[#27272a]">
                <span className="text-[10px] text-[#a1a1aa] block mb-1">Link Direto de Avaliação:</span>
                <span className="font-mono text-xs text-amber-300 break-all select-all">
                  {confirmedBusiness.reviewUrl}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyLink(confirmedBusiness.reviewUrl)}
                  className="bg-[#18181b] hover:bg-[#27272a] text-white border border-[#27272a] text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'COPIADO!' : 'COPIAR LINK'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestLink(confirmedBusiness.reviewUrl)}
                  className="bg-[#18181b] hover:bg-[#27272a] text-emerald-400 border border-emerald-500/20 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>↗ TESTAR LINK</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onCreateQrFromReview(
                      `Avaliação Google — ${confirmedBusiness.businessName}`,
                      confirmedBusiness.reviewUrl
                    )
                  }
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>▦ CRIAR QR CODE DINÂMICO</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MINHAS EMPRESAS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">MINHAS EMPRESAS</h2>
          </div>
          <span className="text-xs text-[#a1a1aa]">
            {savedBusinesses.length} {savedBusinesses.length === 1 ? 'empresa' : 'empresas'}
          </span>
        </div>

        {loadingBusinesses ? (
          <div className="py-8 text-center text-xs text-[#a1a1aa]">Carregando empresas salvas...</div>
        ) : savedBusinesses.length === 0 ? (
          <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-8 text-center space-y-3">
            <Star className="w-8 h-8 text-amber-400/50 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Nenhuma empresa adicionada ainda.</h3>
            <p className="text-xs text-[#a1a1aa] max-w-sm mx-auto">
              Gere o link de avaliação da sua primeira empresa acima para salvar na lista.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedBusinesses.map((b) => (
              <div
                key={b.id}
                className="bg-[#111113] border border-[#27272a] hover:border-[#3f3f46] rounded-2xl p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                      <span className="truncate">{b.businessName}</span>
                    </h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium shrink-0">
                      Google configurado
                    </span>
                  </div>

                  <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-1">{b.address}</p>

                  <div className="mt-2 bg-[#18181b] p-2 rounded-lg border border-[#27272a] text-[11px] font-mono text-zinc-300 truncate">
                    {b.reviewUrl}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(b.reviewUrl)}
                      className="px-2.5 py-1 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-zinc-300 hover:text-white inline-flex items-center gap-1 transition-colors"
                      title="Copiar link direto"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>

                    <button
                      onClick={() => handleTestLink(b.reviewUrl)}
                      className="px-2.5 py-1 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-emerald-400 inline-flex items-center gap-1 transition-colors"
                      title="Testar no Google"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Testar</span>
                    </button>

                    <button
                      onClick={() =>
                        onCreateQrFromReview(`Avaliação Google — ${b.businessName}`, b.reviewUrl)
                      }
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium inline-flex items-center gap-1 transition-colors shadow-sm"
                      title="Gerar QR Code dinâmico"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Gerar QR</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteBusiness(b.id)}
                    className="p-1 text-[#71717a] hover:text-red-400 transition-colors"
                    title="Remover empresa salva"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
