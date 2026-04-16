#!/usr/bin/env bash
# T027 — Load test para SC-003: GET /api/v1/availability con 50 usuarios concurrentes
# Requiere: npm install -g autocannon
# Uso: bash tests/load-availability.sh [BASE_URL]

BASE_URL="${1:-http://localhost:3000}"
ENDPOINT="$BASE_URL/api/v1/availability?fecha_inicio=$(date -v+7d +%Y-%m-%d)&fecha_fin=$(date -v+10d +%Y-%m-%d)"

echo "=== Load Test: GET /api/v1/availability ==="
echo "URL: $ENDPOINT"
echo "Concurrencia: 50 | Duración: 10s"
echo ""

npx autocannon -c 50 -d 10 --json "$ENDPOINT" | tee /tmp/load-result.json

echo ""
echo "=== Resultados ==="
node -e "
const r = require('/tmp/load-result.json');
const p95 = r.latency.p97_5 || r.latency['97.5'];
console.log('Requests/s:', r.requests.average);
console.log('p50 latency:', r.latency.p50, 'ms');
console.log('p95 latency:', r.latency.p95, 'ms');
console.log('p99 latency:', r.latency.p99, 'ms');
console.log('Errors:', r.errors);
console.log('');
if (r.latency.p95 <= 1000) {
  console.log('✓ PASS: p95 < 1000ms (SC-003 cumplido)');
} else {
  console.log('✗ FAIL: p95 =', r.latency.p95, 'ms (SC-003 requiere < 1000ms)');
  process.exit(1);
}
"
