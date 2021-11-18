const express = require('express');

const Books = require('../models/Books');
const User = require('../models/Users')
const Blog = require('../models/Blog')
const Authors = require('../models/Authors');
const reviews = require("../models/Review");
const {auth} = require('./helpers/authenticate');
const {uploader} = require('./helpers/uploader')

const router = express.Router();
let exclude = {updatedAt: 0};

async function pattern (q){
    let bad = ['the', 'and', "your", 'you', 'our', 'when', 'what', 'where', 'ours', 'yours'];
    q = q.toLocaleLowerCase();
    let queries = q.split(' ');
    queries = queries.filter(i => i.length >= 3 && !(bad.includes(i)));
    queries.sort((a, b) => b.length - a.length);
    queries.unshift(q);
    queries = queries.join('|');
    return new RegExp(`${queries}`, 'i')
}

async function result(book){
    try{
        let res = book.toObject();
        res.similar = await book.similar;
        return res
    }
    catch (e){
        return e
    }

}

router.get('/books/popular', async (req, res) => {
    try{
    let  books = await Books.find().select(exclude).sort('-downloads, -year').limit(10).populate('reviews').populate({path: 'authors', select: 'name imageUrl'});
    books = books.map(async i => await result(i));
    books = await Promise.all(books)
    res.status(200).json({data: books, msg:"Loaded Books", status: true});
    }
    catch (e) {
        res.status(500).send({msg: "Something went wrong", status: false})
    }
});

router.get('/books/get/:id', async (req, res) =>{
    try{
        let id = req.params['id']
        let book = await Books.findById(id).select(exclude).populate('reviews').populate({path: 'authors', select: 'name imageUrl id'});
        let resp = await result(book);
        res.status(200).json(resp);
    }
    catch (e) {
        res.status(500).send({msg: "Something went wrong", status: false})
    }

});

router.get('/books/all', async (req, res) =>{
    try{
        let books = await Books.find({}).populate('reviews').populate({path: 'authors', select: 'name imageUrl id'}).lean();
    }
    catch{
        res.status(500).send({msg: "Something went wrong", status: false})
    }
});

router.get('/books/search', async (req, res) =>{
    try {
    let q = req.query.q;
    let reg = new RegExp(`\b${q}\b`, 'i')
    let regexp = await pattern(q);
    let resp = await Authors.find({name: reg}).select({name:1, books:1}).populate({path: 'books', select: exclude, populate:{path: 'authors', select: 'name id imageUrl'} });

    let results = await Books.find({$or:[{title: regexp}, {summary: regexp}, {genres: {$in:[regexp]}}]})
                               .select(exclude).limit(10).populate('reviews').populate({path: 'authors', select: 'name id imageUrl'});

    results = results.map(async i => await result(i));
    results = await Promise.all(results);
    let index = results.map(x => x._id.toString());
    resp = resp.map(async b =>{
        let books = b.books
        books = books.map(async i => {
            if(!(index.includes(i._id.toString()))){
            let book = await i.populate('reviews').execPopulate();
            book = await result(book);
            results.push(book)
            return book
            }
        })
        return books
    });
    res.status(200).json(results);
    }
    catch(e){
        res.status(500).send({msg: "Something went wrong", status: false})
    }

});
router.get('/authors/get/:id', async (req, res) => {
    try{
        let id = req.params['id']
        let book = await Authors.findById(id).select(exclude).sort('name').populate({path: 'books', select: 'title imageUrl id'}).lean();
        res.status(200).json(book)
    }
    catch (e) {
        res.status(500).send({msg: "Something went wrong", status: false})
    }
})


router.get('/authors/search', async (req, res) => {
    try{
        let q = req.query.q;
        let regexp = await pattern(q);
        const results = await Authors.find({name: regexp}).populate({path: 'books', select: 'title imageUrl'}).lean();
        res.status(200).json(results)
    }
    catch (e){
        res.status(500).send({msg: "Something went wrong", status: false})
    }
});

router.get('/authors/all',async (req, res) => {
    try{
        const results = await Authors.find().populate({path: 'books', select: 'title imageUrl'}).lean();
        res.status(200).json(results)
    }
    catch (e) {
        res.status(500).send({msg: "Something went wrong", status: false})
    }
});

router.post('/reviews', auth, async (req, res) => {
    try{
        let bid = req.body.id;
        delete req.body.id;
        await reviews.create(req.body);
        let book = await Books.findById(bid).select('title').populate('reviews')
        res.status(200).json({msg:"Action Successful", status: true, data: book.reviews})
    }
    catch(e){
        res.status(500).send({msg: "Something went wrong", status: false})
    }
})

router.get('/books/downloads/:id', async (req, res) => {
    try{
        let id = req.params['id']
        let book = await Books.findByIdAndUpdate(id, {$inc:{downloads: 1}, new: true}).select('downloads').lean()
        res.status(200).json({status: true, msg: "Action Successful", data: book.downloads})
    }
    catch (e) {
        console.log(e)
        res.status(500).send({msg: "Something went wrong", status: false})
    }
})

