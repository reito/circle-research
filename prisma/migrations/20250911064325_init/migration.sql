-- CreateEnum
CREATE TYPE "public"."ClubCategory" AS ENUM ('SPORTS', 'CULTURE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Club" ADD COLUMN     "category" "public"."ClubCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "images" TEXT[];
