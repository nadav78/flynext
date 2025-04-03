-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING', 'CANCELLATION');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "profileImage" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "theme_mode" TEXT NOT NULL DEFAULT 'light',

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "type" "NotificationType" NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "locationId" INTEGER NOT NULL,
    "star_rating" INTEGER,
    "ownerId" INTEGER NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "amenities" TEXT,
    "gallery_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelRoomType" (
    "id" SERIAL NOT NULL,
    "hotelId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price_per_night" DECIMAL(65,30),
    "amenities" TEXT,
    "room_count" INTEGER NOT NULL,
    "gallery_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HotelRoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelReservation" (
    "id" SERIAL NOT NULL,
    "check_in_time" TIMESTAMP(3) NOT NULL,
    "check_out_time" TIMESTAMP(3) NOT NULL,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "hotelId" INTEGER NOT NULL,
    "hotelRoomTypeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "tripItineraryId" INTEGER,

    CONSTRAINT "HotelReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripItinerary" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "afs_booking_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_price" DECIMAL(65,30),
    "invoice_url" TEXT,

    CONSTRAINT "TripItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "session_data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Airport" (
    "id" SERIAL NOT NULL,
    "afs_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_key" ON "Token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_id_key" ON "UserPreference"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_id_key" ON "Notification"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Hotel_id_key" ON "Hotel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "HotelRoomType_id_key" ON "HotelRoomType"("id");

-- CreateIndex
CREATE UNIQUE INDEX "HotelReservation_id_key" ON "HotelReservation"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TripItinerary_id_key" ON "TripItinerary"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSession_id_key" ON "PaymentSession"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Location_id_key" ON "Location"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Location_city_country_key" ON "Location"("city", "country");

-- CreateIndex
CREATE UNIQUE INDEX "Airport_id_key" ON "Airport"("id");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "HotelReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelRoomType" ADD CONSTRAINT "HotelRoomType_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelReservation" ADD CONSTRAINT "HotelReservation_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelReservation" ADD CONSTRAINT "HotelReservation_hotelRoomTypeId_fkey" FOREIGN KEY ("hotelRoomTypeId") REFERENCES "HotelRoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelReservation" ADD CONSTRAINT "HotelReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelReservation" ADD CONSTRAINT "HotelReservation_tripItineraryId_fkey" FOREIGN KEY ("tripItineraryId") REFERENCES "TripItinerary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripItinerary" ADD CONSTRAINT "TripItinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Airport" ADD CONSTRAINT "Airport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
