import { Buffer } from 'buffer';
import fs from 'fs';
import url from 'url';

import is from 'is';  // is.js
import yaml from 'js-yaml';
import lodash from 'lodash';

import { clone } from './clone.js';
import { Chat, toChat } from './chat.js';

const DEFAULT_MC_PORT = 25565;

const DEFAULT_OFFLINE_KICK_MESSAGE: Chat = {
    text: 'Hello ',
    extra: [
        { selector: "@p", color: 'aqua' },
        { text: '\nThe server is not ready yet!\n', color: 'red' },
        { text: 'Please come back in less than 3 minutes.'}
    ]
};

const DEFAULT_STARTING_KICK_MESSAGE: Chat = {
    text: 'Hello ',
    extra: [
        { selector: "@p", color: 'aqua' },
        { text: '!\n', color: 'white' },
        { text: 'The server will be ready very soon!', color: 'gold' },
    ]
};

const DEFAULT_SERVER_DESCRIPTION: Chat = {
    text: 'The server is sleeping!\n',
    color: 'gold',
    extra: [
        { text: 'If you want to launch it please ', color: 'white' },
        { text: 'join it', bold: true, color: 'green' },
        { text: '.', color: 'white' }
    ]
};

export interface Config {
    serverName: string;
    skeletonServer: {
        port: number;
        protocolVersion: number;
    };
    mcServer: {
        address: string;
        port: number;
    };
    wakeServer: {
        mac: string;
        address: string;
        port: number;
    };
    offlineKickMessage: Chat;
    startingKickMessage: Chat;
    serverDescription: Chat;
};

const DEFAULT_CONFIG: Config = {
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
        mac: '00:00:00:00:00:00',
        address: '255.255.255.255',
        port: 9
    },
    offlineKickMessage: DEFAULT_OFFLINE_KICK_MESSAGE,
    startingKickMessage: DEFAULT_STARTING_KICK_MESSAGE,
    serverDescription: DEFAULT_SERVER_DESCRIPTION
};

export function loadConfig (configPath?: string | Buffer | url.URL | number): Config {
    configPath = configPath ? configPath : './config.yaml';

    const yamlDoc = yaml.load(fs.readFileSync(configPath, 'utf8'));

    console.log((yamlDoc as any).starting_kick_message);
    const doc = fillDefaults(camelizeKeys(yamlDoc));

    doc.offlineKickMessage = toChat(doc.offlineKickMessage);
    doc.startingKickMessage = toChat(doc.startingKickMessage);
    doc.serverDescription = toChat(doc.serverDescription);

    console.log(JSON.stringify(doc, null, 2));

    return doc;
}

function fillDefaults(config: any): Config {
    let newConfig = config;
    newConfig = fillDefaultProperties(newConfig, DEFAULT_CONFIG);

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
