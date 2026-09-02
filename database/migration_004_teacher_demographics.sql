-- EVALPRO migration 004
-- Adds sex and birth date to teacher_profiles, so ranking results can be
-- broken down by demographic profile on the AO Evaluation Dashboard.
-- Purely additive — both columns are nullable.
--
-- Run once:
--   mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_004_teacher_demographics.sql

USE evalpro;

ALTER TABLE teacher_profiles
  ADD COLUMN sex ENUM('male', 'female') NULL AFTER contact_number,
  ADD COLUMN birth_date DATE NULL AFTER sex;
