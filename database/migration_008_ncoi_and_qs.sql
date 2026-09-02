-- EVALPRO migration 008
-- Adds storage for the NCOI Evaluation page (Portfolio Annotation and
-- Behavioural Events Interview) and the extra Qualification Standards
-- record fields shown on the QS page. Purely additive.
--
-- Run once:
--   mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_008_ncoi_and_qs.sql

USE evalpro;

-- One row per PA area or BEI question, per application.
-- 'slot' is the stable key from the form (e.g. '4.4.2' or 'Q1').
CREATE TABLE IF NOT EXISTS ncoi_evidence (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  section        ENUM('pa','bei') NOT NULL,
  slot           VARCHAR(20) NOT NULL,
  annotation     TEXT NULL,
  document_id    INT UNSIGNED NULL,
  -- Scored by the Principal; PA max 10, BEI max 5 under the CAReER split.
  score          DECIMAL(5,2) NULL,
  reviewed_by    INT UNSIGNED NULL,
  reviewed_at    TIMESTAMP NULL DEFAULT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ncoi_evidence_application
    FOREIGN KEY (application_id) REFERENCES promotion_applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_ncoi_evidence_document
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  CONSTRAINT fk_ncoi_evidence_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_ncoi_evidence_slot (application_id, section, slot)
) ENGINE=InnoDB;

-- Submission state for the NCOI form as a whole.
ALTER TABLE promotion_applications
  ADD COLUMN ncoi_submitted_at TIMESTAMP NULL DEFAULT NULL AFTER ncoi_numeric_score;

-- Extra fields shown on the Qualification Standards record form.
ALTER TABLE qualification_records
  ADD COLUMN year_completed SMALLINT UNSIGNED NULL AFTER hours,
  ADD COLUMN document_id INT UNSIGNED NULL AFTER year_completed,
  ADD CONSTRAINT fk_qualification_document
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
