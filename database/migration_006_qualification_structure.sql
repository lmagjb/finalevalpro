-- EVALPRO migration 006
-- Adds structure to qualification records so statistics can report on
-- meaningful, comparable groups instead of free-text titles.
--
-- Purely additive. Run once:
--   mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_006_qualification_structure.sql

USE evalpro;

-- Institution and a normalized level per qualification record. 'level' is
-- what makes records comparable across teachers (e.g. two teachers with a
-- "Master's Degree" whose titles are worded differently).
ALTER TABLE qualification_records
  ADD COLUMN institution VARCHAR(200) NULL AFTER detail,
  ADD COLUMN level VARCHAR(100) NULL AFTER institution,
  ADD COLUMN hours INT UNSIGNED NULL AFTER level;

CREATE INDEX idx_qualification_level ON qualification_records(category, level);

-- Highest educational attainment on the teacher profile, so it can be
-- reported even before an application exists.
ALTER TABLE teacher_profiles
  ADD COLUMN highest_education VARCHAR(100) NULL AFTER years_of_service,
  ADD COLUMN education_institution VARCHAR(200) NULL AFTER highest_education;
