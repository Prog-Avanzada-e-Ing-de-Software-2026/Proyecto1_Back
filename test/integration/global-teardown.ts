import { getSharedContainer, removeConnectionFile } from './connection';

export default async function globalTeardown(): Promise<void> {
  const container = getSharedContainer();
  if (container) {
    await container.stop();
  }
  removeConnectionFile();
}
