const mongoose = require('mongoose')

BlogSchema = new mongoose.Schema({
    imageUrl: String,
    title: String,
    body: String,
    tags: Array,
    likes: {
        type: Number,
        default: 0,
    },
    duration: {
      type: Number,
      default: 5
    },
    language: {
        type: String,
        default: "English"
    },
    author:{
        type: mongoose.Schema.Types.ObjectID,
        ref: 'Users'
    }

}, {timestamps: true, toObject: {virtuals: true, getters: true}, toJSON:{virtuals: true, getters:true}})

BlogSchema.virtual('comments', {
    ref: "Review",
    localField: "title",
    foreignField: "book",
    justOne: false,
    options:{sort: {createdAt: 1}}
});

BlogSchema.methods.getSimilar = async function(){
    let fields = {title:1, imageUrl:1, id:1}
    let model = mongoose.model('Books');
    let result =  await model.find({genres: {$in: this.tags}}).select(fields).limit(5).lean();
    return result
};

BlogSchema.virtual('similar').get(function () {
    return this.getSimilar()
})

module.exports = mongoose.model('Blogs', BlogSchema);