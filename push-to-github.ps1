# GitHub Push Script
# Replace YOUR_GITHUB_USERNAME and YOUR_REPO_NAME with your actual values

Write-Host "Setting up GitHub remote..." -ForegroundColor Green

# Add your GitHub repository URL here
$repoUrl = "https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git"

# Add remote (if not already added)
git remote add origin $repoUrl 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote might already exist, trying to set URL..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
}

# Check current branch
$branch = git branch --show-current
if ([string]::IsNullOrEmpty($branch)) {
    $branch = "main"
    git branch -M main
}

Write-Host "Current branch: $branch" -ForegroundColor Cyan

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push -u origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "Push failed. Make sure:" -ForegroundColor Red
    Write-Host "1. You have a GitHub repository created" -ForegroundColor Yellow
    Write-Host "2. You're authenticated with GitHub (use: gh auth login)" -ForegroundColor Yellow
    Write-Host "3. The repository URL is correct" -ForegroundColor Yellow
}

