/**
 * Created by smallwolf on 2017/8/11.
 */
'use strict';
process.env.DEBUG = 'gen:table';
require('../common/global_defines');
let debug = require('debug')('gen:table');
let isForce = process.argv[2] === '--force' || process.argv[3] === '--force';
debug(`force sync mode is ${isForce ? 'on' : 'off'}!`)
let syncTables = [];

async function waitModuleLoaded() {
    return new Promise((r, j) => {
        CT.blockchain.evt.on('loaded', r);
    })
}

async function init() {
    for (let k in CT.schemas) {
        debug(`Sync ${k}...`);
        syncTables.push(k);
        await CT.schemas[k].sync({force: isForce})
            .catch(err => {
                debug(`${k} error: ${err}`);
            });
        debug(`Sync ${k} done.`);
    }
    if (isForce) {
        await waitModuleLoaded();

        let name = 'TEST SM';
        let mnemonic = 'breeze plastic hockey replace around mask math whisper ignore broken hat empty';
        let kp = await CT.blockchain.account.createAccount(name, mnemonic);
        mnemonic = await CT._.encrypt(mnemonic, CT.config.secret);
        let initAccount = {
            ...kp,
            name,
            mnemonic: mnemonic.join('|'),
            type: CT.constant.ACCOUNT_TYPE.TRANSFER,
            source: CT.constant.ACCOUNT_SOURCE.IMPORT,
        };
        await CT.models.account.create(initAccount);
        debug('create batch transfer account succeed!');
        await CT.models.user.create({username: 'admin', password: CT._.md5('admin')});
        debug('create admin user account succeed!');
    }
}

init()
    .then(() => {
        debug('\nSync table list:');
        debug(syncTables.join('\n'));
        process.exit(0);
    })
    .catch(err => {
        debug(err);
    })
    .finally(() => {

        process.exit(0);
    });
