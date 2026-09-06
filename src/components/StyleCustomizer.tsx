import React, { useRef } from 'react';
import { Sliders } from 'lucide-react';
import type { PaperCustomization } from '../types/style';
import { STYLE_RANGES, DENSITY_PRESETS } from '../types/style';

interface Props {
  customization: PaperCustomization;
  onChange: (updated: PaperCustomization) => void;
}

const SliderRow: React.FC<{
  label: string;
  value: number;
  unit: string;
  range: { min: number; max: number; step: number };
  onChange: (v: number) => void;
}> = ({ label, value, unit, range, onChange }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className="text-[10px] font-bold text-slate-500">{label}</label>
      <span className="text-[10px] font-bold text-blue-600">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={range.min}
      max={range.max}
      step={range.step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-blue-600"
    />
  </div>
);

export const StyleCustomizer: React.FC<Props> = ({ customization, onChange }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onChange({ ...customization, logoUrl: event.target?.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const applyPreset = (preset: keyof typeof DENSITY_PRESETS) => {
    onChange({ ...customization, ...DENSITY_PRESETS[preset] });
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-md space-y-4 text-xs no-print">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders size={14} className="text-blue-600" /> Paper Layout & Typography Studio
        </h3>
        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
          Live Controls
        </span>
      </div>

      {/* QUICK DENSITY PRESETS */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 block mb-1">QUICK DENSITY</label>
        <div className="flex bg-slate-100 p-0.5 rounded-xl">
          {(['compact', 'normal', 'spacious'] as const).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className="flex-1 py-1 rounded-lg font-bold text-[10px] capitalize transition text-slate-500 hover:text-blue-600"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 1. TYPOGRAPHY & SPACING — now real sliders, not fixed presets */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
          1. Typography & Spacing
        </span>

        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">FONT FAMILY</label>
          <div className="flex bg-slate-100 p-0.5 rounded-xl">
            {(['serif', 'sans', 'mono'] as const).map((font) => (
              <button
                key={font}
                onClick={() => onChange({ ...customization, fontFamily: font })}
                className={`flex-1 py-1 rounded-lg font-bold text-[10px] capitalize transition ${
                  customization.fontFamily === font ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {font}
              </button>
            ))}
          </div>
        </div>

        <SliderRow
          label="FONT SIZE"
          value={customization.fontSizePx}
          unit="px"
          range={STYLE_RANGES.fontSizePx}
          onChange={(v) => onChange({ ...customization, fontSizePx: v })}
        />
        <SliderRow
          label="LINE HEIGHT"
          value={customization.lineHeight}
          unit="×"
          range={STYLE_RANGES.lineHeight}
          onChange={(v) => onChange({ ...customization, lineHeight: v })}
        />
        <SliderRow
          label="WORD SPACING"
          value={customization.wordSpacingPx}
          unit="px"
          range={STYLE_RANGES.wordSpacingPx}
          onChange={(v) => onChange({ ...customization, wordSpacingPx: v })}
        />
        <SliderRow
          label="QUESTION GAP"
          value={customization.questionGapPx}
          unit="px"
          range={STYLE_RANGES.questionGapPx}
          onChange={(v) => onChange({ ...customization, questionGapPx: v })}
        />
        <SliderRow
          label="PAGE MARGIN"
          value={customization.pageMarginPx}
          unit="px"
          range={STYLE_RANGES.pageMarginPx}
          onChange={(v) => onChange({ ...customization, pageMarginPx: v })}
        />
      </div>

      {/* 2. LAYOUT & DENSITY */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
          2. Columns, Border & Numbering
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">COLUMNS (PAGE SAVER)</label>
            <div className="flex bg-slate-100 p-0.5 rounded-xl">
              {([1, 2] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => onChange({ ...customization, columns: col })}
                  className={`flex-1 py-1 rounded-lg font-bold text-[10px] transition ${
                    customization.columns === col ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {col === 1 ? '1 Col' : '2 Col'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">PAPER BORDER</label>
            <div className="flex bg-slate-100 p-0.5 rounded-xl">
              {(['none', 'single', 'double'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => onChange({ ...customization, borderStyle: b })}
                  className={`flex-1 py-1 rounded-lg font-bold text-[10px] capitalize transition ${
                    customization.borderStyle === b ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Q-NUMBER FORMAT</label>
            <div className="flex bg-slate-100 p-0.5 rounded-xl">
              {(['Q1.', '1.', 'Q.1)'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onChange({ ...customization, questionNumberFormat: fmt })}
                  className={`flex-1 py-1 rounded-lg font-bold text-[10px] transition ${
                    customization.questionNumberFormat === fmt ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. WATERMARK & BRANDING */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
          3. Watermark & Branding
        </span>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Affiliation / Board Subheader</label>
          <input
            type="text"
            value={customization.affiliationText}
            onChange={(e) => onChange({ ...customization, affiliationText: e.target.value })}
            placeholder="e.g. Affiliated to CBSE, New Delhi"
            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={customization.showWatermark}
                onChange={(e) => onChange({ ...customization, showWatermark: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span>Security Watermark</span>
            </label>

            {customization.showWatermark && (
              <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
                <span>Opacity:</span>
                {[0.04, 0.08, 0.15].map((op) => (
                  <button
                    key={op}
                    onClick={() => onChange({ ...customization, watermarkOpacity: op })}
                    className={`px-1.5 py-0.5 rounded ${
                      customization.watermarkOpacity === op ? 'bg-blue-600 text-white' : 'bg-slate-100'
                    }`}
                  >
                    {op === 0.04 ? 'Light' : op === 0.08 ? 'Med' : 'Bold'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {customization.showWatermark && (
            <input
              type="text"
              value={customization.watermarkText}
              onChange={(e) => onChange({ ...customization, watermarkText: e.target.value })}
              placeholder="Watermark text (e.g. WINNER'S ACADEMY)"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-bold text-slate-700"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <label className="flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={customization.showStudentBox}
              onChange={(e) => onChange({ ...customization, showStudentBox: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span className="text-[11px] font-medium text-slate-700">Candidate Info Box</span>
          </label>
          <label className="flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={customization.showSignatures}
              onChange={(e) => onChange({ ...customization, showSignatures: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span className="text-[11px] font-medium text-slate-700">Signature Rows</span>
          </label>
        </div>
      </div>
    </div>
  );
};
