import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import * as stream from 'stream';

type PartialDriveFile = {
  id: string;
  name: string;
};

type SearchResultResponse = {
  kind: 'drive#fileList';
  nextPageToken: string;
  incompleteSearch: boolean;
  files: PartialDriveFile[];
};

@Injectable()
export class GdriveService {
  private driveClient: any;

  constructor(private readonly configService: ConfigService) {
    this.driveClient = this.createDriveClient(
      this.configService.getOrThrow('drive.clientId'),
      this.configService.getOrThrow('drive.clientSecret'),
      this.configService.getOrThrow('drive.redirectUri'),
      this.configService.getOrThrow('drive.refreshToken'),
    );
  }

  private createDriveClient(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    refreshToken: string,
  ) {
    const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    client.setCredentials({ refresh_token: refreshToken });
    return google.drive({
      version: 'v3',
      auth: client,
    });
  }

  createFolder(folderName: string): Promise<PartialDriveFile> {
    return this.driveClient.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id, name',
    });
  }

  searchFolder(folderName: string): Promise<PartialDriveFile | null> {
    return new Promise((resolve, reject) => {
      this.driveClient.files.list(
        {
          q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
          fields: 'files(id, name)',
        },
        (err: unknown, res: { data: SearchResultResponse }) => {
          if (err as Error) {
            return reject(err);
          }

          return resolve(res.data.files ? res.data.files[0] : null);
        },
      );
    });
  }

  async getFileUrl(fileId: string): Promise<string> {
    const response = await this.driveClient.files.get({
      fileId,
      fields: 'webViewLink',
    });

    const imageUrl = response.data.webViewLink;
    return imageUrl;
  }

  // <img src="https://drive.google.com/uc?id=1b3MwYbi8osTZgPs8QbNkaGHuAWI00i60"/>

  async saveFile(file: Express.Multer.File, folderId: string) {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);
    const createdFile = await this.driveClient.files.create({
      requestBody: {
        name: file.originalname,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
    });

    await this.driveClient.permissions.create({
      fileId: createdFile.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return createdFile.data.id;
  }

  async deleteFile(fileId: string) {
    await this.driveClient.files.delete({
      fileId,
    });
    return;
  }
}
