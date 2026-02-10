const express = require('express');

const { requireAuth } = require('../middlewares/auth');
const {
  createGroup,
  listGroups,
  getGroup,
  joinGroup,
  requestAccess,
  listJoinRequests,
  approveJoinRequest,
  denyJoinRequest,
  leaveGroup,
  deleteGroup,
} = require('../controllers/groups.controller');

const router = express.Router();

router.get('/', listGroups);
router.get('/:id', requireAuth, getGroup);

router.post('/', requireAuth, createGroup);
router.post('/:id/join', requireAuth, joinGroup);
router.post('/:id/request', requireAuth, requestAccess);
router.get('/:id/requests', requireAuth, listJoinRequests);
router.post('/:id/requests/:userId/approve', requireAuth, approveJoinRequest);
router.delete('/:id/requests/:userId', requireAuth, denyJoinRequest);
router.post('/:id/leave', requireAuth, leaveGroup);
router.delete('/:id', requireAuth, deleteGroup);

module.exports = router;
