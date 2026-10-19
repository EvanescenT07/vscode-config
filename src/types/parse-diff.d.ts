declare module "parse-diff" {
  interface Change {
    type: "add" | "del" | "normal";
    add?: boolean;
    del?: boolean;
    normal?: boolean;
    ln?: number;
    ln1?: number;
    ln2?: number;
    content: string;
  }

  interface Chunk {
    content: string;
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    changes: Change[];
  }

  interface File {
    from?: string;
    to?: string;
    index?: string[];
    newMode?: string;
    oldMode?: string;
    deleted?: boolean;
    new?: boolean;
    renamed?: boolean;
    binary?: boolean;
    chunks: Chunk[];
    additions?: number;
    deletions?: number;
  }

  function parse(input: string): File[];

  export = parse;
}
