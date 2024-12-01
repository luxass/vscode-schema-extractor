import { ExtensionContext, commands, window, workspace, Uri, version,  } from "vscode";
import {
  extractSchema,
  getConfiguration,
  getReleases,
  getSchemaList,
  getWorkspace
} from "./utils";
import fetch from "node-fetch";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("schema-extractor.extract-all", async () => {
      const { releaseList, outputPath } = getConfiguration();

      const _workspace = await getWorkspace();

      if (!_workspace) {
        return;
      }

      const baseUri = _workspace.uri;

      try {
        const schemaList = await fetch("https://raw.githubusercontent.com/luxass/vscode-schemas/refs/heads/main/schemas/v" + version + "/schema-list.json")

        const schemaListJson = await schemaList.json();

        if (!Array.isArray(schemaListJson)) {
          throw new Error("Invalid schema list.");
        }

        for (const schema of schemaListJson) {
          console.log("Extracting schema:", schema);
          await extractSchema(baseUri, outputPath, schema);
        }

        console.log("Schema extraction completed.");

      } catch (e) {
        console.log("version:", version);
        console.error(e);
        window.showErrorMessage("Something went wrong.");
      }


    })
  );
}
