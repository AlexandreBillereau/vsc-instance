import * as fs from 'fs';
import * as path from 'path';

export const FileSystem = {
  /**
   * Crée un dossier de manière récursive
   */
  ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },

  /**
   * Lit un fichier JSON
   */
  readJsonFile<T>(filePath: string, defaultValue: T): T {
    try {
      if (!fs.existsSync(filePath)) {
        return defaultValue;
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Erreur lecture fichier JSON ${filePath}:`, error);
      return defaultValue;
    }
  },

  /**
   * Écrit un fichier JSON
   */
  writeJsonFile(filePath: string, data: any): void {
    try {
      const dirPath = path.dirname(filePath);
      this.ensureDir(dirPath);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Erreur écriture fichier JSON ${filePath}:`, error);
      throw error;
    }
  },

  /**
   * Supprime un dossier et son contenu
   */
  removeDir(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  },

  /**
   * Copie un dossier
   */
  copyDir(sourceDir: string, targetDir: string): void {
    if (fs.existsSync(sourceDir)) {
      fs.cpSync(sourceDir, targetDir, { recursive: true });
    }
  },

  /**
   * Lister les dossiers dans un dossier
   */
  listDirsIn(dirPath: string): string[] {
    return fs.readdirSync(dirPath);
  }
}; 