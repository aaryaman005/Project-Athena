# === Groups ===

resource "aws_iam_group" "engineering" {
  name = "Engineering"
}

resource "aws_iam_group" "data_science" {
  name = "DataScience"
}

resource "aws_iam_group" "finance" {
  name = "Finance"
}

resource "aws_iam_group" "hr" {
  name = "HR"
}

resource "aws_iam_group" "interns" {
  name = "Interns"
}

resource "aws_iam_group" "contractors" {
  name = "Contractors"
}

# === Policy Attachments ===

# Engineering: PowerUserAccess
resource "aws_iam_group_policy_attachment" "engineering_policy" {
  group      = aws_iam_group.engineering.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

# DataScience: S3FullAccess
resource "aws_iam_group_policy_attachment" "data_science_policy" {
  group      = aws_iam_group.data_science.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# Finance: Billing
resource "aws_iam_group_policy_attachment" "finance_policy" {
  group      = aws_iam_group.finance.name
  policy_arn = "arn:aws:iam::aws:policy/job-function/Billing"
}

# HR: ReadOnly
resource "aws_iam_group_policy_attachment" "hr_policy" {
  group      = aws_iam_group.hr.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Interns: ReadOnly
resource "aws_iam_group_policy_attachment" "interns_policy" {
  group      = aws_iam_group.interns.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Contractors: Custom Restricted Policy
resource "aws_iam_policy" "restricted_contractor" {
  name        = "RestrictedContractorPolicy"
  description = "Limited access for contractors"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_group_policy_attachment" "contractors_policy" {
  group      = aws_iam_group.contractors.name
  policy_arn = aws_iam_policy.restricted_contractor.arn
}
