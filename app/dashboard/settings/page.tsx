"use client";

import React, { useState } from "react";
import { FiSave, FiSettings, FiKey, FiGlobe, FiBell } from "react-icons/fi";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FiSettings className="w-6 h-6 text-blue-600" /> Platform Settings
          </h1>
          <p className="text-slate-500 mt-1">Configure your voice generator and platform preferences.</p>
        </div>
        <div className="flex items-center gap-4">
          {showSavedMsg && <span className="text-sm font-medium text-green-600">Settings saved!</span>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            <FiSave className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* API Configuration */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <FiKey className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">API Configuration</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Replicate API Token</label>
                <input
                  type="password"
                  placeholder="r8_..."
                  defaultValue="r8_placeholder_key_xxxx"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-slate-500">Used for generating AI voiceovers via Replicate models.</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">OpenAI API Key (Optional)</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-slate-500">Used for GPT-based script generation integrations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Voiceover Defaults */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <FiGlobe className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Voiceover Defaults</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Default Voice Model</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option>suno-ai/bark</option>
                  <option>elevenlabs/speech</option>
                  <option>coqui/xtts</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Default Language</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Default Voice Style / Profile</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="voice_style" defaultChecked className="text-blue-600 focus:ring-blue-500" />
                  Neutral / Professional
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="voice_style" className="text-blue-600 focus:ring-blue-500" />
                  Energetic / YouTube
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="voice_style" className="text-blue-600 focus:ring-blue-500" />
                  Calm / Narrative
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & System */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <FiBell className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Preferences</h2>
          </div>
          <div className="p-6 space-y-5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-700">Email Notifications</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: 0, borderColor: '#2563eb' }} />
                <div className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-600 cursor-pointer"></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-700">Auto-save JSON Templates</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ left: 0, borderColor: '#cbd5e1' }} />
                <div className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-700">Dark Mode (Beta)</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ left: 0, borderColor: '#cbd5e1' }} />
                <div className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></div>
              </div>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
