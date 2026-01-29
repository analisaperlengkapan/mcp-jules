
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function getCurrentGitContext(): Promise<{ owner: string; repo: string; branch: string } | null> {
  try {
    const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url');
    const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');

    const cleanUrl = remoteUrl.trim();
    // Support HTTPS and SSH URLs
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    const match = cleanUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);

    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        branch: branch.trim(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting git context:', error);
    return null;
  }
}
