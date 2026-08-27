#!/usr/bin/env bash
set -euo pipefail

ENDPOINT=${ENDPOINT:-http://localhost:4000/graphql}

echo "Smoke tests hitting $ENDPOINT"

# 1) Create Base
CREATE_BASE=$(cat <<'GQL'
mutation {
  createBase(input:{name:"Base A", location:"Ville", status:active, coordinates:{latitude:48.85, longitude:2.35, altitude:35}}) {
    id name location
  }
}
GQL
)

echo "== createBase =="
echo "$CREATE_BASE" | jq -R -s '{query:.}' | curl -sS -X POST -H "Content-Type: application/json" -d @- $ENDPOINT | jq '.'

echo "Smoke test script finished. Use the responses to extract IDs and run further tests." 

exit 0
