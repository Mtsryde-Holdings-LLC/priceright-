variable "environment" {
  description = "Deployment environment (production, staging, development)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

#############################################################
# Vercel Variables
#############################################################

variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repository in format: owner/repo"
  type        = string
}

variable "nextauth_url" {
  description = "NextAuth URL for production"
  type        = string
}

variable "nextauth_secret" {
  description = "NextAuth secret key"
  type        = string
  sensitive   = true
}

#############################################################
# Database Variables
#############################################################

variable "use_aws_rds" {
  description = "Whether to create AWS RDS PostgreSQL instance"
  type        = bool
  default     = false
}

variable "database_url" {
  description = "Database URL (if not using AWS RDS)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  default     = ""
}

#############################################################
# Redis Variables
#############################################################

variable "use_aws_elasticache" {
  description = "Whether to create AWS ElastiCache Redis"
  type        = bool
  default     = false
}

variable "redis_url" {
  description = "Redis URL (if not using AWS ElastiCache)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

#############################################################
# Optional Marketplace Variables
#############################################################

variable "amazon_client_id" {
  description = "Amazon SP-API client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "amazon_client_secret" {
  description = "Amazon SP-API client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "sentry_dsn" {
  description = "Sentry DSN for error tracking"
  type        = string
  default     = ""
  sensitive   = true
}
