/**
 * Domain Enums
 * Synchronized with the business logic and Prisma Schema
 */

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPERADMIN = 'SUPERADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
  BLOCKED = 'BLOCKED',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  MULTIPLE_SELECT = 'MULTIPLE_SELECT',
  TRUE_FALSE = 'TRUE_FALSE',
}

export enum ScoringMode {
  STANDARD = 'STANDARD',
  WEIGHTED = 'WEIGHTED',
}

export enum LocationType {
  BATTLEFIELD = 'BATTLEFIELD',
  MONUMENT = 'MONUMENT',
  ANCIENT_CAPITAL = 'ANCIENT_CAPITAL',
  CITADEL = 'CITADEL',
  TEMPLE = 'TEMPLE',
  OTHER = 'OTHER',
}

export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  DYNASTY = 'DYNASTY',
  MILITARY_FORCE = 'MILITARY_FORCE',
  OTHER = 'OTHER',
}

export enum LearningPathType {
  CHRONOLOGICAL = 'CHRONOLOGICAL',
  THEMATIC = 'THEMATIC',
  MYTHOLOGICAL = 'MYTHOLOGICAL',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}
