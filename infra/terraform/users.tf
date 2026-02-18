locals {
  # Logic to assign groups based on index
  # 0-39: Engineering (40)
  # 40-54: DataScience (15)
  # 55-64: Finance (10)
  # 65-74: HR (10)
  # 75-89: Interns (15)
  # 90-99: Contractors (10)
}

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
  count = 40
  user = aws_iam_user.employees[count.index].name # 0-39
  groups = [aws_iam_group.engineering.name]
}

resource "aws_iam_user_group_membership" "data_science" {
  count = 15
  user = aws_iam_user.employees[count.index + 40].name # 40-54
  groups = [aws_iam_group.data_science.name]
}

resource "aws_iam_user_group_membership" "finance" {
  count = 10
  user = aws_iam_user.employees[count.index + 55].name # 55-64
  groups = [aws_iam_group.finance.name]
}

resource "aws_iam_user_group_membership" "hr" {
  count = 10
  user = aws_iam_user.employees[count.index + 65].name # 65-74
  groups = [aws_iam_group.hr.name]
}

resource "aws_iam_user_group_membership" "interns" {
  count = 15
  user = aws_iam_user.employees[count.index + 75].name # 75-89
  groups = [aws_iam_group.interns.name]
}

resource "aws_iam_user_group_membership" "contractors" {
  count = 10
  user = aws_iam_user.employees[count.index + 90].name # 90-99
  groups = [aws_iam_group.contractors.name]
}
