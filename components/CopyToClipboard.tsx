
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyToClipboardProps {
  text: string;
  className?: string;
  label?: string;
  type?: string;
}

export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ text, className = "", label, type = "Dado" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  if (!text) return null;

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleCopy}
        className={`group flex items-center gap-1.5 transition-all hover:opacity-80 active:scale-95 ${className}`}
        title={`Clique para copiar ${type.toLowerCase()}`}
      >
        <span className="truncate">{label || text}</span>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500 animate-in fade-in zoom-in duration-200" />
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
        )}
      </button>
      
      {copied && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-xl whitespace-nowrap z-30 animate-in fade-in slide-in-from-bottom-1">
          {type} copiado!
        </div>
      )}
    </div>
  );
};
