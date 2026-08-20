import { APIRequestContext, Browser, Page, request } from '@playwright/test';

/**
 * Preparação de cenário do RoomMaker, feita por API.
 *
 * Criar usuário e sala pela TELA custaria uns 15 segundos por cenário e traria
 * junto todo o risco de flake dos formulários — que não têm nada a ver com o que
 * estes testes existem para provar. A interface só é exercitada onde ela é o
 * assunto: o tabuleiro.
 *
 * O que NÃO pode ser atalhado por API é o lance em si. É justamente o contrato
 * entre o WebSocket do navegador e o do servidor que nenhum teste unitário
 * alcança — se o front mandasse `promotion` onde o back espera `promocao`, os
 * 324 testes das duas suítes continuariam verdes.
 */

const API = process.env['E2E_API_URL'] ?? 'http://localhost:8080';
/** Precisa bater com AuthService.STORAGE_PREFIX. */
const PREFIXO_STORAGE = 'roommaker_';

export interface Usuario {
    readonly username: string;
    readonly senha: string;
    readonly token: string;
}

export interface Sala {
    readonly nome: string;
    readonly usernameDono: string;
    readonly senha: string;
}

/** Sufixo único por execução, para dois testes nunca disputarem a mesma sala. */
export function sufixoUnico(): string {
    return Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 900 + 100);
}

export async function apiContext(): Promise<APIRequestContext> {
    return request.newContext({ baseURL: API });
}

/** Cadastra um usuário descartável. O /cadastro já devolve o JWT. */
export async function criarUsuario(api: APIRequestContext, prefixo: string): Promise<Usuario> {
    const username = `${prefixo}${sufixoUnico()}`.slice(0, 15);
    const senha = 'e2eSenha123';

    const resposta = await api.post('/cadastro', {
        data: {
            username,
            password: senha,
            email: `${username}@e2e.local`,
            descricao: 'usuario de teste e2e',
        },
    });

    if (!resposta.ok()) {
        throw new Error(`Falha ao cadastrar ${username}: ${resposta.status()} ${await resposta.text()}`);
    }

    const corpo = await resposta.json();
    return { username, senha, token: corpo.token ?? corpo.jwt ?? corpo.accessToken };
}

export async function criarSalaXadrez(api: APIRequestContext, dono: Usuario): Promise<Sala> {
    const nome = `xadrez${sufixoUnico()}`.slice(0, 15);
    const senha = 'e2e';

    const resposta = await api.post('/salas', {
        headers: { Authorization: `Bearer ${dono.token}` },
        data: { nome, categoria: 'xadrez', senha, qtdCapacidade: 2 },
    });

    if (!resposta.ok()) {
        throw new Error(`Falha ao criar sala: ${resposta.status()} ${await resposta.text()}`);
    }
    return { nome, usernameDono: dono.username, senha };
}

export async function entrarNaSala(api: APIRequestContext, sala: Sala, convidado: Usuario): Promise<void> {
    const resposta = await api.post(`/salas/${sala.usernameDono}/${sala.nome}`, {
        headers: { Authorization: `Bearer ${convidado.token}` },
        data: { senha: sala.senha },
    });

    if (!resposta.ok()) {
        throw new Error(`Falha ao entrar na sala: ${resposta.status()} ${await resposta.text()}`);
    }
}

export async function apagarSala(api: APIRequestContext, sala: Sala, dono: Usuario): Promise<void> {
    // Melhor esforço: um cenário que já falhou não deve falhar de novo na faxina
    // e esconder o erro de verdade.
    await api.delete(`/salas/${sala.usernameDono}/${sala.nome}`, {
        headers: { Authorization: `Bearer ${dono.token}` },
    }).catch(() => undefined);
}

/**
 * Abre uma aba já autenticada como este usuário.
 *
 * A sessão é semeada com `addInitScript`, que roda ANTES de qualquer script da
 * página: o Angular sobe já encontrando o token no localStorage, sem passar por
 * tela de login nem por um estado intermediário de "deslogado".
 */
export async function abrirComoUsuario(browser: Browser, usuario: Usuario): Promise<Page> {
    const contexto = await browser.newContext();
    await contexto.addInitScript(
        ([prefixo, token, username]) => {
            localStorage.setItem(`${prefixo}token`, token);
            localStorage.setItem(`${prefixo}username`, username);
        },
        [PREFIXO_STORAGE, usuario.token, usuario.username] as const,
    );
    return contexto.newPage();
}

/** Navega para a sala e espera o componente de xadrez aparecer. */
export async function irParaSala(page: Page, sala: Sala): Promise<void> {
    await page.goto(`/salas/${sala.usernameDono}/${sala.nome}`);
    await page.locator('app-xadrez').waitFor({ state: 'visible' });
}
