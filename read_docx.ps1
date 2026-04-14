Add-Type -AssemblyName System.IO.Compression.FileSystem
$path = "c:\Users\Almas\Downloads\website content.docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlStr = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

# Strip XML tags to get raw text
$text = $xmlStr -replace '<w:p[ >]', "`n<w:p"
$text = $text -replace '<[^>]+>', ''
Write-Output $text
