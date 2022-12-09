import { ExtensionContext, commands, window, workspace, Uri } from "vscode";
import {
  extractSchema,
  getConfiguration,
  getReleases,
  getSchemaList,
  getWorkspace
} from "./utils";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("schema-extractor.extract-all", async () => {
      const { releaseList, outputPath } = getConfiguration();

      const _workspace = await getWorkspace();

      if (!_workspace) {
        return;
      }

      const baseUri = _workspace.uri;

      const releases = await getReleases(baseUri, releaseList);

      if (!releases) {
        return;
      }

      const release = await window.showQuickPick(
        releases.map((release) => release.name),
        {
          title: "Pick a release"
        }
      );

      const releaseUri = releases.find((r) => r.name === release)?.url;
      console.log(releaseUri);

      if (!release || !releaseUri) {
        return;
      }

      const root = await getSchemaList(baseUri, releaseUri);

      if (!root) {
        return;
      }

      if (!root.schemas) {
        window.showErrorMessage("No schemas found in list.");
        return;
      }

      if (!Array.isArray(root.schemas)) {
        window.showErrorMessage("Schemas is a non-array.");
        return;
      }

      let output =
        outputPath ||
        (await window.showInputBox({
          title: "Output path",
          value: "./"
        })) ||
        "./";

      if (!output) {
        output = "./";
      }

      await workspace.fs.createDirectory(Uri.joinPath(baseUri, output));

      await Promise.all([
        ...(root.schemas || []).map(async (schema) =>
          extractSchema(baseUri, output, schema)
        ),
        ...(root.externalSchemas || []).map(async (schema) =>
          extractSchema(baseUri, output, schema)
        )
      ]);
      window.showInformationMessage("Schemas extracted.");
    })
  );

  context.subscriptions.push(
    commands.registerCommand("schema-extractor.extract-one", async () => {
      const { releaseList, outputPath } = getConfiguration();

      const _workspace = await getWorkspace();

      if (!_workspace) {
        return;
      }

      const baseUri = _workspace.uri;

      const releases = await getReleases(baseUri, releaseList);

      if (!releases) {
        return;
      }

      const release = await window.showQuickPick(
        releases.map((release) => release.name),
        {
          title: "Pick a release"
        }
      );

      const releaseUri = releases.find((r) => r.name === release)?.url;
      console.log(releaseUri);

      if (!release || !releaseUri) {
        return;
      }

      const schemas = await getSchemaList(baseUri, releaseUri);

      if (!schemas) {
        return;
      }

      if (!schemas.schemas) {
        window.showErrorMessage("No schemas found in list.");
        return;
      }

      if (!Array.isArray(schemas.schemas)) {
        window.showErrorMessage("Schemas is a non-array.");
        return;
      }

      const schema = await window.showQuickPick(
        schemas.schemas.concat(schemas.externalSchemas),
        {
          title: "Pick a schema"
        }
      );

      if (!schema) {
        return;
      }

      let output =
        outputPath ||
        (await window.showInputBox({
          title: "Output path",
          value: "./"
        })) ||
        "./";

      if (!output) {
        output = "./";
      }

      await workspace.fs.createDirectory(Uri.joinPath(baseUri, output));

      await extractSchema(baseUri, output, schema);
    })
  );
}
