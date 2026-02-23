-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferSettings" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfferSettings_shop_key" ON "OfferSettings"("shop");
