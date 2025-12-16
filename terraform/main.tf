terraform {
  required_version = ">= 1.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.15"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional: Configure remote state
  # backend "s3" {
  #   bucket = "priceright-terraform-state"
  #   key    = "production/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

#############################################################
# Provider Configuration
#############################################################

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "aws" {
  region = var.aws_region
}

#############################################################
# Vercel Project
#############################################################

resource "vercel_project" "priceright" {
  name      = "priceright-${var.environment}"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  build_command    = "npm run build"
  output_directory = ".next"

  environment = [
    {
      key    = "DATABASE_URL"
      value  = var.database_url
      target = ["production", "preview"]
    },
    {
      key    = "REDIS_URL"
      value  = var.redis_url
      target = ["production", "preview"]
    },
    {
      key    = "NEXTAUTH_SECRET"
      value  = var.nextauth_secret
      target = ["production", "preview"]
    },
    {
      key    = "NEXTAUTH_URL"
      value  = var.nextauth_url
      target = ["production"]
    },
  ]
}

#############################################################
# AWS RDS PostgreSQL (Optional - if not using Supabase)
#############################################################

resource "aws_db_instance" "postgres" {
  count = var.use_aws_rds ? 1 : 0

  identifier        = "priceright-${var.environment}"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_encrypted = true

  db_name  = "priceright"
  username = "priceright_admin"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.postgres[0].id]
  db_subnet_group_name   = aws_db_subnet_group.postgres[0].name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  skip_final_snapshot = var.environment != "production"

  tags = {
    Name        = "priceright-${var.environment}"
    Environment = var.environment
  }
}

#############################################################
# AWS ElastiCache Redis (Optional - if not using Upstash)
#############################################################

resource "aws_elasticache_cluster" "redis" {
  count = var.use_aws_elasticache ? 1 : 0

  cluster_id           = "priceright-${var.environment}"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  security_group_ids = [aws_security_group.redis[0].id]
  subnet_group_name  = aws_elasticache_subnet_group.redis[0].name

  snapshot_retention_limit = var.environment == "production" ? 5 : 0
  snapshot_window         = "03:00-05:00"

  tags = {
    Name        = "priceright-${var.environment}"
    Environment = var.environment
  }
}

#############################################################
# S3 Bucket for File Storage
#############################################################

resource "aws_s3_bucket" "storage" {
  bucket = "priceright-${var.environment}-storage"

  tags = {
    Name        = "priceright-${var.environment}-storage"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "storage" {
  bucket = aws_s3_bucket.storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "storage" {
  bucket = aws_s3_bucket.storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = [var.nextauth_url]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

#############################################################
# IAM User for S3 Access
#############################################################

resource "aws_iam_user" "s3_user" {
  name = "priceright-${var.environment}-s3"

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_access_key" "s3_user" {
  user = aws_iam_user.s3_user.name
}

resource "aws_iam_user_policy" "s3_policy" {
  name = "priceright-${var.environment}-s3-policy"
  user = aws_iam_user.s3_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.storage.arn,
          "${aws_s3_bucket.storage.arn}/*"
        ]
      }
    ]
  })
}

#############################################################
# VPC and Networking (if using AWS RDS/ElastiCache)
#############################################################

resource "aws_vpc" "main" {
  count = var.use_aws_rds || var.use_aws_elasticache ? 1 : 0

  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "priceright-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_a" {
  count = var.use_aws_rds || var.use_aws_elasticache ? 1 : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name        = "priceright-${var.environment}-private-a"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_b" {
  count = var.use_aws_rds || var.use_aws_elasticache ? 1 : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name        = "priceright-${var.environment}-private-b"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "postgres" {
  count = var.use_aws_rds ? 1 : 0

  name       = "priceright-${var.environment}"
  subnet_ids = [aws_subnet.private_a[0].id, aws_subnet.private_b[0].id]

  tags = {
    Name        = "priceright-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_elasticache_subnet_group" "redis" {
  count = var.use_aws_elasticache ? 1 : 0

  name       = "priceright-${var.environment}"
  subnet_ids = [aws_subnet.private_a[0].id, aws_subnet.private_b[0].id]

  tags = {
    Name        = "priceright-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_security_group" "postgres" {
  count = var.use_aws_rds ? 1 : 0

  name        = "priceright-${var.environment}-postgres"
  description = "Security group for PostgreSQL"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict this in production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "priceright-${var.environment}-postgres"
    Environment = var.environment
  }
}

resource "aws_security_group" "redis" {
  count = var.use_aws_elasticache ? 1 : 0

  name        = "priceright-${var.environment}-redis"
  description = "Security group for Redis"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict this in production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "priceright-${var.environment}-redis"
    Environment = var.environment
  }
}
