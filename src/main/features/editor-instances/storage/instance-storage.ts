import * as path from 'path';
import { APP_PATHS } from '../../shared/constants/paths';
import { FileSystem } from '../../shared/utils/file-system';
import { EditorInstance, EditorInstanceConfig, IPCResult } from '../types';
import { CONST_NAMES } from '../../shared/constants/names';
import * as fs from 'fs';
import archiver from 'archiver';
import { dialog } from 'electron';

interface InstancesData {
  instances: EditorInstance[];
}

interface InstanceMetadata {
  name: string;
  type: 'vscode' | 'cursor';
  icon?: {
    title: string;
    svg: string;
  };
  createdAt: string;
}

interface VSCodeSettings {
  "workbench.colorCustomizations"?: {
    "titleBar.activeBackground"?: string;
    "titleBar.activeForeground"?: string;
    "titleBar.inactiveBackground"?: string;
    "titleBar.inactiveForeground"?: string;
    [key: string]: string | undefined;
  };
  [key: string]: any;
}

export class InstanceStorage {
  private static readonly DEFAULT_DATA: InstancesData = { instances: [] };
  private static readonly DEFAULT_TEMPLATE_DATA: EditorInstance;

  constructor() {
    // Initialiser le stockage
    FileSystem.ensureDir(APP_PATHS.ROOT);
    FileSystem.ensureDir(APP_PATHS.INSTANCES_DIR);
    
    // Créer le fichier de configuration s'il n'existe pas
    if (!FileSystem.readJsonFile<InstancesData>(APP_PATHS.INSTANCES_CONFIG, InstanceStorage.DEFAULT_DATA)) {
      FileSystem.writeJsonFile(APP_PATHS.INSTANCES_CONFIG, InstanceStorage.DEFAULT_DATA);
    }
  }

  /**
   * Crée une nouvelle instance
   */
  async createInstance(config: EditorInstanceConfig): Promise<IPCResult> {
    const instances = this.listInstances();
    const instanceId = `instance-${Date.now()}`;
    try{
      // Créer les dossiers pour cette instance
      const instanceDir = path.join(APP_PATHS.INSTANCES_DIR, instanceId);
      const userDataDir = path.join(instanceDir, 'user-data');
      const extensionsDir = path.join(instanceDir, 'extensions');
      
      if (config.useTemplate) {
        const templateInstance = this.getTemplateInstance();
        FileSystem.copyDir(templateInstance.userDataDir, userDataDir);
        FileSystem.copyDir(templateInstance.extensionsDir, extensionsDir);
      } else {
        FileSystem.ensureDir(userDataDir);
        FileSystem.ensureDir(extensionsDir);
      }

      const newInstance: EditorInstance = {
        id: instanceId,
        name: config.name,
        type: config.type,
        instanceDir,
        userDataDir,
        extensionsDir,
        workspaceFolder: config.workspaceFolder,
        params: config.params || [],
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        icon: config.icon
      };

      instances.push(newInstance);
      this.saveInstances(instances);

      return { success: true, message: 'Instance created', data: newInstance };
    } catch (error) {
      //reverse and remove the instance if it was created
      this.deleteInstance(instanceId);
      return { success: false, message: 'Error creating instance ' + error };
    }
  }

  /**
   * Crée une instance de template
   */
  async createInstanceTemplate(): Promise<IPCResult> {
    // Créer les dossiers pour cette instance
    const instanceDir = path.join(APP_PATHS.INSTANCE_TEMPLATE_DIR, CONST_NAMES.TEMPLATE_SPLUG);
    const userDataDir = path.join(instanceDir, 'user-data');
    const extensionsDir = path.join(instanceDir, 'extensions');

    try {
      //on s'assure que les dossiers existent sinon on les crée
      FileSystem.ensureDir(userDataDir);
      FileSystem.ensureDir(extensionsDir);

    //on crée l'instance
    const instance: EditorInstance = {
      id: CONST_NAMES.TEMPLATE_SPLUG,
      name: 'Template',
      type: 'vscode',
      instanceDir,
      userDataDir,
      extensionsDir,
      workspaceFolder: undefined,
      params: [],
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      icon: undefined
    };

    this.saveTemplateInstance(instance);

      return { success: true, message: 'Instance template created', data: instance };
    } catch (error) {
      //reverse and remove the instance if it was created
      this.deleteInstance(CONST_NAMES.TEMPLATE_SPLUG);
      return { success: false, message: 'Error creating instance template' };
    }
  }

  /**
   * Liste toutes les instances
   */
  listInstances(): EditorInstance[] {
    const data = FileSystem.readJsonFile<InstancesData>(
      APP_PATHS.INSTANCES_CONFIG,
      InstanceStorage.DEFAULT_DATA
    );
    return data.instances;
  }

  /**
   * Met à jour une instance
   */
  updateInstance(instance: EditorInstance): void {
    const instances = this.listInstances();
    const index = instances.findIndex(i => i.id === instance.id);
    
    if (index !== -1) {
      instances[index] = instance;
      this.saveInstances(instances);
    }
  }

