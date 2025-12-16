output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.priceright.id
}

output "vercel_project_url" {
  description = "Vercel project production URL"
  value       = "https://${vercel_project.priceright.name}.vercel.app"
}

output "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  value       = aws_s3_bucket.storage.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.storage.arn
}

output "s3_access_key_id" {
  description = "IAM access key ID for S3"
  value       = aws_iam_access_key.s3_user.id
  sensitive   = true
}

output "s3_secret_access_key" {
  description = "IAM secret access key for S3"
  value       = aws_iam_access_key.s3_user.secret
  sensitive   = true
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = var.use_aws_rds ? aws_db_instance.postgres[0].endpoint : null
}

output "rds_connection_string" {
  description = "RDS PostgreSQL connection string"
  value       = var.use_aws_rds ? "postgresql://${aws_db_instance.postgres[0].username}:${var.db_password}@${aws_db_instance.postgres[0].endpoint}/${aws_db_instance.postgres[0].db_name}?sslmode=require" : null
  sensitive   = true
}

output "elasticache_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = var.use_aws_elasticache ? "${aws_elasticache_cluster.redis[0].cache_nodes[0].address}:${aws_elasticache_cluster.redis[0].cache_nodes[0].port}" : null
}

output "elasticache_connection_string" {
  description = "ElastiCache Redis connection string"
  value       = var.use_aws_elasticache ? "redis://${aws_elasticache_cluster.redis[0].cache_nodes[0].address}:${aws_elasticache_cluster.redis[0].cache_nodes[0].port}" : null
  sensitive   = true
}

output "deployment_summary" {
  description = "Deployment summary with all important information"
  value = {
    environment          = var.environment
    vercel_project      = vercel_project.priceright.name
    s3_bucket           = aws_s3_bucket.storage.id
    database_provider   = var.use_aws_rds ? "AWS RDS" : "External"
    redis_provider      = var.use_aws_elasticache ? "AWS ElastiCache" : "External"
  }
}
