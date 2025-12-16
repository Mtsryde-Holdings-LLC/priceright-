# PriceRight Infrastructure as Code (Terraform)

This directory contains Terraform configuration to automate the infrastructure setup for PriceRight.

## What This Creates

- **Vercel Project**: Configured with environment variables
- **AWS S3 Bucket**: For file storage (brand approval documents)
- **AWS RDS PostgreSQL** (optional): Managed database
- **AWS ElastiCache Redis** (optional): Managed Redis for job queue
- **IAM User & Policies**: For S3 access

## Prerequisites

1. **Install Terraform**
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/

   # Verify
   terraform --version
   ```

2. **AWS Credentials**
   ```bash
   # Configure AWS CLI
   aws configure

   # Or set environment variables
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   ```

3. **Vercel API Token**
   - Go to https://vercel.com/account/tokens
   - Create new token
   - Save it securely

## Quick Start

### Step 1: Configure Variables

```bash
# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

### Step 2: Initialize Terraform

```bash
terraform init
```

This downloads required providers (Vercel, AWS).

### Step 3: Plan Deployment

```bash
terraform plan
```

Review what will be created. Make sure everything looks correct.

### Step 4: Apply Configuration

```bash
terraform apply
```

Type `yes` to confirm. This will:
- Create S3 bucket
- Set up Vercel project
- Optionally create RDS/ElastiCache
- Output connection strings

### Step 5: Save Outputs

```bash
# View all outputs
terraform output

# Get specific sensitive outputs
terraform output -raw s3_access_key_id
terraform output -raw s3_secret_access_key
terraform output -raw rds_connection_string
```

## Configuration Options

### Using External Services (Recommended for Quick Start)

```hcl
use_aws_rds         = false
use_aws_elasticache = false
database_url        = "postgresql://..."  # From Supabase
redis_url           = "rediss://..."      # From Upstash
```

**Pros**: Faster setup, free tier available, managed backups
**Cons**: Less control, potential vendor lock-in

### Using AWS Services (Enterprise)

```hcl
use_aws_rds         = true
use_aws_elasticache = true
db_instance_class   = "db.t3.micro"
redis_node_type     = "cache.t3.micro"
```

**Pros**: Full control, enterprise features, compliance
**Cons**: More expensive, requires AWS expertise

## Environments

### Production

```bash
terraform workspace new production
terraform workspace select production
terraform apply -var-file="production.tfvars"
```

### Staging

```bash
terraform workspace new staging
terraform workspace select staging
terraform apply -var-file="staging.tfvars"
```

## Cost Estimation

### Minimal Setup (External Services)
- S3: ~$0.50/month (minimal usage)
- Vercel: Free tier or $20/month (Pro)
- **Total**: ~$0.50 - $20/month

### AWS Full Stack
- RDS db.t3.micro: ~$15/month
- ElastiCache cache.t3.micro: ~$13/month
- S3: ~$0.50/month
- Vercel: $20/month (Pro)
- **Total**: ~$48/month

### Production Scale
- RDS db.t3.small: ~$30/month
- ElastiCache cache.t3.small: ~$26/month
- S3: ~$5/month (with more storage)
- Vercel: $20/month
- **Total**: ~$81/month

## Updating Infrastructure

```bash
# Make changes to *.tf files
nano main.tf

# Review changes
terraform plan

# Apply updates
terraform apply
```

## Destroying Infrastructure

**⚠️ WARNING**: This will delete ALL resources!

```bash
# Review what will be deleted
terraform plan -destroy

# Destroy everything
terraform destroy
```

## State Management

### Local State (Default)

State is stored in `terraform.tfstate` locally.

**⚠️ IMPORTANT**:
- Add `*.tfstate*` to `.gitignore`
- Never commit state files (contains secrets)
- Back up state files regularly

### Remote State (Recommended for Teams)

Uncomment the backend configuration in `main.tf`:

```hcl
terraform {
  backend "s3" {
    bucket = "priceright-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}
```

Then initialize:

```bash
terraform init -migrate-state
```

## Troubleshooting

### Error: "No valid credential sources"

```bash
aws configure
# Enter your AWS credentials
```

### Error: "vercel_api_token" is required

```bash
# Set in terraform.tfvars
vercel_api_token = "your-token"

# Or via environment variable
export TF_VAR_vercel_api_token="your-token"
```

### Error: Resource already exists

```bash
# Import existing resource
terraform import aws_s3_bucket.storage priceright-production-storage

# Or remove from state
terraform state rm aws_s3_bucket.storage
```

## Security Best Practices

1. **Never commit sensitive files**
   ```bash
   # Add to .gitignore
   terraform.tfvars
   *.tfstate*
   .terraform/
   ```

2. **Use separate AWS accounts for environments**
   - Production: Separate AWS account
   - Staging: Separate AWS account
   - Development: Local or shared account

3. **Enable MFA for AWS**
   ```bash
   aws iam enable-mfa-device --user-name your-user
   ```

4. **Rotate credentials regularly**
   - AWS: Every 90 days
   - Vercel: Every 180 days

5. **Use least-privilege IAM policies**
   - Only grant necessary permissions
   - Use IAM roles instead of users where possible

## Integration with CI/CD

Add to GitHub Actions:

```yaml
- name: Terraform Apply
  run: terraform apply -auto-approve
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    TF_VAR_vercel_api_token: ${{ secrets.VERCEL_TOKEN }}
```

## Support

- Terraform Docs: https://www.terraform.io/docs
- AWS Provider: https://registry.terraform.io/providers/hashicorp/aws
- Vercel Provider: https://registry.terraform.io/providers/vercel/vercel
