passport = require('passport');
const LS = require('passport-local').Strategy;
const Users = require('../models/Users');


module.exports = {
    local(passport) {
        passport.use(new LS({usernameField: 'email'}, async (username, password, done) => {
                try {
                    let fields = {'name': 1, 'email': 1, 'fave': 1, 'reviews': 1, 'id': 1, password: 1};
                    let user = await Users.findOne({email: username}).populate({path: 'fave', select: {id: 1, title: 1, imageUrl: 1}}).populate('reviews').select(fields);
                    if (!user) {
                        return done(null, false, {message: "Incorrect Email"});
                    }
                    if (!(user.isValidPassword(password))) {
                        return done(null, false, {message: "Incorrect Password"})
                    }
                    return done(null, user)
                } catch (err) {
                    return done(err)
                }

            })
        )}

};

