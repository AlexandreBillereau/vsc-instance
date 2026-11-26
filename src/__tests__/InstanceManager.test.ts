/**
 * @jest-environment node
 */
import { spawn } from 'child_process';
import { InstanceManager } from '../main/features/editor-instances/managers/instance-manager';
import { InstanceStorage } from '../main/features/editor-instances/storage/instance-storage';
import { VSCodeFinder } from '../main/features/editor-instances/finders/vscode-finder';
import { CursorFinder } from '../main/features/editor-instances/finders/cursor-finder';

jest.mock('electron', () => ({ app: { getPath: () => '/tmp/vsc-instance-test' } }));
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn(() => ({ unref: jest.fn() })),
}));
jest.mock('../main/features/editor-instances/storage/instance-storage');
jest.mock('../main/features/editor-instances/finders/vscode-finder');
jest.mock('../main/features/editor-instances/finders/cursor-finder');

const instance = {
  id: 'js',
  name: 'Javascript',
  type: 'vscode',
  userDataDir: '/data/js/user',
  extensionsDir: '/data/js/extensions',
  workspaceFolder: '/projects/app',
  params: ['--disable-gpu'],
};

describe('InstanceManager', () => {
  let storage: jest.Mocked<InstanceStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    (VSCodeFinder.find as jest.Mock).mockResolvedValue('/usr/bin/code');
    (CursorFinder.find as jest.Mock).mockResolvedValue(null);
  });

  async function createManager(): Promise<InstanceManager> {
    const manager = new InstanceManager();
    storage = (InstanceStorage as jest.MockedClass<typeof InstanceStorage>).mock.instances[0] as jest.Mocked<InstanceStorage>;
    storage.listInstances.mockReturnValue([{ ...instance }] as never);
    await manager.initialize();
    return manager;
  }

  it('launches the editor with its own data and extensions directories', async () => {
    const manager = await createManager();

    await manager.openInstance('js');

    expect(spawn).toHaveBeenCalledWith(
      '/usr/bin/code',
      [
        '--new-window',
        '--user-data-dir=/data/js/user',
        '--extensions-dir=/data/js/extensions',
        '/projects/app',
        '--disable-gpu',
      ],
      expect.objectContaining({ detached: true }),
    );
  });

  it('strips Electron variables so the editor does not inherit this app runtime', async () => {
    process.env.ELECTRON_RUN_AS_NODE = '1';
    const manager = await createManager();

    await manager.openInstance('js');

    const { env } = (spawn as jest.Mock).mock.calls[0][2];
    expect(env.ELECTRON_RUN_AS_NODE).toBeUndefined();
    expect(env.NODE_OPTIONS).toBeUndefined();
    delete process.env.ELECTRON_RUN_AS_NODE;
  });

  it('records when the instance was last used', async () => {
    const manager = await createManager();

    await manager.openInstance('js');

    expect(storage.updateInstance).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'js', lastUsed: expect.any(String) }),
    );
  });

  it('throws for an unknown instance', async () => {
    const manager = await createManager();

    await expect(manager.openInstance('missing')).rejects.toThrow('missing');
    expect(spawn).not.toHaveBeenCalled();
  });

  it('refuses to create a Cursor instance when Cursor is not installed', async () => {
    const manager = await createManager();

    const result = await manager.createInstance({ name: 'Zig', type: 'cursor' } as never);

    expect(result.success).toBe(false);
    expect(storage.createInstance).not.toHaveBeenCalled();
  });
});
