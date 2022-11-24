import {
  Uri,
  window,
  workspace,
  WorkspaceFolder
} from 'vscode';
import fetch from 'fetch-shim';
import type { Metadata } from './types';
export function getConfiguration(): {
  metadataUri: string;
  outputPath: string;
} {
  return {
    metadataUri:
      workspace
        .getConfiguration('schema-extractor')
        .get<string>('metadataUri') ||
      'https://raw.githubusercontent.com/luxass/vscode-schemas/main/metadata.json',
    outputPath:
      workspace.getConfiguration('schema-extractor').get<string>('output') ||
      './extracted-schemas'
  };
}

export async function getSchemaList(
  baseUri: Uri,
  url: string
): Promise<Metadata | undefined> {
  try {
    const { scheme } = Uri.parse(url);
    
    if (!['http', 'https', 'file'].includes(scheme)) {
      window.showErrorMessage('Invalid URL. Only HTTP, HTTPS and file are supported.');
      return;
    }

    if (scheme === 'file') {
      const content = JSON.parse(new TextDecoder('utf8').decode(
        await workspace.fs.readFile(
          Uri.joinPath(baseUri, url)
        )
      )) as Metadata;
      if (!content.schemas) {
        window.showErrorMessage('No schemas found in list.');
        return;
      }
      return content;
    }

    const res = await fetch(url);
    const data = (await res.json()) as Metadata;
    if (!data.schemas) {
      window.showErrorMessage('No schemas found in list.');
      return;
    }
    return data;
  } catch (e) {
    console.error(e);
    window.showErrorMessage(
      'Something went wrong, while trying to fetch schema list.'
    );
  }
}

export async function getWorkspace(): Promise<WorkspaceFolder | undefined> {
  const workspaces = workspace.workspaceFolders;
  if (!workspaces || !workspaces.length) {
    window.showErrorMessage('No workspace opened.');
    return;
  }
  if (workspaces.length > 1) {
    const pickedWorkspace = await window.showWorkspaceFolderPick();
    if (!pickedWorkspace) {
      window.showErrorMessage('No workspace selected.');
      return;
    }
    return pickedWorkspace;
  } else {
    return workspaces[0];
  }
}
