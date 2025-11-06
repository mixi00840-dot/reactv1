$apiServicePath = "lib\core\services\api_service.dart"

# Read the file as an array of lines
$lines = Get-Content $apiServicePath

# Find the line numbers for the first getUserProfile
$startLine = -1
$endLine = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s+/// Get user profile$' -and $startLine -eq -1) {
        $startLine = $i
    }
    if ($startLine -ne -1 -and $lines[$i] -match '^\s+/// Follow/Unfollow user$') {
        $endLine = $i - 1
        break
    }
}

if ($startLine -ne -1 -and $endLine -ne -1) {
    Write-Host "Removing lines $startLine to $endLine (first getUserProfile)"
    
    # Create new content without those lines
    $newContent = @()
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($i -lt $startLine -or $i -gt $endLine) {
            $newContent += $lines[$i]
        }
    }
    
    # Write back
    $newContent | Set-Content $apiServicePath -Encoding UTF8
    Write-Host "Fixed api_service.dart - removed duplicate getUserProfile"
} else {
    Write-Host "Could not find the duplicate getUserProfile method"
}
