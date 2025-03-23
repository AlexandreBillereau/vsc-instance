export type EditorType = 'vscode' | 'cursor';

export interface EditorInstance {
  id: string;
  name: string;
  type: EditorType;
  userDataDir: string;
  extensionsDir: string;
  workspaceFolder?: string;
  params: string[];
  createdAt: string;
  lastUsed: string;
}

export interface EditorInstanceConfig {
  name: string;
  type: EditorType;
  workspaceFolder?: string;
  params?: string[];
} 