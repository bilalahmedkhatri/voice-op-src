import React, { ReactNode } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiLoader } from 'react-icons/fi';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message: string;
  isAlert?: boolean;
  confirmText?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  isSuccess?: boolean;
  successMessage?: string;
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message,
  isAlert = false,
  confirmText = isAlert ? "OK" : "Delete",
  icon,
  isLoading = false,
  isSuccess = false,
  successMessage = "Action completed successfully!"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Success</h3>
            <p className="text-sm text-slate-500">{successMessage}</p>
          </div>
        ) : (
          <>
            <div className="p-5 flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-[#ff7d6e]">
                {icon || <FiAlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
              {!isAlert && (
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-orange-50/50 hover:border-[#ff9b8f]/60 focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (onConfirm) onConfirm();
                  else onClose();
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff9b8f]/25 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
              >
                {isLoading && <FiLoader className="w-4 h-4 animate-spin" />}
                {isLoading ? "Processing..." : confirmText}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
