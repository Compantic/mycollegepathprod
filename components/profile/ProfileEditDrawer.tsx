"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { useEffect } from "react";

interface ProfileEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  isSaving: boolean;
}

export function ProfileEditDrawer({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  isSaving,
}: ProfileEditDrawerProps) {
  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[101] w-full max-w-lg border-l border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl sm:rounded-l-[2rem]"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-6 sm:px-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{title}</h3>
                  <p className="text-sm font-medium text-slate-500">Update your information securely.</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
                <div className="space-y-6">
                  {children}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-6 sm:px-8">
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 py-4 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Data is encrypted & stored securely
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
