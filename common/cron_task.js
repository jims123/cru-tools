const {MinuteTimer, Task} = require("../common/minute_timer");
let TimeWheel = require('../common/time_wheel_schedule');
const log = require("debug")('cru-tool:task');
const stmp = require("./email");

async function handleFn() {
    console.time('check member isOnline');
    let owners = await CT.models.owner.findAll({sendEmergency: 1}, {attributes: ['name', 'address', 'email']});
    let ownerMap = {};
    let ownerAddresses = [];
    let reportTimeLimit = CT.moment().subtract(CT.config.memberOfflineMaxTime + 1, 'hours').unix();
    owners.forEach(o => {
        ownerMap[o.address] = o;
        ownerAddresses.push(o.address);
    });
    let lastReports = await CT.db.query(`select * from (select *,row_number() over (partition by address order by report_slot desc) as rn from t_report) as tt where tt.rn <= 2`, {
        type: CT.Sequelize.QueryTypes.SELECT,
        model: CT.schemas.report,
        mapToModel: true
    });

    let reportGroupMap = CT._.groupBy(lastReports, 'address');
    let reportGroupMapKeys = Object.keys(reportGroupMap);
    let members = [];
    if (CT._.compact(reportGroupMapKeys).length > 0 && CT._.compact(ownerAddresses).length > 0) {
        members = await CT.models.member.findAll({
            address: CT._.compact(reportGroupMapKeys),
            source: CT._.compact(ownerAddresses)
        }, {attributes: ['address', 'name', 'source']});
    }
    let membersMap = {};
    members.forEach(m => {
        membersMap[m.address] = m;
    });
    let ownerEmailData = {};
    for (let k in reportGroupMap) {
        let [cur, prev] = reportGroupMap[k];
        let m = membersMap[cur.address];
        if (!m) {
            continue;
        }
        let o = ownerMap[m.source];
        if (!o || !cur) {
            continue;
        }
        if (cur.reportTime > reportTimeLimit && (!prev || (prev.free - cur.free < CT.config.memberOfflineHDDCapSpan))) {
            continue;
        }
        if (!prev) {
            prev = cur;
        }
        let hddCapDiff = prev.free - cur.free;
        let d = {
            ownerName: o.name,
            ownerAddress: o.address,
            ...cur.toJSON(),
            memberName: m.name,
        };
        if (!ownerEmailData[o.email]) {
            ownerEmailData[o.email] = [];
        }
        if (hddCapDiff >= CT.config.memberOfflineHDDCapSpan) {
            d.capWarn = true;
            d.capDiff = hddCapDiff;
        }
        if (cur.reportTime <= reportTimeLimit) {
            d.reportWarn = true;
        }
        ownerEmailData[o.email].push(d);
    }
    console.timeLog('check member isOnline', JSON.stringify(ownerEmailData));
    let ret = await stmp.sendBadMachinesEmergency(ownerEmailData);
    console.timeEnd('check member isOnline');
}

class CronTask {
    constructor() {
        let minTimer = new MinuteTimer(30, 60 * 1000, true);
        this.status = 'stopped';
        this.mt = minTimer;
        this.mt.addTask(0, [], () => {
            handleFn().catch(err => {
                log('sendBadMachinesEmergency fail! ', err.message);
            })
        }, TimeWheel.TaskType.Period);
    }

    start() {
        log('min_cron_task start at:', CT.moment().utcOffset("+08:00").format('YYYY/MM/DD HH:mm:ss'));
        this.mt.start();
        this.status = 'starting';
    }


}

module.exports = new CronTask();