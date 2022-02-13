class Exception extends Error {
    constructor(...args) {
        let [code, message] = args.shift();
        let customMessge = args.shift();
        if (Object.prototype.toString.call(customMessge) === '[object Function]') {
            message = fn(...args);
        }
        else if(customMessge){
            message = customMessge;
        }
        super(`${message}[${code}]`);

        this.errCode = code;

        this.errMsg = message;
    }
}

module.exports = Exception;

