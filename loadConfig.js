import fs from 'fs';

import yaml from 'js-yaml';
import lodash from 'lodash';

const DEFAULT_MC_PORT = 25565;

export default function(configPath) {
    configPath = configPath ? configPath : './config.yaml';
    // Get document, or throw exception on error
    try {
        let doc = yaml.load(fs.readFileSync(configPath, 'utf8'));
        doc = camelizeKeys(doc);
        doc = fillDefaults(doc);
        console.log(doc);
        return doc;
    } catch (e) {
        console.log(e);
    }
}

function fillDefaults(config) {
    const defaultConfig = {
        skeletonServer: {
            port: DEFAULT_MC_PORT,
            onlineMode: true,
            protocolVersion: 47
        },
        mcServer: {
            address: '0.0.0.0',
            port: DEFAULT_MC_PORT
        },
        wakeServer: {
            // address is copied from mc_server
            mac: '00:00:00:00:00:00',
            port: 9
        }
    };

    let newConfig = clone(config);
    if(newConfig === null){
        newConfig = {};
    }

    fillDefaultProperties(newConfig, defaultConfig);

    // assume that wake_server address is the same as mc_server unless told otherwise
    fillDefaultProperties(newConfig.wake_server, newConfig.mc_server);

    return newConfig;
}

function fillDefaultProperties(obj, defaultObj) {
    for (const prop in defaultObj) {
        if (defaultObj.hasOwnProperty(prop)) {
            if(obj[prop] === undefined) {
                obj[prop] = clone(defaultObj[prop]);
            } else if(obj[prop] !== null && obj[prop].constructor === Object) {
                fillDefaultProperties(obj[prop], defaultObj[prop]);
            }
        }
    }
}

const camelizeKeys = (obj) => {
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

function clone(a) {
    return JSON.parse(JSON.stringify(a));
 }
