import { Uri, window, workspace, WorkspaceFolder } from 'vscode';
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
    console.log(scheme);

    if (!['http', 'https', 'file'].includes(scheme)) {
      window.showErrorMessage(
        'Invalid URL. Only HTTP, HTTPS and file are supported.'
      );
      return;
    }

    if (scheme === 'file') {
      const content = JSON.parse(
        new TextDecoder('utf8').decode(
          await workspace.fs.readFile(Uri.joinPath(baseUri, url))
        )
      ) as Metadata;
      if (!content.schemas.length && !content.schema_urls.length) {
        window.showErrorMessage('No schemas found in list.');
        return;
      }
      return content;
    }

    const res = await fetch(url);
    const data = (await res.json()) as Metadata;
    if (!data.schemas.length && !data.schema_urls.length) {
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

export async function extractSchema(
  baseUri: Uri,
  output: string,
  schema: string
) {
  try {
    const { authority } = Uri.parse(schema);

    if (authority === 'raw.githubusercontent.com') {
      const res = await fetch(schema);
      const data = await res.json();

      console.log(  schema.replace(
        /^https:\/\/raw.githubusercontent.com\/microsoft\/vscode\/(\d+\.)(\d+\.)(\*|\d+)(.*)/,
        '$1.json'
      ));
      
      await workspace.fs.writeFile(
        Uri.joinPath(
          baseUri,
          output,
          schema.replace(
            /^https:\/\/raw.githubusercontent.com\/microsoft\/vscode\/(\d+\.)(\d+\.)(\*|\d+)(.*)/,
            '$4.json'
          )
        ),
        new TextEncoder().encode(JSON.stringify(data, null, 2))
      );
      return;
    }

    const text = (
      await workspace.openTextDocument(Uri.parse(schema))
    ).getText();

    const parsedSchema = JSON.parse(text);

    await workspace.fs.writeFile(
      Uri.joinPath(
        baseUri,
        output!,
        schema.replace(/^vscode:\/\/schemas(.*)/, '$1.json')
      ),
      new TextEncoder().encode(JSON.stringify(parsedSchema, null, 2))
    );
  } catch (e) {
    window.showErrorMessage(
      `Something went wrong, while trying to extract ${schema}`
    );
    console.error(e);
  }
}
