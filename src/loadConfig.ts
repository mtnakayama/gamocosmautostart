import { Buffer } from 'buffer';
import fs from 'fs';
import url from 'url';

import is from 'is';  // is.js
import yaml from 'js-yaml';
import lodash from 'lodash';

const DEFAULT_MC_PORT = 25565;

export interface SkeletonServerConfig {
    port: number;
    onlineMode: boolean;
    protocolVersion: number;
}

export interface GenericServerConfig {
    address: string;
    port: number;
}

export interface WakeServerConfig extends GenericServerConfig {
    mac: string;
}

export interface Config {
    serverName: string;
    skeletonServer: SkeletonServerConfig,
    mcServer: GenericServerConfig,
    wakeServer: WakeServerConfig
}

export function loadConfig (configPath?: string | Buffer | url.URL | number): Config {
    configPath = configPath ? configPath : './config.yaml';

    const yamlDoc = yaml.load(fs.readFileSync(configPath, 'utf8'));

    const doc = fillDefaults(camelizeKeys(yamlDoc));
    console.log(doc);

    return doc;
}

function fillDefaults(config: any): Config {
    const defaultConfig = {
        serverName: 'Example',
        skeletonServer: {
            port: DEFAULT_MC_PORT,
            protocolVersion: 755
        },
        mcServer: {
            address: '0.0.0.0',
            port: DEFAULT_MC_PORT
        },
        wakeServer: {
            // address is copied from mc_server
            mac: '00:00:00:00:00:00',
            address: '255.255.255.255',
            port: 9
        }
    };

    let newConfig = config;
    newConfig = fillDefaultProperties(newConfig, defaultConfig);

    return newConfig;
}

function fillDefaultProperties(obj: Object, defaultObj: Object): Object {
    if(is.null(obj)) {
        return clone(defaultObj);
    } else {
        for(const key of Object.keys(defaultObj)) {
            // @ts-ignore
            if(is.not.existy(obj[key])) {
                // @ts-ignore
                obj[key] = clone(defaultObj[key]);
            // @ts-ignore
            } else if(is.json(obj[key])) {
                // @ts-ignore
                fillDefaultProperties(obj[key], defaultObj[key]);
            }
        }
        return obj;
    }

}

function camelizeKeys(obj: any): any {
    // https://stackoverflow.com/a/50620653/1400059
    if (Array.isArray(obj)) {
        return obj.map(v => camelizeKeys(v));
    } else if (obj != null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [lodash.camelCase(key)]: camelizeKeys(obj[key]),
            }),
            {},
        );
    }
    return obj;
};

function clone(a: any): any {
    return JSON.parse(JSON.stringify(a));
 }
