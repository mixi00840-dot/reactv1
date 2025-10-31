$files = @(
    "ContentManager.js",
    "Coupons.js",
    "Explorer.js",
    "Featured.js",
    "Levels.js",
    "Livestreams.js",
    "MediaBrowser.js",
    "Moderation.js",
    "Orders.js",
    "Payments.js",
    "PlatformAnalytics.js",
    "Posts.js",
    "SoundManager.js",
    "Stores.js",
    "Stories.js",
    "Tags.js",
    "UserDetails.js",
    "Users.js",
    "Videos.js"
)

foreach ($file in $files) {
    $path = "admin-dashboard\src\pages\$file"
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        # Replace "  }, []);" with "    // eslint-disable-next-line react-hooks/exhaustive-deps`n  }, []);"
        $newContent = $content -replace '(\s+)\}, \[\]\);', "`$1// eslint-disable-next-line react-hooks/exhaustive-deps`n`$1}, []);"
        Set-Content $path $newContent -NoNewline
        Write-Host "Fixed $file"
    }
}

Write-Host "All files processed!"
