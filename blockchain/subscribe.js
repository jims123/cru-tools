const moment = require("moment");
const {subscribeNewBlocks} = require("@polkadot/api-derive/chain/subscribeNewBlocks");
let log = require('debug')('cru-tool:sub');
let receiveWorkReportAddressInfos = [];

function getEraSpan(eras, days) {

    eras.sort((a, b) => {
        return b.gt(a) ? 1 : -1;
    });
    return eras.splice(0, days * 4);
}

function calcNeedClaimRewardsEras(eras, owners, stakerExposures, ownersRewardsInfo) {
    let rewardsMap = {};
    let ownersNeedClaimRewardsInfoMap = {};
    eras = eras.map(a => {
        return a.toNumber()
    });
    ownersRewardsInfo.forEach(o => {
        let claimedRewards = o.stakingLedger.claimedRewards.map(a => {
            return a.toNumber();
        });
        ownersNeedClaimRewardsInfoMap[o.accountId] = CT._.difference(eras, claimedRewards);
    });

    let stakerHadRewardMap = {};
    for (let i = 0; i < stakerExposures.length; i++) {
        let s = stakerExposures[i];
        let owner = owners[i];
        s.forEach(e => {
            if (!stakerHadRewardMap[owner]) {
                stakerHadRewardMap[owner] = [];
            }
            if (!e.isEmpty) {
                stakerHadRewardMap[owner].push(e.era.toNumber());
            }
        })
    }


    owners.forEach(o => {
        let ocrim = ownersNeedClaimRewardsInfoMap[o] || [];
        let shrm = stakerHadRewardMap[o] || [];

        rewardsMap[o] = CT._.intersection(ocrim, shrm);
    });
    return rewardsMap;
}

async function saveReport() {
    let addressesSize = receiveWorkReportAddressInfos.length;
    if (addressesSize == 0) {
        return;
    }
    let addressInfos = receiveWorkReportAddressInfos.splice(0, addressesSize);
    log('handle workReport addresses:', addressInfos);
    CT.models.report.findCurrentSlotReportsInSlotOrInsert(addressInfos).then(d => {
        // log(d);
    }).catch(err => {
        log(err);
    });
}

async function handleWorkReportEvent(type, accountId, sworkerPubKey, reportTime) {

    let address = accountId.toString();
    reportTime = reportTime || Date.now();
    let existed = await CT.models.member.checkMemberExist(address);
    if (!existed) {
        return;
    }
    log(new Date(), type, address, CT.BC_ENV.currentReportSlot);
    receiveWorkReportAddressInfos.push({address, reportTime, reportSlot: CT.BC_ENV.currentReportSlot});
}

async function handleBalanceWarning(address, balance, nonce) {
    if (balance < CT.config.rewardAccountBalanceWarning * Math.pow(10, 12)) {
        await CT.stmp.sendBalance(address, balance, nonce).catch(err => {
            console.error(err);
        });
    }

}

async function handleEraReward(eraIndex) {
    eraIndex = eraIndex.toJSON();
    log(`activeEra:${eraIndex.index}, \tstart time: ${moment(eraIndex.start).utcOffset("+08:00").format('YYYY/MM/DD HH:mm:ss')} `);
    CT.checkLic(eraIndex.start);
    if ((eraIndex.index + CT.config.claimPerEraOffset) % CT.config.claimPerEra != 0) {
        return;
    }

    let eras = await CT.BC_ENV.API.derive.staking.erasHistoric();
    let owners = await CT.models.owner.findAll({needClaims: 1}, {fields: {address: 1}});
    owners = owners.map(o => {
        return o.address;
    });
    eras = getEraSpan(eras, 3);
    if (owners.length == 0 || eras.length == 0) {
        return;
    }
    let stakerExposures = await CT.BC_ENV.API.derive.staking._stakerExposures(owners, eras);
    let ownersRewardsInfo = await CT.BC_ENV.API.derive.staking.queryMulti(owners, {
        withLedger: true,
        // withExposure: false,
        // withDestination: true,
        // withController: true,
        // withNominations: true,
        // withPrefs: true
    });

    let needRewardMap = calcNeedClaimRewardsEras(eras, owners, stakerExposures, ownersRewardsInfo);
    let txs = [];
    let eraRewards = [];
    for (let k in needRewardMap) {
        let o = needRewardMap[k];
        o.forEach(era => {
            txs.push(CT.BC_ENV.API.tx.staking.rewardStakers(k, era));
            eraRewards.push({
                eraIndex: era,
                partialFee: 0,
                callAddress: CT.BC_ENV.REWARD_ACCOUNT_PAIR.address.toString(),
                ownerAddress: k,
                txHash: '',
            });
        });
    }
    if (txs.length == 0) {
        return;
    }

    let batchTx = await CT.BC_ENV.API.tx.utility.batch(txs);
    let paymentInfo = await batchTx.paymentInfo(CT.BC_ENV.REWARD_ACCOUNT_PAIR);

    let txHash = await batchTx.signAndSend(CT.BC_ENV.REWARD_ACCOUNT_PAIR).catch(err => {
        console.error(err);
    });
    eraRewards.forEach(er => {
        er.partialFee = paymentInfo.partialFee.toNumber();
        er.txHash = (txHash || '').toString();
    });

    await CT.models.eraReward.bulkCreate(eraRewards).catch(err => {
        console.error(err);
    });

    log('owner eras info:', JSON.stringify(needRewardMap), 'claimed reward!');
    await CT.stmp.sendEraClaimedByOwner(needRewardMap).catch(err => {
        console.error(err);
    });

}

