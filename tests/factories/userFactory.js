const mongoose = require('mongoose');

const User = mongoose.model('User');

module.exports = () => new User({}).save();
