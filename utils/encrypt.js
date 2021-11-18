const jwt = require('jsonwebtoken')

const {JWT_SECRET} = process.env

function encode(data, options){
    return new Promise((resolve, reject) => {
        try{
            let token = jwt.sign(data, JWT_SECRET, options || {})
            let r = Buffer.from(token, 'ascii')
            resolve(r.toString('base64url'))
        }
        catch (e){
            reject(e)
        }
    })

}

function decode(data){
    return new Promise((resolve, reject) => {
        try{
            let r = Buffer.from(data, 'base64url')
            let j = r.toString('ascii')
            resolve(jwt.verify(j, JWT_SECRET))
        }
        catch (e){
            reject(e)
        }
    })}

module.exports = {encode, decode}