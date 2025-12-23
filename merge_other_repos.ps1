# Define repo URLs and base target
$baseRepo = "https://github.com/DefinetlyNotAI/Code_DUMP"
$reposToImport = @(
    "https://github.com/USERNAME/PROJECT_NAME",
)

# Step 1: Clone the base repo
git clone $baseRepo Code_DUMP_MERGED
Set-Location Code_DUMP_MERGED

# Step 2: Add each repo as a remote and pull into a subtree preserving full history
foreach ($repo in $reposToImport) {
    $repoName = ($repo -split "/")[-1]

    Write-Host "`nAdding $repoName as remote..."
    git remote add $repoName $repo

    Write-Host "Fetching $repoName..."
    git fetch $repoName

    # Step 3: Merge repo into a subfolder while keeping all commits
    Write-Host "Merging $repoName into subfolder $repoName using subtree (full history)..."
    git subtree add --prefix=$repoName $repoName main
    # Replace 'main' with 'master' if the repo uses 'master'

    Write-Host "Removing remote $repoName..."
    git remote remove $repoName
}

Write-Host "`nAll repositories imported into subfolders with full commit history preserved."
