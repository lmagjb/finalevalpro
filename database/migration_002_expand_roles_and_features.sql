-- EVALPRO migration 002
-- Adds: expanded roles, staff profiles, notifications, application workflow
-- tracking, document metadata/storage, and teacher profile contact info.
--
-- SAFE TO RUN AGAINST THE EXISTING, ALREADY-POPULATED DATABASE:
-- every change here is additive (new tables, new nullable columns, or an
-- enum widened to include new values). Nothing here drops or renames an
-- existing table or column, and no existing row is modified.
--
-- This script is meant to be run ONCE. (Standard MySQL does not support
-- "IF NOT EXISTS" on ADD COLUMN / CREATE INDEX the way MariaDB does, so
-- re-running it after it has already succeeded will error on the second
-- run with "duplicate column" / "duplicate key name" — that's expected
-- and safe; it just means it already applied.)
--
-- Run it the same way you ran schema.sql originally, e.g.:
--   mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_002_expand_roles_and_features.sql

USE evalpro;

-- ---------------------------------------------------------------------
-- 1. Expand the set of roles the system understands.
--    'teacher' and 'admin_officer' keep working exactly as before —
--    admin_officer is kept for backward compatibility with any existing
--    accounts; new staff registrations use the specific roles below.
-- ---------------------------------------------------------------------
ALTER TABLE users
  MODIFY COLUMN role ENUM(
    'teacher',
    'admin_officer',
    'principal',
    'ao_ii',
    'psds',
    'hr_ao_iv',
    'hrmpsb',
    'sds'
  ) NOT NULL;

-- ---------------------------------------------------------------------
-- 2. A single profile table for every non-teacher staff role.
--    (Mirrors admin_officer_profiles, generalized to the new roles.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_profiles (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  school        VARCHAR(150),   -- relevant for principal
  district      VARCHAR(150),   -- relevant for psds
  division      VARCHAR(150),
  designation   VARCHAR(100),
  contact_number VARCHAR(30),
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_staff_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_staff_profiles_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Teacher profile gains a contact number (used on the profile page).
-- ---------------------------------------------------------------------
ALTER TABLE teacher_profiles
  ADD COLUMN contact_number VARCHAR(30) NULL AFTER division;

-- ---------------------------------------------------------------------
-- 4. Promotion applications gain workflow-stage tracking and a division
--    record number (shown on the AO II dashboard).
-- ---------------------------------------------------------------------
ALTER TABLE promotion_applications
  ADD COLUMN current_stage ENUM(
    'principal','ao_ii','psds','hr_ao_iv','hrmpsb','sds','approved','returned'
  ) NOT NULL DEFAULT 'principal' AFTER status,
  ADD COLUMN division_record_no VARCHAR(50) NULL AFTER current_stage,
  ADD COLUMN target_position VARCHAR(100) NULL AFTER division_record_no;

CREATE INDEX idx_promo_app_stage ON promotion_applications(current_stage);

-- ---------------------------------------------------------------------
-- 5. Audit trail: one row per stage transition / decision.
--    Powers the "Audit trail" panels on AO II / PSDS / HR-AO IV.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_history (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id  INT UNSIGNED NOT NULL,
  actor_id        INT UNSIGNED NULL,
  from_stage      VARCHAR(30) NULL,
  to_stage        VARCHAR(30) NOT NULL,
  action          ENUM('forward','return','endorse','approve') NOT NULL,
  remarks         TEXT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_history_application
    FOREIGN KEY (application_id) REFERENCES promotion_applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_history_actor
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. Notifications (bell dropdown + full notifications page).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        VARCHAR(500) NOT NULL,
  type        ENUM('stage','returned','general') NOT NULL DEFAULT 'general',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- ---------------------------------------------------------------------
-- 7. Documents: add PPST domain, verification status, and file storage.
--    Files are stored as bytes in the database (LONGBLOB) — there is no
--    external file-storage service configured yet, so this keeps uploads
--    working at zero extra cost. file_url is kept (now nullable) for a
--    future migration to real object storage without another schema change.
-- ---------------------------------------------------------------------
ALTER TABLE documents
  MODIFY COLUMN file_url VARCHAR(500) NULL,
  ADD COLUMN domain TINYINT UNSIGNED NULL AFTER application_id,
  ADD COLUMN mime_type VARCHAR(100) NULL AFTER file_name,
  ADD COLUMN file_data LONGBLOB NULL AFTER file_url,
  ADD COLUMN status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending' AFTER file_data;

CREATE INDEX idx_documents_application_domain ON documents(application_id, domain);
