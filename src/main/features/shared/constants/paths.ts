import { app } from 'electron';
import * as path from 'path';
import { Template } from 'webpack';

export const APP_PATHS = {
  // Dossier principal des données utilisateur
  USER_DATA: app.getPath('userData'),
  
  // Dossier des instances d'éditeur
  ROOT: path.join(app.getPath('userData')),
  
  // Fichier de configuration des instances
  INSTANCES_CONFIG: path.join(app.getPath('userData'), 'instances', 'instances.json'),

  //template 
  INSTANCE_TEMPLATE_CONFIG: path.join(app.getPath('userData'), 'instances', 'template', 'instance.json'),
  
  // Dossier contenant les instances
  INSTANCES_DIR: path.join(app.getPath('userData'), 'instances'),

  // Dossuer contenant le intsntance template
  INSTANCE_TEMPLATE_DIR: path.join(app.getPath('userData'), 'instances', 'template'),

}; 