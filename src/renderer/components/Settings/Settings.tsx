import React from 'react';
import './Settings.css';
import { ExtensionsFetcher } from '../extensionsFetcher/extensionsFetcher';

export function Settings() {
  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <p>Hello from settings!</p>
      <ExtensionsFetcher />
    </div>
  );
} 