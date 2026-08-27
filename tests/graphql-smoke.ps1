$graphql = 'http://localhost:4000/graphql'
function Invoke-GraphQL($query) {
  $body = @{ query = $query } | ConvertTo-Json
  try {
    $res = Invoke-RestMethod -Uri $graphql -Method Post -Body $body -ContentType 'application/json'
    return $res
  } catch {
    return @{ error = $_.Exception.Message; response = $_.ErrorDetails }
  }
}

Write-Output "== Smoke test: create base 'flane' @ 'pointe noire' =="
$query1 = 'mutation { createBase(input: { name: "flane", location: "pointe noire", status: inactive }) { id name location status } }'
$res1 = Invoke-GraphQL $query1
$res1 | ConvertTo-Json -Depth 5

Write-Output "`n== Create same name, different location 'libreville' (should succeed) =="
$query2 = 'mutation { createBase(input: { name: "flane", location: "libreville", status: inactive }) { id name location status } }'
$res2 = Invoke-GraphQL $query2
$res2 | ConvertTo-Json -Depth 5

Write-Output "`n== Create same name, same location 'pointe noire' (should fail) =="
$query3 = 'mutation { createBase(input: { name: "flane", location: "pointe noire", status: inactive }) { id name location status } }'
$res3 = Invoke-GraphQL $query3
$res3 | ConvertTo-Json -Depth 5

Write-Output "`nSmoke test finished."
