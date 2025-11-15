# API Endpoint Testing Script
$baseUrl = "http://localhost:3000/api"
$results = @()

Write-Host "=== Testing API Endpoints ===" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "  $Method $Endpoint" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "  SUCCESS" -ForegroundColor Green
        $script:results += [PSCustomObject]@{
            Endpoint = "$Method $Endpoint"
            Status = "PASS"
            Description = $Description
        }
        return $response
    }
    catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $script:results += [PSCustomObject]@{
            Endpoint = "$Method $Endpoint"
            Status = "FAIL"
            Description = $Description
            Error = $_.Exception.Message
        }
        return $null
    }
    finally {
        Write-Host ""
    }
}

# Test Authentication Endpoints
Write-Host "`n--- Authentication Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Method "POST" -Endpoint "/auth/send-otp" -Body @{email="test@example.com"} -Description "Send OTP"

# Test Store Endpoints
Write-Host "`n--- Store Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Endpoint "/stores" -Description "Get all stores"

# Test Product Endpoints
Write-Host "`n--- Product Endpoints ---" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Endpoint "/products" -Description "Get all products"
Test-Endpoint -Method "GET" -Endpoint "/products/store/1" -Description "Get products by store ID"

# Test Transaction Endpoints (basic structure test)
Write-Host "`n--- Transaction Endpoints ---" -ForegroundColor Magenta
Write-Host "Note: Transaction endpoints require authentication and valid data" -ForegroundColor Gray

# Display Summary
Write-Host "`n`n=== Test Summary ===" -ForegroundColor Cyan
$script:results | Format-Table -AutoSize

$passed = ($script:results | Where-Object {$_.Status -eq "PASS"}).Count
$failed = ($script:results | Where-Object {$_.Status -eq "FAIL"}).Count
$total = $script:results.Count

Write-Host "`nTotal Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
