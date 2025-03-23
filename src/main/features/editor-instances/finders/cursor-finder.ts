import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

type Platform = 'win32' | 'darwin' | 'linux';

export class CursorFinder {
  private static getCommonPaths(): string[] {
    const platform = os.platform() as Platform;
    const commonPaths: Record<Platform, string[]> = {
      win32: [
        `${os.homedir()}\\AppData\\Local\\Programs\\cursor\\Cursor.exe`,
        'C:\\Program Files\\Cursor\\Cursor.exe',
        'C:\\Program Files (x86)\\Cursor\\Cursor.exe'
      ],
      darwin: [
        '/Applications/Cursor.app/Contents/MacOS/Cursor',
        `${os.homedir()}/Applications/Cursor.app/Contents/MacOS/Cursor`
      ],
      linux: [
        '/usr/bin/cursor',
        '/usr/local/bin/cursor',
        `${os.homedir()}/.local/bin/cursor`,
        '/opt/cursor/cursor'
      ]
    };

    return commonPaths[platform] || [];
  }

  private static async findWindowsCursor(): Promise<string | null> {
    try {
      // Chercher via where
      const { stdout: whereOutput } = await execAsync('where Cursor.exe');
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
        'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Cursor.exe" /ve'
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

  private static async findUnixCursor(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('which cursor');
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
      return this.findWindowsCursor();
    } else {
      return this.findUnixCursor();
    }
  }
} 