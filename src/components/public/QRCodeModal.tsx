"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  dateStr: string;
  url?: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  title,
  dateStr,
  url,
}: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Default to current page URL if none provided
  const targetUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    if (isOpen && targetUrl) {
      QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
      })
        .then((dataUri) => setQrDataUrl(dataUri))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-ibadah-${dateStr.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-app/50 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-accent/15 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="font-serif font-bold text-xl text-ink mb-1">
          QR Code Bahan Ibadah
        </h3>
        <p className="text-xs text-ink-muted mb-6">
          {title} • {dateStr}
        </p>

        <div className="bg-white p-4 rounded-xl border border-line inline-block shadow-inner mb-6">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-56 h-56 mx-auto object-contain rounded-md"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-ink-muted text-sm">
              Menghasilkan QR...
            </div>
          )}
        </div>

        <p className="text-xs text-ink-muted mb-4">
          Arahkan kamera HP jemaat untuk langsung membuka berkas ibadah ini.
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1 text-xs gap-1.5"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Tersalin!" : "Salin Link"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadQR}
            className="flex-1 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh QR
          </Button>
        </div>
      </div>
    </div>
  );
}
