import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * Google Drive Service (v3) - Pro Expansion
 * Maneja la subida y organización de presupuestos y planos.
 * Requiere un archivo 'config/google_credentials.json' (Service Account).
 */

export class GoogleDriveService {
    private drive;
    private static instance: GoogleDriveService;

    private constructor() {
        const credentialsPath = path.join(process.cwd(), 'config', 'google_credentials.json');
        
        if (fs.existsSync(credentialsPath)) {
            const auth = new google.auth.GoogleAuth({
                keyFile: credentialsPath,
                scopes: ['https://www.googleapis.com/auth/drive.file'],
            });
            this.drive = google.drive({ version: 'v3', auth });
        } else {
            console.warn('[GoogleDrive] No se encontró config/google_credentials.json. El servicio está en modo simulado.');
        }
    }

    public static getInstance() {
        if (!GoogleDriveService.instance) {
            GoogleDriveService.instance = new GoogleDriveService();
        }
        return GoogleDriveService.instance;
    }

    /**
     * Crea una estructura de carpetas para el proyecto: [ESTUDIO] / [OBRA] / [VERSION]
     */
    async createFolderStructure(estudioId: string, obra: string): Promise<string | null> {
        if (!this.drive) return null;

        try {
            // 1. Buscar o crear carpeta del Estudio (Raíz)
            const studioFolderId = await this.getOrCreateFolder(estudioId, 'root');
            
            // 2. Crear carpeta de la Obra
            const obraFolderId = await this.getOrCreateFolder(obra, studioFolderId);
            
            return obraFolderId;
        } catch (error) {
            console.error('[GoogleDrive] Error creando carpetas:', error);
            return null;
        }
    }

    private async getOrCreateFolder(name: string, parentId: string): Promise<string> {
        const query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
        const res = await this.drive!.files.list({ q: query, fields: 'files(id, name)' });
        
        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!;
        }

        const fileMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId === 'root' ? [] : [parentId]
        };

        const folder = await this.drive!.files.create({
            requestBody: fileMetadata,
            fields: 'id'
        });

        return folder.data.id!;
    }

    /**
     * Sube un archivo a Drive
     */
    async uploadFile(filePath: string, fileName: string, parentId: string) {
        if (!this.drive) return;

        const fileMetadata = {
            name: fileName,
            parents: [parentId]
        };
        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(filePath)
        };

        try {
            const file = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id'
            });
            return file.data.id;
        } catch (error) {
            console.error('[GoogleDrive] Error subiendo archivo:', error);
        }
    }
}

export const driveService = GoogleDriveService.getInstance();
