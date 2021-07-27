const jwt = require("express-jwt");


auth = jwt({
    secret: process.env.JWT_SECRET,
    requestProperty: 'data',
    algorithms: ["HS256"]
});

module.exports = {auth};
