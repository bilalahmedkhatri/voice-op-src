"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert, Link2, LoaderCircle, Send, Square } from "lucide-react";

type FlowScriptItem = {
  id: string;
  type: "short" | "long_video";
  title: string;
  description: string;
  script: string;
};

type FlowPort = {
  postMessage(message: unknown): void;
  disconnect(): void;
  onMessage: { addListener(listener: (message: unknown) => void): void };
  onDisconnect: { addListener(listener: () => void): void };
};

type FlowBrowserApi = {
  runtime?: { connect(extensionId: string, options: { name: string }): FlowPort };
};

type BridgeMessage = {
  type?: string;
  [key: string]: unknown;
};

type ItemStatus = {
  status: string;
  percentage?: number;
  prompt?: string;
  error?: string;
};

const FLOW_MODES = [
  { value: "textToVideo", label: "Text to video" },
  { value: "imageToVideo", label: "Image to video" },
  { value: "componentsToVideo", label: "Components to video" },
];

const VIDEO_LENGTHS = ["4s", "6s", "8s", "10s", "4s-concat", "6s-concat", "8s-concat", "10s-concat"];

export default function FlowBatchGenerator({
  items,
  selectedIds,
  onSelectionChange,
}: {
  items: FlowScriptItem[];
  selectedIds: string[];
  onSelectionChange(ids: string[]): void;
}) {
  const portRef = useRef<FlowPort | null>(null);
  const [extensionId, setExtensionId] = useState("");
  const [connectionState, setConnectionState] = useState("disconnected");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState("");
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({});
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("textToVideo");
  const [model, setModel] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [videoOption, setVideoOption] = useState("6s");
  const [outputCount, setOutputCount] = useState(1);
  const [concurrentPrompts, setConcurrentPrompts] = useState(1);
  const [promptDelaySecondsMin, setPromptDelaySecondsMin] = useState(0);
  const [promptDelaySecondsMax, setPromptDelaySecondsMax] = useState(0);
  const [style, setStyle] = useState("");
  const [voiceover, setVoiceover] = useState("");
  const [backgroundMusic, setBackgroundMusic] = useState("");

  useEffect(() => () => portRef.current?.disconnect(), []);

  const connect = () => {
    setError(null);
    const id = extensionId.trim();
    if (!/^[a-p]{32}$/.test(id)) {
      setError(`The extension ID must be exactly 32 characters from a to p (the entered value has ${id.length}). Copy it from chrome://extensions.`);
      return;
    }
    const currentOrigin = window.location.origin;
    if (currentOrigin !== "https://www.genzee.video") {
      setError(`This page is running at ${currentOrigin}. The installed production extension accepts only https://www.genzee.video. For local testing, load a separate development copy of the extension with this exact origin allowlisted.`);
      return;
    }
    const browserApi = (window as Window & { chrome?: FlowBrowserApi }).chrome;
    if (!browserApi?.runtime?.connect) {
      setError("Chrome did not expose the external extension connection API. Confirm the extension is enabled, reload this GenZee page, and try again.");
      return;
    }

    portRef.current?.disconnect();
    setConnectionState("connecting");
    try {
      const port = browserApi.runtime.connect(id, { name: "genzee-flow-v1" });
      portRef.current = port;
      port.onMessage.addListener((rawMessage) => {
        if (!rawMessage || typeof rawMessage !== "object") return;
        const message = rawMessage as BridgeMessage;
        if (message.type === "READY") {
          setConnectionState("connected");
          setError(null);
        } else if (message.type === "BATCH_ACCEPTED") {
          setGroupId(String(message.groupId || ""));
          setBatchStatus("queued");
        } else if (message.type === "BATCH_REJECTED") {
          setBatchStatus("error");
          setError(String(message.error || "The extension rejected this batch."));
        } else if (message.type === "ITEM_PROGRESS") {
          const index = Number(message.promptIndex);
          const itemId = selectedIds[index];
          if (!itemId) return;
          setItemStatuses((previous) => ({
            ...previous,
            [itemId]: {
              status: String(message.status || "running"),
              percentage: Number(message.percentage || 0),
              prompt: String(message.prompt || ""),
            },
          }));
        } else if (message.type === "BATCH_STATUS") {
          const status = String(message.status || "running");
          setBatchStatus(status);
          if (["completed", "cancelled", "error"].includes(status)) setGroupId(null);
        } else if (message.type === "CANCEL_REJECTED") {
          setError(String(message.error || "The extension could not cancel this batch."));
        }
      });
      port.onDisconnect.addListener(() => {
        if (portRef.current === port) portRef.current = null;
        setConnectionState("disconnected");
        setGroupId(null);
        setBatchStatus((current) => ["sending", "queued", "running"].includes(current) ? "connection-lost" : current);
      });
    } catch {
      setConnectionState("disconnected");
      setError("Could not connect to the Flow extension. Check the extension ID and reload GenZee.");
    }
  };

  const submitBatch = () => {
    const port = portRef.current;
    const selectedItems = items.filter((item) => selectedIds.includes(item.id));
    if (!port || connectionState !== "connected") {
      setError("Connect the Flow extension before sending scripts.");
      return;
    }
    if (selectedItems.length === 0) {
      setError("Select at least one script to send.");
      return;
    }
    if (!model.trim()) {
      setError("Enter the model name as it appears in Google Flow.");
      return;
    }

    const nextBatchId = crypto.randomUUID();
    setBatchId(nextBatchId);
    setGroupId(null);
    setBatchStatus("sending");
    setItemStatuses({});
    setError(null);
    port.postMessage({
      type: "SUBMIT_BATCH",
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      batch: {
        schemaVersion: 1,
        batchId: nextBatchId,
        settings: {
          mode,
          model: model.trim(),
          aspectRatio,
          videoOption,
          outputCount,
          concurrentPrompts,
          promptDelaySecondsMin,
          promptDelaySecondsMax,
          style: style.trim(),
          voiceover: voiceover.trim(),
          backgroundMusic: backgroundMusic.trim(),
        },
        items: selectedItems.map((item) => ({
          id: item.id,
          title: item.title,
          caption: item.description,
          script: item.script,
        })),
      },
    });
  };

  const cancelBatch = () => {
    if (!portRef.current || !groupId) return;
    portRef.current.postMessage({ type: "CANCEL_BATCH", groupId });
  };

  const toggleAll = () => {
    onSelectionChange(items.length > 0 && selectedIds.length === items.length ? [] : items.map((item) => item.id));
  };

  return (
    <section className="space-y-4 border-y border-slate-200 py-5" aria-labelledby="flow-batch-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="flow-batch-title" className="text-lg font-semibold text-slate-900">Google Flow batch</h2>
          <p className="text-sm text-slate-600">{selectedIds.length} scripts selected</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={toggleAll} className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {items.length > 0 && selectedIds.length === items.length ? <Check size={16} /> : <Square size={16} />}
            {items.length > 0 && selectedIds.length === items.length ? "Clear selection" : "Select all"}
          </button>
          <button type="button" onClick={submitBatch} disabled={connectionState !== "connected" || !!groupId || batchStatus === "sending" || selectedIds.length === 0} className="inline-flex items-center gap-2 rounded bg-[#c83a2a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#ad3024] disabled:cursor-not-allowed disabled:opacity-50">
            {batchStatus === "sending" ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
            Send selected
          </button>
          {groupId && <button type="button" onClick={cancelBatch} className="rounded border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Cancel batch</button>}
        </div>
      </div>

      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Generation settings</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm text-slate-700">Mode
            <select value={mode} onChange={(event) => setMode(event.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-2">
              {FLOW_MODES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-700">Google Flow model
            <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Exact model label in Flow" className="w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm text-slate-700">Aspect ratio
            <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-2">
              <option value="16:9">16:9 landscape</option><option value="9:16">9:16 portrait</option><option value="1:1">1:1 square</option><option value="4:3">4:3 landscape</option><option value="3:4">3:4 portrait</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-700">Video length
            <select value={videoOption} onChange={(event) => setVideoOption(event.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-2">
              {VIDEO_LENGTHS.map((option) => <option key={option} value={option}>{option.replace("-concat", " concat")}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-700">Outputs per script
            <input type="number" min={1} max={4} value={outputCount} onChange={(event) => setOutputCount(Number(event.target.value))} className="w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm text-slate-700">Concurrent scripts
            <input type="number" min={1} max={6} value={concurrentPrompts} onChange={(event) => setConcurrentPrompts(Number(event.target.value))} className="w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm text-slate-700">Minimum delay (seconds)
            <input type="number" min={0} value={promptDelaySecondsMin} onChange={(event) => setPromptDelaySecondsMin(Number(event.target.value))} className="w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm text-slate-700">Maximum delay (seconds)
            <input type="number" min={0} value={promptDelaySecondsMax} onChange={(event) => setPromptDelaySecondsMax(Number(event.target.value))} className="w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm text-slate-700">Style or theme
            <input value={style} onChange={(event) => setStyle(event.target.value)} placeholder="Optional direction" className="w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm text-slate-700">Voiceover direction
            <input value={voiceover} onChange={(event) => setVoiceover(event.target.value)} placeholder="Optional; added to prompt" className="w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm text-slate-700">Background music direction
            <input value={backgroundMusic} onChange={(event) => setBackgroundMusic(event.target.value)} placeholder="Optional; added to prompt" className="w-full rounded border border-slate-300 px-3 py-2" />
          </label>
        </div>
      </details>

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-64 flex-1 space-y-1 text-sm text-slate-700">Chrome extension ID
          <input value={extensionId} onChange={(event) => setExtensionId(event.target.value)} placeholder="32-character ID from chrome://extensions" minLength={32} maxLength={32} spellCheck={false} autoCapitalize="off" className="w-full rounded border border-slate-300 px-3 py-2 font-mono" />
        </label>
        <button type="button" onClick={connect} disabled={connectionState === "connecting"} className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {connectionState === "connecting" ? <LoaderCircle size={16} className="animate-spin" /> : <Link2 size={16} />}
          {connectionState === "connected" ? "Reconnect" : "Connect extension"}
        </button>
        <span className="text-xs text-slate-500" role="status">{connectionState}</span>
      </div>

      <p className="text-xs text-slate-500">Open a Google Flow project before submitting. Flow handles generation and Chrome downloads completed videos to your device; GenZee does not store these videos yet. Style, voiceover, and music directions are included in prompt text because the extension has no separate controls for them.</p>
      {batchId && <p className="text-sm text-slate-700" role="status">Batch {batchStatus || "sending"}{groupId ? ` · ${groupId}` : ""}</p>}
      {Object.entries(itemStatuses).length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Flow prompt progress">
          {Object.entries(itemStatuses).map(([itemId, itemStatus]) => {
            const item = items.find((candidate) => candidate.id === itemId);
            return <li key={itemId} className="flex items-center gap-2 text-sm text-slate-700">
              {itemStatus.status === "completed" ? <Check size={15} className="text-emerald-600" /> : <LoaderCircle size={15} className="animate-spin text-[#c83a2a]" />}
              <span className="truncate">{item?.title || itemId}</span>
              <span className="ml-auto text-xs text-slate-500">{itemStatus.percentage ?? 0}% · {itemStatus.status}</span>
            </li>;
          })}
        </ul>
      )}
      {error && <p className="flex items-center gap-2 text-sm text-red-700" role="alert"><CircleAlert size={16} />{error}</p>}
    </section>
  );
}
