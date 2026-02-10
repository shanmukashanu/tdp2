const express = require('express');

const { requireAuth } = require('../middlewares/auth');
const {
  listCommunityMessages,
  listGroupMessages,
  listPrivateMessages,
  listConversations,
} = require('../controllers/messages.controller');

const router = express.Router();

router.get('/community', requireAuth, listCommunityMessages);
router.get('/groups/:groupId', requireAuth, listGroupMessages);
router.get('/private/:otherUserId', requireAuth, listPrivateMessages);
router.get('/conversations', requireAuth, listConversations);

module.exports = router;
