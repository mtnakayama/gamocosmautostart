import * as skeletonServer from './skeletonServer.js';
import { loadConfig } from './loadConfig.js';

function main() {
    console.log("Loading the server.");
    const config = loadConfig();
    skeletonServer.start(config);
    console.log('done')
}

main();