router.get('/books/ratings', async (req, res) =>{
    try{
        let id = req.query['id'];
        let r = req.query['r'];
        let rr = parseInt(r)
        if(isNaN(rr) || rr<1 || rr>5) throw Error('Invalid Value')
        let key = `ratings.${r}`
        let book = await Books.findByIdAndUpdate(id, {$inc:{[key]: 1}}, {new: true}).select('ratings')
        res.status(200).json({data: book.ratings, msg: "Action Successful", status: true})
    }
    catch (e) {
        res.status(500).send({msg: "Something went wrong", status: false})

}});

router.get('/books/:branch', async (req, res) =>{
    try{
        let branch = req.params['branch']
        let books = await Books.find({branch: branch}).select(exclude).populate('reviews').populate({path: 'authors', select: 'name imageUrl id'});
        books = books.map(async book => await result(book))
        books = await Promise.all(books)
        res.status(200).json({data: books, msg: "Action Successful", status: true})
    }
    catch (e) {
        res.status(500).send({msg: "Something went wrong", status: false})
    }
});

router.get('/search', async (req, res) => {
    try {
        let include = {title: 1, name:1}
        let q = req.query.q;
        let regexp = await pattern(q);
        const author = await Authors.find({name: regexp}).select(include).limit(10).lean();
        let book = await Books.find({$or:[{title: regexp}, {summary: regexp}, {genres: {$in:[regexp]}}]})
            .select(include).limit(10).lean();

        let result = {authors: author, books: book}
        res.status(200).json({data: result, msg: "Action Successful", status: true});
    }
    catch(e){
        res.status(500).send({msg: "Something went wrong", status: false})
    }
})

router.post('/image', uploader.any(), (req, res)=>{
    try{
        res.status(200).json({
            urls:{
                default: req.files[0].path,
                800: req.files[0].path,
                1024: req.files[0].path,
                1920: req.files[0].path,
            }
        })
    }
    catch{
        res.status(500).json({
            "error": {
                "message": "The image upload failed"
            }
        })
    }

})

router.post('/blogs/create', uploader.any(), async (req, res)=>{
    try{
        let imageUrl = req.files[0].path
        let tags = req.body.tags.split(',').map(i => i.trim())
        if(!req.body.author){
            let rand = crypto.randomBytes(3).toString('hex')
            let body = {name: req.body.writer || "Anon", email: `${rand}@gmail.com`}
            let author = new User()
            author.setPassword(process.env.ANON_PWD)
            author.set(body)
            await author.save()
            req.body.author = author.id
        }
        let body = {...req.body, imageUrl}
        await Blog.create(body)
        res.status(200).json({msg: 'Successfully Created'})
    }
    catch(e){
        console.log(e)
        res.status(500).json({error: "Unable to Save Blog"})
    }
})

router.get('/blogs/latest', async (req, res) => {

    try{
        let blogs = await Blog.find().limit(20).select(exclude).populate('comments').populate({path: 'author', select: 'name'}).sort('-createdAt')
        blogs = blogs.map(async blog => await result(blog))
        blogs = await Promise.all(blogs)
        res.status(200).json({data: blogs, msg: "Successful"})
    }
    catch (e){
        console.log(e)
        res.status(500).send({msg: "Something went wrong", status: false})
    }
})

router.get('/blogs/search', async (req, res) =>{

    try{
        let q = req.query.q
        let reg = await pattern(q)
        let blogs = await Blog.find({$or: [{title: reg}, {body: reg}, {author: reg}]}).select(exclude).populate('comments').populate({path: 'author', select: 'name'}).sort('-likes -createdAt')
        res.status(200).json({data: blogs, msg: 'Successful'})
    }
    catch (e){
        res.status(500).send({msg: "Something went wrong", status: false})
    }
})

router.get('/blogs/likes', async (req, res) => {
    try{
        let id = req.query.id
        let blog = await Blog.findByIdAndUpdate(id, {$inc: {likes: 1}, new: true}).select(exclude).populate('comments').populate({path: 'author', select: 'name'})
        let title = blog.title
        if(req.query.uid){
            let uid = req.query.uid
            await User.findByIdAndUpdate(uid, {$addToSet: {favourites: title}})
        }
        // blog = await result(blog)
        res.status(200).json({data: blog.likes, msg: "Successful"})
    }
    catch (e){
        res.status(500).send({msg: "Something went wrong", status: false})
    }
})

router.get('/blogs/get/:id', async (req, res) =>{
    try{
        let id = req.params.id
        let blog = await Blog.findById(id).select(exclude).populate('comments').populate({path: 'author', select: 'name'})
        blog = await result(blog)
        res.status(200).json({data: blog, msg: "Successful"})
    }
    catch(e){
        console.log(e)
        res.status(500).json({msg: "Something went wrong", status: false})
    }
})

module.exports = router;
