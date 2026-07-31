import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MediaService } from '../../../../../services/media/media.service';
import { NgClass, NgIf } from '@angular/common';

@Component({
    selector: 'app-video-local',
    standalone: true,
    imports: [NgIf, NgClass],
    templateUrl: './video-local.component.html',
    styleUrl: './video-local.component.scss'
})
export class VideoLocalComponent implements OnDestroy {
    @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

    public mediaIniciada: boolean = false;
    public audioAtivo: boolean = true;
    public videoAtivo: boolean = true;
    public erro: string | null = null;
    public carregando: boolean = false;

    constructor(private mediaService: MediaService) { }

    ngOnDestroy(): void {
        this.pararMedia();
    }

    async iniciarMedia(): Promise<void> {
        try {
            this.carregando = true;
            this.erro = null;

            console.log('🎥 Solicitando acesso à câmera e microfone...');

            // Para o stream anterior se existir
            const streamAnterior = this.mediaService.getLocalStream();
            if (streamAnterior) {
                streamAnterior.getTracks().forEach(track => track.stop());
            }

            // Obtém novo stream
            const stream = await this.mediaService.startLocalMedia();

            console.log('✅ Stream obtido com sucesso');
            console.log('📹 Video tracks:', stream.getVideoTracks().map(t => `${t.label} (enabled: ${t.enabled})`));
            console.log('🎤 Audio tracks:', stream.getAudioTracks().map(t => `${t.label} (enabled: ${t.enabled})`));

            // Aguarda o elemento estar disponível
            setTimeout(() => {
                if (!this.videoElement?.nativeElement) {
                    console.error('❌ Elemento de vídeo não encontrado');
                    this.erro = 'Erro ao inicializar o elemento de vídeo';
                    this.carregando = false;
                    return;
                }

                const video = this.videoElement.nativeElement;

                // Atribui o stream ao vídeo
                video.srcObject = stream;

                // Listener para quando os metadados estiverem carregados
                video.addEventListener('loadedmetadata', () => {
                    console.log('✅ Metadados carregados, iniciando reprodução...');
                    video.play()
                        .then(() => {
                            console.log('✅ Vídeo reproduzindo com sucesso!');
                            this.mediaIniciada = true;
                            this.audioAtivo = this.mediaService.isAudioEnabled();
                            this.videoAtivo = this.mediaService.isVideoEnabled();
                            this.carregando = false;
                        })
                        .catch(err => {
                            console.error('❌ Erro ao reproduzir vídeo:', err);
                            this.erro = 'Erro ao reproduzir vídeo: ' + err.message;
                            this.carregando = false;
                        });
                }, { once: true });

            }, 100);

        } catch (error: any) {
            console.error('❌ Erro ao iniciar mídia:', error);
            this.carregando = false;

            if (error.name === 'NotAllowedError') {
                this.erro = 'Permissão negada pelo sistema! Por favor, permita o acesso à câmera e microfone.';
                alert('Permissão negada! Clique no ícone de cadeado na barra de endereço e permita o acesso à câmera e microfone.');
            } else if (error.name === 'NotFoundError') {
                this.erro = 'Câmera ou microfone não encontrados.';
                alert('Câmera ou microfone não encontrados. Conecte um dispositivo e tente novamente.');
            } else if (error.name === 'NotReadableError') {
                this.erro = 'Câmera ou microfone já está em uso por outro aplicativo.';
                alert('Câmera já está em uso. Feche outros aplicativos que possam estar usando a câmera.');
            } else {
                this.erro = error.message || 'Erro desconhecido ao acessar câmera/microfone';
                alert('Erro: ' + this.erro);
            }

            this.mediaIniciada = false;
        }
    }

    pararMedia(): void {
        console.log('🛑 Parando mídia...');

        // Para todos os tracks do stream
        const stream = this.mediaService.getLocalStream();
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log(`🛑 Track parado: ${track.kind} - ${track.label}`);
            });
        }

        this.mediaService.stopLocalMedia();

        if (this.videoElement?.nativeElement) {
            const video = this.videoElement.nativeElement;
            video.pause();
            video.srcObject = null;
        }

        this.mediaIniciada = false;
        console.log('✅ Mídia parada com sucesso');
    }

    alternarAudio(): void {
        this.audioAtivo = this.mediaService.toggleAudio();
        console.log('🎤 Áudio:', this.audioAtivo ? 'ON' : 'OFF');
    }

    alternarVideo(): void {
        this.videoAtivo = this.mediaService.toggleVideo();
        console.log('📹 Vídeo:', this.videoAtivo ? 'ON' : 'OFF');
    }

    recarregarVideo(): void {
        if (this.videoElement?.nativeElement) {
            const video = this.videoElement.nativeElement;
            const src = video.src;
            video.src = src;
            console.log('🔄 Vídeo recarregado');
        }
    }

    get statusMensagem(): string {
        if (this.carregando) {
            return 'Carregando...';
        }

        if (!this.mediaIniciada) {
            return 'Aguardando acesso à webcam...';
        }

        const partes: string[] = [];

        if (!this.videoAtivo) {
            partes.push('Câmera desligada');
        }

        if (!this.audioAtivo) {
            partes.push('Microfone mudo');
        }

        if (partes.length === 0) {
            return 'Transmitindo vídeo ao vivo da Webcam...';
        }

        return partes.join(' | ');
    }
}
