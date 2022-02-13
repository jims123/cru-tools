let TimeWheel = require('./time_wheel_schedule');

let keyIndex = 0;


class MinuteTimer {
    /**
     *
     * @param interval 执行tick间隔, 默认1秒
     */
    constructor(slotSize = 60, interval = 1000, stoped = false) {
        this.stoped = stoped;
        this.interval = interval;
        this._TW = new TimeWheel(slotSize, 0);
        this._TW.on('tick', (tasks) => {
            CT.chainEvent.emit(CT.constant.CHAIN_EVENT_TYPE.CRON_TASK, Date.now());
            // console.log('tasks:', tasks)
            for (let i = 0; i < tasks.length; i++) {
                let t = tasks[i];
                try {
                    t.fn(...t.params);
                } catch (e) {
                    console.error(e);
                }
            }
        });
        this._TW.on('round', async (tasks) => {
            CT.chainEvent.emit(CT.constant.CHAIN_EVENT_TYPE.CRON_TASK, Date.now());

            let sysCfgs = await CT.models.sysCfg.findAll({}, {raw: false});

            let sysCfgsMap = {};
            sysCfgs.forEach(s => {
                sysCfgsMap[s.keyName] = s.cfgValue;
            });

            CT.config.memberOfflineMaxTime = CT._.isNil(sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.MEMBER_OFFLINE_MAX_TIME]) ? CT.config.memberOfflineMaxTime : sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.MEMBER_OFFLINE_MAX_TIME];
            CT.config.memberOfflineHDDCapSpan = CT._.isNil(sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.MEMBER_OFFLINE_HDDCAP_SPAN]) ? CT.config.memberOfflineHDDCapSpan : sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.MEMBER_OFFLINE_HDDCAP_SPAN];
            CT.config.claimPerEra = CT._.isNil(sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.CLAIM_PER_ERA]) ? CT.config.claimPerEra : sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.CLAIM_PER_ERA];
            CT.config.claimPerEraOffset = CT._.isNil(sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.CLAIM_PER_ERA_OFFSET]) ? CT.config.claimPerEraOffset : sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.CLAIM_PER_ERA_OFFSET];
            CT.config.rewardAccountBalanceWarning = CT._.isNil(sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.REWARD_ACCOUNT_BALANCE_WARNING]) ? CT.config.rewardAccountBalanceWarning : sysCfgsMap[CT.constant.SYSTEM_CONFIG_KEY_NAME.REWARD_ACCOUNT_BALANCE_WARNING];

            let [free, reportedFilesSize, fileKeysCount] = await CT.BC_ENV.API.queryMulti([
                CT.BC_ENV.API.query.swork.free,
                CT.BC_ENV.API.query.swork.reportedFilesSize,
                CT.BC_ENV.API.query.market.fileKeysCount,
            ]);
            await CT.models.epochStorageLog.create({
                free: free,
                reportedFilesSize: reportedFilesSize,
                filesCount: fileKeysCount,
            }).catch(err => {
                console.error(err);
            });

        });
        this.timer = setInterval(function () {
            !this.stoped && this._TW.tick();
        }.bind(this), interval);
    }

    /**
     *
     * @param minutes     Number      延迟多少秒执行fn
     * @param params  Array       数组会被解构
     * @param fn      Function    执行函数
     * @returns {string}
     */
    addTask(minutes, params, fn, taskType = TimeWheel.TaskType.Once) {
        let key = `${Date.now().toString(36)}_${CT._.randStr(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')}_${keyIndex++}`;
        if (keyIndex > Number.MAX_SAFE_INTEGER) {
            keyIndex = 0;
        }
        this._TW.addTask(minutes, key, new Task(params, fn), taskType);
        return key;
    }

    start() {
        this.stoped = false;
    }

    stop() {
        this.stoped = true;
    }

    cancleTask(key) {
        return this._TW.cancleTask(key, TimeWheel.TaskType.Once);
    }

    getNextRunTime(key) {
        return this._TW.nextRunTime(key, this.interval);
    }

    get nextRoundStartTime() {
        return (this._TW.size - this._TW.wheel) * this.interval;
    }

    get currentTickTime() {
        return this._TW.wheel * this.interval;
    }
}

class Task {
    constructor(params, fn) {
        this.params = params;
        this.fn = fn;
    }
};

module.exports = module.exports.default = {MinuteTimer, Task};
