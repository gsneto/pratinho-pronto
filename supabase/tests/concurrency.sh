#!/usr/bin/env bash
# Teste de concorrência: dois workers substituem a MESMA lista ao mesmo tempo.
# O worker A segura o lock da linha e espera; o B bloqueia até A commitar e,
# então, substitui a lista inteira. Espera-se uma substituição completa (sem
# mistura) e sem duplicatas.
set -u
PSQL="psql -U postgres -v ON_ERROR_STOP=1 -q"

if ! $PSQL -f /tests/concurrency/setup.sql > /tmp/cc_setup.log 2>&1; then
  echo "FAIL concurrency: setup"
  cat /tmp/cc_setup.log
  exit 1
fi

$PSQL -f /tests/concurrency/a.sql > /tmp/cc_a.log 2>&1 &
( sleep 0.3; $PSQL -f /tests/concurrency/b.sql > /tmp/cc_b.log 2>&1 ) &
wait

if grep -qE "ERROR|FATAL" /tmp/cc_a.log /tmp/cc_b.log; then
  echo "FAIL concurrency: erro nos workers"
  cat /tmp/cc_a.log /tmp/cc_b.log
  exit 1
fi

$PSQL -f /tests/concurrency/verify.sql 2>&1
