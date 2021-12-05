import { EventEmitter } from 'events';
import is from 'is';  // is.js
import mc, { Server, States } from 'minecraft-protocol';
// @ts-ignore
import proxyTCP from 'node-tcp-proxy';

import { Chat, toChat, replacePlayerSelector } from './chat.js'
import { Config } from './loadConfig.js';
import { wake } from './wake.js';

const REFRESH_RATE = 15000;  // refresh rate in ms

const OFFLINE_KICK_MESSAGE: Chat = {
    text: 'Hello ',
    extra: [
        { selector: "@p", color: 'aqua' },
        { text: '\nThe server is not ready yet!\n', color: 'red' },
        { text: 'Please come back in less than 3 minutes.'}
    ]
};

const STARTING_KICK_MESSAGE: Chat = {
    text: 'Hello ',
    extra: [
        { selector: "@p", color: 'aqua' },
        { text: '!\n', color: 'white' },
        { text: 'The server will be ready very soon™ in', color: 'gold' },
        { text: ' XX ', obfuscated: true, color: 'gold' },
        { text: 'seconds.', color: 'gold' },
    ]
};

const OFFLINE_MESSAGE: Chat = {
    text: 'The server is sleeping!\n',
    color: 'gold',
    extra: [
        { text: 'If you want to launch it please ', color: 'white' },
        { text: 'join it', color: 'green' },
        { text: '.', color: 'white' }
    ]
};

enum ServerStatus {
    Down = 'down',
    Up = 'up',
    Starting = 'starting',
}

export function start(config: Config) {
    const skeletonServer = new SkeletonServer(config, OFFLINE_MESSAGE, STARTING_KICK_MESSAGE);
    let proxy: any = null;

    async function eventHandler() {
        const status = await getServerStatus(config);
        console.log(status);
        switch(status) {
            case ServerStatus.Up:
                await skeletonServer.stop();
                if(proxy === null) {
                    proxy = startProxy(config);
                }
                break;
            case ServerStatus.Starting:
            case ServerStatus.Down:
                await skeletonServer.start();
                if(proxy !== null) {
                    proxy.end();
                    proxy = null;
                }
                break;
        }
        setTimeout(async () => {
            eventHandler();
        },
        15000);
    }
    eventHandler();
}

function startProxy(config: Config): any {
    console.log(`Starting proxy to ${config.mcServer.address}:${config.mcServer.port}`);
    return proxyTCP.createProxy(
        config.skeletonServer.port,
        config.mcServer.address,
        config.mcServer.port
    );
}


class SkeletonServer extends EventEmitter {
    readonly config: Config;
    kickMessage: Chat;
    description: Chat;
    server: mc.Server | null;

    /** Constructs a new SkeletonServer but does not start it. */
    constructor(config: Config, description: string | Chat = '',
            kickMessage: string | Chat = '') {

        super();
        this.config = config;
        this.description = toChat(description);
        this.kickMessage = toChat(kickMessage);
        this.server = null;
    }

    start() {
        if(this.server === null) {
            this.server = this._launchSkeletonServer()
        }
    }

    stop() {
        if(this.server !== null) {
            this.server.close();
            this.server = null;
        }
    }

    private _launchSkeletonServer(): mc.Server {
        console.log("Launching skeleton server.");

        const server = this._createSkeletonServer();
        server.on('login', (client: mc.Client) => {
            console.log(`Starting the server ${this.config.serverName} because someone joined it!`);

            const message = replacePlayerSelector(this.kickMessage, client.username);
            client.write("kick_disconnect", { reason: JSON.stringify(message) });
            this.emit('login', client);
        });
        return server;
    }

    private _createSkeletonServer(): mc.Server {
        return mc.createServer({
            host: "0.0.0.0",
            port: this.config.skeletonServer.port,
            beforePing: (res: mc.NewPingResult, client: mc.Client) => {
                res.version.name = 'Sleeping';  // this text appears in the upper right corner of server selection
                res.version.protocol = this.config.skeletonServer.protocolVersion;
                res.description = this.description
            },
            maxPlayers: 0,
            'online-mode': true,
            // @ts-ignore
            encryption: true,
            version: `${this.config.skeletonServer.protocolVersion}`
        });
    }
};

function getServerStatus(config: Config): Promise<ServerStatus> {
    return new Promise<ServerStatus>((resolve, reject) => {
        const closeTimeout = REFRESH_RATE / 2;
        const client = createClient(config);

        // use a timeout because the `connected` state doesn't alway mean
        // the server is 100% up.
        setTimeout(() => {
            if(client.state === 'login') {
                resolve(ServerStatus.Up);
            } else {
                resolve(ServerStatus.Down);
            }
            client.end();
        },
        closeTimeout);

        client.on('error', (err: any) => {
            if(err.code === 'ECONNRESET') {
                resolve(ServerStatus.Starting);
            } else {
                resolve(ServerStatus.Down);
            }
            client.end();
        });
    })
}

/**
 * Create a client to use for testing the status of the MC server
 * @param config
 * @returns
 */
function createClient(config: Config) {
    return mc.createClient({
        version: `${config.skeletonServer.protocolVersion}`,
        host: config.mcServer.address,
        port: config.mcServer.port,
        username: 'test',
        skipValidation: true,
        closeTimeout: REFRESH_RATE / 2
    });
}
