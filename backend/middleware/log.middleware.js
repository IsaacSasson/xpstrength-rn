import dotenv from 'dotenv';
dotenv.config();

export async function logger(req, _res, next) {

    const ip = req.ip;

    const host = req.get('host');
    const url = `${req.protocol}://${host}${req.originalUrl}`;

    let bodyPreview = '';
    if (req.body && Object.keys(req.body).length) {
        bodyPreview = JSON.stringify(req.body).slice(0, 50);
        if (JSON.stringify(req.body).length > 50) bodyPreview += '…';
    }

    if (process.env.NODE_ENV === "production") {
        //TODO write logs into database with sequelized object instead of printing Prod based on Log
        console.log(`${ip} → ${url} ${bodyPreview ? '| body: ' + bodyPreview : ''}`);
    } else if (process.env.NODE_ENV === "development") {
        console.log(`${bodyPreview ? '| body: ' + bodyPreview : ''}`);
    }
    next()
}

export default logger;