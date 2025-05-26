import express from 'express';
import dotenv from "dotenv";
//Config env
dotenv.config();

const app = express();

app.get('/health', (_req, res) => res.json({ status: 'ok' }));



if (process.env.NODE_ENV !== 'test') {

    const PORT = process.env.PORT || 3000;

    if (process.env.NODE_ENV == "production") {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`✅  Prod on port: ${PORT}`)
        })
    }
    else if (process.env.NODE_ENV == "development") {
        app.listen(PORT, () => console.log(`✅  Dev on http://localhost:${PORT}`));
    }
    else {
        console.error("error | UNKNOWN NODE ENV SETTING");
    }
}


export default app;
