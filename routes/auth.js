const express = require('express');
const User = require('../models/Users');
const passport = require('passport');
const router = express.Router();

// Login path through front end.
router.post('/login',  async (req, res) => {
        passport.authenticate('local', (err, user, info) =>{
            if(err){
                res.status(400).json({msg:'Check credentials and try again', status: false})
            }
            else if(user){
                let token = user.genJwt();
                user.password = {};
                res.json({user, token:token})

            }
            else{
                res.status(401).json({msg:'Check credentials and try again', status: false})
            }

        })(req, res);
    }
);


module.exports = router;
