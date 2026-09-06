import React from 'react';
import { Upload } from 'lucide-react';

interface Props {
  importText: string;
  setImportText: (text: string) => void;
  importErrors: string[];
  onImportJSON: () => void;
  showToast: (msg: string) => void;
}

export const ImportTab: React.FC<Props> = ({
  importText,
  setImportText,
  importErrors,
  onImportJSON,
  showToast
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Import AI JSON</h2>
            <p className="text-xs text-slate-500 font-medium">Paste the JSON from your AI output here</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setImportText(text);
                showToast("Pasted from clipboard!");
              }}
              className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold active:scale-95"
            >
              Paste
            </button>
            <button
              onClick={() => setImportText('')}
              className="px-2.5 py-1 rounded-xl bg-red-50 text-red-600 text-xs font-bold active:scale-95"
            >
              Clear
            </button>
          </div>
        </div>

        {importErrors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-1">
            <span className="font-bold block">Validation Errors:</span>
            {importErrors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        )}

        <textarea
          rows={12}
          value={importText}
          placeholder='Paste raw JSON starting with { "schema_version": "1.1", ... }'
          onChange={(e) => setImportText(e.target.value)}
          className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-purple-500 leading-relaxed"
        />

        <button
          onClick={onImportJSON}
          className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 active:scale-95 transition"
        >
          <Upload size={16} />
          <span>Validate & Load into Editor</span>
        </button>
      </div>
    </div>
  );
};
