import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

interface ScanResult {
  user: { firstName: string; lastName: string; email: string };
  checkInTime: string;
}

interface Props {
  onClose: () => void;
  onSuccess?: (result: ScanResult) => void;
}

export default function QRScanner({ onClose, onSuccess }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const containerId = 'qr-scanner-container';

  const scanMutation = useMutation({
    mutationFn: (qrData: string) => api.post('/attendance/scan', { qrData }).then(r => r.data),
    onSuccess: (data) => {
      setLastResult(data);
      setStatus('success');
      toast.success(`✅ ${data.user?.firstName} ${data.user?.lastName} checked in!`, { duration: 4000 });
      onSuccess?.(data);
      // Auto-resume scanning after 3s
      setCooldown(true);
      setTimeout(() => { setCooldown(false); setStatus('scanning'); }, 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Check-in failed';
      setErrorMsg(msg);
      setStatus('error');
      if (msg.includes('Already checked in')) {
        toast(msg, { icon: '✅' });
      } else {
        toast.error(msg);
      }
      setCooldown(true);
      setTimeout(() => { setCooldown(false); setStatus('scanning'); }, 2500);
    },
  });

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      (decodedText) => {
        if (cooldown || scanMutation.isPending) return;
        setStatus('scanning');
        scanMutation.mutate(decodedText);
      },
      () => {} // ignore errors (camera feed noise)
    ).then(() => setStatus('scanning')).catch((err) => {
      console.error('Camera error:', err);
      setErrorMsg('Camera access denied. Please allow camera permission in your browser.');
      setStatus('error');
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []); // eslint-disable-line

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}
        style={{ border: '1px solid var(--border-medium)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold  flex items-center gap-2">
              <Camera className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
              Scan Member QR
            </h2>
            <p className=" text-sm mt-0.5">Point camera at member's QR code</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X className="w-5 h-5" /></button>
        </div>

        {/* Camera viewport */}
        <div className="relative rounded-2xl overflow-hidden mb-5" style={{ background: '#000', minHeight: 300 }}>
          <div id={containerId} style={{ width: '100%' }} />

          {/* Scanning overlay */}
          {status === 'scanning' && !cooldown && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Corner brackets */}
                {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                  'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c, i) => (
                  <div key={i} className={`absolute w-8 h-8 rounded-sm ${c}`}
                    style={{ borderColor: 'var(--accent)' }} />
                ))}
                {/* Scan line animation */}
                <div className="absolute left-0 right-0 h-0.5 animate-[scan_2s_ease-in-out_infinite]"
                  style={{ background: 'var(--accent)', top: '50%', boxShadow: '0 0 8px var(--accent)' }} />
              </div>
            </div>
          )}

          {/* Success overlay */}
          {status === 'success' && lastResult && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', backdropFilter: 'blur(4px)' }}>
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-3" />
              <p className=" text-xl font-bold">{lastResult.user?.firstName} {lastResult.user?.lastName}</p>
              <p className="text-emerald-400 text-sm mt-1">Checked In Successfully!</p>
            </div>
          )}

          {/* Error overlay */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{ background: 'rgba(239,68,68,0.1)', backdropFilter: 'blur(4px)' }}>
              <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
              <p className=" text-center text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Processing */}
          {scanMutation.isPending && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: status === 'success' ? 'rgba(16,185,129,0.1)' : 'var(--bg-base)' }}>
          <div className={`w-2 h-2 rounded-full ${status === 'scanning' && !cooldown ? 'bg-emerald-400 animate-pulse' : status === 'success' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-gray-600'}`} />
          <span className="">
            {status === 'idle' ? 'Starting camera...'
              : status === 'scanning' ? 'Ready — point at QR code'
              : status === 'success' ? 'Check-in recorded! Resuming...'
              : 'Retrying...'}
          </span>
        </div>

        <p className=" text-xs text-center mt-3">
          Admin • Camera-based attendance marking
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}</style>
    </div>
  );
}
