import { app } from 'electron';
import * as path from 'path';

export const APP_PATHS = {
  // Dossier principal des données utilisateur
  USER_DATA: app.getPath('userData'),
  
  // Dossier des instances d'éditeur
  // example: C:\Users\user\AppData\Roaming\editor-instances
  ROOT: path.join(app.getPath('userData')),
  
  // Fichier de configuration des instances
  // example: C:\Users\user\AppData\Roaming\editor-instances\instances.json
  INSTANCES_CONFIG: path.join(app.getPath('userData'), 'instances', 'instances.json'),
  
  // Dossier contenant les instances
  // example: C:\Users\user\AppData\Roaming\editor-instances\instances
  INSTANCES_DIR: path.join(app.getPath('userData'), 'instances')
}; 