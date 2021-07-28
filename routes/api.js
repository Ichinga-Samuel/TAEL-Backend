const express = require('express');
const Books = require('../models/Books');
const Authors = require('../models/Authors');
const reviews = require("../models/Review");
const {auth} = require('./helpers/authenticate');

const router = express.Router();

let exclude = {updatedAt: 0};
function pattern (q){
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
    let res = book.toObject();
    res.similar = await book.similar;
    return res
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
    let regexp = pattern(q);
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
        console.log(e)
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
        let regexp = pattern(q);
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
        let rev = await reviews.create(req.body);
        let book = await Books.findById(bid).select(exclude).populate('reviews').populate({path: 'authors', select: 'name imageUrl id'});
        book = result(book)
        res.status(200).json({msg:"Action Successful", status: true, data: book})
    }
    catch(e){
        res.status(500).send({msg: "Something went wrong", status: false})
    }
})

router.get('/books/downloads/:id', async (req, res) => {
    try{
        let id = req.params['id']
        let book = await Books.findByIdAndUpdate(id, {$inc:{downloads: 1}, new: true}).select(exclude).populate('reviews').populate({path: 'authors', select: 'name imageUrl id'});
        book = result(book)
        res.status(200).json({status: true, msg: "Action Successful", data: book})
    }
    catch (e) {
        res.status(500).send({msg: "Something went wrong", status: false})
    }
})

router.get('/books/ratings', async (req, res) =>{
    try{
        let id = req.query['id'];
        let r = req.query['r'];
        let key = `ratings.${r}`
        let book = await Books.findByIdAndUpdate(id, {$inc:{[key]: 1}}, {new: true}).select(exclude).populate('reviews').populate({path: 'authors', select: 'name imageUrl id'});
        book = result(book)
        res.status(200).json({data: book, msg: "Action Successful", status: true})
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
        let regexp = pattern(q);
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

router.get('/test', auth, (req, res) =>{
    console.log(req.data);
    res.status(200).json('ok')
});

module.exports = router;
