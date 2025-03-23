import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

type Platform = 'win32' | 'darwin' | 'linux';

export class VSCodeFinder {
  private static getCommonPaths(): string[] {
    const platform = os.platform() as Platform;
    const commonPaths: Record<Platform, string[]> = {
      win32: [
        'C:\\Program Files\\Microsoft VS Code\\Code.exe',
        'C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe',
        `${os.homedir()}\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe`,
        'C:\\Program Files\\Microsoft VS Code Insiders\\Code - Insiders.exe',
        `${os.homedir()}\\AppData\\Local\\Programs\\Microsoft VS Code Insiders\\Code - Insiders.exe`
      ],
      darwin: [
        '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
        '/usr/local/bin/code',
        `${os.homedir()}/Library/Application Support/Code/bin/code`,
        '/opt/homebrew/bin/code',
        `${os.homedir()}/.local/bin/code`,
        '/usr/local/opt/visual-studio-code/bin/code'
      ],
      linux: [
        '/usr/bin/code',
        '/usr/local/bin/code',
        `${os.homedir()}/.local/bin/code`,
        '/snap/bin/code'
      ]
    };

    return commonPaths[platform] || [];
  }

  private static async findWindowsVSCode(): Promise<string | null> {
    try {
      // Chercher via where
      const { stdout: whereOutput } = await execAsync('where Code.exe');
      if (whereOutput) {
        const paths = whereOutput.split('\n').map(p => p.trim()).filter(Boolean);
        if (paths.length > 0) return paths[0];
      }
    } catch {
      // Continuer avec les autres méthodes si where échoue
    }

    try {
      // Chercher dans le registre
      const { stdout: regOutput } = await execAsync(
        'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Code.exe" /ve'
      );
      if (regOutput) {
        const match = regOutput.match(/REG_SZ\s+([^\n]+)/);
        if (match && match[1]) return match[1].trim();
      }
    } catch {
      // Continuer si la recherche dans le registre échoue
    }

    return null;
  }

  private static async findUnixVSCode(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('which code');
      return stdout.trim();
    } catch {
      return null;
    }
  }

  static async find(): Promise<string | null> {
    // 1. Vérifier les chemins communs d'abord
    const commonPaths = this.getCommonPaths();
    for (const path of commonPaths) {
      if (fs.existsSync(path)) {
        return path;
      }
    }

    // 2. Utiliser des méthodes spécifiques à la plateforme
    const platform = os.platform() as Platform;
    if (platform === 'win32') {
      return this.findWindowsVSCode();
    } else {
      return this.findUnixVSCode();
    }
  }
} 