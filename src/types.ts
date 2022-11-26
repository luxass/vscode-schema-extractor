declare global {
  const IS_WEB: boolean;
}

export interface Metadata {
  version: string;

  // Schemas accessible via vscode://schemas/
  schemas: string[];
  
  // Schemas that are located inside folders, but not accessible via vscode://schemas/
  schema_urls: string[];
}
