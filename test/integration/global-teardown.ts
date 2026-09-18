import { getSharedContainer, removeConnectionFile } from './connection';

export default async function globalTeardown(): Promise<void> {
  try {
    const container = getSharedContainer();
    if (container) {
      await container.stop();
    }
  } finally {
    removeConnectionFile();
  }
}
