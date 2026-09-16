import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  Star,
  Search,
  ExternalLink,
  Edit3,
  Download,
  Trash2,
  Radio,
  Clock,
  Sparkles,
  QrCode as QrIcon,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { QrCodeItem } from '../types';
import { subscribeUserQrCodes, toggleQrCodeActive } from '../services/qrService';
import { getDynamicQrUrl } from '../config';
import { generateQrDataUrl } from '../utils/qrGenerator';

interface DashboardProps {
  userId: string;
  onOpenNewQr: () => void;
  onOpenGoogleReview: () => void;
  onEditQr: (item: QrCodeItem) => void;
  onDownloadQr: (item: QrCodeItem) => void;
  onDeleteQr: (item: QrCodeItem) => void;
}

type FilterType = 'all' | 'active' | 'inactive';

// Format scan date cleanly in pt-BR
const formatLastScan = (dateStr?: string | null): string => {
  if (!dateStr) return 'Nenhuma leitura ainda';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Hoje às ${timeStr}`;
    }
    return `${date.toLocaleDateString('pt-BR')} às ${timeStr}`;
  } catch {
    return dateStr;
  }
};

export const Dashboard: React.FC<DashboardProps> = ({
  userId,
  onOpenNewQr,
  onOpenGoogleReview,
  onEditQr,
  onDownloadQr,
  onDeleteQr,
}) => {
  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [qrThumbs, setQrThumbs] = useState<Record<string, string>>({});

  // Real-time listener for Firestore persistence
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeUserQrCodes(
      userId,
      (items) => {
        setQrCodes(items);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load user QR codes:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Generate compact QR thumbnails for cards
  useEffect(() => {
    qrCodes.forEach((qr) => {
      if (!qrThumbs[qr.id]) {
        const dynamicUrl = getDynamicQrUrl(qr.code);
        generateQrDataUrl(dynamicUrl, { width: 140, margin: 1 })
          .then((thumb) => {
            setQrThumbs((prev) => ({ ...prev, [qr.id]: thumb }));
          })
          .catch(() => {});
      }
    });
  }, [qrCodes, qrThumbs]);

  // Real-time calculated metrics
  const stats = useMemo(() => {
    const total = qrCodes.length;
    const active = qrCodes.filter((q) => q.active).length;
    const inactive = total - active;
    const scans = qrCodes.reduce((acc, curr) => acc + (curr.totalScans || 0), 0);
    return { total, active, inactive, scans };
  }, [qrCodes]);

  // Filter and search
  const filteredQrCodes = useMemo(() => {
    return qrCodes.filter((qr) => {
      // Filter status
      if (filter === 'active' && !qr.active) return false;
      if (filter === 'inactive' && qr.active) return false;

      // Search query
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase().trim();
        const matchesName = qr.name.toLowerCase().includes(queryLower);
        const matchesCode = qr.code.toLowerCase().includes(queryLower);
        const matchesDest = qr.destinationUrl.toLowerCase().includes(queryLower);
        return matchesName || matchesCode || matchesDest;
      }

      return true;
    });
  }, [qrCodes, filter, searchQuery]);

  const handleToggleActive = async (qr: QrCodeItem) => {
    try {
      await toggleQrCodeActive(qr.id, qr.active);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleTestQrLink = (qr: QrCodeItem) => {
    const dynamicUrl = getDynamicQrUrl(qr.code);
    window.open(dynamicUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            VINI <span className="text-red-500">CODE</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            Gerencie seus QR Codes dinâmicos
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewQr}
            id="btn-dashboard-new-qr"
            className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ NOVO QR CODE</span>
          </button>

          <button
            onClick={onOpenGoogleReview}
            id="btn-dashboard-google-review"
            className="flex-1 sm:flex-initial bg-[#16161a] hover:bg-[#1f1f23] text-white border border-[#27272a] hover:border-amber-500/40 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>AVALIAÇÃO GOOGLE</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="grid grid-cols-4 divide-x divide-[#27272a] text-center">
          <div className="px-2">
            <span className="text-xl sm:text-2xl font-extrabold text-white block">
              {stats.total}
            </span>
            <span className="text-[11px] sm:text-xs text-[#a1a1aa] uppercase tracking-wider font-medium">
              QR Codes
            </span>
          </div>

          <div className="px-2">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 block">
              {stats.active}
            </span>
            <span className="text-[11px] sm:text-xs text-[#a1a1aa] uppercase tracking-wider font-medium">
              Ativos
            </span>
          </div>

          <div className="px-2">
            <span className="text-xl sm:text-2xl font-extrabold text-amber-400 block">
              {stats.inactive}
            </span>
            <span className="text-[11px] sm:text-xs text-[#a1a1aa] uppercase tracking-wider font-medium">
              Inativos
            </span>
          </div>

          <div className="px-2">
            <span className="text-xl sm:text-2xl font-extrabold text-red-500 block">
              {stats.scans}
            </span>
            <span className="text-[11px] sm:text-xs text-[#a1a1aa] uppercase tracking-wider font-medium">
              Leituras
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔎 Buscar por nome, código ou destino..."
            className="w-full bg-[#111113] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#71717a] outline-none transition-all"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center bg-[#111113] border border-[#27272a] p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-red-600 text-white font-semibold'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            TODOS ({stats.total})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'active'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            ATIVOS ({stats.active})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'inactive'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            INATIVOS ({stats.inactive})
          </button>
        </div>
      </div>

      {/* QR Code List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#a1a1aa]">Carregando QR Codes...</p>
        </div>
      ) : filteredQrCodes.length === 0 ? (
        <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-10 text-center">
          {searchQuery ? (
            <div>
              <p className="text-sm text-[#a1a1aa]">Nenhum QR Code encontrado com os termos pesquisados.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-red-400 hover:underline"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 text-red-500 mx-auto flex items-center justify-center border border-red-500/20">
                <QrIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">Nenhum QR Code criado ainda.</h3>
              <p className="text-xs text-[#a1a1aa] max-w-sm mx-auto">
                Crie seu primeiro QR Code dinâmico para usar em cartões, mesas, redes sociais ou placas de avaliação.
              </p>
              <button
                onClick={onOpenNewQr}
                className="mt-2 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ CRIAR PRIMEIRO QR CODE</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredQrCodes.map((qr) => (
            <div
              key={qr.id}
              className="bg-[#111113] hover:bg-[#141417] border border-[#27272a] hover:border-[#3f3f46] rounded-2xl p-4 transition-all flex flex-col justify-between group shadow-sm"
            >
              {/* Card Main Info */}
              <div className="flex items-start gap-3.5">
                {/* QR Code thumbnail ~80-90px */}
                <div
                  onClick={() => onDownloadQr(qr)}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-white p-1.5 rounded-xl shrink-0 cursor-pointer shadow-md hover:ring-2 hover:ring-red-500 transition-all flex items-center justify-center"
                  title="Clique para visualizar e baixar"
                >
                  {qrThumbs[qr.id] ? (
                    <img
                      src={qrThumbs[qr.id]}
                      alt={qr.name}
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 animate-pulse rounded" />
                  )}
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                      {qr.name}
                    </h3>
                    <button
                      onClick={() => handleToggleActive(qr)}
                      title={qr.active ? 'Desativar QR' : 'Ativar QR'}
                      className="shrink-0 text-xs inline-flex items-center gap-1"
                    >
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          qr.active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            qr.active ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                          }`}
                        />
                        {qr.active ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </button>
                  </div>

                  <div className="mt-1 space-y-0.5 text-xs text-[#a1a1aa]">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span>Código:</span>
                      <span className="font-mono font-bold text-red-400 bg-red-950/30 px-1.5 py-0.2 rounded border border-red-900/30">
                        {qr.code}
                      </span>
                    </div>

                    <p className="truncate font-mono text-[11px] text-zinc-300" title={qr.destinationUrl}>
                      {qr.destinationUrl}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-[#71717a]">
                      <span className="font-medium text-white">
                        {qr.totalScans || 0} {qr.totalScans === 1 ? 'leitura' : 'leituras'}
                      </span>
                      <span>•</span>
                      <span className="truncate">Última: {formatLastScan(qr.lastScannedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrated Compact Action Footer */}
              <div className="mt-3.5 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs">
                <button
                  onClick={() => handleTestQrLink(qr)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors"
                  title="Testar URL dinâmica de redirecionamento"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Testar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditQr(qr)}
                    className="px-2.5 py-1 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-[#f4f4f5] hover:text-white inline-flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => onDownloadQr(qr)}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium inline-flex items-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </button>

                  <button
                    onClick={() => onDeleteQr(qr)}
                    className="p-1 rounded-lg text-[#71717a] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Excluir QR Code"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
