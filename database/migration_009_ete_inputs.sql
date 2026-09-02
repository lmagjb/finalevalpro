-- EVALPRO migration 009
-- Adds the inputs the official ETE rubric needs (DO 024 s.2025, Tables
-- 2.a-2.c and Table 3), so Education, Training and Experience points can
-- be computed rather than self-declared.
--
-- Run once:
--   mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_009_ete_inputs.sql

USE evalpro;

ALTER TABLE teacher_profiles
  -- Units earned toward a Master's Degree; drives the Education level.
  ADD COLUMN education_units SMALLINT UNSIGNED NULL DEFAULT 0 AFTER education_institution,
  ADD COLUMN has_masters_degree BOOLEAN NOT NULL DEFAULT FALSE AFTER education_units,
  -- Months is what Table 2.c actually keys on; years alone loses precision
  -- (6 years 3 months and 6 years score differently).
  ADD COLUMN months_of_service SMALLINT UNSIGNED NULL AFTER has_masters_degree;

-- Backfill months from the existing years value so nothing regresses.
-- The `id > 0` condition is redundant logically, but it references the
-- primary key so this runs under MySQL Workbench's safe-update mode.
UPDATE teacher_profiles
   SET months_of_service = years_of_service * 12
 WHERE id > 0
   AND months_of_service IS NULL
   AND years_of_service IS NOT NULL;
