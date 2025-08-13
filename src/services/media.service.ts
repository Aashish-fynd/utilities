import { v1 as SpeechV1, protos as SpeechProtos } from '@google-cloud/speech';
import { TextToSpeechClient, protos as TTSProtos } from '@google-cloud/text-to-speech';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger.js';
import { ExternalServiceError } from '@/utils/errors.js';

export interface TranscribeParams {
	audio: string; // base64
	encoding: 'LINEAR16' | 'MP3' | 'OGG_OPUS' | 'MULAW' | 'ALAW';
	sampleRateHertz: number;
	languageCode?: string;
}

export interface SynthesizeParams {
	text: string;
	voice?: { languageCode?: string; name?: string };
	audioConfig?: {
		audioEncoding?: 'MP3' | 'OGG_OPUS' | 'LINEAR16';
		speakingRate?: number;
		pitch?: number;
		volumeGainDb?: number;
	};
}

export class MediaService {
	private speechClient: SpeechV1.SpeechClient;
	private ttsClient: TextToSpeechClient;

	constructor() {
		this.speechClient = new SpeechV1.SpeechClient();
		this.ttsClient = new TextToSpeechClient();
	}

	async transcribe(params: TranscribeParams): Promise<{ id: string; text: string; alternatives: Array<{ text: string; confidence?: number }>; metadata: any }>{
		try {
			const request: SpeechProtos.google.cloud.speech.v1.IRecognizeRequest = {
				config: {
					encoding: params.encoding as any,
					sampleRateHertz: params.sampleRateHertz,
					languageCode: params.languageCode || 'en-US',
					enableAutomaticPunctuation: true,
				},
				audio: {
					content: params.audio,
				},
			};

			logger.info('Calling Google Speech-to-Text');
			const [response] = await this.speechClient.recognize(request);

			const alternatives: Array<{ text: string; confidence?: number }> = [];
			let bestText = '';
			if (response.results) {
				for (const result of response.results) {
					if (result.alternatives && result.alternatives.length > 0) {
						const top = result.alternatives[0];
						alternatives.push({ text: top.transcript || '', confidence: top.confidence || undefined });
						if (!bestText && top.transcript) bestText = top.transcript;
					}
				}
			}

			const id = uuidv4();
			return {
				id,
				text: bestText,
				alternatives,
				metadata: {
					provider: 'google',
					service: 'speech-to-text',
					timestamp: new Date().toISOString(),
				},
			};
		} catch (error) {
			logger.error('Error transcribing audio:', error);
			throw new ExternalServiceError(
				`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async synthesize(params: SynthesizeParams): Promise<{ id: string; audioContent: string; mimeType: string; metadata: any }>{
		try {
			const request: TTSProtos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
				input: { text: params.text },
				voice: {
					languageCode: params.voice?.languageCode || 'en-US',
					name: params.voice?.name,
				},
				audioConfig: {
					audioEncoding: (params.audioConfig?.audioEncoding || 'MP3') as any,
					speakingRate: params.audioConfig?.speakingRate,
					pitch: params.audioConfig?.pitch,
					volumeGainDb: params.audioConfig?.volumeGainDb,
				},
			};

			logger.info('Calling Google Text-to-Speech');
			const [response] = await this.ttsClient.synthesizeSpeech(request);
			const audioContent = response.audioContent ? Buffer.from(response.audioContent as any).toString('base64') : '';

			const mimeType = this.getMimeType((request.audioConfig?.audioEncoding as string) || 'MP3');
			const id = uuidv4();
			return {
				id,
				audioContent,
				mimeType,
				metadata: {
					provider: 'google',
					service: 'text-to-speech',
					timestamp: new Date().toISOString(),
				},
			};
		} catch (error) {
			logger.error('Error synthesizing speech:', error);
			throw new ExternalServiceError(
				`Failed to synthesize speech: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private getMimeType(encoding: string): string {
		switch (encoding) {
			case 'OGG_OPUS':
				return 'audio/ogg';
			case 'LINEAR16':
				return 'audio/wav';
			case 'MP3':
			default:
				return 'audio/mpeg';
		}
	}
}

export const mediaService = new MediaService();