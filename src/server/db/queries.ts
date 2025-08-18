import "server-only";
import { db } from "~/server/db";
import {
  files_table as fileSchema,
  folders_table as folderSchema,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const QUERIES = {
  getAllParentsForFolder: async function getAllParentsForFolder(
    folderId: number,
  ) {
    const parents = [];
    let currentId: number | null = folderId;
    while (currentId !== null) {
      const folder = await db
        .selectDistinct()
        .from(folderSchema)
        .where(eq(folderSchema.id, currentId));

      if (!folder[0]) {
        throw new Error("Parent folder not found");
      }
      parents.unshift(folder[0]);
      currentId = folder[0]?.parent;
    }
    return parents;
  },
  getFolders: function getFolders(parsedFolderId: number) {
    return db
      .select()
      .from(folderSchema)
      .where(eq(folderSchema.parent, parsedFolderId));
  },
  getFiles: function getFiles(parsedFolderId: number) {
    return db
      .select()
      .from(fileSchema)
      .where(eq(fileSchema.parent, parsedFolderId));
  },
};

export const MUTATIONS = {
  createFile: async function (input: {
    file: {
      name: string;
      size: number;
      url: string;
    };
    userId: string;
  }) {
    return await db.insert(fileSchema).values({
      ...input.file,
      ownerId: input.userId,
      parent: 1,
    });
  },
};
