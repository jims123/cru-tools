class Market {
    constructor() {
    }

    async getMarketInfo() {
        let marketInfo = await CT.BC_ENV.API.queryMulti([
            CT.BC_ENV.API.query.market.fileKeysCount,
            CT.BC_ENV.API.query.market.fileByteFee,
            CT.BC_ENV.API.query.market.fileKeysCountFee,
            CT.BC_ENV.API.query.market.fileBaseFee,
            CT.BC_ENV.API.query.market.ordersCount,
        ]).then(([fileKeysCount, fileByteFee, fileKeysCountFee,fileBaseFee,ordersCount]) => {
            return {
                fileKeysCount,
                fileByteFee,
                fileKeysCountFee,
                fileBaseFee,
                ordersCount,
            }
        });

        return marketInfo;

    }
}

module.exports = new Market();


