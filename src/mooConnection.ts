import * as net from 'net';
import * as vscode from 'vscode';

export class MooConnection {
    private socket: net.Socket;
    private dataCallback: ((data: string) => void) | undefined;
    private styleCallback: ((url: string) => void) | undefined;
    private fugueEditDocument: vscode.TextDocument | undefined;
    private isFugueEditActive: boolean = false;
    private messageQueue: string[] = [];
    private isProcessingQueue: boolean = false;

    constructor(host: string, port: number) {
        this.socket = new net.Socket();
        
        this.socket.connect(port, host, () => {
            console.log('Connected to MOO server');
        });

        this.socket.on('data', (data) => {
            // split data on newline characters
            const messages = data.toString().split('\n');
            
            for (const message of messages) {
                if (message.trim() !== '') {
                    this.messageQueue.push(message);
                }
            }
            this.processQueue();
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            if (this.dataCallback) {
                this.dataCallback('Error: ' + error.message);
            }
        });
    }

    public sendCommand(command: string) {
        console.log('Sending command:', command);
        this.socket.write(command + '\n'); // Ensure newline character is correct
    }

    public onData(callback: (data: string) => void) {
        this.dataCallback = callback;
    }

    public onStyle(callback: (url: string) => void) {
        this.styleCallback = callback;
    }

    public disconnect() {
        this.socket.destroy();
    }

    private extractAndSendStyleUrl(message: string) {
        const styleRegex = /!@style:url:(.+?)(?=.less)/;
        const match = message.match(styleRegex);
        
        if (match && this.styleCallback) {
            this.styleCallback(match[1] + ".less");
        }
    }

    private async handleFugueEditMessage(message: string) {
        const content = message.replace('FugueEdit >', '');
        
        if (content.trim().startsWith('@program')) {
            this.isFugueEditActive = true;
        }

        if (this.isFugueEditActive) {
            if (!this.fugueEditDocument) {
                this.fugueEditDocument = await vscode.workspace.openTextDocument({ content: '', language: 'plaintext' });
                await vscode.window.showTextDocument(this.fugueEditDocument, vscode.ViewColumn.One);
            }

            const edit = new vscode.WorkspaceEdit();
            const endPosition = this.fugueEditDocument.lineAt(this.fugueEditDocument.lineCount - 1).range.end;
            edit.insert(this.fugueEditDocument.uri, endPosition, '\n' + content);
            await vscode.workspace.applyEdit(edit);
            //await this.fugueEditDocument.save();

            if (content.trim() === '.') {
                this.isFugueEditActive = false;
                this.fugueEditDocument = undefined; // Reset the document reference
            }
        }
    }

    private async processQueue() {
        if (this.isProcessingQueue) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                if (message.startsWith('FugueEdit > ')) {
                    await this.handleFugueEditMessage(message);
                } else {
                    if (this.dataCallback) {
                        this.dataCallback(message);
                    }
                    this.extractAndSendStyleUrl(message);
                }
            }
        }

        this.isProcessingQueue = false;
    }
}