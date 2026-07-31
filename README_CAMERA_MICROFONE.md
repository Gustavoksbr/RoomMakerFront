# 📹 Implementação de Câmera e Microfone - Branch testando-camera-e-microfone

## ✅ O que foi implementado

Foi criado um sistema de câmera e microfone LOCAL (apenas o próprio usuário pode ver/ouvir) dentro das salas do RoomMaker.

### Arquivos Criados/Modificados:

1. **Serviço de Mídia** (`src/app/services/media/media.service.ts`)
   - Gerencia acesso à câmera e microfone
   - Controla mute/unmute de áudio e vídeo
   - Usa WebRTC API (getUserMedia)

2. **Componente de Vídeo Local** (`src/app/components/salas/entrar-sala/dentro-da-sala/video-local/`)
   - `video-local.component.ts` - Lógica do componente
   - `video-local.component.html` - Interface do usuário
   - `video-local.component.scss` - Estilos

3. **Integração** (`dentro-da-sala.component.*`)
   - Componente de vídeo integrado na página da sala
   - Aparece para todos os usuários, mas cada um vê apenas sua própria câmera

## 🔧 Como Testar

### 1. Compilar e Executar
```bash
cd RoomMakerFront
npm run build
npm start
```

### 2. Acessar uma Sala
- Faça login
- Entre em qualquer sala
- Você verá a seção "📹 Minha Câmera e Microfone"

### 3. Ativar Câmera
- Clique no botão "🎥 Ligar Câmera e Microfone"
- O navegador vai pedir permissão para acessar câmera/microfone
- **IMPORTANTE**: Permita o acesso

### 4. Controles Disponíveis
- 🎤 **Microfone** - Liga/desliga áudio
- 📹 **Câmera** - Liga/desliga vídeo
- 🛑 **Desligar Tudo** - Para completamente a captura

## 🐛 Debug - Se a Câmera Aparecer Preta

### Abra o Console do Navegador (F12)

Você deverá ver mensagens como:
```
🎥 Solicitando acesso à câmera e microfone...
✅ Stream obtido com sucesso
📹 Video tracks: DroidCam Source 2 (enabled: true)
🎤 Audio tracks: Microphone (DroidCam Virtual Audio) (enabled: true)
📹 Configurando elemento de vídeo...
📹 Stream tracks: video: DroidCam Source 2, audio: Microphone (DroidCam Virtual Audio)
✅ Metadata carregado
✅ Vídeo reproduzindo
```

### Possíveis Problemas:

#### 1. **Câmera em uso por outro aplicativo**
- Erro: `NotReadableError` ou `Could not start video source`
- Solução: Feche outros programas usando a câmera (Skype, Teams, OBS, etc.)

#### 2. **DroidCam não está transmitindo**
- Abra o aplicativo DroidCam Client no PC
- Conecte seu celular
- Verifique se está transmitindo ANTES de clicar no botão da sala

#### 3. **Permissão negada**
- Erro: `NotAllowedError`
- Solução: Verifique as permissões do navegador (ícone de cadeado na barra de endereço)
- Permita câmera e microfone para `localhost`

#### 4. **Vídeo preto mas áudio funciona**
- Verifique no console se há erro: `DOMException: Could not start video source`
- Reinicie o DroidCam Client
- Reinicie o navegador
- Tente outro navegador (Chrome, Edge, Firefox)

#### 5. **Elemento de vídeo não disponível**
- Erro: `⚠️ Elemento de vídeo não disponível`
- Aguarde alguns segundos e tente novamente
- Isso pode acontecer se você clicar muito rápido

### Testando com Câmera Real

Se você tiver uma webcam real (não DroidCam):
1. Desconecte o DroidCam
2. Conecte sua webcam USB
3. Acesse a sala e clique no botão
4. Deve funcionar normalmente

### Verificar Dispositivos Disponíveis

Cole no console do navegador:
```javascript
navigator.mediaDevices.enumerateDevices().then(devices => {
  console.log('📹 Dispositivos disponíveis:');
  devices.forEach(device => {
    console.log(`${device.kind}: ${device.label}`);
  });
});
```

## 🎯 Próximos Passos

Esta é uma implementação LOCAL para teste. Os próximos passos seriam:

1. **Integrar WebRTC para transmissão**
   - Usar Agora.io, WebRTC nativo, ou outra biblioteca
   - Permitir que usuários vejam/ouçam uns aos outros

2. **Melhorar UI**
   - Grid de vídeos de múltiplos usuários
   - Indicador de quem está falando
   - Layouts diferentes (galeria, apresentador, etc.)

3. **Configurações avançadas**
   - Seleção de dispositivo de entrada
   - Qualidade de vídeo
   - Filtros e efeitos

## 📝 Notas Técnicas

- **API Usada**: WebRTC `getUserMedia()`
- **Compatibilidade**: Chrome, Edge, Firefox, Safari modernos
- **HTTPS Necessário**: Em produção, HTTPS é obrigatório para getUserMedia
- **Localhost**: Funciona em HTTP durante desenvolvimento

## 🔐 Segurança e Privacidade

- O stream NUNCA sai do navegador do usuário nesta versão
- Nenhum vídeo é gravado ou transmitido
- Ao sair da sala, todo o stream é encerrado automaticamente
- Permissões devem ser concedidas pelo usuário

## ❓ Perguntas Frequentes

**P: Por que a câmera não aparece?**
R: Veja a seção de Debug acima. Geralmente é problema de permissão ou dispositivo em uso.

**P: O áudio está sendo capturado?**
R: Sim, mas está mutado (`muted=true`) para evitar eco, já que não há transmissão ainda.

**P: Outros usuários podem me ver?**
R: NÃO. Esta é uma versão LOCAL de teste. Apenas você vê sua câmera.

**P: Funciona em produção (Vercel)?**
R: Funciona, mas precisa de HTTPS. O Vercel fornece HTTPS automaticamente.
