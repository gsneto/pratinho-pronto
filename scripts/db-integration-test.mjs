// Runner de testes de integração REAIS de PostgreSQL para o Pratinho Pronto.
//
// Sobe um container Postgres descartável, aplica o shim de auth (papéis +
// auth.uid() + storage), aplica as migrações e executa supabase/tests/*.sql.
// NUNCA toca produção: usa apenas um container Docker local e efêmero.
//
// Uso: node scripts/db-integration-test.mjs
// Requisitos: Docker em execução e as imagens postgres:17 disponíveis.
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const container = `pratinho-pg-test-${Date.now()}`
const migrationsDir = resolve(root, 'supabase/migrations')
const testsDir = resolve(root, 'supabase/tests')

const run = (args, options = {}) => execFileSync('docker', args, { encoding: 'utf8', ...options })

function waitForReady() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      run(['exec', container, 'pg_isready', '-U', 'postgres'])
      return true
    } catch {
      // Espera síncrona de 1s (Atomics.wait) sem depender do SO.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000)
    }
  }
  return false
}

let exitCode = 0
try {
  console.log(`Subindo container descartável ${container} (Postgres 17)...`)
  run(['run', '-d', '--name', container, '-e', 'POSTGRES_PASSWORD=test', '-e', 'POSTGRES_DB=postgres', 'postgres:17'])
  if (!waitForReady()) throw new Error('Postgres não ficou pronto a tempo')

  // Copia migrações, seed e testes para dentro do container.
  run(['exec', container, 'mkdir', '-p', '/sql'])
  run(['cp', migrationsDir + '/.', `${container}:/sql`])
  run(['exec', container, 'mkdir', '-p', '/tests'])
  run(['cp', testsDir + '/.', `${container}:/tests`])
  run(['cp', resolve(root, 'supabase/seed.sql'), `${container}:/seed.sql`])

  // 1) Shim de auth/storage/roles.
  console.log('\nAplicando shim local (auth/roles/storage)...')
  run(['exec', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-f', '/tests/local_shim.sql'])

  // 2) Migrações, uma a uma, reportando OK/FAIL (continua mesmo com falha,
  //    para diagnosticar a ordem sem interromper a suíte de testes).
  console.log('\nAplicando migrações:')
  const migrations = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort()
  const failedMigrations = []
  for (const file of migrations) {
    try {
      run(['exec', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-1', '-f', `/sql/${file}`])
      console.log(`  OK   ${file}`)
    } catch (error) {
      failedMigrations.push(file)
      console.log(`  FAIL ${file}`)
      const stderr = (error.stderr || '').toString().trim().split('\n').slice(-2).join(' ')
      if (stderr) console.log(`       ${stderr}`)
    }
  }

  // 3) Seed (roda depois das migrações, como o Supabase faz em db reset).
  //    Inclui a validação final do catálogo.
  console.log('\nAplicando seed:')
  try {
    run(['exec', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-1', '-f', '/seed.sql'])
    console.log('  OK   seed.sql')
  } catch (error) {
    exitCode = 1
    failedMigrations.push('seed.sql')
    console.log('  FAIL seed.sql')
    console.log((error.stderr || '').toString().trim().split('\n').slice(-3).join('\n'))
  }

  // 4) Testes de integração (SQL com asserts via RAISE; .sh para concorrência).
  console.log('\nExecutando testes de integração:')
  const tests = readdirSync(testsDir)
    .filter((file) => (file.endsWith('.sql') || file.endsWith('.sh')) && file !== 'local_shim.sql')
    .sort()
  for (const file of tests) {
    try {
      // 2>&1 para capturar os NOTICE (PASS) do psql, que vão para stderr.
      const command = file.endsWith('.sh') ? `bash /tests/${file}` : `psql -U postgres -v ON_ERROR_STOP=1 -f /tests/${file}`
      const output = run(['exec', container, 'bash', '-lc', `${command} 2>&1`])
      const pass = (output.match(/PASS /g) || []).length
      const failed = /FAIL |ERROR:/.test(output)
      console.log(`  ${failed ? 'FAIL' : 'OK'}   ${file} (${pass} verificações)`)
      if (failed) {
        exitCode = 1
        console.log(output.split('\n').filter((line) => /FAIL|ERROR:/.test(line)).join('\n'))
      }
    } catch (error) {
      exitCode = 1
      console.log(`  FAIL ${file}`)
      console.log((error.stdout || '').toString())
      console.log((error.stderr || '').toString())
    }
  }

  if (failedMigrations.length) {
    console.log(`\nMigrações que não aplicam em base limpa: ${failedMigrations.join(', ')}`)
  }
} catch (error) {
  exitCode = 1
  console.error('Falha no runner:', error.message)
} finally {
  try {
    run(['rm', '-f', container])
    console.log(`\nContainer ${container} removido.`)
  } catch {
    console.error(`Não foi possível remover o container ${container}.`)
  }
}

process.exit(exitCode)
