// vscodeOpener.js
import { shell } from 'electron';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

class VSCodePathFinder {
  static async findVSCodePath() {
    const platform = os.platform();
    
    const commonPaths = {
      win32: [
        'C:\\Program Files\\Microsoft VS Code\\Code.exe',
        'C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe',
        `${os.homedir()}\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe`,
        `${os.homedir()}\\AppData\\Local\\Microsoft VS Code\\Code.exe`
      ],
      darwin: [
        '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
        '/usr/local/bin/code'
      ],
      linux: [
        '/usr/bin/code',
        '/usr/local/bin/code',
        `${os.homedir()}/.local/bin/code`
      ]
    };

    const paths = commonPaths[platform] || [];
    
    for (const path of paths) {
      if (fs.existsSync(path)) {
        return path;
      }
    }

    if (platform === 'win32') {
      try {
        return new Promise((resolve, reject) => {
          exec('where code.cmd', (error, stdout) => {
            if (!error && stdout) {
              const paths = stdout.split('\n').map(p => p.trim()).filter(Boolean);
              if (paths.length > 0) {
                resolve(paths[0]);
                return;
              }
            }

            exec('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\code.exe" /ve', (error, stdout) => {
              if (!error && stdout) {
                const match = stdout.match(/REG_SZ\s+([^\n]+)/);
                if (match && match[1]) {
                  resolve(match[1].trim());
                  return;
                }
              }

              const programFiles = [
                process.env['ProgramFiles'],
                process.env['ProgramFiles(x86)'],
                process.env['LOCALAPPDATA']
              ].filter(Boolean);

              for (const dir of programFiles) {
                const possiblePath = path.join(dir, 'Microsoft VS Code', 'bin', 'code.cmd');
                if (fs.existsSync(possiblePath)) {
                  resolve(possiblePath);
                  return;
                }
              }

              reject(new Error('VS Code not found'));
            });
          });
        });
      } catch (e) {
        console.log('Erreur lors de la recherche de VS Code sur Windows:', e);
      }
    } else {
      try {
        return new Promise((resolve, reject) => {
          exec('which code', (error, stdout) => {
            if (error) reject(error);
            resolve(stdout.trim());
          });
        });
      } catch (e) {
        console.log('VS Code non trouvé via which');
      }
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
      this._vscodePath = await VSCodePathFinder.findVSCodePath();

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