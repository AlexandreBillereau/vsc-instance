import { app } from 'electron';
import * as path from 'path';

export const APP_PATHS = {
  // Dossier principal des données utilisateur
  USER_DATA: app.getPath('userData'),
  
  // Dossier des instances d'éditeur
  // example: C:\Users\user\AppData\Roaming\editor-instances
  EDITOR_INSTANCES: path.join(app.getPath('userData'), 'editor-instances'),
  
  // Fichier de configuration des instances
  // example: C:\Users\user\AppData\Roaming\editor-instances\instances.json
  INSTANCES_CONFIG: path.join(app.getPath('userData'), 'editor-instances', 'instances.json'),
  
  // Dossier contenant les instances
  // example: C:\Users\user\AppData\Roaming\editor-instances\instances
  INSTANCES_DIR: path.join(app.getPath('userData'), 'editor-instances', 'instances')
}; 