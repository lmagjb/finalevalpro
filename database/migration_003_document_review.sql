-- EVALPRO migration 003
-- Adds document review tracking (who verified/rejected a MOV, and why),
-- used by the Principal and AO Evaluation dashboards. Purely additive.
--
-- Run once against your database:
--   mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_003_document_review.sql

USE evalpro;

ALTER TABLE documents
  ADD COLUMN remarks VARCHAR(500) NULL AFTER status,
  ADD COLUMN reviewed_by INT UNSIGNED NULL AFTER remarks,
  ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by,
  ADD CONSTRAINT fk_documents_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_documents_status ON documents(status);
