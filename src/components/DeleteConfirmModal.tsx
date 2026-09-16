import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { QrCodeItem } from '../types';
import { deleteQrCode, toggleQrCodeActive } from '../services/qrService';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrItem: QrCodeItem | null;
  onDeleted?: () => void;
  onDeactivated?: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  qrItem,
  onDeleted,
  onDeactivated,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !qrItem) return null;

  const handleDeletePermanent = async () => {
    setIsProcessing(true);
    try {
      await deleteQrCode(qrItem.id);
      if (onDeleted) onDeleted();
      onClose();
    } catch (err) {
      console.error('Error deleting QR:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivate = async () => {
    setIsProcessing(true);
    try {
      await toggleQrCodeActive(qrItem.id, true); // deactivate it
      if (onDeactivated) onDeactivated();
      onClose();
    } catch (err) {
      console.error('Error deactivating QR:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">Excluir QR Code?</h3>
            <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
              Atenção: se este QR Code já estiver impresso, ele poderá deixar de funcionar.
            </p>
            <div className="mt-2 text-xs bg-[#18181b] p-2.5 rounded-lg border border-[#27272a] text-[#71717a]">
              Código: <span className="text-white font-mono">{qrItem.code}</span> — {qrItem.name}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-4 border-t border-[#27272a]">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-white transition-colors"
          >
            CANCELAR
          </button>

          {qrItem.active && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDeactivate}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-400/10 rounded-xl border border-amber-500/20 transition-colors"
            >
              DESATIVAR APENAS
            </button>
          )}

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleDeletePermanent}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? 'Excluindo...' : 'EXCLUIR PERMANENTEMENTE'}
          </button>
        </div>
      </div>
    </div>
  );
};
