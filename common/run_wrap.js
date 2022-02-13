
function run(fn) {
    return function (req, res, next) {
        fn(req, res, next)
            .then((data) => {
                return 0;
            })
            .catch(err => {
                console.error(err.stack);
                if (err.errCode === undefined) {
                    let stack = err.stack;
                    err = new CT.Exception(CT.error.ERROR_UNKNOWN);
                    err.stack = stack;
                }
                res.format({
                    "json": () => {
                        res.json(err);
                    },
                    "html": () => {
                        res.render('error', {err});
                    }
                });
            })
    };
}

module.exports = run;