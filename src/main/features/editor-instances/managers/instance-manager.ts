import { spawn } from 'child_process';
import { EditorInstance, EditorInstanceConfig, EditorType, IPCResult } from '../types';
import { InstanceStorage } from '../storage/instance-storage';
import { VSCodeFinder } from '../finders/vscode-finder';
import { CursorFinder } from '../finders/cursor-finder';
import { CONST_NAMES } from '../../shared/constants/names';
import path from 'path';

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
  async createInstance(config: EditorInstanceConfig): Promise<IPCResult> {
    if (config.type === 'vscode' && !this.editorPaths.vscode) {
      return { success: false, message: 'VSCode is not installed or not found, so we cannot create an instance. Please install it and relaunch the app.' };
    }
    if (config.type === 'cursor' && !this.editorPaths.cursor) {
      return { success: false, message: 'Cursor is not installed or not found, so we cannot create an instance. Please install it and relaunch the app.' };
    }

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
    const instance = instanceId === CONST_NAMES.TEMPLATE_SPLUG ? this.storage.getTemplateInstance() : this.storage.listInstances().find(i => i.id === instanceId);

    if (!instance) {
        throw new Error(`Instance ${instanceId} non trouvée`);
    }

    const editorPath = this.editorPaths[instance.type];
    if (!editorPath) {
      throw new Error(`Éditeur ${instance.type} non trouvé`);
    }

    const args = ['--new-window'];

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

    //isolate the process from the parent process because the both are running with electron this app and the editors
    const cleanEnv = { ...process.env };
    delete cleanEnv.NODE_OPTIONS;
    delete cleanEnv.ELECTRON_RUN_AS_NODE

    const child = spawn(editorPath, args, {
      stdio: 'ignore',
      windowsHide: false,
      detached: true,
      env: cleanEnv
    });

    child.unref();

    // // Log pour debug
    // console.log('Lancement VS Code:', {
    //   pid: process.pid,
    //   path: editorPath,
    //   args: args
    // });

    // Mettre à jour la date de dernière utilisation
    instance.lastUsed = new Date().toISOString();
    this.storage.updateInstance(instance);

  }

  /**
   * Supprime une instance
   */
  deleteInstance(instanceId: string): IPCResult {
    return this.storage.deleteInstance(instanceId);
  }

  /**
   * Crée une instance de template
   */
  async createInstanceTemplate(): Promise<IPCResult> {

    if (!this.editorPaths.vscode) {
      return { success: false, message: 'VSCode is not installed or not found, so we cannot create an instance. Please install it and relaunch the app.' };
    }

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

  /**
   * Exporte une instance
   */
  async exportInstance(instanceId: string): Promise<void> {
    const instance = this.listInstances().find(i => i.id === instanceId);

    if (!instance) {
      throw new Error(`Instance ${instanceId} non trouvée`);
    }

    await this.storage.exportInstance(instance);
  }

  /**
   * Importe une instance
   */
  async importInstance(): Promise<EditorInstance | null> {
    return this.storage.importInstance();
  }

  /**
   * Met à jour la couleur d'une instance
   */
  updateInstanceColor(instanceId: string, color: string): Promise<void> {
    return this.storage.updateInstanceColor(instanceId, color);
  }
} 