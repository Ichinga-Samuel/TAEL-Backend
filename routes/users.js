const express = require('express');
const Users = require('../models/Users');
const {emailService} = require('../utils/messanger')
const {encode, decode} = require("../utils/encrypt");


const router = express.Router();

router.post('/create', async (req, res, next) => {
  try {
    let user = new Users()
    user.setPassword(req.body.password);
    delete req.body.password;
    user.set(req.body)
    await user.save()
    if (user) {
      let token = await encode({id: user._id, from: req.get('From')})
      let path = req.originalUrl.replace(req.path, '')
      let body = {data: {link: `${req.protocol}://${req.headers.host}${path}/activate/${token}`, name: req.body.name,
          title: 'Account Activation'}, subject: 'Account Verification', type: 'activation', recipient: req.body.email}
      let mail = new emailService()
      let resp = await mail.send(body)
      res.status(201).json({msg: 'Account Creation Was Successful Check your Email to Activate your Account', status: true})
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

router.get('/activate/:token', async (req, res) =>{
  try{
    let token = req.params['token'];
    let data = await decode(token)
    await Users.findByIdAndUpdate(data.id, {verified: true})
    res.redirect(data.from)
  }
  catch(e){
    res.status(500).send('Something Went Wrong')
  }
})

router.post('/reset_password', async (req, res) => {
  try{
    let user = await Users.findOne({email: req.body.email}, 'email name')
    if(user.email){
      let token = await encode({email: user.email}, {expiresIn: "2h"})
      let body = {data: {link: `${req.get('From')}/reset_password/${token}`, name: user.name, title: 'Password Reset'},
        recipient: user.email, subject: "Password Reset", type: 'pwd_reset'}
      let mailer = new emailService()
      let resp = await mailer.send(body)
      res.status(200).json({msg: "A Password Reset Link Has Been Sent to Your Email Address", status: true})
    }
    else{
      res.status(200).json({msg: 'No User With this Email Address Try Again', status: false})
    }
  }
  catch (e) {
    res.status(502).json({msg: "Something Went Wrong", status: false})
  }
})

router.post('/change_password', async (req, res) => {
  try {
    let data = await decode(req.body.token);
    let user = await Users.findOne({email: data.email}, 'email');
    let pwd = req.body.password;
    user.setPassword(pwd)
    await user.save()
    res.status(200).json({msg: "Password Reset Successful", status: true})
  }
  catch (e) {
   res.status(200).json({msg: "Password Reset Token has Expired Try Again", status: false})
  }
});

router.post('/mark', async (req, res) => {
  try{
    let title = req.body.title;
    let id = req.body.uid
    let action = req.body.action
    let msg
    if(action === 'pull'){
      await Users.findByIdAndUpdate(id, {$pull: {favourites: title}, new: true})
      msg = "Book Removed from Favourites"
    }
    else if(action==='add') {
      await Users.findByIdAndUpdate(id, {$addToSet: {favourites: title}, new: true})
      msg = "Book Added to Favourites"
    }
    let user = await Users.findById(id).populate({path: 'fave', select: {id: 1, title: 1, imageUrl: 1}})
    res.status(200).json({fave: user.fave, msg: msg})
  }
  catch(e){
    res.status(500).json({msg: "Action Unsuccessful", status: false})
  }
});

router.get('/test', (req, res) => {
  console.log(req.path, req.originalUrl)
  res.json({m: 'dd'})
})
module.exports = router;
