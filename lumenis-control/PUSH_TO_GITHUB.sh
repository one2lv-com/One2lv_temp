#!/bin/bash

echo "🌌 LUMENIS - GitHub Push Helper"
echo "=========================================================="
echo ""

# Check current branch and status
BRANCH=$(git branch --show-current)
COMMITS_AHEAD=$(git rev-list --count origin/$BRANCH..$BRANCH 2>/dev/null || echo "?")

echo "📊 Repository Status:"
echo "  Branch: $BRANCH"
echo "  Commits ahead: $COMMITS_AHEAD"
echo "  Remote: https://github.com/one2lv-com/lumenis-control.git"
echo ""

# Show commits to be pushed
echo "📋 Commits to be pushed:"
echo "----------------------------------------"
git log --oneline origin/$BRANCH..$BRANCH 2>/dev/null || git log --oneline -12
echo ""
echo "=========================================================="
echo ""

# Attempt push
echo "🚀 Attempting to push to GitHub..."
echo ""

# Try direct push
git push origin $BRANCH 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================================="
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "View your repository at:"
    echo "https://github.com/one2lv-com/lumenis-control"
    echo "=========================================================="
else
    echo ""
    echo "=========================================================="
    echo "⚠️  Direct push failed - Authentication required"
    echo "=========================================================="
    echo ""
    echo "🔑 Options to authenticate:"
    echo ""
    echo "Option 1: Use GitHub Personal Access Token"
    echo "  1. Create token at: https://github.com/settings/tokens"
    echo "  2. Set remote with token:"
    echo "     git remote set-url origin https://YOUR_TOKEN@github.com/one2lv-com/lumenis-control.git"
    echo "     git push origin $BRANCH"
    echo ""
    echo "Option 2: Use SSH (if configured)"
    echo "  git remote set-url origin git@github.com:one2lv-com/lumenis-control.git"
    echo "  git push origin $BRANCH"
    echo ""
    echo "Option 3: Push from local machine"
    echo "  1. Clone the repo locally"
    echo "  2. Copy these commits"
    echo "  3. Push from your authenticated environment"
    echo ""
    echo "=========================================================="
fi
