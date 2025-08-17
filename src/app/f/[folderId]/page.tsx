import { db } from "~/server/db";
import {
  files_table as FileSchema,
  folders_table as FolderSchema,
} from "~/server/db/schema";
import DriveContents from "../../drive-contents";
import { eq } from "drizzle-orm";

async function getAllParents(folderId: number) {
  const parents = [];
  let currentId: number | null = folderId;
  while (currentId !== null) {
    const folder = await db
      .selectDistinct()
      .from(FolderSchema)
      .where(eq(FolderSchema.id, currentId));

    if (!folder[0]) {
      throw new Error("Parent folder not found");
    }
    parents.unshift(folder[0]);
    currentId = folder[0]?.parent;
  }
  return parents;
}

export default async function GoogleDriveClone(props: {
  params: Promise<{ folderId: string }>;
}) {
  const params = await props.params;
  const parsedFolderId = parseInt(params.folderId);
  if (isNaN(parsedFolderId)) {
    return <div>Invalid folder ID</div>;
  }
  const foldersPromise = db
    .select()
    .from(FolderSchema)
    .where(eq(FolderSchema.parent, parsedFolderId));
  const filesPromise = db
    .select()
    .from(FileSchema)
    .where(eq(FileSchema.parent, parsedFolderId));
  const parentsPromise = getAllParents(parsedFolderId);

  // Run in parallel
  const [folders, files, parents] = await Promise.all([
    foldersPromise,
    filesPromise,
    parentsPromise,
  ]);

  return <DriveContents files={files} folders={folders} parents={parents} />;
}
