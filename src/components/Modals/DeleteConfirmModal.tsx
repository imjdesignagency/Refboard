import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  projectName,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#1b1c22] border border-white/10 shadow-2xl overflow-hidden text-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#15161a]">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-white">Delete Project</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-300">
            Are you sure you want to permanently delete{' '}
            <strong className="text-white font-semibold">"{projectName}"</strong>?
          </p>
          <p className="text-[11px] text-slate-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
            This will permanently erase all associated boards, reference images, and scene configurations stored in IndexedDB.
          </p>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all"
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
