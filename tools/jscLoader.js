require('bytenode');
if (!~['generateTable'].indexOf(process.argv[2])) {
    process.exit(1001);
}
require(`./${process.argv[2]}`);