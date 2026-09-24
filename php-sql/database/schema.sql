CREATE DATABASE IF NOT EXISTS tahu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tahu;

CREATE TABLE IF NOT EXISTS tips (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject ENUM('bm','math','science','english') NOT NULL,
  title VARCHAR(180) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tips_subject_created (subject, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(80) NOT NULL,
  category ENUM('General','BM','Math','Science','English') NOT NULL,
  title VARCHAR(180) NOT NULL,
  content TEXT NOT NULL,
  upvotes INT UNSIGNED NOT NULL DEFAULT 0,
  owner_token_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_posts_created (created_at),
  INDEX idx_posts_category_created (category, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  username VARCHAR(80) NOT NULL,
  content TEXT NOT NULL,
  owner_token_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_comments_post_created (post_id, created_at),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS post_votes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  visitor_token_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_post_visitor (post_id, visitor_token_hash),
  INDEX idx_votes_post (post_id),
  CONSTRAINT fk_votes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;
