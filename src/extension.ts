import { ExtensionContext, commands, window, workspace, Uri } from 'vscode';
import {
  extractSchema,
  getConfiguration,
  getSchemaList,
  getWorkspace
} from './utils';

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('schema-extractor.extract-all', async () => {
      const { metadataUri, outputPath } = getConfiguration();

      const _workspace = await getWorkspace();

      if (!_workspace) {
        return;
      }

      const baseUri = _workspace.uri;

      const root = await getSchemaList(baseUri, metadataUri);
      
      if (!root) {
        return;
      }

      if (!root.schemas) {
        window.showErrorMessage('No schemas found in list.');
        return;
      }

      if (!Array.isArray(root.schemas)) {
        window.showErrorMessage('Schemas is a non-array.');
        return;
      }

      let output =
        outputPath ||
        (await window.showInputBox({
          title: 'Output path',
          value: './'
        })) ||
        './';

      if (!output) {
        output = './';
      }

      await workspace.fs.createDirectory(Uri.joinPath(baseUri, output));

      await Promise.all([
        ...(root.schemas || []).map(async (schema) =>
          extractSchema(baseUri, output, schema)
        ),
        ...(root.schema_urls || []).map(async (schema) =>
          extractSchema(baseUri, output, schema)
        )
      ]);
      window.showInformationMessage('Schemas extracted.');
    })
  );

  context.subscriptions.push(
    commands.registerCommand('schema-extractor.extract-one', async () => {
      const { metadataUri, outputPath } = getConfiguration();

      const _workspace = await getWorkspace();

      if (!_workspace) {
        return;
      }

      const baseUri = _workspace.uri;

      const root = await getSchemaList(baseUri, metadataUri);

      if (!root) {
        return;
      }

      if (!root.schemas) {
        window.showErrorMessage('No schemas found in list.');
        return;
      }

      if (!Array.isArray(root.schemas)) {
        window.showErrorMessage('Schemas is a non-array.');
        return;
      }

      const schema = await window.showQuickPick(
        root.schemas.concat(root.schema_urls),
        {
          title: 'Pick a schema'
        }
      );

      if (!schema) {
        return;
      }

      let output =
        outputPath ||
        (await window.showInputBox({
          title: 'Output path',
          value: './'
        })) ||
        './';

      if (!output) {
        output = './';
      }

      await workspace.fs.createDirectory(Uri.joinPath(baseUri, output));

      await extractSchema(baseUri, output, schema);
    })
  );
}
