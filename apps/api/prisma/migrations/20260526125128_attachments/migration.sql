-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_task_id_idx" ON "Attachment"("task_id");

-- CreateIndex
CREATE INDEX "Attachment_uploaded_by_idx" ON "Attachment"("uploaded_by");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
