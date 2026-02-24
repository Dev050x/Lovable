-- CreateEnum
CREATE TYPE "MessageFrom" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('TOOL_CALL', 'TEXT_MESSAGE');

-- CreateEnum
CREATE TYPE "TOOL_CALL" AS ENUM ('READ_FILE', 'WRITE_FILE', 'UPDATE_FILE', 'DELETE_FILE');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "SandboxId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationHistory" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "from" "MessageFrom" NOT NULL,
    "type" "ConversationType" NOT NULL,
    "tooolCall" "TOOL_CALL",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConversationHistory" ADD CONSTRAINT "ConversationHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
