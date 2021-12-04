import util from 'util';

import { Config } from './loadConfig.js';
import wol from 'wol';
import is, { any } from 'is';  // is.js

const wolWakeAsync: (macAddress:string, options?: wol.WakeOptions) => Promise<any> = util.promisify(wol.wake)

export async function wake(config: Config): Promise<any> {
    return wolWakeAsync(
        config.wakeServer.mac,
        {
            address: config.wakeServer.address,
            port: config.wakeServer.port
        }
    );
}
