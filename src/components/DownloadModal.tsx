import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Edit3, Trash2, CheckCircle2, Shield } from 'lucide-react';
import { QrCodeItem } from '../types';
import { getDynamicQrUrl } from '../config';
import { generateQrDataUrl, downloadQrAsPng, downloadQrAsSvg } from '../utils/qrGenerator';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrItem: QrCodeItem | null;
  onEdit: (item: QrCodeItem) => void;
  onDelete: (item: QrCodeItem) => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  qrItem,
  onEdit,
  onDelete,
}) => {
  const [showLabelBelow, setShowLabelBelow] = useState(true);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!qrItem) return;

    const dynamicUrl = getDynamicQrUrl(qrItem.code);
    setIsGenerating(true);

    generateQrDataUrl(dynamicUrl, {
      showLabel: showLabelBelow,
      label: qrItem.name,
      width: 480,
    })
      .then((url) => setQrPreviewUrl(url))
      .catch((err) => console.error('Failed to generate preview:', err))
      .finally(() => setIsGenerating(false));
  }, [qrItem, showLabelBelow]);

  if (!isOpen || !qrItem) return null;

  const dynamicUrl = getDynamicQrUrl(qrItem.code);

  const handleDownloadPng = async () => {
    await downloadQrAsPng(dynamicUrl, `ViniCode_${qrItem.name}`, {
      showLabel: showLabelBelow,
      label: qrItem.name,
    });
  };

  const handleDownloadSvg = async () => {
    await downloadQrAsSvg(dynamicUrl, `ViniCode_${qrItem.name}`);
  };

  const handleTestQr = () => {
    window.open(dynamicUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
          <div>
            <h2 className="text-base font-semibold text-white">QR CODE DINÂMICO</h2>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Pronto para impressão ou uso em placas e tags NFC.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#18181b] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Metadata Bar */}
          <div className="flex items-center justify-between bg-[#18181b] p-3 rounded-xl border border-[#27272a] text-xs">
            <div>
              <span className="text-[#a1a1aa] block text-[10px]">Nome do QR:</span>
              <span className="font-semibold text-white text-sm">{qrItem.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[#a1a1aa] block text-[10px]">Status:</span>
              <span
                className={`inline-flex items-center gap-1 font-medium text-xs ${
                  qrItem.active ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${qrItem.active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {qrItem.active ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[#a1a1aa]">
              <span>Código Permanente:</span>
              <span className="font-mono font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/40">
                {qrItem.code}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#a1a1aa]">
              <span>Destino Atual:</span>
              <span className="font-mono text-white truncate max-w-[240px]" title={qrItem.destinationUrl}>
                {qrItem.destinationUrl}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#a1a1aa]">
              <span>URL Dinâmica Codificada:</span>
              <span className="font-mono text-zinc-300 truncate max-w-[240px]" title={dynamicUrl}>
                {dynamicUrl}
              </span>
            </div>
          </div>

          {/* QR Code Canvas Preview */}
          <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center mx-auto shadow-inner max-w-[260px]">
            {isGenerating ? (
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrPreviewUrl ? (
              <img
                src={qrPreviewUrl}
                alt={qrItem.name}
                className="max-h-56 object-contain rounded select-none"
              />
            ) : null}
          </div>

          {/* Checkbox: Mostrar nome abaixo do QR Code */}
          <div className="flex items-center justify-center">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#a1a1aa] hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showLabelBelow}
                onChange={(e) => setShowLabelBelow(e.target.checked)}
                className="w-4 h-4 rounded bg-[#18181b] border-[#27272a] text-red-600 focus:ring-red-500 focus:ring-offset-0"
              />
              <span>Mostrar nome abaixo do QR Code na impressão</span>
            </label>
          </div>

          {/* Download & Test buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownloadPng}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>BAIXAR PNG</span>
            </button>

            <button
              onClick={handleDownloadSvg}
              className="bg-[#18181b] hover:bg-[#27272a] text-white border border-[#27272a] text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>BAIXAR SVG</span>
            </button>
          </div>

          {/* Action Row: Test, Edit, Delete */}
          <div className="flex items-center justify-between pt-3 border-t border-[#27272a] text-xs">
            <button
              onClick={handleTestQr}
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
              title="Testar URL dinâmica permanente"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>TESTAR QR</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onEdit(qrItem);
                }}
                className="text-[#a1a1aa] hover:text-white font-medium flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>EDITAR</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onDelete(qrItem);
                }}
                className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>EXCLUIR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