  /**
   * Supprime une instance
   * @returns {IPCResult} Résultat de l'opération
   */
  deleteInstance(instanceId: string): IPCResult {
    try {
      const instances = this.listInstances().filter(i => i.id !== instanceId);
      
      // Supprimer les dossiers de l'instance
      const instancePath = path.join(APP_PATHS.INSTANCES_DIR, instanceId);
      FileSystem.removeDir(instancePath);
      // On ne sauvegarde la nouvelle liste que si la suppression a réussi
      this.saveInstances(instances);

      return { success: true };
    } catch (error: any) {
      if (error.code === 'EBUSY') {
        return {
          success: false,
          message: 'VSCode window must be closed first'
        };
      }
      return {
        success: false,
        message: 'Failed to delete instance'
      };
    }
  }

  /**
   * Sauvegarde la liste des instances
   */
  private saveInstances(instances: EditorInstance[]): void {
    FileSystem.writeJsonFile(APP_PATHS.INSTANCES_CONFIG, { instances });
  }

  private saveTemplateInstance(instance: EditorInstance): void {
    FileSystem.writeJsonFile(APP_PATHS.INSTANCE_TEMPLATE_CONFIG, instance);
  }

  getTemplateInstance(): EditorInstance {
    return FileSystem.readJsonFile<EditorInstance>(APP_PATHS.INSTANCE_TEMPLATE_CONFIG, InstanceStorage.DEFAULT_TEMPLATE_DATA);
  }


