const express = require('express');
const Users = require('../models/Users');


const router = express.Router();

router.post('/create', async (req, res, next) => {
  let fields = {'name': 1, 'email': 1, 'fave': 1, 'reviews': 1, 'id': 1}
  try {
    let user = new Users();
    user.setPassword(req.body.password);
    delete req.body.password;
    user.set(req.body);
    user = await user.save();
    if (user) {
      res.status(201).json({msg: 'Account Creation Was Successful', status: true})
    }
  }
  catch(e){
    res.status(502).send({msg: 'Account Creation Was Not Successful', status: false});
  }

});

router.get('/validate_email/:email', async (req, res) => {
  try{
    let email = req.params['email'];
    let count = await Users.countDocuments({email: email});
    if(count > 0){
        res.json({status: false, msg: 'Email already in use'})
    }else{res.json({status: true, msg: 'Email available'})}
  }
  catch (e) {
    res.json({status: false, msg: 'Unable to validate email at the moment'})
  }

});

router.post('/mark', async (req, res) => {
  try{
    let title = req.body.title;
    let fields = {'name': 1, 'email': 1, 'fave': 1, 'reviews': 1, 'id': 1, favourites: 1};
    let user = await Users.findById(req.body.uid).select(fields);
    if(user.favourites.includes(title)){
      user = await user.updateOne({$pull: {favourites: title}})
    }else{
      user = await user.updateOne({$addToSet: {favourites: title}})
    }
    user = await user.save();
    user = await user.populate({path: 'fave', select: {id: 1, title: 1, imageUrl: 1}}).populate('reviews').execPopulate();
    res.status(200).json({user: user, msg: "Action Successful"})
  }
  catch(e){
    res.status(500).json({msg: "Action Unsuccessful", status: false})
  }
});

module.exports = router;
