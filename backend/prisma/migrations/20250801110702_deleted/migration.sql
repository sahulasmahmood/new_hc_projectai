/*
  Warnings:

  - You are about to drop the `ChatConversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatMemory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatConversation" DROP CONSTRAINT "ChatConversation_patientId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMemory" DROP CONSTRAINT "ChatMemory_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMemory" DROP CONSTRAINT "ChatMemory_patientId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_conversationId_fkey";

-- DropTable
DROP TABLE "ChatConversation";

-- DropTable
DROP TABLE "ChatMemory";

-- DropTable
DROP TABLE "ChatMessage";
