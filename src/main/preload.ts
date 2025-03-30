// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { CONST_IPC_CHANNELS } from './features/shared/constants/names';

const channels = [
  CONST_IPC_CHANNELS.OPEN_EDITOR,
  CONST_IPC_CHANNELS.LIST_EDITOR_INSTANCES,
  CONST_IPC_CHANNELS.CREATE_EDITOR_INSTANCE,
  CONST_IPC_CHANNELS.OPEN_EDITOR_INSTANCE,
  CONST_IPC_CHANNELS.DELETE_EDITOR_INSTANCE,
  CONST_IPC_CHANNELS.GET_INSTANCE_EXTENSIONS,
  CONST_IPC_CHANNELS.OPEN_FOLDER,
  CONST_IPC_CHANNELS.CREATE_EDITOR_INSTANCE_TEMPLATE,
  CONST_IPC_CHANNELS.GET_TEMPLATE_INSTANCE,
  CONST_IPC_CHANNELS.SYNC_EXTENSIONS,
  CONST_IPC_CHANNELS.IMPORT_INSTANCE,
  CONST_IPC_CHANNELS.UPDATE_INSTANCE_COLOR,
  CONST_IPC_CHANNELS.EXPORT_INSTANCE
] as const;

type Channels = typeof channels[number];

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
