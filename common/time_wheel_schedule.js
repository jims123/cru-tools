const {EventEmitter} = require('events');
const TaskType = {
    Once: Symbol('Once'),
    Period: Symbol('Period'),
};
const DEBUG = false;

/**
 * 时间轮定时器
 */
class TimerWheel extends EventEmitter {
    static get TaskType() {
        return TaskType;
    }

    /**
     *  constructor
     * @param slotSize            {Number}        槽个数
     * @param currentWheelIndex   {Number}        当前指针指向
     */
    constructor(slotSize = 60, currentWheelIndex = 0) {
        super();
        this._wheelIndex = currentWheelIndex >= slotSize ? 0 : currentWheelIndex;
        this._slotsOfWheel = slotSize;
        this._slots = [];
        this._slotOfTask = new Map();
        this.strictMode = false;

        for (let i = 0; i < this.size; i++) {
            let slot = {};
            for (let k in TimerWheel.TaskType) {
                slot[TimerWheel.TaskType[k]] = new Map();
            }
            this._slots.push(slot);
        }
    }

    /**
     * 获取当前指针位置
     * @returns {*}
     */
    get wheel() {
        return this._wheelIndex;
    }

    /**
     * 获取时间轮槽数
     * @returns {Number}
     */
    get size() {
        return this._slotsOfWheel;
    }

    /**
     * 查找任务所在的槽索引
     * @param taskKey
     * @returns {*}
     */
    has(taskKey) {
        return this._slotOfTask.has(taskKey);
    }

    /**
     * 查找任务所在的槽索引
     * @param taskKey
     * @returns {*}
     */
    slot(taskKey) {
        if (!this._slotOfTask.has(taskKey)) {
            return -1;
        }
        return this._slotOfTask.get(taskKey);
    }

    /**
     * 获取指定槽的所有任务
     * @param slotIndex
     * @param taskKey
     * @param taskType
     * @returns {*}
     */
    tasks(slotIndex, taskKey, taskType) {
        if (slotIndex < 0 || slotIndex > this.size) {
            return null;
        }
        let slot = this._slots[slotIndex];

        // 如果taskKey为空则返回槽
        if (taskKey === undefined) {
            return slot;
        }
        return slot[taskType].get(taskKey);
    }

    /**
     * 获取任务下次执行时间
     * @param taskKey
     * @param tickInterval
     * @returns {number}
     */
    nextRunTime(taskKey, tickInterval) {
        if (arguments.length !== 2) {
            throw new Error('参数个数不正确');
        }
        // 获取任务所在槽
        let slotIndex = this.slot(taskKey);
        if (slotIndex == null || slotIndex === -1) {
            return -1;
        }

        return (slotIndex + 1) * tickInterval;
    }

    /**
     * 滴答
     */
    tick() {
        if (this._wheelIndex + 1 >= this.size) {
            this._wheelIndex = 0;
            this.emit('round');
        } else {
            this._wheelIndex++;
        }
        let slot = this.tasks(this.wheel);
        let tasks = [];
        for (let task of slot[TimerWheel.TaskType.Once].values()) {
            tasks.push(task);
        }
        slot[TimerWheel.TaskType.Once].clear();
        for (let task of slot[TimerWheel.TaskType.Period].values()) {
            tasks.push(task);
        }
        this.emit('tick', tasks);
        return tasks;
    }

    /**
     * 添加一个任务
     * @param timeout
     * @param taskKey
     * @param task
     * @param taskType
     */
    addTask(timeout, taskKey, task, taskType) {
        if (arguments.length !== 4) {
            throw new Error('参数个数不正确');
        }
        if (this.strictMode && timeout > this.size) {
            return false;
        }
        if (timeout > this.size) {
            DEBUG && console.warn('timeout的精度大于时间轮的精度');
        }
        let slotFallIndex = (timeout + this.wheel) % this.size;
        let slot = this._slots[slotFallIndex][taskType];
        slot.set(taskKey, task);
        this._slotOfTask.set(taskKey, slotFallIndex);
    }

    /**
     * 删除指定任务
     * @param taskKey
     * @param taskType
     * @returns {boolean}
     */
    cancleTask(taskKey, taskType) {
        if (arguments.length !== 2) {
            throw new Error('参数个数不正确');
        }
        // 获取任务所在槽
        let slotIndex = this.slot(taskKey);
        if (slotIndex === -1 || slotIndex == null) {
            return false;
        }

        // 判断任务是否存在
        let slot = this.tasks(slotIndex);
        console.log('slotIndex', slotIndex);
        if (!slot || !slot[taskType].has(taskKey)) {
            return false;
        }

        // 删除任务
        slot[taskType].delete(taskKey);
        this._slotOfTask.delete(taskKey);
        return true;
    }

    /**
     * 清空槽中所有任务
     * @param slotIndex
     * @returns {number}
     */
    clearTask(slotIndex) {
        let slot = this.slot(slotIndex);
        let taskCount = 0;
        for (let k in slot) {
            taskCount += slot[k].size;
            slot[k].clear();
        }
        return taskCount;
    }
}

module.exports = module.exports.default = TimerWheel;