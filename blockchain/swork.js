class Swork {
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

    async getWorkerReports(addresses) {
        if (addresses.length == 0) {
            return [];
        }
        let workerAnchors = await this.getWorkerAnchors(addresses);
        let workReports = await CT.BC_ENV.API.query.swork.workReports.multi(workerAnchors.map(d => d.anchor)).then(data => {
            return data.map(d => {
                return d.toJSON();
            });
        });

        for (let i = 0; i < workReports.length; i++) {
            workReports[i].punishment_deadline = workerAnchors[i].punishment_deadline;
        }

        return workReports;

    }

    async getSystemStorageInfo() {
        let storageInfo = await CT.BC_ENV.API.queryMulti([CT.BC_ENV.API.query.swork.free, CT.BC_ENV.API.query.swork.reportedFilesSize, CT.BC_ENV.API.query.swork.spower]).then(([free, reportedFilesSize, spower]) => {
            return {
                free,
                reportedFilesSize,
                spower
            }
        });

        return storageInfo;

    }

    async checkReportsInSlot(addresses, reportSlot) {
        let workerAnchors = await this.getWorkerAnchors(addresses).then(data => {
            return data.map(wi => {
                return [wi.anchor, reportSlot];
            });
        });
        let reportedInSlotInfos = await CT.BC_ENV.API.query.swork.reportedInSlot.multi(workerAnchors).then(data => {
            return data.map(d => {
                return d.toJSON();
            });
        });
        return reportedInSlotInfos;
    }
}

module.exports = new Swork();


