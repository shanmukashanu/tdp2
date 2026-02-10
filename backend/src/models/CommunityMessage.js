const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    resourceType: { type: String, enum: ['image', 'video', 'raw', 'auto'], default: 'image' },
  },
  { _id: false }
);

const CommunityMessageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, default: '' },
    media: { type: MediaSchema, default: null },
  },
  { timestamps: true }
);

CommunityMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CommunityMessage', CommunityMessageSchema);
