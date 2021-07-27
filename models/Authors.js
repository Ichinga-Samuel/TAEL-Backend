const mongoose = require('mongoose');

AuthorSchema = new mongoose.Schema({
    name: String,
    gender: String,
    country: String,
    birthdate: Date,
    bio: String,
    imageUrl: String,
    books: [
        {
            type: mongoose.Schema.Types.ObjectID,
            ref: 'Books'
        }
    ]

}, {timestamps: true});

module.exports = mongoose.model('Author', AuthorSchema);
