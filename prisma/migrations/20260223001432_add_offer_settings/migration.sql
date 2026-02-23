-- CreateTable
CREATE TABLE "OfferSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "announcementBar" BOOLEAN NOT NULL DEFAULT true,
    "barMessage" TEXT NOT NULL DEFAULT '⚡ Special one-time offer just for you!',
    "showCountdown" BOOLEAN NOT NULL DEFAULT true,
    "countdownMin" INTEGER NOT NULL DEFAULT 14,
    "countdownSec" INTEGER NOT NULL DEFAULT 59,
    "brandColor" TEXT NOT NULL DEFAULT '#7c6af7',
    "title" TEXT NOT NULL DEFAULT 'Wait — before you go!',
    "subtitle" TEXT NOT NULL DEFAULT 'We''ve got an exclusive upgrade offer available only right now.',
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT NOT NULL DEFAULT '',
    "ctaDelaySeconds" INTEGER NOT NULL DEFAULT 0,
    "paragraph" TEXT NOT NULL DEFAULT '',
    "ctaCopy" TEXT NOT NULL DEFAULT 'Yes! Add to my order',
    "offerPrice" TEXT NOT NULL DEFAULT '',
    "originalPrice" TEXT NOT NULL DEFAULT '',
    "declineMessage" TEXT NOT NULL DEFAULT 'No thanks, I''ll pass on this deal.',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OfferSettings_shop_key" ON "OfferSettings"("shop");
