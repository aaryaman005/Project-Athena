# === Attack Path 1: The Intern Chain ===
# Intern -> assumes MaintenanceRole -> passes role to EC2 -> gets Admin

# 1. The Maintenance Role (Intermediate)
resource "aws_iam_role" "maintenance_role" {
  name = "MaintenanceRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })
}

# 2. Policy allowing Intern to assume MaintenanceRole
resource "aws_iam_policy" "assume_maintenance" {
  name = "AssumeMaintenanceRole"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "sts:AssumeRole"
        Effect   = "Allow"
        Resource = aws_iam_role.maintenance_role.arn
      }
    ]
  })
}

# Attach to a specific intern (employee_076 - an Intern)
resource "aws_iam_user_policy_attachment" "intern_escalation" {
  user       = "employee_076" 
  policy_arn = aws_iam_policy.assume_maintenance.arn
  depends_on = [aws_iam_user.employees]
}

# 3. Maintenance Role Permissions (PassRole + RunInstances)
resource "aws_iam_role_policy" "maintenance_policy" {
  name = "MaintenancePolicy"
  role = aws_iam_role.maintenance_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ec2:RunInstances",
          "iam:PassRole"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# 4. The Target Admin Role (The Prize)
resource "aws_iam_role" "prod_ec2_admin" {
  name = "ProdEC2Admin"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "prod_admin_access" {
  role       = aws_iam_role.prod_ec2_admin.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}


# === Attack Path 2: Data Scientist Policy Edit ===
# Data Lead -> Edit Policy -> Admin

resource "aws_iam_user" "data_lead" {
  name = "data_lead"
}

resource "aws_iam_user_login_profile" "data_lead" {
  user = aws_iam_user.data_lead.name
}

resource "aws_iam_policy" "datascience_policy" {
  name = "DataScienceCustomPolicy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["s3:*"]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Allow data_lead to EDIT this specific policy
resource "aws_iam_user_policy" "edit_policy_priv" {
  name = "EditPolicyPrivilege"
  user = aws_iam_user.data_lead.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "iam:CreatePolicyVersion",
          "iam:SetDefaultPolicyVersion"
        ]
        Effect   = "Allow"
        Resource = aws_iam_policy.datascience_policy.arn
      }
    ]
  })
}

# Creating an Admin Role that uses this policy (Misconfiguration)
resource "aws_iam_role" "analytics_admin" {
  name = "AnalyticsAdmin"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "analytics_misconfig" {
  role       = aws_iam_role.analytics_admin.name
  policy_arn = aws_iam_policy.datascience_policy.arn
}


# === Data Source for Account ID ===
data "aws_caller_identity" "current" {}
