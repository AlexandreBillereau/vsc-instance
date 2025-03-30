import * as path from 'path';
import { APP_PATHS } from '../../shared/constants/paths';
import { FileSystem } from '../../shared/utils/file-system';
import { EditorInstance, EditorInstanceConfig } from '../types';
import { CONST_NAMES } from '../../shared/constants/names';
import * as fs from 'fs';
import archiver from 'archiver';
import { dialog } from 'electron';

interface InstancesData {
  instances: EditorInstance[];
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
  async createInstance(config: EditorInstanceConfig): Promise<EditorInstance> {
    const instances = this.listInstances();
    const instanceId = `instance-${Date.now()}`;
    
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

    return newInstance;
  }

  /**
   * Crée une instance de template
   */
  async createInstanceTemplate(): Promise<EditorInstance> {
    // Créer les dossiers pour cette instance
    const instanceDir = path.join(APP_PATHS.INSTANCE_TEMPLATE_DIR, CONST_NAMES.TEMPLATE_SPLUG);
    const userDataDir = path.join(instanceDir, 'user-data');
    const extensionsDir = path.join(instanceDir, 'extensions');
    
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

    return instance;
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
   */
  deleteInstance(instanceId: string): void {
    const instances = this.listInstances().filter(i => i.id !== instanceId);
    this.saveInstances(instances);

    // Supprimer les dossiers de l'instance
    const instancePath = path.join(APP_PATHS.INSTANCES_DIR, instanceId);
    FileSystem.removeDir(instancePath);
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
   * use archiver to get a zip file of the instance
   */
  async exportInstance(instance: EditorInstance): Promise<void> {
    // Demander à l'utilisateur où sauvegarder le fichier ZIP
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Instance',
      defaultPath: `${instance.name}-${instance.type}.zip`,
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
    });

    if (!filePath) return; // L'utilisateur a annulé

    // Créer le fichier ZIP
    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Compression maximale
    });

    // Gérer les événements du stream
    output.on('close', () => {
      console.log(`Archive créée: ${archive.pointer()} bytes total`);
    });

    archive.on('error', (err) => {
      throw err;
    });

    // Lier l'archive au stream de sortie
    archive.pipe(output);

    // Ajouter le dossier de l'instance au ZIP
    archive.directory(instance.instanceDir, false);

    // Finaliser l'archive
    await archive.finalize();
  }

  /**
 * Imports an instance from a ZIP file
 */
async importInstance(): Promise<EditorInstance | null> {
  // Demander à l'utilisateur de sélectionner le fichier ZIP
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title: 'Import Instance',
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    properties: ['openFile']
  });

  if (canceled || !filePaths || filePaths.length === 0) {
    return null; // L'utilisateur a annulé, on retourne null
  }

  const zipPath = filePaths[0];
  const instanceId = `instance-${Date.now()}`;
  const instanceDir = path.join(APP_PATHS.INSTANCES_DIR, instanceId);

  try {
    // Extraire le ZIP
    await new Promise<void>((resolve, reject) => {
      const extract = require('extract-zip');
      extract(zipPath, { dir: instanceDir })
        .then(() => resolve())
        .catch((err: Error) => reject(err));
    });

    // Lire le contenu du dossier extrait
    const files = fs.readdirSync(instanceDir);
    const extractedDir = path.join(instanceDir, files[0]); // Le dossier de l'instance est le premier élément

    // Créer la nouvelle instance
    const newInstance: EditorInstance = {
      id: instanceId,
      name: path.basename(zipPath, '.zip'), // Utiliser le nom du fichier ZIP comme nom d'instance
      type: 'vscode', // Par défaut, on met vscode
      instanceDir,
      userDataDir: path.join(instanceDir, 'user-data'),
      extensionsDir: path.join(instanceDir, 'extensions'),
      workspaceFolder: undefined,
      params: [],
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      icon: undefined
    };

    // Ajouter l'instance à la liste
    const instances = this.listInstances();
    instances.push(newInstance);
    this.saveInstances(instances);

    return newInstance;
  } catch (error) {
    // En cas d'erreur, on nettoie le dossier créé
    if (fs.existsSync(instanceDir)) {
      FileSystem.removeDir(instanceDir);
    }
    throw error;
  }
}

} 