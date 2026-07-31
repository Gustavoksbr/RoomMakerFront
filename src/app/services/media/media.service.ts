import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MediaService {
    private localStream: MediaStream | null = null;
    private audioEnabled: boolean = true;
    private videoEnabled: boolean = true;

    constructor() { }

    /**
     * Inicia a captura de áudio e vídeo do usuário
     */
    async startLocalMedia(): Promise<MediaStream> {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            return this.localStream;
        } catch (error) {
            console.error('Erro ao acessar câmera/microfone:', error);
            throw error;
        }
    }

    /**
     * Para a captura de mídia
     */
    stopLocalMedia(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localStream = null;
        }
    }

    /**
     * Alterna o estado do áudio (mute/unmute)
     */
    toggleAudio(): boolean {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            this.audioEnabled = audioTracks[0]?.enabled ?? false;
        }
        return this.audioEnabled;
    }

    /**
     * Alterna o estado do vídeo (on/off)
     */
    toggleVideo(): boolean {
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            this.videoEnabled = videoTracks[0]?.enabled ?? false;
        }
        return this.videoEnabled;
    }

    /**
     * Retorna o stream local
     */
    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    /**
     * Verifica se o áudio está ativo
     */
    isAudioEnabled(): boolean {
        return this.audioEnabled;
    }

    /**
     * Verifica se o vídeo está ativo
     */
    isVideoEnabled(): boolean {
        return this.videoEnabled;
    }
}
