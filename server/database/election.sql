-- Online Election Management System - Database Schema

CREATE DATABASE IF NOT EXISTS `online_election_db`;
USE `online_election_db`;

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS `admin` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Organizers Table
CREATE TABLE IF NOT EXISTS `organizers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `unique_number` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'disabled') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Candidate Nominations Table (Also acts as Candidate profiles once approved)
CREATE TABLE IF NOT EXISTS `candidate_nominations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `mobile` VARCHAR(20) NOT NULL,
  `address` TEXT NOT NULL,
  `college_org` VARCHAR(150) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `dob` DATE NOT NULL,
  `photo_path` VARCHAR(255) NOT NULL,
  `id_path` VARCHAR(255) NOT NULL,
  `manifesto_path` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `declaration_checked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Voters Table
-- CREATE TABLE IF NOT EXISTS `voters` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `name` VARCHAR(100) NOT NULL,
--   `email` VARCHAR(100) NOT NULL UNIQUE,
--   `mobile` VARCHAR(20) NOT NULL,
--   `dob` DATE NOT NULL,
--   `address` TEXT NOT NULL,
--   `password_hash` VARCHAR(255) NOT NULL,
--   `status` ENUM('active', 'disabled') DEFAULT 'active',
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 4. Voters Table
CREATE TABLE IF NOT EXISTS `voters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,

  `voter_id` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Example: 100524729001',

  `full_name` VARCHAR(100) NOT NULL,

  `department` VARCHAR(100) NOT NULL,

  `year_of_study` VARCHAR(20) NOT NULL,

  `mobile` VARCHAR(15),

  `email` VARCHAR(100),

  `password_hash` VARCHAR(255) NOT NULL,

  `status` ENUM('active','disabled') DEFAULT 'active',

  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Elections Table
CREATE TABLE IF NOT EXISTS `elections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `voting_start_time` TIME NOT NULL,
  `voting_end_time` TIME NOT NULL,
  `status` ENUM('draft', 'published', 'ended') DEFAULT 'draft',
  `organizer_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organizer_id`) REFERENCES `organizers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Election Candidates Junction Table
CREATE TABLE IF NOT EXISTS `election_candidates` (
  `election_id` INT NOT NULL,
  `candidate_nomination_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`election_id`, `candidate_nomination_id`),
  FOREIGN KEY (`election_id`) REFERENCES `elections` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`candidate_nomination_id`) REFERENCES `candidate_nominations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Votes Table (Voter can only vote once per election)
CREATE TABLE IF NOT EXISTS `votes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `voter_id` INT NOT NULL,
  `election_id` INT NOT NULL,
  `candidate_nomination_id` INT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_voter_election` (`voter_id`, `election_id`),
  FOREIGN KEY (`voter_id`) REFERENCES `voters` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`election_id`) REFERENCES `elections` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`candidate_nomination_id`) REFERENCES `candidate_nominations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `user_role` ENUM('admin', 'organizer', 'voter') NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `user_role` ENUM('admin', 'organizer', 'voter', 'candidate', 'system') DEFAULT 'system',
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Password Resets Table
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(100) NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default Admin user
-- Password: admin123
-- Bcrypt Hash of admin123: $2b$10$wK1mB5qJvxZ/a3eD4y5vUeXh9xJ4e0d7/B41/uR99q6s3w.H7m9yq
INSERT INTO `admin` (`username`, `email`, `password_hash`) 
VALUES ('admin', 'admin@election.com', '$2b$10$wK1mB5qJvxZ/a3eD4y5vUeXh9xJ4e0d7/B41/uR99q6s3w.H7m9yq')
ON DUPLICATE KEY UPDATE `username`=`username`;
