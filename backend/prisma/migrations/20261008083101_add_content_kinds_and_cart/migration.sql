-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "imageCredits" TEXT[],
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'place',
ADD COLUMN     "months" INTEGER[],
ADD COLUMN     "priceNote" TEXT,
ADD COLUMN     "season" TEXT,
ADD COLUMN     "sourceUrls" TEXT[];

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_placeId_key" ON "CartItem"("userId", "placeId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
