import * as net from 'net';

export class MooConnection {
    private socket: net.Socket;
    private dataCallback: ((data: string) => void) | undefined;
    private styleCallback: ((url: string) => void) | undefined;

    constructor(host: string, port: number) {
        this.socket = new net.Socket();
        
        this.socket.connect(port, host, () => {
            console.log('Connected to MOO server');
        });

        this.socket.on('data', (data) => {
            const message = data.toString();
            if (this.dataCallback) {
                this.dataCallback(message);
            }
            this.extractAndSendStyleUrl(message);
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
}