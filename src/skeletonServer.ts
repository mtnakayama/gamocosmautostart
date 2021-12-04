import is from 'is';  // is.js
import mc, { Server } from 'minecraft-protocol';
// @ts-ignore
import proxyTCP from 'node-tcp-proxy';

import { Config } from './loadConfig';

enum ServerStatus {
    Down,
    Up
}

async function getServerStatus(config: Config): Promise<ServerStatus> {
    return ServerStatus.Down;
}

// function checkUntilServerIsUp(config: Config) {
//     const loopUntilServerIsUp = setInterval(() => {
//         getServerStatus(config)
//             .then(result => {
//                 switch (result.status) {
//                     case "up":
//                         mcServer.close();
//                         mcServer.on('close', () => {
//                             setTimeout(() => {
//                                 const proxyToNewDO = proxyTCP.createProxy(serverData.port, result.ip, config.mcServer.port);
//                                 checkUntilServerIsDown(serverData, proxyToNewDO);
//                             }, 5000);
//                             clearInterval(loopUntilServerIsUp);
//                         });
//                         break;
//                     case "paused":
//                         // resumeServer(serverData.id, serverData.key);
//                         break;
//                 }
//             });
//     }, 5000);
// }

// function checkUntilServerIsDown(serverData, proxyToNewDO) {
//     const loopUntilServerIsDown = setInterval(() => {
//         getServerStatus(serverData)
//             .then(result => {
//                 if (result.status == "down") {
//                     if (proxyToNewDO)
//                         proxyToNewDO.end();
//                     clearInterval(loopUntilServerIsDown);
//                     setTimeout(() => {
//                         launchSkeletonServerImpl(serverData);
//                     }, 5000);
//                 }
//             });
//     }, 5000);
// }

function launchSkeletonServerImpl(config: Config) {
    const skeletonServer = createSkeletonServer(config);
    skeletonServer.on("login", (client) => {
        console.log(`Starting the server ${config.serverName} because someone joined it!`);
        const reasonKick = {
            text: `Hello §b ${client.username} §r!
§cThe Minecraft server ${config.serverName} is not ready yet!
§rPlease come back in less than 3 minutes.`
        };
        client.write("kick_disconnect", { reason: JSON.stringify(reasonKick) });

        // start server
    });
}

function createSkeletonServer(config: Config): mc.Server {
    return mc.createServer({
        host: "0.0.0.0",
        port: config.skeletonServer.port,
        beforePing: (res: mc.NewPingResult, client: mc.Client) => {
            res.version.name = "The server is offline!";
            res.version.protocol = config.skeletonServer.protocolVersion;
            const offlineMessage = `§cThe Minecraft server ${config.serverName} is offline!\n§6If you want to launch it please join it.`;
            if(is.string(res.description)) {
                res.description = offlineMessage;
            } else {
                // @ts-ignore
                res.description.text = offlineMessage;
            }
        },
        maxPlayers: 0,
        'online-mode': true,
        // @ts-ignore
        encryption: true,
        version: `${config.skeletonServer.protocolVersion}`
    });
}

export function start(config: Config) {
    console.log("hello");
    getServerStatus(config)
        .then(result => {
            switch (result) {
                case ServerStatus.Up:

                    break;
                case ServerStatus.Down:
                    console.log("down");
                    launchSkeletonServerImpl(config);
                    break;
            }
        });
}

function runProxy(config: Config) {
    const proxyToNewDO = proxyTCP.createProxy(
        config.skeletonServer.port,
        config.mcServer.address,
        config.mcServer.port
    );
    // checkUntilServerIsDown(serverData, proxyToNewDO);
}