async function handleExtrinsicSuccessEvent(type, DispatchInfo) {

    // let member = CT.MEMBER_LIST.has(addr);
    // if (!member) {
    //     return;
    // }
    // log(type, DispatchInfo);
}

async function initApi() {
    let checkCount = 0;

    const unsubSSEData = await CT.BC_ENV.API.queryMulti([
        CT.BC_ENV.API.query.swork.free,
        CT.BC_ENV.API.query.swork.reportedFilesSize,
        CT.BC_ENV.API.query.swork.addedFilesCount,
        CT.BC_ENV.API.query.market.fileKeysCount,
    ], ([free, reportedFilesSize, addedFilesCount, fileKeysCount]) => {
        CT.chainEvent.emit(CT.constant.CHAIN_EVENT_TYPE.STORAGE, {
            free: CT.humanize.fileSize(free),
            reportedFilesSize: CT.humanize.fileSize(reportedFilesSize),
            addedFilesCount,
            fileKeysCount
        });
    });
    CT.BC_ENV.API.derive.chain.bestNumberFinalized((blockNumber) => {
        CT.chainEvent.emit(CT.constant.CHAIN_EVENT_TYPE.NEW_HEADER, {bestNumberFinalized: blockNumber});
    })
    CT.BC_ENV.API.derive.chain.bestNumber((blockNumber) => {
        CT.chainEvent.emit(CT.constant.CHAIN_EVENT_TYPE.NEW_HEADER, {bestNumber: blockNumber});
    })

    let unsubNow = await CT.BC_ENV.API.query.timestamp.now((moment) => {
        // log(`The last block has a timestamp of ${(moment.toNumber() / 1000).toDate('YYYY/MM/DD HH:mm:ss')}`);
        if (checkCount % 300 == 299) {
            CT.checkLic(moment.toNumber());
            checkCount = 0;
        }
        saveReport();
    });
    let unsubActiveERA = await CT.BC_ENV.API.query.staking.activeEra(handleEraReward);
    const unsub = await CT.BC_ENV.API.query.system.account(CT.BC_ENV.REWARD_ACCOUNT_PAIR.address, ({
                                                                                                       nonce,
                                                                                                       data: balance
                                                                                                   }) => {
        handleBalanceWarning(CT.BC_ENV.REWARD_ACCOUNT_PAIR.address, balance.free.toNumber(), nonce.toNumber());
        // console.log(`free balance is ${balance.free} with ${balance.reserved} reserved and a nonce of ${nonce}`);
    });
    let unsubEvents = await CT.BC_ENV.API.query.system.events((events) => {
        events.forEach((record) => {
            const {event, phase} = record;
            const types = event.typeDef;

            switch (event.section) {
                case 'swork':
                    if (event.method === 'WorksReportSuccess') {
                        handleWorkReportEvent(event.method, ...event.data)
                    }
                case 'system':
                    if (event.method === 'ExtrinsicSuccess') {
                        // handleExtrinsicSuccessEvent(event.method, ...event.data)
                    }
                    return;
            }
        });
    });
}


initApi()
    .catch(err => {
        console.error(new Date(), err);
    })
    .finally(() => {
        log('subscribed => events, now, activeEra');
    });
