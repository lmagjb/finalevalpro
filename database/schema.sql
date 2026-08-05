-- EVALPRO: A PPST-Based Teacher Promotion Readiness and Scoring System
-- Database schema (MySQL 8+)
-- Covers: user accounts/roles, teacher profiles, and placeholder tables for
-- promotion applications and document storage (built out in later phases).

CREATE DATABASE IF NOT EXISTS evalpro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE evalpro;

CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(150)  NOT NULL,
  email           VARCHAR(191)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  role            ENUM('teacher', 'admin_officer') NOT NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS teacher_profiles (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             INT UNSIGNED NOT NULL,
  employee_number     VARCHAR(50),
  school              VARCHAR(150),
  division            VARCHAR(150),
  current_position    VARCHAR(100),   -- e.g. Teacher I, Teacher II, Master Teacher I
  years_of_service    INT UNSIGNED DEFAULT 0,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teacher_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_teacher_profiles_user (user_id)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS admin_officer_profiles (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  division      VARCHAR(150),
  designation   VARCHAR(100),
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ao_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ao_profiles_user (user_id)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS promotion_applications (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id    INT UNSIGNED NOT NULL,
  status        ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected')
                NOT NULL DEFAULT 'draft',
  total_score   DECIMAL(6,2) DEFAULT NULL,
  submitted_at  TIMESTAMP    NULL DEFAULT NULL,
  reviewed_by   INT UNSIGNED NULL,
  reviewed_at   TIMESTAMP    NULL DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_promo_app_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_promo_app_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS documents (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id  INT UNSIGNED NOT NULL,
  indicator_type  ENUM('COI', 'NCOI') NOT NULL,
  file_name       VARCHAR(255) NOT NULL,
  file_url        VARCHAR(500) NOT NULL,
  uploaded_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documents_application
    FOREIGN KEY (application_id) REFERENCES promotion_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_promo_app_status ON promotion_applications(status);
