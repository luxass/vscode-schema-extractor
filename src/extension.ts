import { ExtensionContext, commands, window, workspace, Uri } from 'vscode';
import { getConfiguration, getSchemaList, getWorkspace } from './utils';

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('schema-extractor.extract-all', async () => {
      const { metadataUri, outputPath } = getConfiguration();

      const _workspace = await getWorkspace();

      if (!_workspace) {
        return;
      }

      const baseUri = _workspace.uri;

      const root = await getSchemaList(metadataUri);

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
        }));

      if (!output) {
        output = './';
      }

      await workspace.fs.createDirectory(Uri.joinPath(baseUri, output));

      await Promise.all(
        root.schemas.map(async (schema) => {
          try {
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
        })
      );
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

      const root = await getSchemaList(metadataUri);

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

      const schema = await window.showQuickPick(root.schemas, {
        title: 'Pick a schema'
      });

      if (!schema) {
        return;
      }

      let output =
        outputPath ||
        (await window.showInputBox({
          title: 'Output path',
          value: './'
        }));

      if (!output) {
        output = './';
      }

      await workspace.fs.createDirectory(Uri.joinPath(baseUri, output));

      try {
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
    })
  );
}
