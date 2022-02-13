const MNEMONIC_LENGTH = CT.constant.MNEMONIC_LENGTH;


const {Keyring} = require("@polkadot/api");


class Account {
    constructor() {
    }

    /**
     *
     * @param name {string} 昵称
     * @param mnemonic {string} 助剂词
     * @param type {string} sr25519
     * @returns {Promise<void>}
     */
    async createAccount(name, mnemonic, type = 'sr25519') {

        // Validate the mnemic string that was generated
        const isValidMnemonic = CT._.mnemonicValidate(mnemonic);

        if (!isValidMnemonic) {
            throw new CT.Exception(CT.error.ERROR_PARAMS, '助记词生成失败！');
        }

        // Create valid Substrate-compatible seed from mnemonic
        // const seedAlice = mnemonicToMiniSecret(mnemonic);

        // create an sr25519 pair from the mnemonic (keyring defaults)
        const krp = CT.BC_ENV.keyRing.createFromUri(mnemonic, {name}, type);
        krp.setMeta({
            genesisHash: CT.BC_ENV.API.genesisHash.toHex(),
            whenCreated: Date.now()
        });

        return krp;
    }

    /**
     *
     * @param name {string} 昵称
     * @param mnemonic {string} 助剂词
     * @param type {string} sr25519
     * @returns {Promise<void>}
     */
    async loadAccount(name, mnemonic, type = 'sr25519', createdAt) {

        // Validate the mnemic string that was generated
        const isValidMnemonic = CT._.mnemonicValidate(mnemonic);

        if (!isValidMnemonic) {
            throw new CT.Exception(CT.error.ERROR_PARAMS, '助记词生成失败！');
        }

        // Create valid Substrate-compatible seed from mnemonic
        // const seedAlice = mnemonicToMiniSecret(mnemonic);

        // create an sr25519 pair from the mnemonic (keyring defaults)
        const krp = CT.BC_ENV.keyRing.addFromUri(mnemonic, {name}, type);
        krp.setMeta({
            genesisHash: CT.BC_ENV.API.genesisHash.toHex(),
            whenCreated: createdAt ? new Date(createdAt).getTime() * 1000 : Date.now()
        });

        return krp;
    }

    async getAccountListBalance(addresses) {
        if (addresses.length <= 0) {
            return {};
        }
        let balances = await CT.BC_ENV.API.query.system.account.multi(addresses);
        let addrMap = {};
        for (let i = 0; i < addresses.length; i++) {
            addrMap[addresses[i]] = balances[i].data;
        }

        return addrMap;
    }

    async getAccountBalance(address) {
        if (!address) {
            return {};
        }
        let balances = await CT.BC_ENV.API.query.system.account(address);

        return balances;
    }

    async getErasTotalStakes(eras) {
        if (!eras || eras.length <= 0) {
            return [];
        }
        let stakings = await CT.BC_ENV.API.query.staking.erasTotalStakes.multi(eras);

        return stakings;
    }

    async getAccountLocksInfo(address, type = null) {
        if (!address) {
            return {};
        }
        let lock = await CT.BC_ENV.API.query.balances.locks(address);

        if (type) {
            lock = lock.find(a => {
                return a.id == type
            });
        }
        return lock;
    }

    /**
     *
     * @param addresses
     * @returns {Promise<*[]|*>}
     */
    async getAccountLocksInfos(addresses, type = null) {
        if (!addresses.length) {
            return [];
        }
        let locks = await CT.BC_ENV.API.query.balances.locks.multi(addresses);

        if (type) {
            locks = locks.map(l => {
                return l.find(a => {
                    return a.id.toHuman().replaceAll(/[ ]/g, '') == type
                });
            });
        }

        return locks;
    }

    async retrieveTransfer(taddress, addresses, balance) {
        const txs = [];
        addresses.forEach(a => {
            txs.push(CT.BC_ENV.API.tx.balances.transfer(a, balance));
        });

        const {partialFee, weight} = await CT.BC_ENV.API.tx.utility
            .batch(txs)
            .paymentInfo(taddress);

        console.log(`transaction will have a weight of ${weight}, with ${partialFee.toHuman()} weight fees`);
        return partialFee;
    }

    async transfer(taddress, address, balance) {
        if (!CT.BC_ENV.keyRing.getPair(taddress)) {
            throw new CT.Exception(CT.error.ERROR_NO_DATA, '转账账户未找到');
        }
        const txHash = await CT.BC_ENV.API.tx.balances
            .transfer(address, balance)
            .signAndSend(taddress/*, ({ events = [], status }) => {
                console.log(`Current status is ${status.type}`);

                if (status.isFinalized) {
                    console.log(`Transaction included at blockHash ${status.asFinalized}`);

                    // Loop through Vec<EventRecord> to display all events
                    events.forEach(({ phase, event: { data, method, section } }) => {
                        console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                    });

                    unsub();
                }
            }*/);
        return {txHash};
    }

    async batchTransfer(taddress, addresses, balance) {
        let transfer = CT.BC_ENV.keyRing.getPair(taddress);
        if (!transfer) {
            throw new CT.Exception(CT.error.ERROR_NO_DATA, '转账账户未找到');
        }
        const txs = [];
        addresses.forEach(a => {
            txs.push(CT.BC_ENV.API.tx.balances.transfer(a, balance));
        });
        const txHash = await CT.BC_ENV.API.tx.utility
            .batch(txs)
            .signAndSend(transfer/*, ({ events = [], status }) => {
                console.log(`Current status is ${status.type}`);

                if (status.isFinalized) {
                    console.log(`Transaction included at blockHash ${status.asFinalized}`);

                    // Loop through Vec<EventRecord> to display all events
                    events.forEach(({ phase, event: { data, method, section } }) => {
                        console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                    });

                    unsub();
                }
            }*/);
        return {txHash};
    }

    async toJson(account, pwd) {
        let backup = account.toJson(pwd);
        // backup.meta.genesisHash = CT.BC_ENV.API.genesisHash.toHex();
        // backup.meta.whenCreated = Date.now();
        return backup
    }
}

module.exports = new Account();


