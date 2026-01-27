@echo off
REM Automated Vercel Deployment Script for NextBanker (Windows)
REM This script automates the deployment process to Vercel

echo.
echo ========================================
echo NextBanker - Automated Vercel Deployment
echo ========================================
echo.

REM Check if vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Vercel CLI not found. Installing...
    call npm install -g vercel
    echo [SUCCESS] Vercel CLI installed
)

echo.
echo [Step 1] Building application locally...
echo.
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed. Please fix errors before deploying.
    pause
    exit /b 1
)

echo [SUCCESS] Build successful
echo.

echo [Step 2] Checking git status...
echo.

git status --short > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f %%i in ('git status --short') do set HAS_CHANGES=1
)

if defined HAS_CHANGES (
    echo [WARNING] You have uncommitted changes
    git status --short
    echo.
    set /p COMMIT_CHOICE="Do you want to commit these changes? (y/n): "

    if /i "%COMMIT_CHOICE%"=="y" (
        set /p COMMIT_MSG="Enter commit message: "
        git add .
        git commit -m "%COMMIT_MSG%"

        echo Pushing to GitHub...
        git push origin main
        echo [SUCCESS] Changes committed and pushed
    ) else (
        echo [WARNING] Continuing with uncommitted changes...
    )
) else (
    echo [SUCCESS] Working directory clean
)

echo.
echo [Step 3] Checking environment variables...
echo.
echo Required environment variables for Vercel:
echo   - DATABASE_URL
echo   - SESSION_SECRET
echo   - SMTP_HOST
echo   - SMTP_PORT
echo   - SMTP_SECURE
echo   - SMTP_USER
echo   - SMTP_PASSWORD
echo   - SMTP_FROM_NAME
echo   - SMTP_FROM_EMAIL
echo.
echo [IMPORTANT] Make sure these are set in Vercel dashboard!
echo Visit: https://vercel.com/your-project/settings/environment-variables
echo.
set /p ENV_READY="Have you added all environment variables in Vercel? (y/n): "

if /i not "%ENV_READY%"=="y" (
    echo.
    echo Please add environment variables first:
    echo 1. Go to https://vercel.com
    echo 2. Select your project
    echo 3. Go to Settings - Environment Variables
    echo 4. Add each variable from your .env file
    echo 5. Re-run this script
    pause
    exit /b 0
)

echo.
echo [Step 4] Deploying to Vercel...
echo.
echo Choose deployment type:
echo 1) Preview deployment (for testing)
echo 2) Production deployment
echo.
set /p DEPLOY_CHOICE="Enter choice (1 or 2): "

if "%DEPLOY_CHOICE%"=="2" (
    echo Deploying to PRODUCTION...
    call vercel --prod
) else (
    echo Creating PREVIEW deployment...
    call vercel
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo [SUCCESS] Deployment Successful!
    echo ==========================================
    echo.
    echo Next steps:
    echo 1. Visit your deployment URL (shown above)
    echo 2. Test login functionality
    echo 3. Create admin account if needed
    echo 4. Verify database connection
    echo 5. Test email notifications
    echo.
    echo View logs: https://vercel.com/dashboard
) else (
    echo.
    echo ==========================================
    echo [ERROR] Deployment Failed
    echo ==========================================
    echo.
    echo Troubleshooting:
    echo 1. Check build logs above for errors
    echo 2. Verify environment variables in Vercel
    echo 3. Check Vercel dashboard for detailed logs
    echo 4. Ensure all dependencies are in package.json
    pause
    exit /b 1
)

echo.
pause
