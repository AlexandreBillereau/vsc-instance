export type EditorType = 'vscode' | 'cursor';

export interface EditorInstanceConfig {
  name: string;
  type: EditorType;
  workspaceFolder?: string;
  params?: string[];
  icon?: {
    title: string;
    svg: string;
  };
}

export interface EditorInstance {
  id: string;
  name: string;
  type: EditorType;
  instanceDir: string;
  userDataDir: string;
  extensionsDir: string;
  workspaceFolder?: string;
  params: string[];
  createdAt: string;
  lastUsed: string;
  icon?: {
    title: string;
    svg: string;
  };
}

export interface MarketplaceExtension {
  identifier: {
    id: string;
  };
  name: string;
  displayName: string;
  description: string;
  publisher: string;
  version: string;
  preview?: boolean;
  icon?: string;
  stats?: {
    downloadCount: number;
    averageRating: number;
  };
} 