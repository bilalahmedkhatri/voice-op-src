import { useState } from 'react';
import { FaEdit, FaSave, FaTrash, FaSearch, FaDownload, FaFont } from 'react-icons/fa';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface SavedPromptsProps {
  prompts: string[];
  onLoad: (prompt: string) => void;
  onDelete: (index: number) => void;
}

export default function SavedPrompts({ prompts, onLoad, onDelete }: SavedPromptsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [promptToDelete, setPromptToDelete] = useState<number | null>(null);

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (prompts.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-slate-50/60 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#ff7d6e] flex items-center justify-center">
            <FaEdit className="w-6 h-6" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          No Saved Prompts Yet
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Your saved prompts will appear here. Start by entering text in the editor and clicking Save!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FaSave className="text-[#ff7d6e]" />
            <span>Saved Prompts</span>
          </h3>
          <span className="px-3 py-1 bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] text-white rounded-full text-xs font-semibold shadow-2xs font-mono">
            {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#ff9b8f] focus:ring-2 focus:ring-[#ff9b8f]/25 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Prompts Grid */}
      {filteredPrompts.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-500">
          <p className="text-sm">
            No prompts match &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt, index) => {
            const originalIndex = prompts.indexOf(prompt);
            return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                aria-label={`Load prompt: ${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}`}
                title={prompt.substring(0, 120)}
                onClick={() => onLoad(prompt)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onLoad(prompt);
                  }
                }}
                className="group relative bg-white border border-slate-200/80 hover:border-[#ff9b8f] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer outline-none focus:ring-2 focus:ring-[#ff9b8f]/30"
              >
                {/* Prompt Preview */}
                <div className="flex-1 p-3.5 bg-slate-50 rounded-xl text-sm leading-relaxed text-slate-700 max-h-[120px] overflow-hidden relative border border-slate-100">
                  {prompt.substring(0, 150)}
                  {prompt.length > 150 ? '...' : ''}
                  {prompt.length > 150 && (
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <FaFont className="text-slate-400" />
                  <span>{prompt.length} characters</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoad(prompt);
                    }}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-[#ff9b8f] to-[#ff7d6e] hover:from-[#f8887a] hover:to-[#f05a48] text-white rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FaDownload className="text-xs" />
                    <span>Load</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPromptToDelete(originalIndex);
                    }}
                    className="py-2 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                    title="Delete Prompt"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={promptToDelete !== null}
        onClose={() => setPromptToDelete(null)}
        onConfirm={() => {
          if (promptToDelete !== null) {
            onDelete(promptToDelete);
            setPromptToDelete(null);
          }
        }}
        title="Delete Saved Prompt"
        message="Are you sure you want to delete this prompt?"
      />
    </div>
  );
}

