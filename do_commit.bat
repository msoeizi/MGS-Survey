@echo off
cd /d "c:\Users\User\Antigravity\MGS survey"
git add -A
git commit -m "fix: hide sidebar on login, set email from address, fix deploy workflow"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
