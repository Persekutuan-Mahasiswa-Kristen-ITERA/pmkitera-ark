"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QRCodeModal } from "./QRCodeModal";

interface QRCodeButtonProps {
  title: string;
  dateStr: string;
  url?: string;
  className?: string;
}

export function QRCodeButton({
  title,
  dateStr,
  url,
  className = "",
}: QRCodeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`gap-2 text-ink hover:text-accent hover:border-accent ${className}`}
        title="Tampilkan QR Code untuk di-scan jemaat"
      >
        <QrCode className="w-4 h-4 text-accent" />
        <span>Scan QR</span>
      </Button>

      <QRCodeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        dateStr={dateStr}
        url={url}
      />
    </>
  );
}
