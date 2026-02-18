terraform {
  # Use local state to avoid creating actual AWS resources
  # Comment out backend block for local development
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "athena/terraform.tfstate"
  #   region = "us-east-1"
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Mock provider configuration for development
# This prevents actual AWS resource creation
provider "aws" {
  region = var.aws_region
  # Use mock credentials to prevent API calls
  access_key = "mock-access-key"
  secret_key = "mock-secret-key"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  # Use local endpoints to avoid real AWS calls
  endpoints {
    iam = "http://localhost:4566"
    sts = "http://localhost:4566"
  }
}
