ALTER TABLE "Habit" ADD COLUMN "slug" TEXT;

DO $$
DECLARE
  habit_record RECORD;
  base_slug TEXT;
  candidate_slug TEXT;
  suffix INTEGER;
BEGIN
  FOR habit_record IN
    SELECT "id", "userId", "name"
    FROM "Habit"
    ORDER BY "createdAt", "id"
  LOOP
    base_slug := trim(both '-' from regexp_replace(lower(habit_record."name"), '[^a-z0-9]+', '-', 'g'));
    IF base_slug = '' THEN
      base_slug := 'habit';
    END IF;

    candidate_slug := base_slug;
    suffix := 2;
    WHILE EXISTS (
      SELECT 1
      FROM "Habit"
      WHERE "userId" = habit_record."userId"
        AND "slug" = candidate_slug
    ) LOOP
      candidate_slug := base_slug || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;

    UPDATE "Habit"
    SET "slug" = candidate_slug
    WHERE "id" = habit_record."id";
  END LOOP;
END $$;

ALTER TABLE "Habit" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Habit_userId_slug_key" ON "Habit"("userId", "slug");
