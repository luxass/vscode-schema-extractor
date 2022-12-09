import fetch from "fetch-shim";
import { Uri, window, workspace, WorkspaceFolder } from "vscode";
import type { ConfigurationResult, Release, SchemaUris } from "./types";

export function getConfiguration(): ConfigurationResult {
  return {
    releaseList:
      workspace
        .getConfiguration("schema-extractor")
        .get<string>("releaseList") ||
      "https://raw.githubusercontent.com/luxass/vscode-schemas/main/schemas/.vscode-schemas.json",
    outputPath:
      workspace.getConfiguration("schema-extractor").get<string>("output") ||
      "./extracted-schemas"
  };
}

export async function getSchemaList(
  baseUri: Uri,
  url: string
): Promise<SchemaUris | undefined> {
  try {
    const { scheme } = Uri.parse(url);
    if (!["http", "https", "file"].includes(scheme)) {
      window.showErrorMessage(
        "Invalid URL. Only HTTP, HTTPS and file are supported."
      );
      return;
    }

    if (scheme === "file") {
      const content = JSON.parse(
        new TextDecoder("utf8").decode(
          await workspace.fs.readFile(Uri.joinPath(baseUri, url))
        )
      ) as SchemaUris;
      if (!content.schemas.length && !content.externalSchemas.length) {
        window.showErrorMessage("No schemas found in list.");
        return;
      }
      return content;
    }

    const res = await fetch(url);
    const data = (await res.json()) as SchemaUris;
    if (!data.schemas.length && !data.externalSchemas.length) {
      window.showErrorMessage("No schemas found in list.");
      return;
    }
    return data;
  } catch (e) {
    console.error(e);
    window.showErrorMessage(
      "Something went wrong, while trying to fetch schema list."
    );
  }
}

export async function getWorkspace(): Promise<WorkspaceFolder | undefined> {
  const workspaces = workspace.workspaceFolders;
  if (!workspaces || !workspaces.length) {
    window.showErrorMessage("No workspace opened.");
    return;
  }
  if (workspaces.length > 1) {
    const pickedWorkspace = await window.showWorkspaceFolderPick();
    if (!pickedWorkspace) {
      window.showErrorMessage("No workspace selected.");
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

    if (authority === "raw.githubusercontent.com") {
      const res = await fetch(schema);
      const data = await res.json();
      const match = schema.match(
        /^https:\/\/raw\.githubusercontent\.com\/[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}\/([\w.-]*)\/[\w.-]*\/(.*)$/
      );

      if (!match) {
        window.showErrorMessage(
          `Something went wrong, while trying to extract ${schema}`
        );
        return;
      }

      const [_url, repo, path] = match;
      let fileName;
      
      if (repo === "vscode" && path.startsWith("extension")) {
        const [ext, _schema, file] = path.split("/").slice(1);
        fileName = `${ext}/${file}`;
      } else {
        const splitted = path.split("/");
        fileName = splitted.at(-1);
      }

      if (!fileName) {
        window.showErrorMessage(
          `Something went wrong, while trying to parse filename`
        );
        return;
      }

      await workspace.fs.writeFile(
        Uri.joinPath(baseUri, output, "external-schemas", repo, fileName),
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
        schema.replace(/^vscode:\/\/schemas(.*)/, "$1.json")
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

export async function getReleases(
  baseUri: Uri,
  url: string
): Promise<Array<Release> | undefined> {
  try {
    const { scheme } = Uri.parse(url);
    if (!["http", "https", "file"].includes(scheme)) {
      window.showErrorMessage(
        "Invalid URL. Only HTTP, HTTPS and file are supported."
      );
      return;
    }

    if (scheme === "file") {
      const content = JSON.parse(
        new TextDecoder("utf8").decode(
          await workspace.fs.readFile(Uri.joinPath(baseUri, url))
        )
      );

      if (!Array.isArray(content)) {
        window.showErrorMessage("Invalid list of releases.");
        return;
      }

      if (!content.length) {
        window.showErrorMessage("No releases found in list.");
        return;
      }

      if (!content.length) {
        window.showErrorMessage("No schemas found in list.");
        return;
      }
      return content;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)) {
      window.showErrorMessage("Invalid list of releases.");
      return;
    }

    if (!data.length) {
      window.showErrorMessage("No schemas found in list.");
      return;
    }
    return data;
  } catch (e) {
    console.error(e);
    window.showErrorMessage(
      "Something went wrong, while trying to fetch list of releases."
    );
  }
}
