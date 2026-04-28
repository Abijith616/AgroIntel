ALTER TABLE "Crop" ADD COLUMN "latitude" REAL;
ALTER TABLE "Crop" ADD COLUMN "longitude" REAL;

UPDATE "Crop"
SET "latitude" = 9.7463, "longitude" = 76.6683
WHERE "name" = 'Rice' AND "district" = 'Kottayam' AND "place" = 'Kuravilangad';

UPDATE "Crop"
SET "latitude" = 10.3424, "longitude" = 76.2112
WHERE "name" = 'Tomato' AND "district" = 'Thrissur' AND "place" = 'Irinjalakuda';

UPDATE "Crop"
SET "latitude" = 9.5916, "longitude" = 76.5222
WHERE "name" = 'Wheat' AND "district" = 'Kottayam' AND lower("place") = 'kottayam';

UPDATE "Crop"
SET "latitude" = 9.9312, "longitude" = 76.2673
WHERE "name" = 'Tomato' AND "place" = 'Kerala' AND ("state" = '' OR "district" = '');
