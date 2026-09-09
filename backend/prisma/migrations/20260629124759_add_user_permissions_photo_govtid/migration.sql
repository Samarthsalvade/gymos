-- AlterTable
ALTER TABLE "Gym" ADD COLUMN     "defaultModules" TEXT DEFAULT '["dashboard","workout","checkin","progress","badges","membership","events"]',
ADD COLUMN     "selfCheckInDefault" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "enabledModules" TEXT,
ADD COLUMN     "govtIdNumber" TEXT,
ADD COLUMN     "govtIdType" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "selfCheckInEnabled" BOOLEAN NOT NULL DEFAULT false;
