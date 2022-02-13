var express = require('express');
var router = express.Router();

router.get('/', CT.co(CT.ctrls.owner.indexPage));
router.get('/:id', CT.co(CT.ctrls.owner.getOwner));
router.post('/', CT.co(CT.ctrls.owner.addOwner));
router.put('/:id', CT.co(CT.ctrls.owner.editOwner));
router.delete('/', CT.co(CT.ctrls.owner.delOwner));
router.get('/:id/unlock', CT.co(CT.ctrls.owner.getOwnerUnlockList));

module.exports = router;
