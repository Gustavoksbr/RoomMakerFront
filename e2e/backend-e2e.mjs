/**
 * Sobe o RoomMakerBack apontado para o banco de TESTES.
 *
 * Existe como script, e não dentro do webServer do Playwright, por dois motivos:
 * o Spring Boot leva ~40s para subir e pagar isso a cada execução tornaria o
 * ciclo insuportável; e um backend que não sobe aqui falha com o erro do Spring
 * na tela, em vez de virar um timeout de navegador sem explicação.
 *
 * A troca de banco é feita sobrescrevendo ROOMMAKER_MONGODB_URI com o valor de
 * ROOMMAKER_MONGODB_URI_TESTES: o application.properties lê a primeira, e é ela
 * que decide onde o e2e escreve.
 *
 *   node e2e/backend-e2e.mjs
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const BACKEND = resolve(AQUI, '..', '..', 'RoomMakerBack');

if (!existsSync(BACKEND)) {
    console.error(`Backend não encontrado em ${BACKEND}.`);
    console.error('Este script espera RoomMakerBack e RoomMakerFront lado a lado.');
    process.exit(1);
}

function lerEnv(caminho) {
    if (!existsSync(caminho)) return {};
    const variaveis = {};
    for (const linha of readFileSync(caminho, 'utf8').split(/\r?\n/)) {
        const corte = linha.indexOf('=');
        if (corte < 0 || linha.trimStart().startsWith('#')) continue;
        variaveis[linha.slice(0, corte).trim()] = linha.slice(corte + 1).trim();
    }
    return variaveis;
}

const env = lerEnv(join(BACKEND, '.env'));
const uriDeTestes = process.env.ROOMMAKER_MONGODB_URI_TESTES ?? env.ROOMMAKER_MONGODB_URI_TESTES;

if (!uriDeTestes) {
    console.error('ROOMMAKER_MONGODB_URI_TESTES não está definida (nem no ambiente, nem no .env do backend).');
    console.error('O e2e não sobe sem ela — rodar contra o banco de produção não é uma opção silenciosa.');
    process.exit(1);
}

const nomeDoBanco = uriDeTestes.match(/\/([^/?]+)(\?|$)/)?.[1] ?? '(desconhecido)';
if (!nomeDoBanco.includes('test')) {
    console.error(`O banco configurado é '${nomeDoBanco}', que não parece ser de testes.`);
    console.error('Abortando: o e2e cria e apaga salas e usuários.');
    process.exit(1);
}

console.log(`Subindo o backend em http://localhost:8080 (banco: ${nomeDoBanco})`);

// Caminho absoluto e entre aspas: no Windows o .bat precisa de shell, e com
// shell o nome relativo não resolve contra o cwd do filho.
const ehWindows = process.platform === 'win32';
const gradlew = join(BACKEND, ehWindows ? 'gradlew.bat' : 'gradlew');

const processo = spawn(
    ehWindows ? `"${gradlew}"` : gradlew,
    ['bootRun', '--console=plain'],
    {
        cwd: BACKEND,
        stdio: 'inherit',
        shell: ehWindows,
        env: {
            ...process.env,
            ...env,
            // A que manda é esta: o application.properties lê ROOMMAKER_MONGODB_URI.
            ROOMMAKER_MONGODB_URI: uriDeTestes,
        },
    },
);

const encerrar = () => processo.kill();
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
processo.on('exit', codigo => process.exit(codigo ?? 0));
