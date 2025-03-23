import { app } from 'electron';
import * as path from 'path';

export const APP_PATHS = {
  // Dossier principal des données utilisateur
  USER_DATA: app.getPath('userData'),
  
  // Dossier des instances d'éditeur
  EDITOR_INSTANCES: path.join(app.getPath('userData'), 'editor-instances'),
  
  // Fichier de configuration des instances
  INSTANCES_CONFIG: path.join(app.getPath('userData'), 'editor-instances', 'instances.json'),
  
  // Dossier contenant les instances
  INSTANCES_DIR: path.join(app.getPath('userData'), 'editor-instances', 'instances')
}; 