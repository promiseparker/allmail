"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import { Toast, useToast } from "@/components/ui/toast";

export function PrivacySettings() {
  const router = useRouter();
  const { toast, show, dismiss } = useToast();

  const [isExporting,        setIsExporting]        = useState(false);
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);
  const [confirmText,        setConfirmText]        = useState("");
  const [isDeleting,         setIsDeleting]         = useState(false);

  async function exportData() {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `syncone-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        show("Export downloaded", "success");
      } else {
        show("Export failed — please try again", "error");
      }
    } catch {
      show("Export failed — please try again", "error");
    } finally {
      setIsExporting(false);
    }
  }

  async function deleteAccount() {
    if (confirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      } else {
        show("Failed to delete account — please contact support", "error");
        setIsDeleting(false);
      }
    } catch {
      show("Something went wrong — please try again", "error");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="space-y-5">
        {/* Data export */}
        <section className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Export your data
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Download a full JSON export of your calendars, events, and
                settings.
              </p>
            </div>
            <button
              onClick={exportData}
              disabled={isExporting}
              className="flex items-center gap-1.5 text-sm font-medium border border-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Exporting…" : "Export JSON"}
            </button>
          </div>
        </section>

        {/* Delete account */}
        <section className="bg-white border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Trash2 className="w-4 h-4 text-conflict-hard" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-900">
                Delete account
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Permanently deletes your account, all connected calendars, and
                all event data. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-3 text-sm font-medium text-conflict-hard hover:underline"
                >
                  Delete my account →
                </button>
              ) : (
                <div className="mt-4 space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-conflict-hard flex-shrink-0" />
                    <p className="text-xs font-medium text-conflict-hard">
                      This will permanently delete all your data.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">
                      Type <strong>DELETE</strong> to confirm
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/30 focus:border-red-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={deleteAccount}
                      disabled={confirmText !== "DELETE" || isDeleting}
                      className="bg-conflict-hard text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                      {isDeleting ? "Deleting…" : "Permanently delete"}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setConfirmText("");
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismiss} />
      )}
    </>
  );
}
