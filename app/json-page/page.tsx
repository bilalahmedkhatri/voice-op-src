"use client";

import React, { useState, useRef } from "react";
import { FiUpload, FiFileText, FiAlertCircle } from "react-icons/fi";
import TemplateRenderer from "../components/TemplateRenderer";

export default function JsonPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Automatically parse on file upload
        const parsed = JSON.parse(content);
        setParsedData(parsed);
        setIsGenerated(true);
      } catch (err) {
        setError("Invalid JSON file content.");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
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
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const handleClear = () => {
    setJsonInput("");
    setParsedData(null);
    setIsGenerated(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {!isGenerated && (
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <FiFileText className="w-8 h-8 text-blue-600" />
              Dynamic Template Generator
            </h1>
            <p className="text-slate-500 text-lg">
              Upload or paste JSON to automatically generate a functional user interface.
            </p>
          </header>
        )}

        {!isGenerated ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-md text-sm font-medium"
                  >
                    <FiUpload className="w-4 h-4" />
                    Upload JSON File
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  value={jsonInput}
                  onChange={handleTextChange}
                  placeholder="Paste your JSON here..."
                  className="w-full h-64 p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
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
                <button
                  onClick={handleParse}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  Generate Template
                </button>
                {parsedData && (
                  <button
                    onClick={handleClear}
                    className="px-6 py-2.5 bg-transparent border border-slate-300 hover:bg-slate-100 font-medium rounded-md transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Generated Interface
              </h2>
              <button
                onClick={() => setIsGenerated(false)}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                ← Back to Input
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
              <TemplateRenderer data={parsedData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
