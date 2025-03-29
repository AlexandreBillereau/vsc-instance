import { spawn } from 'child_process';
import { EditorInstance, EditorInstanceConfig, EditorType } from '../types';
import { InstanceStorage } from '../storage/instance-storage';
import { VSCodeFinder } from '../finders/vscode-finder';
import { CursorFinder } from '../finders/cursor-finder';
import { CONST_NAMES } from '../../shared/constants/names';

export class InstanceManager {
  private storage: InstanceStorage;
  private editorPaths: Record<EditorType, string | null>;

  constructor() {
    this.storage = new InstanceStorage();
    this.editorPaths = {
      vscode: null,
      cursor: null
    };
  }

  /**
   * Initialise le manager en cherchant les éditeurs
   */
  async initialize(): Promise<void> {
    // Chercher les éditeurs en parallèle
    const [vscodePath, cursorPath] = await Promise.all([
      VSCodeFinder.find(),
      CursorFinder.find()
    ]);

    this.editorPaths.vscode = vscodePath;
    this.editorPaths.cursor = cursorPath;
  }

  /**
   * Crée une nouvelle instance
   */
  async createInstance(config: EditorInstanceConfig): Promise<EditorInstance> {
    return this.storage.createInstance(config);
  }

  /**
   * Liste toutes les instances
   */
  listInstances(): EditorInstance[] {
    return this.storage.listInstances();
  }

  /**
   * Ouvre une instance spécifique
   */
  async openInstance(instanceId: string): Promise<void> {
    console.log(instanceId);
    const instance = instanceId === CONST_NAMES.TEMPLATE_SPLUG ? this.storage.getTemplateInstance() : this.storage.listInstances().find(i => i.id === instanceId);

    if (!instance) {
        throw new Error(`Instance ${instanceId} non trouvée`);
    }

    const editorPath = this.editorPaths[instance.type];
    if (!editorPath) {
      throw new Error(`Éditeur ${instance.type} non trouvé`);
    }

    // Construire les arguments
    const args = ['--new-window'];
    
    // Ajouter les dossiers de configuration
    args.push(`--user-data-dir=${instance.userDataDir}`);
    args.push(`--extensions-dir=${instance.extensionsDir}`);

    // Ajouter le dossier de travail si spécifié
    if (instance.workspaceFolder) {
      args.push(instance.workspaceFolder);
    }

    // Ajouter les paramètres supplémentaires
    if (instance.params && instance.params.length > 0) {
      args.push(...instance.params);
    }

    // Lancer l'éditeur
    const process = spawn(editorPath, args, {
      stdio: 'ignore',
      windowsHide: false, //ne pas mettre a true, sinon y aura un proc invisible qui tourne
      detached: true
    });

    process.unref();

    // Log pour debug
    console.log('Lancement VS Code:', {
      pid: process.pid,
      path: editorPath,
      args: args
    });

    // Mettre à jour la date de dernière utilisation
    instance.lastUsed = new Date().toISOString();
    this.storage.updateInstance(instance);

  }

  /**
   * Supprime une instance
   */
  deleteInstance(instanceId: string): void {
    this.storage.deleteInstance(instanceId);
  }

  /**
   * Crée une instance de template
   */
  createInstanceTemplate(): Promise<EditorInstance> {
    return this.storage.createInstanceTemplate();
  }

  /**
   * Récupère l'instance de template
   */
  getTemplateInstance(): EditorInstance {
    return this.storage.getTemplateInstance();
  }

  /**
   * Synchronise les extensions d'une instance
   */
  syncExtensions(instanceId: string): Promise<boolean> {
    return this.storage.syncExtensions(instanceId);
  }
} 