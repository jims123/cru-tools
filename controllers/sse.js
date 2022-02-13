const connects = {};

function removeConnect(userId) {
    delete connects[userId];
}

function handleSub(h) {
    for (let k in connects) {
        let res = connects[k];
        if (res.destroyed || !res.writable) {
            removeConnect(k);
            continue;
        }
        res.write(`data: ${JSON.stringify(h)}\n\n`);
    }
}

class Ctrl {
    constructor() {
        CT.chainEvent.on(CT.constant.CHAIN_EVENT_TYPE.NEW_HEADER, handleSub);
        CT.chainEvent.on(CT.constant.CHAIN_EVENT_TYPE.STORAGE, handleSub);
        CT.chainEvent.on(CT.constant.CHAIN_EVENT_TYPE.CRON_TASK, function (now) {
            let data = {
                now: now,
                currentTickTime: CT.MT.mt.currentTickTime,
                nextRoundStartTime: CT.MT.mt.nextRoundStartTime,
            };
            handleSub(data);
        });
    }

    async SSEHomePage(req, res) {
        req.clearTimeout();
        connects[req.user.id] = res;
        res.writeHead(200, {
            'Connection': 'keep-alive',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
        });
        let data = {
            now: Date.now(),
            currentTickTime: CT.MT.mt.currentTickTime,
            nextRoundStartTime: CT.MT.mt.nextRoundStartTime,
        };
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        return;
    }
}

module.exports = new Ctrl();