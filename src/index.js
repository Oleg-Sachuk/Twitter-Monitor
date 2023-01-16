// @ts-nocheck

const express = require('express');
const bodyParser = require('body-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const handlers = require('./express').default;
const path = require('path');
const {Twitter} = require('./lib/clients/twitter');


const PORT = Number(process.env.PORT) || 80;
const ACCOUNTS = JSON.parse(process.env.ACCOUNTS) || [];

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "Twitter listener API",
            description: "Documentation for Twitter listener API"
        },
        servers: [process.env.SERVER_URL || `http://localhost:${PORT}`],
    },
    apis: [__filename, path.join(__dirname, `./twitter/*.js`)]
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);

class App {
    /**
     * @param { number } port
     */
    constructor(port) {
        this.port = port;
        this.app = express();
        this.server = require('http').createServer(this.app);
        this.app.use(express.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
        this.app.set('trust proxy', true);

        if (process.env.NODE_ENV === 'development') {
            this.app.use((req, res, next) => {
                console.log(`${req.method} ${req.path} [STARTED]`)
                const start = process.hrtime()
                res.on('finish', () => {
                    const duration = this.getRequestDuration(start);
                    console.log(`${req.method} ${req.path} [FINISHED] code: ${res.statusCode} ${duration.toLocaleString()} ms`)
                });
                next();
            });
        }


        //routes
        /**
         * @swagger
         * tags:
         *  - name: Tweets
         *    description: API for user tweets
         *
         * definitions:
         *  ErrorInternal:
         *   type: object
         *   properties:
         *      error:
         *          type: string
         *          enum: ["error retrieving tweets"]
         *  ErrorBadRequest:
         *   type: object
         *   properties:
         *      error:
         *          type: string
         *          enum: ["Bad request: username is not specified"]
         */
        this.app.get('/api/all/:username', handlers.twitter.get);

        //Initialize API
        const _ = new Twitter(ACCOUNTS);
    }

    /**
     * @param {[number, number] | undefined} start
     */
    getRequestDuration(start) {
        const NS_PER_SEC = 1e9
        const NS_TO_MS = 1e6
        const diff = process.hrtime(start)

        return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(`***********SERVER HAS BEEN STARTED ON PORT ${this.port}***********`);
        });
    }
}

new App(PORT).listen();
