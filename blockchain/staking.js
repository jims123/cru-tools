const {waitingInfo} = require("@polkadot/api-derive/staking/waitingInfo");
const cache = {};

class Staking {
    constructor() {
    }

    async getWorkerAnchors(addresses) {
        let workerInfos = await CT.BC_ENV.API.query.swork.identities.multi(addresses).then(data => {
            return data.map(d => {
                return d.toJSON();
            });
        });
        return workerInfos;
    }

    async getStakingLimit(addresses) {
        let stakings = await CT.BC_ENV.API.query.staking.stakeLimit.multi(addresses).then(data => {
            return data;
        });
        let validatorPrefs = await CT.BC_ENV.API.query.staking.validators.multi(addresses).then(data => {
            return data;
        });
        let stakingInfoMap = {};
        for (let i = 0; i < addresses.length; i++) {
            let address = addresses[i];
            let staking = stakings[i];
            let validatorPref = validatorPrefs[i];
            stakingInfoMap[address] = {
                stakingLimit: staking,
                guaranteeFee: validatorPref.guarantee_fee
            }
        }
        return stakingInfoMap;
    }

    async getLedger(address) {
        let ledger = await CT.BC_ENV.API.query.staking.ledger(address).then(data => {
            return data;
        });
        return ledger;
    }

    async getLedgers(addresses) {
        let ledgers = await CT.BC_ENV.API.query.staking.ledger.multi(addresses).then(data => {
            return data;
        });
        return ledgers;
    }

    async getController(address) {
        let controller = await CT.BC_ENV.API.query.staking.bonded(address).then(data => {
            return data.toString();
        });
        return controller;
    }

    async getControllers(addresses) {
        let controllers = await CT.BC_ENV.API.query.staking.bonded.multi(addresses).then(data => {
            return data;
        });
        return controllers;
    }

    async getStakingOverview() {
        if (cache.getStakingOverview && cache.getStakingOverview.expired >= CT.moment().unix()) {
            return cache.getStakingOverview;
        }
        let data = await CT.BC_ENV.API.derive.staking.overview();
        let data1 = await CT.BC_ENV.API.derive.staking.waitingInfo().then(d => {
            return JSON.parse(JSON.stringify(d));
        });
        cache.getStakingOverview = {overview: data, waitInfo: data1, expired: CT.moment().add(6, 'hours').unix()};
        return cache.getStakingOverview;
    }
}

module.exports = new Staking();


