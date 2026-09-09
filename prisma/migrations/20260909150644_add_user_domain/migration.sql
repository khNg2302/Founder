/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_54', 'AGE_55_PLUS');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "AssessmentResultStatus" AS ENUM ('PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ParticipationIntent" AS ENUM ('JOIN_PROJECT', 'BECOME_COFOUNDER');

-- CreateEnum
CREATE TYPE "ParticipationRole" AS ENUM ('FOUNDER', 'COFOUNDER', 'TEAM_MEMBER');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('REQUESTED', 'ACTIVE', 'REJECTED', 'CANCELLED', 'LEFT', 'REMOVED', 'COMPLETED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "ageRange" "AgeRange",
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "nickname" TEXT;

-- CreateTable
CREATE TABLE "UserCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "UserCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAudience" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "audienceTypeId" TEXT NOT NULL,

    CONSTRAINT "UserAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserContribution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationValue" INTEGER,
    "durationUnit" "DurationUnit",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "maxAttempts" INTEGER,
    "cooldownHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "result" "AssessmentResultStatus" NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "intent" "ParticipationIntent" NOT NULL,
    "role" "ParticipationRole" NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipationContribution" (
    "id" TEXT NOT NULL,
    "participationId" TEXT NOT NULL,
    "userContributionId" TEXT NOT NULL,

    CONSTRAINT "ParticipationContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityFeedback" (
    "id" TEXT NOT NULL,
    "participationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedUserId" TEXT NOT NULL,
    "communication" INTEGER NOT NULL,
    "reliability" INTEGER NOT NULL,
    "collaboration" INTEGER NOT NULL,
    "professionalism" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCategory_categoryId_idx" ON "UserCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCategory_userId_categoryId_key" ON "UserCategory"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "UserAudience_audienceTypeId_idx" ON "UserAudience"("audienceTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAudience_userId_audienceTypeId_key" ON "UserAudience"("userId", "audienceTypeId");

-- CreateIndex
CREATE INDEX "Contribution_fieldId_idx" ON "Contribution"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_fieldId_name_key" ON "Contribution"("fieldId", "name");

-- CreateIndex
CREATE INDEX "UserContribution_contributionId_idx" ON "UserContribution"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserContribution_userId_contributionId_key" ON "UserContribution"("userId", "contributionId");

-- CreateIndex
CREATE INDEX "Experience_userId_idx" ON "Experience"("userId");

-- CreateIndex
CREATE INDEX "Experience_contributionId_idx" ON "Experience"("contributionId");

-- CreateIndex
CREATE INDEX "Assessment_contributionId_idx" ON "Assessment"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_contributionId_version_key" ON "Assessment"("contributionId", "version");

-- CreateIndex
CREATE INDEX "AssessmentResult_userId_idx" ON "AssessmentResult"("userId");

-- CreateIndex
CREATE INDEX "AssessmentResult_assessmentId_idx" ON "AssessmentResult"("assessmentId");

-- CreateIndex
CREATE INDEX "Participation_userId_idx" ON "Participation"("userId");

-- CreateIndex
CREATE INDEX "Participation_projectId_idx" ON "Participation"("projectId");

-- CreateIndex
CREATE INDEX "ParticipationContribution_userContributionId_idx" ON "ParticipationContribution"("userContributionId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipationContribution_participationId_userContributionI_key" ON "ParticipationContribution"("participationId", "userContributionId");

-- CreateIndex
CREATE INDEX "CommunityFeedback_reviewerId_idx" ON "CommunityFeedback"("reviewerId");

-- CreateIndex
CREATE INDEX "CommunityFeedback_reviewedUserId_idx" ON "CommunityFeedback"("reviewedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityFeedback_participationId_reviewerId_reviewedUserId_key" ON "CommunityFeedback"("participationId", "reviewerId", "reviewedUserId");

-- AddForeignKey
ALTER TABLE "UserCategory" ADD CONSTRAINT "UserCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAudience" ADD CONSTRAINT "UserAudience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContribution" ADD CONSTRAINT "UserContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContribution" ADD CONSTRAINT "UserContribution_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_userId_contributionId_fkey" FOREIGN KEY ("userId", "contributionId") REFERENCES "UserContribution"("userId", "contributionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationContribution" ADD CONSTRAINT "ParticipationContribution_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "Participation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationContribution" ADD CONSTRAINT "ParticipationContribution_userContributionId_fkey" FOREIGN KEY ("userContributionId") REFERENCES "UserContribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFeedback" ADD CONSTRAINT "CommunityFeedback_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "Participation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFeedback" ADD CONSTRAINT "CommunityFeedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFeedback" ADD CONSTRAINT "CommunityFeedback_reviewedUserId_fkey" FOREIGN KEY ("reviewedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
