import React, { useEffect, useState } from 'react';
import { getQrCodeByCode, recordScan } from '../services/qrService';

interface PublicRedirectProps {
  code: string;
}

export const PublicRedirect: React.FC<PublicRedirectProps> = ({ code }) => {
  const [status, setStatus] = useState<'loading' | 'inactive' | 'not_found'>('loading');

  useEffect(() => {
    let isCancelled = false;

    const performRedirect = async () => {
      try {
        const qrItem = await getQrCodeByCode(code);

        if (isCancelled) return;

        if (!qrItem) {
          setStatus('not_found');
          return;
        }

        if (!qrItem.active) {
          setStatus('inactive');
          return;
        }

        // Asynchronously log scan telemetry without slowing down the client navigation
        recordScan(qrItem.id, qrItem.code).catch((err) => {
          console.warn('Telemetry scan log warning:', err);
        });

        // Instant invisible redirection to the destination URL
        window.location.replace(qrItem.destinationUrl);
      } catch (err) {
        console.error('Redirect lookup error:', err);
        if (!isCancelled) {
          setStatus('not_found');
        }
      }
    };

    performRedirect();

    return () => {
      isCancelled = true;
    };
  }, [code]);

  // While looking up and redirecting, keep completely blank black screen (invisible pass-through)
  if (status === 'loading') {
    return <div id="vini-code-redirect-screen" className="fixed inset-0 bg-[#050505] z-50 pointer-events-none" />;
  }

  if (status === 'inactive') {
    return (
      <div className="fixed inset-0 bg-[#050505] text-[#f4f4f5] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#111113] border border-[#27272a] rounded-2xl p-8 text-center shadow-xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">QR Code Indisponível</h1>
          <p className="text-sm text-[#a1a1aa] leading-relaxed">
            Este QR Code está temporariamente indisponível.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050505] text-[#f4f4f5] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-[#111113] border border-[#27272a] rounded-2xl p-8 text-center shadow-xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-2">QR Code Não Encontrado</h1>
        <p className="text-sm text-[#a1a1aa] leading-relaxed">
          O código informado não foi localizado ou foi removido.
        </p>
      </div>
    </div>
  );
};
