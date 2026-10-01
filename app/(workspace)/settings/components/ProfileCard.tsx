import React from "react";
import { FiUser, FiMail, FiCalendar, FiRefreshCw, FiCheck, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  google_id: string;
  created_at: string;
  updated_at: string;
}

interface ProfileCardProps {
  user: UserProfile;
  displayName: string;
  onDisplayNameChange: (val: string) => void;
  onSaveName: () => void;
  isSaving: boolean;
  saveStatus: "idle" | "success" | "error";
  saveMessage: string;
}

export default function ProfileCard({
  user,
  displayName,
  onDisplayNameChange,
  onSaveName,
  isSaving,
  saveStatus,
  saveMessage,
}: ProfileCardProps) {
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FiUser className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Profile & Identity</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-medium">
          <FaGoogle className="text-xs text-red-500" />
          Google Verified
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* User Avatar + Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div className="relative">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                className="w-16 h-16 rounded-full border-2 border-white shadow object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow border border-slate-200"
              title="Google Account"
            >
              <FaGoogle className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {user.name || "Authenticated User"}
            </h3>
            <p className="text-sm text-slate-500 font-mono">{user.email}</p>
          </div>
        </div>

        {/* Editable Display Name Form */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700">Display Name</label>
            <span className="text-xs text-slate-400 font-mono">{displayName.length}/100</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              maxLength={100}
              placeholder="Enter your display name"
              className="flex-1 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
            />
            <button
              onClick={onSaveName}
              disabled={isSaving || !displayName.trim() || displayName.trim() === user.name}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
            >
              {isSaving ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : saveStatus === "success" ? (
                <FiCheck className="w-4 h-4" />
              ) : null}
              {isSaving ? "Saving..." : saveStatus === "success" ? "Saved!" : "Save Changes"}
            </button>
          </div>
          {saveStatus !== "idle" && (
            <p
              className={`text-xs font-medium flex items-center gap-1.5 mt-1.5 ${
                saveStatus === "success" ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {saveStatus === "success" ? (
                <FiCheckCircle className="w-3.5 h-3.5" />
              ) : (
                <FiAlertCircle className="w-3.5 h-3.5" />
              )}
              {saveMessage}
            </p>
          )}
        </div>

        {/* Read-Only Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiMail className="w-3.5 h-3.5 text-slate-400" /> Email Address
            </span>
            <p className="text-sm font-medium text-slate-800 break-all">{user.email}</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiCalendar className="w-3.5 h-3.5 text-slate-400" /> Member Since
            </span>
            <p className="text-sm font-medium text-slate-800">{formatDate(user.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
