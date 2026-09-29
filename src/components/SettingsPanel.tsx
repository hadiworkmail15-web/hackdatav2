import { Card } from '@/components/ui/Card';
import type { GenerationSettings } from '@/types/schema';

interface SettingsPanelProps {
  settings: GenerationSettings;
  onChange: (settings: GenerationSettings) => void;
  disabled?: boolean;
}

export function SettingsPanel({ settings, onChange, disabled }: SettingsPanelProps) {
  const update = (patch: Partial<GenerationSettings>) => onChange({ ...settings, ...patch });

  return (
    <Card>
      <h4 className="font-semibold text-default text-sm mb-4">Generation Settings</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted mb-1 block">Row Count</label>
          <input
            type="number"
            value={settings.rowCount}
            min={1}
            max={100000}
            onChange={(e) => update({ rowCount: Math.max(1, Number(e.target.value)) })}
            className="input text-sm"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Random Seed</label>
          <input
            type="number"
            value={settings.seed}
            onChange={(e) => update({ seed: Number(e.target.value) })}
            className="input text-sm"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Locale</label>
          <select
            value={settings.locale}
            onChange={(e) => update({ locale: e.target.value })}
            className="input text-sm"
            disabled={disabled}
          >
            <option value="en-US">en-US</option>
            <option value="en-GB">en-GB</option>
            <option value="de-DE">de-DE</option>
            <option value="fr-FR">fr-FR</option>
            <option value="ja-JP">ja-JP</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => update({ currency: e.target.value })}
            className="input text-sm"
            disabled={disabled}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD (C$)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="JPY">JPY (¥)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Null Rate: {settings.nullRate}%</label>
          <input
            type="range"
            min={0}
            max={50}
            value={settings.nullRate}
            onChange={(e) => update({ nullRate: Number(e.target.value) })}
            className="w-full accent-sky-500"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Outlier Rate: {settings.outlierRate}%</label>
          <input
            type="range"
            min={0}
            max={20}
            value={settings.outlierRate}
            onChange={(e) => update({ outlierRate: Number(e.target.value) })}
            className="w-full accent-sky-500"
            disabled={disabled}
          />
        </div>
      </div>
    </Card>
  );
}
