# 📌 RoomMakerFront

Frontend do **RoomMaker**, desenvolvido em **Angular 18**. Este projeto consome a API do backend [RoomMakerBack](https://github.com/Gustavoksbr/RoomMakerBack) para CRUD de salas online

O sistema permite que usuários **criem, procurem, entrem, saiam e excluam salas**. Cada sala pode ser de diferentes categorias, como **Jogo da Velha**, **Jokenpô** ou só **Bate-papo**, e todas possuem um **chat em tempo real via WebSocket**. O dono também pode escolher ou não uma senha para entrar na sala

Também é possível recuperar senha da conta por email

Veja a aplicação completa hospedada [aqui](https://room-maker-front.vercel.app/)

Veja o código do Back-end [aqui](https://github.com/Gustavoksbr/RoomMakerBack)

---

## 🔨 Pré-requisitos

Antes de rodar o projeto, instale:

- [Node.js 18+](https://nodejs.org/en/download/)
- [Angular CLI 18+](https://angular.dev/cli)
- [Git](https://git-scm.com/)

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



