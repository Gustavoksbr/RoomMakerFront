# 📌 RoomMakerFront

Frontend do **RoomMaker**, desenvolvido em **Angular 18**. Este projeto consome a API do backend `RoomMakerBack` para CRUD de salas online

O sistema permite que usuários **criem, procurem, entrem, saiam e excluam salas**. Cada sala pode ser de diferentes categorias, como **Jogo da Velha**, **Jokenpô** ou **Bate-papo**, e todas possuem um **chat em tempo real via WebSocket**.

Veja a aplicação completa hospedada [aqui](https://room-maker-front.vercel.app/)

Veja o código do Back-end [aqui](https://github.com/Gustavoksbr/RoomMakerBack)

---

## 🔨 Pré-requisitos

Antes de rodar o projeto, instale:

- [Node.js 18+](https://nodejs.org/en/download/)
- [Angular CLI 18+](https://angular.dev/cli)
- [Git](https://git-scm.com/)

Verifique as versões instaladas:
```bash
node -v
npm -v
ng version
```

---

## 📂 Clonando o projeto

```bash
git clone https://github.com/Gustavoksbr/RoomMakerFront.git
cd RoomMakerFront
```

---

## 📦 Instalando dependências

Na raiz do projeto, execute:
```bash
npm install
```

Isso instalará todas as dependências listadas no `package.json`.

---

## ⚙️ Configuração da API

O frontend se conecta ao backend através do arquivo:
```
src/app/services/config/api.config.ts
```

Exemplo:
```ts
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080'
};
```

➡️ Ajuste o valor de `BASE_URL` para a URL do seu backend (ex.: servidor local ou deploy).

⚠️ **Importante:** Verifique se o backend possui o **CORS configurado** para aceitar o domínio do frontend.

---

## ▶️ Rodando o projeto

Após instalar as dependências e configurar a API, rode:
```bash
npm start
```
ou
```bash
ng serve
```

O servidor será iniciado em:  
👉 http://localhost:4200

---

## ⚠️ Observações

- Sempre mantenha o backend rodando antes de acessar o frontend.
- Caso use deploy (ex.: **Vercel**), lembre-se de atualizar o `BASE_URL` para a URL pública do backend.

