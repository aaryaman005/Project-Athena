resource "aws_iam_user" "employees" {
  count = var.user_count
  name  = format("employee_%03d", count.index + 1)
  path  = "/employees/"
}

resource "aws_iam_user_login_profile" "employees" {
  count   = var.user_count
  user    = aws_iam_user.employees[count.index].name
  password_reset_required = false
}

resource "aws_iam_user_group_membership" "engineering" {
  count = 100
  user = aws_iam_user.employees[count.index].name # 0-99
  groups = [aws_iam_group.engineering.name]
}

resource "aws_iam_user_group_membership" "data_science" {
  count = 50
  user = aws_iam_user.employees[count.index + 100].name # 100-149
  groups = [aws_iam_group.data_science.name]
}

resource "aws_iam_user_group_membership" "finance" {
  count = 30
  user = aws_iam_user.employees[count.index + 150].name # 150-179
  groups = [aws_iam_group.finance.name]
}

resource "aws_iam_user_group_membership" "hr" {
  count = 30
  user = aws_iam_user.employees[count.index + 180].name # 180-209
  groups = [aws_iam_group.hr.name]
}

resource "aws_iam_user_group_membership" "interns" {
  count = 40
  user = aws_iam_user.employees[count.index + 210].name # 210-249
  groups = [aws_iam_group.interns.name]
}

resource "aws_iam_user_group_membership" "contractors" {
  count = 10
  user = aws_iam_user.employees[count.index + 250].name # 250-259
  groups = [aws_iam_group.contractors.name]
}

resource "aws_iam_user_group_membership" "devops" {
  count = 20
  user = aws_iam_user.employees[count.index + 260].name # 260-279
  groups = [aws_iam_group.devops.name]
}

resource "aws_iam_user_group_membership" "security" {
  count = 20
  user = aws_iam_user.employees[count.index + 280].name # 280-299
  groups = [aws_iam_group.security.name]
}
