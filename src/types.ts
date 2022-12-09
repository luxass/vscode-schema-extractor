declare global {
  const IS_WEB: boolean;
}

export interface SchemaUris {
  version: string;

  // Schemas accessible via vscode://schemas/
  schemas: string[];

  // Schemas that are located inside folders, but not accessible via vscode://schemas/
  externalSchemas: string[];
}

export interface ConfigurationResult {
  releaseList: string;
  outputPath: string;
};

export interface Release {
  name: string;
  url: string;
}