# Define repo URLs and base target
$baseRepo = "https://github.com/USERNAME/DUMP_PROJECT_NAME"
$reposToImport = @(
    "https://github.com/USERNAME/PROJECT_NAME",

)

# Step 1: Clone the base repo
git clone $baseRepo Code_DUMP_MERGED
Set-Location Code_DUMP_MERGED

# Step 2: For each repo, clone it and move its content into a subfolder
foreach ($repo in $reposToImport) {
    $repoName = ($repo -split "/")[-1]
    $clonePath = "..\$repoName"

    Write-Host "`nCloning $repoName..."
    git clone $repo $clonePath

    Write-Host "Moving $repoName into Code_DUMP_MERGED/$repoName..."
    New-Item -ItemType Directory -Path $repoName | Out-Null
    Copy-Item "$clonePath\*" -Destination $repoName -Recurse -Force

    Write-Host "Cleaning up temporary clone $repoName..."
    Remove-Item $clonePath -Recurse -Force
}

Write-Host "`All repositories copied into 'Code_DUMP_MERGED' as subfolders. No merge conflicts. No pushes done."
