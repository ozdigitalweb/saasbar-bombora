import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar Exclusão',
  cancelText = 'Cancelar',
  isDangerous = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]">
      <div className="bg-white rounded-[16px] w-full max-w-md shadow-xl border border-[#E2E8F0] overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
              isDangerous ? 'bg-red-50 text-[#DC2626]' : 'bg-amber-50 text-[#F59E0B]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[1.125rem] font-semibold text-[#0F172A] leading-tight">
              {title}
            </h3>
            <p className="text-[0.875rem] text-[#64748B] mt-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E8F0] text-[#334155] rounded-[10px] text-[0.875rem] font-medium hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-[10px] text-[0.875rem] font-medium text-white transition-colors ${
              isDangerous
                ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                : 'bg-[#0D9488] hover:bg-[#0F766E]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
