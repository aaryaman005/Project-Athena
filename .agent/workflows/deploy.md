---
description: Deploy Project Athena to AWS (ECR + ECS) — requires AWS credentials configured
---

> Prerequisites: AWS CLI configured (`aws configure`), Docker running, ECR repository exists.

## 1. Build & Push Backend Docker Image to ECR

1. Log in to Amazon ECR.
// turbo
2. Run `aws ecr get-login-password --region $env:AWS_DEFAULT_REGION | docker login --username AWS --password-stdin <YOUR_ECR_REGISTRY>` — replace `<YOUR_ECR_REGISTRY>` with your ECR registry URL (e.g. `123456789.dkr.ecr.us-east-1.amazonaws.com`).

3. Build the backend Docker image.
// turbo
4. Run `docker build -t project-athena-backend:latest ./backend` in `c:\Users\aarya\Desktop\Project-Athena`.

5. Tag the image for ECR.
// turbo
6. Run `docker tag project-athena-backend:latest <YOUR_ECR_REGISTRY>/project-athena-backend:latest`.

7. Push the image to ECR.
// turbo
8. Run `docker push <YOUR_ECR_REGISTRY>/project-athena-backend:latest`.

## 2. Build & Deploy Frontend to S3 + CloudFront

9. Build the frontend production bundle.
// turbo
10. Run `npm run build` in `c:\Users\aarya\Desktop\Project-Athena\frontend`.

11. Sync the dist folder to S3.
// turbo
12. Run `aws s3 sync frontend/dist/ s3://<YOUR_S3_BUCKET> --delete` in `c:\Users\aarya\Desktop\Project-Athena` — replace `<YOUR_S3_BUCKET>` with your bucket name.

13. Invalidate the CloudFront cache.
// turbo
14. Run `aws cloudfront create-invalidation --distribution-id <YOUR_CF_DISTRIBUTION_ID> --paths "/*"`.

## 3. Force ECS Service Redeployment

15. Trigger a rolling deploy on ECS.
// turbo
16. Run `aws ecs update-service --cluster athena-cluster --service athena-backend --force-new-deployment`.

17. Report the deployment status to the user.
