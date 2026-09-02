-- EVALPRO migration 005
-- Adds the real DepEd RFTP/CAReER scoring framework, sourced from
-- DO s2025_024 and DBM-DepEd JC Form No. 2-A (Annex I-3):
--   - The 37 official PPST Proficient-level indicators (21 COI + 16 NCOI),
--     rated Outstanding / Very Satisfactory / Not Met per application.
--   - Qualification Standards records (Education/Training/Experience/
--     Eligibility), each self-declared by the teacher and point-reviewed
--     by an evaluator.
--   - IPCRF-based Performance rating.
--   - Numeric COI/NCOI scores as evaluator-assigned fields (max 25/15),
--     matching the real framework where these come from actual classroom
--     observation and portfolio review, not a formula.
--
-- Total scoring model: Education(10) + Training(10) + Experience(10)
-- + Performance(30) + COI(25) + NCOI(15) = 100.
--
-- Purely additive. Run once:
--   mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_005_ppst_scoring_framework.sql

USE evalpro;

-- Reference table: the 37 official indicators (shared across all applications)
CREATE TABLE IF NOT EXISTS ppst_indicators (
  id            INT UNSIGNED PRIMARY KEY,
  number        VARCHAR(10) NOT NULL,
  domain_number TINYINT UNSIGNED NOT NULL,
  domain_name   VARCHAR(100) NOT NULL,
  description   TEXT NOT NULL,
  is_coi        BOOLEAN NOT NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO ppst_indicators (id, number, domain_number, domain_name, description, is_coi) VALUES
(1, '1.1.2', 1, 'Content Knowledge and Pedagogy', 'Apply knowledge of content within and across curriculum teaching areas.', 1),
  (2, '1.2.2', 1, 'Content Knowledge and Pedagogy', 'Use research-based knowledge and principles of teaching and learning to enhance professional practice.', 1),
  (3, '1.3.2', 1, 'Content Knowledge and Pedagogy', 'Ensure the positive use of ICT to facilitate the teaching and learning process.', 1),
  (4, '1.4.2', 1, 'Content Knowledge and Pedagogy', 'Use a range of teaching strategies that enhance learner achievement in literacy and numeracy skills.', 1),
  (5, '1.5.2', 1, 'Content Knowledge and Pedagogy', 'Apply a range of teaching strategies to develop critical and creative thinking, as well as other higher-order thinking skills.', 1),
  (6, '1.6.2', 1, 'Content Knowledge and Pedagogy', 'Display proficient use of Mother Tongue, Filipino and English to facilitate teaching and learning.', 1),
  (7, '1.7.2', 1, 'Content Knowledge and Pedagogy', 'Use effective verbal and non-verbal classroom communication strategies to support learner understanding, participation, engagement and achievement.', 1),
  (8, '2.1.2', 2, 'Learning Environment', 'Establish safe and secure learning environments to enhance learning through the consistent implementation of policies, guidelines and procedures.', 1),
  (9, '2.2.2', 2, 'Learning Environment', 'Maintain learning environments that promote fairness, respect and care to encourage learning.', 1),
  (10, '2.3.2', 2, 'Learning Environment', 'Manage classroom structure to engage learners, individually or in groups, in meaningful exploration, discovery and hands-on activities within a range of physical learning environments.', 1),
  (11, '2.4.2', 2, 'Learning Environment', 'Maintain supportive learning environments that nurture and inspire learners to participate, cooperate and collaborate in continued learning.', 1),
  (12, '2.5.2', 2, 'Learning Environment', 'Apply a range of successful strategies that maintain learning environments that motivate learners to work productively by assuming responsibility for their own learning.', 1),
  (13, '2.6.2', 2, 'Learning Environment', 'Manage learner behavior constructively by applying positive and non-violent discipline to ensure learning-focused environments.', 1),
  (14, '3.1.2', 3, 'Diversity of Learners', 'Use differentiated, developmentally appropriate learning experiences to address learners'' gender, needs, strengths, interests and experiences.', 1),
  (15, '3.2.2', 3, 'Diversity of Learners', 'Establish a learner-centered culture by using teaching strategies that respond to learners'' linguistic, cultural, socio-economic and religious backgrounds.', 1),
  (16, '3.3.2', 3, 'Diversity of Learners', 'Design, adapt and implement teaching strategies that are responsive to learners with disabilities, giftedness and talents.', 1),
  (17, '3.4.2', 3, 'Diversity of Learners', 'Plan and deliver teaching strategies that are responsive to the special educational needs of learners in difficult circumstances, including: geographic isolation; chronic illness; displacement due to armed conflict, urban resettlement or disasters; child abuse and child labor practices.', 1),
  (18, '3.5.2', 3, 'Diversity of Learners', 'Adapt and use culturally appropriate teaching strategies to address the needs of learners from indigenous groups.', 1),
  (19, '4.1.2', 4, 'Curriculum and Planning', 'Plan, manage and implement developmentally sequenced teaching and learning process to meet curriculum requirements and varied teaching contexts.', 1),
  (20, '4.2.2', 4, 'Curriculum and Planning', 'Set achievable and appropriate learning outcomes that are aligned with learning competencies.', 1),
  (21, '4.3.2', 4, 'Curriculum and Planning', 'Adapt and implement learning programs that ensure relevance and responsiveness to the needs of all learners.', 1),
  (22, '4.4.2', 4, 'Curriculum and Planning', 'Participate in collegial discussions that use teacher and learner feedback to enrich teaching practice.', 0),
  (23, '4.5.2', 4, 'Curriculum and Planning', 'Select, develop, organize and use appropriate teaching and learning resources, including ICT, to address learning goals.', 0),
  (24, '5.1.2', 5, 'Assessment and Reporting', 'Design, select, organize and use diagnostic, formative, and summative assessment strategies consistent with curriculum requirements.', 0),
  (25, '5.2.2', 5, 'Assessment and Reporting', 'Monitor and evaluate learner progress and achievement using learner attainment data.', 0),
  (26, '5.3.2', 5, 'Assessment and Reporting', 'Use strategies for providing timely, accurate and constructive feedback to improve learner performance.', 0),
  (27, '5.4.2', 5, 'Assessment and Reporting', 'Communicate promptly and clearly the learners'' needs, progress and achievement to key stakeholders, including parents/guardians.', 0),
  (28, '5.5.2', 5, 'Assessment and Reporting', 'Utilize assessment data to inform the modification of teaching and learning practices and programs.', 0),
  (29, '6.1.2', 6, 'Community Linkages and Professional Engagement', 'Maintain learning environments that are responsive to community contexts.', 0),
  (30, '6.2.2', 6, 'Community Linkages and Professional Engagement', 'Build relationships with parents/guardians and the wider school community to facilitate involvement in the educative process.', 0),
  (31, '6.3.2', 6, 'Community Linkages and Professional Engagement', 'Review regularly personal teaching practice using existing laws and regulations that apply to the teaching profession and the responsibilities specified in the Code of Ethics for Professional Teachers.', 0),
  (32, '6.4.2', 6, 'Community Linkages and Professional Engagement', 'Comply with and implement school policies and procedures consistently to foster harmonious relationships with learners, parents, and other stakeholders.', 0),
  (33, '7.1.2', 7, 'Personal Growth and Professional Development', 'Apply a personal philosophy of teaching that is learner-centered.', 0),
  (34, '7.2.2', 7, 'Personal Growth and Professional Development', 'Adopt practices that uphold the dignity of teaching as a profession by exhibiting qualities such as caring attitude, respect and integrity.', 0),
  (35, '7.3.2', 7, 'Personal Growth and Professional Development', 'Participate in professional networks to share knowledge and to enhance practice.', 0),
  (36, '7.4.2', 7, 'Personal Growth and Professional Development', 'Develop a personal professional improvement plan based on reflection of one''s practice and ongoing professional learning.', 0),
  (37, '7.5.2', 7, 'Personal Growth and Professional Development', 'Set professional development goals based on the Philippine Professional Standards for Teachers.', 0);

-- Per-application rating against each indicator. Defaults to 'X' (Not Met)
-- until an evaluator rates it.
CREATE TABLE IF NOT EXISTS indicator_ratings (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id  INT UNSIGNED NOT NULL,
  indicator_id    INT UNSIGNED NOT NULL,
  rating          ENUM('O', 'VS', 'X') NOT NULL DEFAULT 'X',
  rated_by        INT UNSIGNED NULL,
  rated_at        TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_indicator_ratings_application
    FOREIGN KEY (application_id) REFERENCES promotion_applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_indicator_ratings_indicator
    FOREIGN KEY (indicator_id) REFERENCES ppst_indicators(id) ON DELETE CASCADE,
  CONSTRAINT fk_indicator_ratings_rater
    FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_indicator_ratings (application_id, indicator_id)
) ENGINE=InnoDB;

-- Qualification Standards: Education / Training / Experience / Eligibility.
-- Teacher self-declares; points are reviewed/adjusted by an evaluator.
CREATE TABLE IF NOT EXISTS qualification_records (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id  INT UNSIGNED NOT NULL,
  category        ENUM('education', 'training', 'experience', 'eligibility') NOT NULL,
  title           VARCHAR(200) NOT NULL,
  detail          VARCHAR(300) NULL,
  points          DECIMAL(4,1) NOT NULL DEFAULT 0,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_qualification_records_application
    FOREIGN KEY (application_id) REFERENCES promotion_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- IPCRF-based performance rating (max 30 pts once converted).
CREATE TABLE IF NOT EXISTS ipcrf_records (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id    INT UNSIGNED NOT NULL,
  school_year       VARCHAR(20) NOT NULL,
  numeric_rating    DECIMAL(3,2) NOT NULL,
  adjectival_rating ENUM('Outstanding', 'Very Satisfactory', 'Satisfactory', 'Unsatisfactory', 'Poor') NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ipcrf_records_application
    FOREIGN KEY (application_id) REFERENCES promotion_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Evaluator-assigned numeric COI/NCOI scores (Classroom Observation/Demo
-- Teaching, and Portfolio Annotation + BEI respectively) plus a snapshot
-- of the target position the teacher is applying for.
ALTER TABLE promotion_applications
  ADD COLUMN coi_numeric_score DECIMAL(5,2) NULL AFTER target_position,
  ADD COLUMN ncoi_numeric_score DECIMAL(5,2) NULL AFTER coi_numeric_score;
