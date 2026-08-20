import { defineConfig, devices } from '@playwright/test';

/**
 * E2E do xadrez visual.
 *
 * O Playwright sobe só o `ng serve`. O backend fica por sua conta
 * (`npm run e2e:backend`), de propósito: subir o Spring Boot aqui custaria ~40s
 * em CADA execução, e um backend que não sobe viraria um timeout confuso do
 * navegador em vez de um erro de backend legível.
 *
 * Um trabalhador só (`workers: 1`): os testes compartilham o MongoDB de testes
 * e usam nomes de sala únicos, mas o WebSocket é por sala e paralelizar aqui
 * troca velocidade por intermitência — que é o oposto do que se quer de um teste
 * que existe para dar confiança.
 */
export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    expect: {
        // O WebSocket é assíncrono: as asserções esperam o estado chegar em vez
        // de dormir um tempo fixo.
        timeout: 15_000,
    },
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 1 : 0,
    reporter: [['list']],

    use: {
        baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'off',
    },

    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],

    webServer: {
        command: 'npm start -- --port 4200',
        url: 'http://localhost:4200',
        timeout: 180_000,
        reuseExistingServer: true,
    },
});
