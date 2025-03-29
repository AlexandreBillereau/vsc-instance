import * as path from 'path';
import { APP_PATHS } from '../../shared/constants/paths';
import { FileSystem } from '../../shared/utils/file-system';
import { EditorInstance, EditorInstanceConfig } from '../types';

interface InstancesData {
  instances: EditorInstance[];
}

export class InstanceStorage {
  private static readonly DEFAULT_DATA: InstancesData = { instances: [] };

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
    
    FileSystem.ensureDir(userDataDir);
    FileSystem.ensureDir(extensionsDir);

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
} 