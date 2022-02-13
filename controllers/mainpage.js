const {bestNumberFinalized} = require("@polkadot/api-derive/chain/bestNumberFinalized");

class Ctrl {
    constructor() {
    }

    async indexPage(req, res) {

        let [bestNumberFinalized, bestNumber, progress, /*validatorCount,*/ addedFilesCount, currentReportSlot, historySlotDepth, free, reportedFilesSize, activeEra, currentEra, expectedBlockTime] = await Promise.all([
            CT.BC_ENV.API.derive.chain.bestNumberFinalized(),
            CT.BC_ENV.API.derive.chain.bestNumber(),
            CT.BC_ENV.API.derive.session.progress(),
            // CT.BC_ENV.API.query.staking.validatorCount(),
            CT.BC_ENV.API.query.swork.addedFilesCount(),
            CT.BC_ENV.API.query.swork.currentReportSlot(),
            CT.BC_ENV.API.query.swork.historySlotDepth(),
            CT.BC_ENV.API.query.swork.free(),
            CT.BC_ENV.API.query.swork.reportedFilesSize(),
            CT.BC_ENV.API.query.staking.activeEra(),
            CT.BC_ENV.API.query.staking.currentEra(),
            CT.BC_ENV.API.consts.babe.expectedBlockTime
        ]);

        let marketInfo = await CT.blockchain.market.getMarketInfo();

        let owners = await CT.models.owner.findAll({needClaims: 1});
        let locks = await CT.BC_ENV.API.query.locks.locks.multi(owners.map(o => {
            return o.address;
        }));
        let lockInfos = await CT.blockchain.account.getAccountLocksInfos(owners.map(o => {
            return o.address;
        }), CT.constant.LOCK_TYPE.CRULOCK);
        let ownerLocks = [];
        for (let i = 0; i < owners.length; i++) {
            ownerLocks.push({
                ...owners[i],
                ...locks[i].toJSON(),
                lockInfo: lockInfos[i] ? lockInfos[i].toJSON() : null
            });
        }

        // let chainInfo = await CT._.Request.post("https://crust.webapi.subscan.io/api/scan/metadata", {
        //     json: true,
        //     "headers": {
        //         "accept": "application/json, text/plain, */*",
        //         "accept-language": "zh-CN",
        //         "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"97\", \"Chromium\";v=\"97\"",
        //         "sec-ch-ua-mobile": "?0",
        //         "sec-ch-ua-platform": "\"Windows\"",
        //         "sec-fetch-dest": "empty",
        //         "sec-fetch-mode": "cors",
        //         "referrer": "https://crust.subscan.io/",
        //         "referrerPolicy": "origin-when-cross-origin",
        //         "sec-fetch-site": "same-site"
        //     },
        // });
        // chainInfo = await CT._.Request.post("https://crust.webapi.subscan.io/api/scan/token", {
        //     json: true,
        //     "headers": {
        //         "accept": "application/json, text/plain, */*",
        //         "accept-language": "zh-CN",
        //         "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"97\", \"Chromium\";v=\"97\"",
        //         "sec-ch-ua-mobile": "?0",
        //         "sec-ch-ua-platform": "\"Windows\"",
        //         "sec-fetch-dest": "empty",
        //         "sec-fetch-mode": "cors",
        //         "referrer": "https://crust.subscan.io/",
        //         "referrerPolicy": "origin-when-cross-origin",
        //         "sec-fetch-site": "same-site"
        //     },
        // });

        let rrd = await CT.models.epochStorageLog.findAll({}, {limit: 24, order: [['createdAt', 'desc']]});

        let rrdFree = [];
        let rrdReportedFilesSize = [];
        let rrdFileKeysCount = [];

        rrd.forEach(r => {
            rrdFree.push(r.free);
            rrdReportedFilesSize.push(r.reportedFilesSize);
            rrdFileKeysCount.push(r.filesCount);
        });
        let eras = [];
        for (let i = 0; i < 10; i++) {
            eras.unshift(progress.activeEra - i);
        }
        let erasTotalStakes = await CT.blockchain.account.getErasTotalStakes(eras);
        let staking = await CT.blockchain.staking.getStakingOverview(eras);
        res.render("index", {
            data: {
                bestNumberFinalized,
                bestNumber,
                progress,
                overview:staking.overview,
                nojv: staking.overview.nextElected.length - staking.overview.validators.length,
                waiting:staking.waitInfo.waiting.length,
                addedFilesCount,
                currentReportSlot,
                historySlotDepth,
                free,
                reportedFilesSize,
                expectedBlockTime,
                activeEra,
                currentEra,
                ownerLocks,
                marketInfo,
                erasTotalStakes,
                rrd: {
                    rrdFree,
                    rrdReportedFilesSize,
                    rrdFileKeysCount,
                }
            }
        });
    }
}

module.exports = new Ctrl();