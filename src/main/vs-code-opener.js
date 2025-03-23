// vscodeOpener.js
import { shell } from 'electron';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

class EditorFinder {
  static async findWindowsVSCode() {
    const commonPaths = [
      'C:\\Program Files\\Microsoft VS Code\\Code.exe',
      'C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe',
      `${os.homedir()}\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe`,
      'C:\\Program Files\\Microsoft VS Code Insiders\\Code - Insiders.exe',
      `${os.homedir()}\\AppData\\Local\\Programs\\Microsoft VS Code Insiders\\Code - Insiders.exe`,
      'C:\\Program Files\\VSCodium\\VSCodium.exe',
      `${os.homedir()}\\AppData\\Local\\Programs\\VSCodium\\VSCodium.exe`
    ];

    // Vérifier d'abord les chemins communs
    for (const path of commonPaths) {
      if (fs.existsSync(path)) return path;
    }

    try {
      // Chercher via where
      const whereResult = await new Promise((resolve) => {
        exec('where Code.exe', (error, stdout) => {
          if (!error && stdout) {
            const paths = stdout.split('\n').map(p => p.trim()).filter(Boolean);
            resolve(paths[0]);
          }
          resolve(null);
        });
      });
      if (whereResult) return whereResult;

      // Chercher dans le registre
      const regResult = await new Promise((resolve) => {
        exec('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Code.exe" /ve', (error, stdout) => {
          if (!error && stdout) {
            const match = stdout.match(/REG_SZ\s+([^\n]+)/);
            if (match && match[1]) resolve(match[1].trim());
          }
          resolve(null);
        });
      });
      if (regResult) return regResult;
    } catch (e) {
      console.log('Erreur recherche VS Code Windows:', e);
    }
    return null;
  }

  static async findWindowsCursor() {
    const commonPaths = [
      `${os.homedir()}\\AppData\\Local\\Programs\\cursor\\Cursor.exe`,
      'C:\\Program Files\\Cursor\\Cursor.exe',
      'C:\\Program Files (x86)\\Cursor\\Cursor.exe'
    ];

    // Vérifier d'abord les chemins communs
    for (const path of commonPaths) {
      if (fs.existsSync(path)) return path;
    }

    try {
      // Chercher via where
      const whereResult = await new Promise((resolve) => {
        exec('where Cursor.exe', (error, stdout) => {
          if (!error && stdout) {
            const paths = stdout.split('\n').map(p => p.trim()).filter(Boolean);
            resolve(paths[0]);
          }
          resolve(null);
        });
      });
      if (whereResult) return whereResult;

      // Chercher dans le registre
      const regResult = await new Promise((resolve) => {
        exec('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Cursor.exe" /ve', (error, stdout) => {
          if (!error && stdout) {
            const match = stdout.match(/REG_SZ\s+([^\n]+)/);
            if (match && match[1]) resolve(match[1].trim());
          }
          resolve(null);
        });
      });
      if (regResult) return regResult;
    } catch (e) {
      console.log('Erreur recherche Cursor Windows:', e);
    }
    return null;
  }

  static async findMacVSCode() {
    const commonPaths = [
      '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
      '/usr/local/bin/code',
      '/opt/homebrew/bin/code',
      `${os.homedir()}/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code`
    ];

    // Vérifier les chemins communs
    for (const path of commonPaths) {
      if (fs.existsSync(path)) return path;
    }

    try {
      // Utiliser which comme fallback
      return new Promise((resolve) => {
        exec('which code', (error, stdout) => {
          resolve(error ? null : stdout.trim());
        });
      });
    } catch (e) {
      console.log('Erreur recherche VS Code Mac:', e);
    }
    return null;
  }

  static async findMacCursor() {
    const commonPaths = [
      '/Applications/Cursor.app/Contents/MacOS/Cursor',
      `${os.homedir()}/Applications/Cursor.app/Contents/MacOS/Cursor`
    ];

    // Vérifier les chemins communs
    for (const path of commonPaths) {
      if (fs.existsSync(path)) return path;
    }

    try {
      // Utiliser which comme fallback
      return new Promise((resolve) => {
        exec('which cursor', (error, stdout) => {
          resolve(error ? null : stdout.trim());
        });
      });
    } catch (e) {
      console.log('Erreur recherche Cursor Mac:', e);
    }
    return null;
  }

