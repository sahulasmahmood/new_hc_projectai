-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "patientId" INTEGER,
    "patientPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "context" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMemory" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER,
    "patientId" INTEGER,
    "patientPhone" TEXT,
    "memoryType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatConversation_sessionId_key" ON "ChatConversation"("sessionId");

-- CreateIndex
CREATE INDEX "ChatConversation_sessionId_idx" ON "ChatConversation"("sessionId");

-- CreateIndex
CREATE INDEX "ChatConversation_patientId_idx" ON "ChatConversation"("patientId");

-- CreateIndex
CREATE INDEX "ChatConversation_patientPhone_idx" ON "ChatConversation"("patientPhone");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ChatMessage_timestamp_idx" ON "ChatMessage"("timestamp");

-- CreateIndex
CREATE INDEX "ChatMemory_patientId_idx" ON "ChatMemory"("patientId");

-- CreateIndex
CREATE INDEX "ChatMemory_patientPhone_idx" ON "ChatMemory"("patientPhone");

-- CreateIndex
CREATE INDEX "ChatMemory_memoryType_idx" ON "ChatMemory"("memoryType");

-- CreateIndex
CREATE INDEX "ChatMemory_key_idx" ON "ChatMemory"("key");

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMemory" ADD CONSTRAINT "ChatMemory_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMemory" ADD CONSTRAINT "ChatMemory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
