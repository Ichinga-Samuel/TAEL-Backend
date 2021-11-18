const express = require('express');
const User = require('../models/Users');
const router = express.Router();


router.post('/login',  async (req, res) => {
    try{
        let fields = {name: 1, email: 1, favourites: 1, reviews: 1, id: 1, password: 1};
        let user = await User.findOne({email: req.body.email}).select(fields).populate({path: 'fave', select: {id: 1, title: 1, imageUrl: 1}}).populate('reviews').populate('blogs');
        if(user.isValidPassword(req.body.password)){
            let token = user.genJwt();
            user.password = {};
            res.json({user, token:token, status: true, msg: `Logged in as ${user.name}`})
        }
        else{
            res.status(401).json({msg: 'Invalid Credentials', status: false})
        }

    }
    catch (e){
        res.status(401).json({msg: 'Invalid Credentials', status: false})
    }
});


module.exports = router;
