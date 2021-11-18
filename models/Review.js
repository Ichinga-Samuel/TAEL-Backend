const mongoose = require('mongoose');


const ReviewSchema = new mongoose.Schema({
    review: String,
    email: String,
    name: String,
    book: String,
}, {timestamps: true});

module.exports = mongoose.model('Review', ReviewSchema);
