import z from "zod";
import type { DbService } from "../sql/DbService.js";
import type { ApiTag } from "../tags/TagRepository.js";

export type CreateDocumentRequest = {
  id: string;
  basePath: string;
  filename: string;
  type: string;
};

export type Document = {
  id: string;
  mime: string;
  previousId: string | undefined;
  nextId: string | undefined;
  queryIndex: number;
};

export type DocumentWithTags = Document & {
  tags: ApiTag[];
};

export type DocumentWithPathInfo = Document & {
  base_path: string;
  filename: string;
};

const documentWithPathInfoSchema = z.object({
  id: z.string(),
  mime: z.string(),
  base_path: z.string(),
  filename: z.string(),
});

export class DocumentRepository {
  constructor(private readonly dbService: DbService) {}

  public async createDocument(request: CreateDocumentRequest): Promise<void> {
    await this.dbService.none(
      "INSERT INTO documents (id, base_path, filename, mime) VALUES ($id, $basePath, $filename, $type)",
      request,
    );
  }

  public async getDocumentWithPathInfo(
    id: string,
  ): Promise<DocumentWithPathInfo> {
    const result = await this.dbService.one(
      documentWithPathInfoSchema,
      "SELECT id, mime, base_path, filename FROM documents WHERE id = $id",
      { id },
    );
    return {
      id: result.id,
      mime: result.mime,
      base_path: result.base_path,
      filename: result.filename,
      previousId: undefined,
      nextId: undefined,
      queryIndex: 0,
    };
  }
}
