CREATE UNIQUE INDEX "Participation_userId_projectId_active_unique"
ON "Participation" ("userId", "projectId")
WHERE "status" IN ('REQUESTED', 'ACTIVE');