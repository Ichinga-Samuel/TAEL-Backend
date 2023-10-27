const mongoose = require('mongoose');

AuthorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    birthdate: {
        type: Date,
        required: true,
    },
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
