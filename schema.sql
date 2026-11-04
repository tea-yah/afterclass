-- Run: mysql -u root -p < schema.sql
CREATE DATABASE IF NOT EXISTS afterclass CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE afterclass;

CREATE TABLE users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registration_number CHAR(9) NOT NULL UNIQUE,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  profile_picture VARCHAR(255) NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_code_hash VARCHAR(255) NULL,      -- email OTP (hashed), cleared once verified
  verification_expires DATETIME NULL,
  verification_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE teams (
  team_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  type VARCHAR(30) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB;

-- A student verified by an admin to represent a team (many-to-many)
CREATE TABLE organisers (
  user_id INT UNSIGNED NOT NULL,
  team_id INT UNSIGNED NOT NULL,
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  PRIMARY KEY (user_id, team_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Lifecycle (upcoming/ongoing/completed) and registration status are NOT stored: computed from timestamps.
CREATE TABLE events (
  event_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  team_id INT UNSIGNED NOT NULL,
  category VARCHAR(30) NOT NULL,                  -- added: the frontend's category chips need it
  venue VARCHAR(120) NULL,
  event_mode ENUM('online','offline','hybrid') NOT NULL DEFAULT 'offline',
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  registration_required TINYINT(1) NOT NULL DEFAULT 0,
  registration_fee DECIMAL(8,2) NOT NULL DEFAULT 0 CHECK (registration_fee >= 0),
  external_link VARCHAR(255) NULL,
  approval_status ENUM('pending','approved','rejected','revision_requested') NOT NULL DEFAULT 'pending',
  event_status ENUM('scheduled','cancelled') NOT NULL DEFAULT 'scheduled',
  created_by INT UNSIGNED NULL,                   -- NULL for seed data
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (end_datetime > start_datetime),
  FOREIGN KEY (team_id) REFERENCES teams(team_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_events_start (start_datetime),
  INDEX idx_events_visible (approval_status, event_status, start_datetime),
  INDEX idx_events_team (team_id)
) ENGINE=InnoDB;

CREATE TABLE tags (
  tag_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tag_name VARCHAR(40) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE event_tags (
  event_id INT UNSIGNED NOT NULL,
  tag_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (event_id, tag_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE saved_events (
  user_id INT UNSIGNED NOT NULL,
  event_id INT UNSIGNED NOT NULL,
  saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE interested_events (
  user_id INT UNSIGNED NOT NULL,
  event_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  INDEX idx_interested_event (event_id)
) ENGINE=InnoDB;

-- Admin-entered academic calendar, independent of student events
CREATE TABLE academic_events (
  academic_event_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  category VARCHAR(30) NOT NULL,
  CHECK (end_datetime >= start_datetime),
  INDEX idx_academic_start (start_datetime)
) ENGINE=InnoDB;
-- EventReports and EventReviews are deferred to a later stage.
