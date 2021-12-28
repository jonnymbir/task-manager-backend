const express = require('express');
const User = require('../models/user');
const sharp = require('sharp');
const auth = require('../middleware/auth');
const multer = require('multer');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');
const router = new express.Router();

router.post('/users', async (req, res)=>{
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user:user, token:token}); 
    } catch (error) {
        res.status(400).send(error);
    }
})

router.post('/users/login', async (req, res)=>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(404).send();
    }
})

router.post('/users/logout', auth, async (req, res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token;
        })
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
})

router.post('/users/logoutAll', auth, async (req, res)=>{
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/users/me', auth, async (req, res)=>{
   res.send(req.user);
})

router.get('/users/:id', async (req, res)=>{
    const id = req.params.id;
    try{
        const result = await User.findById(id);
        if(!result){
            return res.status(404).send("Data nosdcsact found");
        }
        res.status(200).send(result);
    } catch(e){
        res.status(505).send({msg: "Data not found"});
    }
})


router.patch('/users/me', auth, async (req, res)=>{
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'age', 'email', 'password'];
        const isValidOperation = updates.every((update)=> allowedUpdates.includes(update));

        if(!isValidOperation){
            return res.status(400).send({ error : "Invalid Updates" });
        }

        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators:true});

        const user = req.user;

        updates.forEach((update)=> user[update] = req.body[update]);
        await user.save();
    
        res.status(201).send(user);
    } catch (e) {
        res.status(400).send(e);
    }
})

router.delete('/users/me', auth, async(req, res)=>{
    try {
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.name);
        res.status(200).send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }

})

const upload = multer({
    //dest: 'avatars', // folder to store pictures
    limits: {
        fileSize: 1000000 // 1MB
    },
    fileFilter(req ,file, cb){
        // if(!file.originalname.endsWith('pdf')){
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/)){
            return cb(new Error('Upload only Pictures!'));
        }
        cb(undefined, true);

    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res)=>{
    //req.user.avatar = req.file.buffer; // we can only access this if the dest folder is not set
    const buffer = await sharp(req.file.buffer).resize({ width:250, height:250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error : error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar){
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(400).send();
    }
})

module.exports = router;