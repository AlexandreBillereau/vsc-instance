import React, { useState } from 'react';
import * as icons from 'simple-icons';
import './IconPicker.css';

interface IconPickerProps {
  onSelect: (icon: { title: string; svg: string }) => void;
  onClose: () => void;
}

export function IconPicker({ onSelect, onClose }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Convertir l'objet icons en tableau
  const iconsList = Object.values(icons).filter(icon => 
    icon.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="icon-picker-overlay">
      <div className="icon-picker-modal">
        <div className="icon-picker-header">
          <h2>Select Programming Language Icon</h2>
          <input
            type="text"
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="icon-search"
          />
          <button onClick={onClose} className="close-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="icons-grid">
          {iconsList.map((icon) => (
            <button
              key={icon.title}
              className="icon-button"
              onClick={() => onSelect({ title: icon.title, svg: icon.svg })}
              title={icon.title}
            >
              <div 
                className="icon-preview"
                dangerouslySetInnerHTML={{ __html: icon.svg }}
              />
              <span className="icon-title">{icon.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 