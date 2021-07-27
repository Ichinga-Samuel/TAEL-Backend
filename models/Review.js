const mongoose = require('mongoose');


const ReviewSchema = new mongoose.Schema({
    review: String,
    email: String,
    name: String,
    book: String,
    time: Date
}, {timestamps: true});

ReviewSchema.pre('save', function(next){this.time = new Date; next()})
module.exports = mongoose.model('Review', ReviewSchema);
