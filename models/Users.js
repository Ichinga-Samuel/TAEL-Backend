const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');


const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        },
    email:{
        type: String,
        index: {unique: true},
        required: true,
    },
    password:{
        hash: {
            type: String,
            required: true
        },
        salt: String,

    },
    verified: {type: Boolean, default: false},
    admin: {type: Boolean, default: false},
    favourites: Array
}, {timestamps: true, toObject: {virtuals: true}, toJSON: {virtuals: true}});

UserSchema.virtual('reviews', {
    ref: "Review",
    localField: "email",
    foreignField: "email",
    justOne: false
});

UserSchema.virtual('fave', {
    ref: "Books",
    localField: "favourites",
    foreignField: "title",
    justOne: false,
    options:{sort: {title: 1}}
});

UserSchema.methods.setPassword = function(pwd){
    this.password.salt = crypto.randomBytes(32).toString('hex');
    this.password.hash = crypto.pbkdf2Sync(pwd, this.password.salt, 10000, 64, "sha512").toString('hex');
};

UserSchema.methods.isValidPassword = function(pwd){
    const hash = crypto.pbkdf2Sync(pwd, this.password.salt, 10000, 64, "sha512").toString('hex');
    return this.password.hash === hash
};

UserSchema.methods.genJwt = function(){
    const expire = new Date();
    expire.setDate(expire.getDate() + 2);
    return jwt.sign({
        _id: this._id,
        email: this.email,
        name: this.name,
        exp: parseInt(expire.getTime() / 1000, 10)
    }, process.env.JWT_SECRET
    )
};

const User = mongoose.model('Users', UserSchema);

module.exports = User;
