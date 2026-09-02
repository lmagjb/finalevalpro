
USE evalpro;

ALTER TABLE teacher_profiles
  ADD COLUMN salary_grade TINYINT UNSIGNED NULL AFTER current_position,
  ADD COLUMN school_level ENUM('Elementary', 'Junior High School', 'Senior High School') NULL AFTER salary_grade;
