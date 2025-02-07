"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MooConnection = void 0;
const net = __importStar(require("net"));
class MooConnection {
    constructor(host, port) {
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
    sendCommand(command) {
        console.log('Sending command:', command);
        this.socket.write(command + '\n'); // Ensure newline character is correct
    }
    onData(callback) {
        this.dataCallback = callback;
    }
    onStyle(callback) {
        this.styleCallback = callback;
    }
    disconnect() {
        this.socket.destroy();
    }
    extractAndSendStyleUrl(message) {
        const styleRegex = /!@style:url:(.+?)(?=.less)/;
        const match = message.match(styleRegex);
        if (match && this.styleCallback) {
            this.styleCallback(match[1] + ".less");
        }
    }
}
exports.MooConnection = MooConnection;
//# sourceMappingURL=mooConnection.js.map