  static async findLinuxVSCode() {
    const commonPaths = [
      '/usr/bin/code',
      '/usr/local/bin/code',
      `${os.homedir()}/.local/bin/code`,
      '/snap/bin/code',
      '/usr/bin/codium',
      '/usr/local/bin/codium'
    ];

    // Vérifier les chemins communs
    for (const path of commonPaths) {
      if (fs.existsSync(path)) return path;
    }

    try {
      // Essayer which pour code et codium
      return new Promise((resolve) => {
        exec('which code', (error, stdout) => {
          if (!error && stdout) {
            resolve(stdout.trim());
          } else {
            exec('which codium', (error2, stdout2) => {
              resolve(error2 ? null : stdout2.trim());
            });
          }
        });
      });
    } catch (e) {
      console.log('Erreur recherche VS Code Linux:', e);
    }
    return null;
  }

  static async findLinuxCursor() {
    const commonPaths = [
      '/usr/bin/cursor',
      '/usr/local/bin/cursor',
      `${os.homedir()}/.local/bin/cursor`,
      '/opt/cursor/cursor'
    ];

    // Vérifier les chemins communs
    for (const path of commonPaths) {
      if (fs.existsSync(path)) return path;
    }

    try {
      // Utiliser which comme fallback
      return new Promise((resolve) => {
        exec('which cursor', (error, stdout) => {
          resolve(error ? null : stdout.trim());
        });
      });
    } catch (e) {
      console.log('Erreur recherche Cursor Linux:', e);
    }
    return null;
  }
}

const VSCodeOpener = {
  /**
   * Crée une nouvelle instance du constructeur d'ouverture VS Code
   * @returns {EditorInstance}
   */
  create() {
    return new EditorInstance();
  }
};

class EditorInstance {
  constructor() {
    this._filePath = '';
    this._lineNumber = null;
    this._columnNumber = null;
    this._instanceName = '';
    this._params = [];
    this._vscodePath = null;
  }

  /**
   * Définit le chemin du fichier ou du dossier à ouvrir
   * @param {string} filePath - Chemin du fichier ou dossier
   * @returns {EditorInstance}
   */
  path(filePath) {
    this._filePath = filePath;
    return this;
  }

  /**
   * Définit le numéro de ligne à ouvrir
   * @param {number} line - Numéro de ligne
   * @returns {EditorInstance}
   */
  line(line) {
    this._lineNumber = line;
    return this;
  }

  /**
   * Définit le numéro de colonne à ouvrir
   * @param {number} column - Numéro de colonne
   * @returns {EditorInstance}
   */
  column(column) {
    this._columnNumber = column;
    return this;
  }

  /**
   * Définit le nom de l'instance (pour user-data-dir et extensions-dir)
   * @param {string} name - Nom de l'instance
   * @returns {EditorInstance}
   */
  instance(name) {
    this._instanceName = name;
    return this;
  }

  /**
   * Ajoute des paramètres supplémentaires à l'URL VS Code
   * @param {Array<string>} params - Liste des paramètres
   * @returns {EditorInstance}
   */
  params(params) {
    this._params = Array.isArray(params) ? params : [params];
    return this;
  }

  /**
   * Ouvre VS Code avec les paramètres configurés
   * @returns {Promise<void>}
   */
  async open() {
    try {
      this._vscodePath = await EditorFinder.findWindowsVSCode();

      if (this._vscodePath) {
        const args = ['--new-window'];
        if (this._filePath) args.push(this._filePath);
        if (this._params.length > 0) args.push(...this._params);

        // Sur Windows, utiliser directement l'exécutable
        const command = `"${this._vscodePath}" ${args.join(' ')}`;
        
        console.log('commande : ', command);
        
        return new Promise((resolve, reject) => {
          // Utiliser spawn au lieu de exec pour une meilleure gestion des processus
          const { spawn } = require('child_process');
          const process = spawn(this._vscodePath, args, {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
          });
          
          process.unref();
          resolve();
        });
      } else {
        return this._openWithProtocol();
      }
    } catch (error) {
      return this._openWithProtocol();
    }
  }

  _openWithProtocol() {
    return new Promise((resolve, reject) => {
      try {
        let vsCodeUrl = 'vscode://';
        if (this._filePath) {
          vsCodeUrl += "file/" + encodeURIComponent(this._filePath);
        }
        
        const timestamp = Date.now();
        const urlParams = [`t=${timestamp}`];
        
        if (this._params.length > 0) {
          urlParams.push(...this._params.map(p => encodeURIComponent(p)));
        }
        
        if (urlParams.length > 0) {
          vsCodeUrl += '?' + urlParams.join('&');
        }
        
        shell.openExternal(vsCodeUrl).then(resolve).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default VSCodeOpener;