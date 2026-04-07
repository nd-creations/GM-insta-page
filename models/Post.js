const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caption:   { type: String, default: '' },
  mediaUrl:  { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  location:  { type: String, default: '' },
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true, toJSON: { virtuals: true } });

PostSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

module.exports = mongoose.model('Post', PostSchema);