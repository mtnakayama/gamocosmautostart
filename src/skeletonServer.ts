// import { startServer, getStatus, resumeServer } from "./gamocosmWrapper.js";
import mc from "minecraft-protocol";
import proxyTCP from "node-tcp-proxy";

async function getServerStatus(serverData) {
    return {status: "down"};
}

function checkUntilServerIsUp(serverData, mcServer) {
    const loopUntilServerIsUp = setInterval(() => {
        getServerStatus(serverData)
            .then(result => {
                switch (result.status) {
                    case "up":
                        mcServer.close();
                        mcServer.on('close', () => {
                            setTimeout(() => {
                                const proxyToNewDO = proxyTCP.createProxy(serverData.port, result.ip, 25565);
                                checkUntilServerIsDown(serverData, proxyToNewDO);
                            }, 5000);
                            clearInterval(loopUntilServerIsUp);
                        });
                        break;
                    case "paused":
                        // resumeServer(serverData.id, serverData.key);
                        break;
                }
            });
    }, 5000);
}

function checkUntilServerIsDown(serverData, proxyToNewDO) {
    const loopUntilServerIsDown = setInterval(() => {
        getServerStatus(serverData)
            .then(result => {
                if (result.status == "down") {
                    if (proxyToNewDO)
                        proxyToNewDO.end();
                    clearInterval(loopUntilServerIsDown);
                    setTimeout(() => {
                        launchSkeletonServerImpl(serverData);
                    }, 5000);
                }
            });
    }, 5000);
}

function launchSkeletonServerImpl(config) {
    console.log("hi")
    let mcServerOptions = {
        host: "0.0.0.0",
        port: serverData.port,
        beforePing: (res, client) => {
            res.version.name = "The server is offline!";
            res.version.protocol = config.skeletonServer.protocolVersion;  // MC 1.17
            res.description.text = "§cThe Minecraft server " + serverName
                + " is offline!\n§6If you want to launch it please join it.";
        },
        maxPlayers: 0
    }
    if (serverData.onlinemode == null) {
        mcServerOptions["online-mode"] = true;
        mcServerOptions["encryption"] = true;
    }
    else {
        mcServerOptions["online-mode"] = serverData.onlinemode;
        mcServerOptions["encryption"] = serverData.onlinemode;
    }
    if (serverData.version) {
        mcServerOptions["version"] = serverData.version;
    }
    console.log('mcServer');
    const mcServer = mc.createServer(mcServerOptions);

    mcServer.on("login", (client) => {
        let isServerNeededToStart = true;
        getServerStatus(serverData)
            .then(result => {
                switch (result.status) {
                    case "down":
                        if (isServerNeededToStart) {
                            isServerNeededToStart = false;
                            console.log("starting the server " + serverName + " because someone joined it!");
                            // startServer(serverData.id, serverData.key);
                            // checkUntilServerIsUp(serverData, mcServer);
                        }
                        break;
                    case "paused":
                        console.log('resuming server')
                        // resumeServer(serverData.id, serverData.key);
                        // checkUntilServerIsUp(serverData, mcServer);
                        break;
                }
            });
        const reasonKick = {
            text: "Hello §b" + client.username + "§r!\n§cThe Minecraft server "
                + serverName + " is not ready yet!\n§rPlease come back in less than 3 minutes."
        };
        client.write("kick_disconnect", { reason: JSON.stringify(reasonKick) });
    });
}

export default function launchSkeletonServer(serverData, serverName) {
    console.log("hello");
    getServerStatus(serverData)
        .then(result => {
            console.log("status", "down");
            switch (result.status) {
                case "up":
                    const proxyToNewDO = proxyTCP.createProxy(serverData.port, result.ip, 25565);
                    checkUntilServerIsDown(serverData, proxyToNewDO);
                    break;
                case "starting":
                case "preparing":
                case "broken":
                case "down":
                    console.log("down");
                    launchSkeletonServerImpl(serverData, serverName);
                    break;
                case "paused":
                    resumeServer(serverData.id, serverData.key);
                    launchSkeletonServerImpl(serverData, serverName);
                    break;
                case "saving":
                    checkUntilServerIsDown(serverData);
                    break;
            }
        });
}
