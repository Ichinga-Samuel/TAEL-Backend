const mongoose = require('mongoose');


const ReviewSchema = new mongoose.Schema({
    review:{
        type: String,
        required: true
    },
    book: String,
    email: String,
    name: String,
}, {timestamps: true});

module.exports = mongoose.model('Review', ReviewSchema);
