-- CreateTable
CREATE TABLE "ReactivationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReactivationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReactivationToken_userId_idx" ON "ReactivationToken"("userId");

-- CreateIndex
CREATE INDEX "Account_email_idx" ON "Account"("email");

-- AddForeignKey
ALTER TABLE "ReactivationToken" ADD CONSTRAINT "ReactivationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
