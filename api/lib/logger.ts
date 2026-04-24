import fs from 'fs';
import path from 'path';

// Define log directory
const logDir = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);  
}

// Logger class
class Logger {
    static log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${message}\n`;
        fs.appendFileSync(path.join(logDir, 'application.log'), logMessage);
        console.log(logMessage);
    }

    static error(message) {
        this.log(`ERROR: ${message}`);
    }

    static info(message) {
        this.log(`INFO: ${message}`);
    }
}

export default Logger;