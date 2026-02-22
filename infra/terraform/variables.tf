variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "user_count" {
  description = "Number of users to create"
  type        = number
  default     = 300
}