  /**
   * Synchronise les extensions d'une instance avec le template core 
   * 
   */
  async syncExtensions(instanceId: string): Promise<boolean> {
    const instance = this.listInstances().find(i => i.id === instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} non trouvée`);
    }

    const templateInstance = this.getTemplateInstance();

    // Lire les extensions du template et de l'instance
    const templateExtensionsFile = path.join(templateInstance.extensionsDir, 'extensions.json');
    const instanceExtensionsFile = path.join(instance.extensionsDir, 'extensions.json');

    const templateExtensions = fs.existsSync(templateExtensionsFile) 
      ? FileSystem.readJsonFile<any[]>(templateExtensionsFile, [])
      : [];

    const instanceExtensions = fs.existsSync(instanceExtensionsFile)
      ? FileSystem.readJsonFile<any[]>(instanceExtensionsFile, [])
      : [];

    // Créer un Map des extensions du template pour faciliter la recherche
    const templateExtMap = new Map(
      templateExtensions.map(ext => [ext.identifier.id, ext])
    );

    // Créer un Map des extensions de l'instance pour faciliter la recherche
    const instanceExtMap = new Map(
      instanceExtensions.map(ext => [ext.identifier.id, ext])
    );

    // Préparer le tableau final des extensions
    const finalExtensions = [];

    // 1. Copier les dossiers d'extensions du template qui ne sont pas dans l'instance
    for (const [extId, templateExt] of templateExtMap) {
      const templateExtDir = path.join(templateInstance.extensionsDir, templateExt.relativeLocation);
      const instanceExtDir = path.join(instance.extensionsDir, templateExt.relativeLocation);

      // Si l'extension n'existe pas dans l'instance, on la copie
      if (!fs.existsSync(instanceExtDir)) {
        FileSystem.copyDir(templateExtDir, instanceExtDir);
      }

      finalExtensions.push({
        ...templateExt,
        location: {
          ...templateExt.location,
          fsPath: instanceExtDir
        }
      });
    }

    // 2. Ajouter les extensions spécifiques à l'instance qui ne sont pas dans le template
    for (const [extId, instanceExt] of instanceExtMap) {
      if (!templateExtMap.has(extId)) {
        finalExtensions.push({
          ...instanceExt,
          location: {
            ...instanceExt.location,
            fsPath: path.join(instance.extensionsDir, instanceExt.relativeLocation)
          }
        });
      }
    }

    // Écrire le fichier extensions.json mis à jour dans l'instance
    FileSystem.writeJsonFile(instanceExtensionsFile, finalExtensions);

    return true;
  }

  /**
   * Exporte une instance
   * logique : 
   * 1. Créer un dossier temporaire
   * 2. Copier le dossier de l'instance dans le dossier temporaire
   * 3. Créer un fichier zip du dossier temporaire
   * 4. Supprimer le dossier temporaire
   * 5. Retourner le chemin du fichier zip
   */
  async exportInstance(instance: EditorInstance): Promise<void> {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Instance',
      defaultPath: `${instance.name}-${instance.type}.zip`,
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
    });

    if (!filePath) return;

    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => {
      console.log(`Archive créée: ${archive.pointer()} bytes total`);
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    // Créer le fichier metadata.json
    const metadata: InstanceMetadata = {
      name: instance.name,
      type: instance.type,
      icon: instance.icon,
      createdAt: instance.createdAt
    };

    // Ajouter le fichier metadata.json
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

    // Ajouter le dossier de l'instance
    archive.directory(instance.instanceDir, 'instance');

    await archive.finalize();
  }

  /**
   * Importe une instance depuis un fichier ZIP
   * logique : 
   * 1. Ouvrir la boite de dialogue pour ouvrir le fichier ZIP
   * 2. Extraire le contenu du fichier ZIP dans un dossier temporaire
   * 3. Créer une nouvelle instance avec les metadata
   * 4. Ajouter l'instance à la liste
   * 5. Retourner l'instance
   */
  async importInstance(): Promise<EditorInstance | null> {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Import Instance',
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      properties: ['openFile']
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return null;
    }

    const zipPath = filePaths[0];
    const instanceId = `instance-${Date.now()}`;
    const instanceDir = path.join(APP_PATHS.INSTANCES_DIR, instanceId);
    const tempDir = path.join(APP_PATHS.INSTANCES_DIR, `temp-${instanceId}`);

    try {
      // Extraire d'abord dans un dossier temporaire
      await new Promise<void>((resolve, reject) => {
        const extract = require('extract-zip');
        extract(zipPath, { dir: tempDir })
          .then(() => resolve())
          .catch((err: Error) => reject(err));
      });

      // Lire le fichier metadata.json
      const metadataPath = path.join(tempDir, 'metadata.json');
      let metadata: InstanceMetadata;
      
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      } else {
        // Fallback si pas de metadata
        metadata = {
          name: path.basename(zipPath, '.zip'),
          type: 'vscode',
          createdAt: new Date().toISOString()
        };
      }

      // Déplacer le dossier instance vers son emplacement final
      const instanceSourceDir = path.join(tempDir, 'instance');
      fs.renameSync(instanceSourceDir, instanceDir);

      // Créer la nouvelle instance avec les metadata
      const newInstance: EditorInstance = {
        id: instanceId,
        name: metadata.name,
        type: metadata.type,
        instanceDir,
        userDataDir: path.join(instanceDir, 'user-data'),
        extensionsDir: path.join(instanceDir, 'extensions'),
        workspaceFolder: undefined,
        params: [],
        createdAt: metadata.createdAt,
        lastUsed: new Date().toISOString(),
        icon: metadata.icon
      };

      // Ajouter l'instance à la liste
      const instances = this.listInstances();
      instances.push(newInstance);
      this.saveInstances(instances);

      return newInstance;
    } catch (error) {
      // Nettoyer en cas d'erreur
      if (fs.existsSync(instanceDir)) {
        FileSystem.removeDir(instanceDir);
      }
      if (fs.existsSync(tempDir)) {
        FileSystem.removeDir(tempDir);
      }
      throw error;
    } finally {
      // Toujours nettoyer le dossier temporaire
      if (fs.existsSync(tempDir)) {
        FileSystem.removeDir(tempDir);
      }
    }
  }

  /**
   * Met à jour la couleur de la barre de titre VSCode
   */
  async updateInstanceColor(instanceId: string, color: string): Promise<void> {
    const instance = this.listInstances().find(i => i.id === instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} non trouvée`);
    }

    // Mettre à jour le fichier settings.json de VSCode
    const settingsPath = path.join(instance.userDataDir, 'User', 'settings.json');
    let settings: VSCodeSettings = {};
    
    // Créer le dossier User s'il n'existe pas
    FileSystem.ensureDir(path.dirname(settingsPath));

    // Lire les paramètres existants s'ils existent
    if (fs.existsSync(settingsPath)) {
      settings = FileSystem.readJsonFile<VSCodeSettings>(settingsPath, {});
    }

    // Mettre à jour les paramètres de couleur
    const updatedSettings: VSCodeSettings = {
      ...settings,
      "workbench.colorCustomizations": {
        ...(settings["workbench.colorCustomizations"] || {}),
        "titleBar.activeBackground": color,
        "titleBar.activeForeground": this.getContrastColor(color),
        "titleBar.inactiveBackground": this.adjustColorBrightness(color, -20),
        "titleBar.inactiveForeground": this.adjustColorBrightness(this.getContrastColor(color), -20)
      }
    };

    // Sauvegarder les paramètres
    FileSystem.writeJsonFile(settingsPath, updatedSettings);

    // Mettre à jour l'instance
    instance.color = color;
    this.updateInstance(instance);
  }

  /**
   * Calcule la couleur de contraste (noir ou blanc) pour une couleur donnée
   */
  private getContrastColor(hexColor: string): string {
    // Convertir la couleur hex en RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculer la luminosité
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retourner blanc ou noir selon la luminosité
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  /**
   * Ajuste la luminosité d'une couleur
   */
  private adjustColorBrightness(hexColor: string, percent: number): string {
    const num = parseInt(hexColor.slice(1), 16);
    const r = (num >> 16) + percent;
    const g = ((num >> 8) & 0x00FF) + percent;
    const b = (num & 0x0000FF) + percent;

    const newR = Math.min(255, Math.max(0, r));
    const newG = Math.min(255, Math.max(0, g));
    const newB = Math.min(255, Math.max(0, b));

    return `#${(newR << 16 | newG << 8 | newB).toString(16).padStart(6, '0')}`;
  }

} 