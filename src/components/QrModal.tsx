import React, { useState, useEffect } from 'react';
import { X, Link2, Tag, Check, AlertCircle } from 'lucide-react';
import { QrCodeItem } from '../types';
import { createQrCode, updateQrCode } from '../services/qrService';
import { normalizeUrl, isValidDestinationUrl, getDynamicQrUrl } from '../config';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  editItem?: QrCodeItem | null;
  initialData?: {
    name?: string;
    destinationUrl?: string;
    type?: QrCodeItem['type'];
  } | null;
  onSuccess?: (item?: QrCodeItem) => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  userId,
  editItem,
  initialData,
  onSuccess,
}) => {
  const isEditing = Boolean(editItem);

  const [name, setName] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setDestinationUrl(editItem.destinationUrl);
      setActive(editItem.active);
    } else if (initialData) {
      setName(initialData.name || '');
      setDestinationUrl(initialData.destinationUrl || '');
      setActive(true);
    } else {
      setName('');
      setDestinationUrl('');
      setActive(true);
    }
    setErrorMessage(null);
  }, [editItem, initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanUrl = normalizeUrl(destinationUrl);

    if (!cleanName) {
      setErrorMessage('Informe um nome para identificar o QR Code.');
      return;
    }

    if (!cleanUrl || !isValidDestinationUrl(cleanUrl)) {
      setErrorMessage('Digite uma URL de destino válida (ex: https://instagram.com/suaconta).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editItem) {
        // Edit existing: code is IMMUTABLE
        await updateQrCode(editItem.id, {
          name: cleanName,
          destinationUrl: cleanUrl,
          active,
        });
        if (onSuccess) onSuccess();
      } else {
        // Create new dynamic QR Code
        const created = await createQrCode(userId, {
          name: cleanName,
          destinationUrl: cleanUrl,
          type: initialData?.type || 'standard',
        });
        if (onSuccess) onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving QR Code:', err);
      setErrorMessage('Não foi possível salvar o QR Code. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111113] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
          <div>
            <h2 className="text-base font-semibold text-white">
              {isEditing ? 'EDITAR QR CODE DINÂMICO' : 'CRIAR QR CODE DINÂMICO'}
            </h2>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              {isEditing
                ? 'Altere o destino a qualquer momento mantendo o mesmo QR impresso.'
                : 'O código impresso continuará funcionando mesmo se você alterar o destino.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#18181b] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* If editing, show the permanent code and permanent link */}
          {isEditing && editItem && (
            <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#a1a1aa]">Código Permanente:</span>
                <span className="font-mono font-bold text-red-400">{editItem.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a1a1aa]">Link Permanente:</span>
                <span className="font-mono text-white truncate max-w-[220px]">
                  {getDynamicQrUrl(editItem.code)}
                </span>
              </div>
              <p className="text-[11px] text-[#71717a] pt-1">
                🔒 O código e a imagem do QR Code são imutáveis. O destino será atualizado em tempo real.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5" htmlFor="qr-name-input">
              Nome do QR Code
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="qr-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Instagram — Carlos"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5" htmlFor="qr-destination-input">
              Link de destino
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="qr-destination-input"
                type="text"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="Ex: instagram.com/carlos ou https://seusite.com"
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717a] outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-[#71717a] mt-1.5">
              💡 Você poderá trocar este link a qualquer momento sem precisar reimprimir o QR Code.
            </p>
          </div>

          {/* Active status toggle */}
          {isEditing && (
            <div className="pt-2 flex items-center justify-between border-t border-[#27272a]">
              <div>
                <span className="text-xs font-medium text-white block">Status do QR Code</span>
                <span className="text-[11px] text-[#a1a1aa]">
                  {active ? 'Ativo e redirecionando normalmente' : 'Inativo (exibe aviso de indisponível)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  active ? 'bg-red-600' : 'bg-[#27272a]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-qr-modal-save"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'SALVAR ALTERAÇÕES' : 'GERAR QR CODE DINÂMICO'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
