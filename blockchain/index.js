let fs = require('fs');
let log = require('debug')('cru-tool:blockchain');
let dirs = fs.readdirSync(__dirname);
const {TypeRegistry} = require('@polkadot/types/create');
const registry = new TypeRegistry();
const {typesBundleForPolkadot, typesAlias} = require("@crustio/type-definitions");
const {EventEmitter} = require('events');

const {WsProvider, ApiPromise, Keyring} = require("@polkadot/api");


function evtCallback(type, ...args) {
    log('wss status:', type);
    switch (type) {
        case 'error':
            break;
        case 'disconnected':
            CT.BC_ENV.isConnected = false;
            CT.BC_ENV.API = undefined;
            start();
            break;
        case 'connected':
            CT.BC_ENV.isConnected = true;
            break;
        case 'ready':
            CT.BC_ENV.isReady = true;
            log('wss api connected!');
            break;
        default:
            break;
    }
}

class Index extends EventEmitter {
    constructor(props) {
        super(props);
    }

    async init() {
        const wsProvider = new WsProvider(CT.config.crustApi)
        const api = new ApiPromise({
            provider: wsProvider,
            typesBundle: typesBundleForPolkadot,
        });
        api.on('connected', evtCallback.bind(api, 'connected'));
        api.on('error', evtCallback.bind(api, 'error'));
        api.on('disconnected', evtCallback.bind(api, 'disconnected'));
        api.on('ready', evtCallback.bind(api, 'ready'));
        await api.isReady.catch(err => {
            console.error(err);
        });
        CT.BC_ENV.API = api;
        const [chainProperties, systemChain, systemChainType, systemName, systemVersion] = await Promise.all([
            api.rpc.system.properties(),
            api.rpc.system.chain(),
            api.rpc.system.chainType
                ? api.rpc.system.chainType()
                : Promise.resolve(registry.createType('ChainType', 'Live')),
            api.rpc.system.name(),
            api.rpc.system.version()
        ]);
        CT.BC_ENV.chainProperties = chainProperties;
        CT.BC_ENV.systemChain = systemChain;
        CT.BC_ENV.systemChainType = systemChainType;
        CT.BC_ENV.systemName = systemName;
        CT.BC_ENV.systemVersion = systemVersion;
        log(`chainInfo => chain:${systemChain},chainType:${systemChainType},name:${systemName},version:${systemVersion}`);

        const ss58Format = CT.BC_ENV.API.consts.system?.ss58Prefix || CT.BC_ENV.chainProperties.ss58Format;
        CT.BC_ENV.keyRing = new Keyring({type: 'sr25519', ss58Format: ss58Format});
        CT.BC_ENV.REWARD_ACCOUNT_PAIR = await CT.blockchain.account.loadAccount('REWARD', CT.config.rewardAccountMnemonic);
        CT.BC_ENV.currentReportSlot = await CT.BC_ENV.API.query.swork.currentReportSlot().then(d => d.toNumber());
        CT.BC_ENV.historySlotDepth = await CT.BC_ENV.API.query.swork.historySlotDepth().then(d => d.toNumber());
    }
}

const index = new Index();

let models = {
    evt: index
};
for (let i = 0; i < dirs.length; i++) {
    let file = dirs[i];
    if (/\.js(c)?$/ig.test(file) && !~[/index\.js(c)?$/ig, /subscribe\.js(c)?$/ig].findIndex(r => {
        return r.test(file);
    })) {
        let name = file.replace(/\.js(c)?$/ig, '');
        models[CT._.toCamel(name)] = require(`./${file}`);
    }
}

function start() {
    if (CT.BC_ENV.isConnecting) {
        log('chain wss is connectiong...');
        return;
    }
    CT.BC_ENV.isConnecting = true;
    try {
        index.init()
            .catch(err => {
                console.error(err);
                CT.BC_ENV.isConnecting = false;
            })
            .finally(() => {
                // require('../common/load_acounts')();
                index.emit('loaded', 'loaded');
                CT.BC_ENV.isConnecting = false;
            });
    } catch (err) {
        console.log(err);
    }
}

start();

module.exports = models;