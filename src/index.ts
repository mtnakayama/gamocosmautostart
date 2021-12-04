import launchSkeletonServer from "./skeletonServer.js";
import loadConfig from './loadConfig.js';

Object.keys(configFile.servers).forEach(serverName => {
    console.log("Loading the server " + serverName);
    const serverData = configFile.servers[serverName];
    const config = loadConfig();
    // launchSkeletonServer(serverData, serverName);
    console.log('done')
});
