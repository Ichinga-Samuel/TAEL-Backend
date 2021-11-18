const mongoose = require('mongoose');
// const asmon = require('mongoose-async')

const BookSchema = new mongoose.Schema({
    title:{
        type: String,
    },
    language:{
        type: String,
        default: 'English'
    },
    year: Number,
    genres: Array,
    branch: String,
    summary:{
        type: String,
    },
    pages: Number,
    imageUrl: String,
    fileUrl: String,
    fileType: String,
    fileSize: {
        type: Number,
    },
    ratings: {
        type: mongoose.Mixed,
        1: Number,
        2: Number,
        3: Number,
        4: Number,
        5: Number,
        get: function(r){
            let items = Object.entries(r);
            let s = 0;
            let t = 0;
            for(let [k,v] of items){
                t += v;
                s += v * parseInt(k);
            }
            return Math.round(s / t)
        },
        set: function(r){
            if (!(this instanceof mongoose.Document)){
                throw Error("Don't do this")
            }else{
                if(r instanceof Object) {return r}
                let rr = parseInt(r)
                if(isNaN(rr) || rr<1 || rr>5) throw Error('Invalid Value')
                this.get('ratings', null, {getters: false})[r] = 1 + parseInt(this.get('ratings', null, {getters: false})[r])
                return this.get('ratings', null, {getters: false})}

        },
        default: {1:1, 2:2, 3:3, 4:4, 5:5}
    },
    authors: [{
        type: mongoose.Schema.Types.ObjectID,
        ref: 'Author'
    }],
    downloads:{
        type: Number,
        default: 0,
    }
}, {timestamps: true, toObject: {virtuals: true, getters: true}, toJSON:{virtuals: true, getters:true}});


BookSchema.virtual('reviews', {
    ref: "Review",
    localField: "title",
    foreignField: "book",
    justOne: false,
    options:{sort: {createdAt: 1}}
});

BookSchema.methods.getSimilar = async function(){
    let fields = {title:1, imageUrl:1, id:1}
    let model = mongoose.model('Books');
    let result =  await model.find({genres: {$in: this.genres}}).select(fields).limit(5).lean();
    return result
};

BookSchema.virtual('similar').get(function () {
        return this.getSimilar()
})

module.exports = mongoose.model('Books', BookSchema);
