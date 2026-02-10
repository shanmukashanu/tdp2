const mongoose = require('mongoose');

const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/AppError');
const Message = require('../models/Message');
const CommunityMessage = require('../models/CommunityMessage');
const Group = require('../models/Group');
const User = require('../models/User');

function normalizeLimit(limit) {
  const l = Math.max(1, parseInt(limit, 10) || 50);
  return Math.min(200, l);
}

const listCommunityMessages = asyncHandler(async (req, res) => {
  const limit = normalizeLimit(req.query.limit);

  const items = await CommunityMessage.find({})
    .populate('from', 'name membershipId profilePicture role')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ ok: true, items: items.reverse() });
});

const listGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const limit = normalizeLimit(req.query.limit);

  if (!mongoose.Types.ObjectId.isValid(groupId)) throw new AppError('Invalid groupId', 400);

  const group = await Group.findById(groupId).select('_id isPublic members');
  if (!group) throw new AppError('Group not found', 404);

  const isMember = group.members.some((m) => String(m.user) === String(req.user._id));
  if (!group.isPublic && !isMember && req.user.role !== 'admin') throw new AppError('Forbidden', 403);

  const items = await Message.find({ type: 'group', group: groupId })
    .populate('from', 'name membershipId profilePicture role')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ ok: true, items: items.reverse() });
});

const listPrivateMessages = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params;
  const limit = normalizeLimit(req.query.limit);

  if (!mongoose.Types.ObjectId.isValid(otherUserId)) throw new AppError('Invalid user id', 400);

  const a = String(req.user._id);
  const b = String(otherUserId);

  const items = await Message.find({
    type: 'private',
    $or: [
      { from: a, to: b },
      { from: b, to: a },
    ],
  })
    .populate('from', 'name membershipId profilePicture role')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ ok: true, items: items.reverse() });
});

const listConversations = asyncHandler(async (req, res) => {
  const userId = String(req.user._id);
  const limit = normalizeLimit(req.query.limit);

  // Recent private messages involving the user
  const privateMsgs = await Message.find({
    type: 'private',
    $or: [{ from: userId }, { to: userId }],
  })
    .populate('from', 'name membershipId profilePicture role')
    .sort({ createdAt: -1 })
    .limit(500);

  const byOther = new Map();
  for (const m of privateMsgs) {
    const other = String(m.from?._id) === userId ? String(m.to) : String(m.from?._id);
    if (!other) continue;
    if (!byOther.has(other)) byOther.set(other, m);
  }

  const otherIds = Array.from(byOther.keys()).slice(0, limit);
  const users = await User.find({ _id: { $in: otherIds } })
    .select('name membershipId profilePicture role status')
    .lean();

  const userById = new Map(users.map((u) => [String(u._id), u]));

  const conversations = otherIds
    .map((id) => {
      const last = byOther.get(id);
      const other = userById.get(String(id));
      if (!other) return null;
      return {
        type: 'private',
        otherUser: other,
        lastMessage: {
          _id: last._id,
          text: last.text,
          media: last.media,
          from: last.from,
          createdAt: last.createdAt,
        },
      };
    })
    .filter(Boolean);

  res.json({ ok: true, items: conversations });
});

module.exports = {
  listCommunityMessages,
  listGroupMessages,
  listPrivateMessages,
  listConversations,
};
