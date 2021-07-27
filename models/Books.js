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
        1:{
            type: Number,
            default: 1,
        },
        2:{
            type: Number,
            default: 1
        },
        3:{
            type: Number,
            default: 1,
        },
        4:{
            type: Number,
            default: 1,
        },
        5:{
            type: Number,
            default: 1,
        },
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
                this.get('ratings', null, {getters: false})[r] = 1 + parseInt(this.get('ratings', null, {getters: false})[r])
                return this.get('ratings', null, {getters: false})}

        },
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

// BookSchema.plugin(asmon);
BookSchema.pre('find', {document: true, query:false}, function () {
    process.stdout.write('hey')
    // this.boy = await this.getSimilar()

})
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
