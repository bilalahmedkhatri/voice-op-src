"use client";

import React, { useState, useRef } from "react";
import { FiUpload, FiFileText, FiAlertCircle, FiSave, FiCheck, FiLoader, FiEdit2 } from "react-icons/fi";
import TemplateRenderer from "../../components/TemplateRenderer";
import { Button } from "@/components/ui";

export default function JsonPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to DB state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setIsLoadingTemplate(true);
      fetch(`/api/templates?id=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.template) {
            setParsedData(data.template.json_data);
            setJsonInput(JSON.stringify(data.template.json_data, null, 2));
            setSavedId(id);
            setSaveStatus("idle");
            setIsGenerated(true);
          }
        })
        .catch(err => console.error("Failed to fetch template:", err))
        .finally(() => setIsLoadingTemplate(false));
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    if (error) setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setError("Please upload a valid JSON file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonInput(content);
        setError(null);
        const parsed = JSON.parse(content);
        setParsedData(parsed);
        setIsGenerated(true);
        setSaveStatus("idle");
        setSavedId(null);
      } catch (err) {
        setError("Invalid JSON file content.");
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleParse = () => {
    if (!jsonInput.trim()) {
      setError("Please enter or upload JSON data.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      setParsedData(parsed);
      setIsGenerated(true);
      setError(null);
      setSaveStatus("idle");
      setSavedId(null);
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const handleClear = () => {
    setJsonInput("");
    setParsedData(null);
    setIsGenerated(false);
    setIsEditing(false);
    setError(null);
    setSaveStatus("idle");
    setSavedId(null);
  };

  const handleDataChange = (newData: any) => {
    setParsedData(newData);
    setJsonInput(JSON.stringify(newData, null, 2));
    if (saveStatus === "saved") {
      setSaveStatus("idle");
    }
  };

  const handleSaveToDb = async () => {
    if (!parsedData) return;
    setSaveStatus("saving");
    try {
      const isExisting = Boolean(savedId);
      const res = await fetch("/api/templates", {
        method: isExisting ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isExisting
            ? { id: savedId, json_data: parsedData }
            : { json_data: parsedData }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setShowLoginModal(true);
          setSaveStatus("idle");
          return;
        }
        throw new Error(data.error || "Failed to save");
      }
      if (!isExisting && data.template?.id) {
        setSavedId(data.template.id);
      }
      setSaveStatus("saved");
      setJsonInput(JSON.stringify(parsedData, null, 2));
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };



  if (isLoadingTemplate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="w-8 h-8 text-[#ff7d6e] animate-spin" />
          <p className="text-slate-500 font-medium">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="mx-auto space-y-8">
        {!isGenerated && (
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <FiFileText className="w-8 h-8 text-[#ff7d6e]" />
              Dynamic Template Generator
            </h1>
            <p className="text-slate-500 text-lg">
              Upload or paste JSON to automatically generate a functional user interface.
            </p>
          </header>
        )}

        {!isGenerated ? (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">JSON Input</h2>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    size="md"
                    icon={<FiUpload className="w-4 h-4 text-[#ff7d6e]" />}
                    hideTextOnMobile={true}
                  >
                    Upload JSON File
                  </Button>
                </div>
              </div>

              <div>
                <textarea
                  value={jsonInput}
                  onChange={handleTextChange}
                  placeholder="Paste your JSON here..."
                  className="w-full h-64 p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff9b8f] focus:ring-2 focus:ring-[#ff9b8f]/25 resize-y"
                  spellCheck={false}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                  <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleParse}
                  variant="primary"
                  size="lg"
                >
                  Generate Template
                </Button>
                {parsedData && (
                  <Button
                    onClick={handleClear}
                    variant="secondary"
                    size="lg"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold">Generated Interface</h2>
                {isEditing && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full border border-orange-200 animate-pulse">
                    Editing Mode
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Edit Toggle Button */}
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "primary" : "secondary"}
                  size="md"
                  icon={isEditing ? <FiCheck className="w-4 h-4" /> : <FiEdit2 className="w-4 h-4 text-[#ff7d6e]" />}
                  title={isEditing ? "Finish Editing" : "Edit Template Fields"}
                  hideTextOnMobile={true}
                >
                  {isEditing ? "Done Editing" : "Edit Template"}
                </Button>

                {/* Save to Database / Save Changes Button */}
                <Button
                  onClick={handleSaveToDb}
                  disabled={saveStatus === "saving"}
                  isLoading={saveStatus === "saving"}
                  variant="primary"
                  size="md"
                  className={saveStatus === "saved" ? "!bg-emerald-600 hover:!bg-emerald-700 text-white" : saveStatus === "error" ? "!bg-red-500 hover:!bg-red-600" : ""}
                  icon={saveStatus === "saved" ? <FiCheck className="w-4 h-4" /> : saveStatus === "error" ? <FiAlertCircle className="w-4 h-4" /> : <FiSave className="w-4 h-4" />}
                  hideTextOnMobile={true}
                >
                  {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Failed" : savedId ? "Save Changes" : "Save to Database"}
                </Button>
              </div>
            </div>
            <TemplateRenderer
              data={parsedData}
              isEditing={isEditing}
              onDataChange={handleDataChange}
            />
          </div>
        )}
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-orange-100 text-[#ff7d6e] rounded-full flex items-center justify-center mx-auto">
                <FiAlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Login Required</h3>
              <p className="text-slate-500 text-sm">
                You need to log in with your Google account before you can save templates to the database.
              </p>
              <div className="pt-4 flex flex-col gap-3">
                <a
                  href="/api/auth/google"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#ff7d6e] hover:bg-[#e04836] text-white rounded-xl font-semibold transition-all shadow-xs"
                >
                  Continue with Google
                </a>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
