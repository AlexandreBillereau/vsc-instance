import React, { useState } from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
  onSelect: (color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#3b82f6', // Light Blue
  '#0ea5e9', // Sky Blue
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#10b981', // Emerald
  '#22c55e', // Green
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#dc2626', // Dark Red
  '#ec4899', // Pink
  '#d946ef', // Fuchsia
  '#a855f7', // Purple
];

export function ColorPicker({ onSelect, onClose }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState('#2563eb');

  const handleCustomColorSubmit = () => {
    onSelect(customColor);
  };

  return (
    <div className="color-picker-overlay" onClick={onClose}>
      <div className="color-picker-container" onClick={e => e.stopPropagation()}>
        <div className="color-picker-header">
          <h3>Choose Theme Color</h3>
          <button className="close-button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="color-grid">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className="color-button"
              style={{ backgroundColor: color }}
              onClick={() => onSelect(color)}
              title={color}
            >
              <span className="color-preview" />
            </button>
          ))}
        </div>
        <div className="custom-color">
          <label htmlFor="custom-color">Custom Color:</label>
          <div className="custom-color-input-group">
            <input
              type="color"
              id="custom-color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
            />
            <button 
              className="confirm-color-button"
              onClick={handleCustomColorSubmit}
              style={{ backgroundColor: customColor }}
            >
              Apply Color
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 