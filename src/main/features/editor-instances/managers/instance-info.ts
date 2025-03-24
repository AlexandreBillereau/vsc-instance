import * as fs from 'fs';
import * as path from 'path';

interface ExtensionMetadata {
  installedTimestamp: number;
  pinned: boolean;
  source: string;
  id: string;
  publisherId: string;
  publisherDisplayName: string;
  targetPlatform: string;
  updated: boolean;
  isPreReleaseVersion: boolean;
  hasPreReleaseVersion: boolean;
}

interface ExtensionLocation {
  $mid: number;
  fsPath?: string;
  external?: string;
  path: string;
  scheme: string;
}

interface Extension {
  identifier: {
    id: string;
    uuid?: string;
  };
  version: string;
  name?: string;
  publisher?: string;
  displayName?: string;
  description?: string;
  location: ExtensionLocation;
  relativeLocation: string;
  metadata: ExtensionMetadata;
  icon?: string; // Base64 encoded icon
}

export class InstanceInfo {
  constructor(private extensionsDir: string) {}

  private async getExtensionIcon(extensionPath: string, packageJson: any): Promise<string | undefined> {
    try {
      // Chercher l'icône dans le package.json
      const iconPath = packageJson.icon;
      if (!iconPath) return undefined;

      const fullIconPath = path.join(extensionPath, iconPath);
      if (!fs.existsSync(fullIconPath)) return undefined;

      // Lire l'icône et la convertir en base64
      const iconBuffer = await fs.promises.readFile(fullIconPath);
      const ext = path.extname(fullIconPath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 'image/svg+xml';
      return `data:${mimeType};base64,${iconBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Error reading extension icon:', error);
      return undefined;
    }
  }

  async getInstalledExtensions(): Promise<Extension[]> {
    try {
      const extensionsFile = path.join(this.extensionsDir, 'extensions.json');
      
      if (!fs.existsSync(extensionsFile)) {
        console.log(`extensionsFile not found ${this}`);
        return [];
      }

      const content = await fs.promises.readFile(extensionsFile, 'utf-8');
      const extensions = JSON.parse(content);
      
      // Le fichier est déjà un tableau d'extensions
      return extensions.map((ext: Extension) => ({
        ...ext,
        // Extraire le nom et l'éditeur de l'ID de l'extension
        name: ext.identifier.id.split('.').pop(),
        publisher: ext.identifier.id.split('.')[0],
        displayName: ext.identifier.id.split('.').pop()
      }));
    } catch (error) {
      console.error('Error reading extensions:', error);
      return [];
    }
  }

  async getExtensionDetails(extension: Extension): Promise<Extension> {
    try {
      const extensionPath = extension.location.fsPath || 
        path.join(this.extensionsDir, extension.relativeLocation);
      
      const packagePath = path.join(extensionPath, 'package.json');
      
      if (!fs.existsSync(packagePath)) {
        return extension;
      }

      const content = await fs.promises.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);

      // Récupérer l'icône
      const icon = await this.getExtensionIcon(extensionPath, packageJson);

      return {
        ...extension,
        displayName: packageJson.displayName || packageJson.name || extension.displayName,
        description: packageJson.description,
        icon
      };
    } catch (error) {
      console.error('Error reading extension details:', error);
      return extension;
    }
  }
}