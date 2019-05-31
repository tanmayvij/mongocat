var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var jwtkey = 'vhxbvkjlcjvbcvbg';
var cryptokey = 'vxcvxzszadcxzxcs';

module.exports.connect = function(req, res, next) {
    var token = '';
    var uri = getUri(req.body);
    mongoose.connect(uri, { useNewUrlParser: true, connectTimeoutMS: 2500 });
    mongoose.connection.on("connected", function() {
        var payload = {
            'host': req.body.host,
            'port': req.body.port,
            'username': req.body.username,
            'authdb': req.body.authdb,
            'password': encrypt(req.body.password),
            'srv': req.body.srv
        };
        token = jwt.sign(payload, jwtkey, {expiresIn: 3600*24});
        token = encrypt(token);
        result = {
            'token': token,
            'host': req.body.host,
            'port': req.body.port,
            'username': req.body.username,
            'authdb': req.body.authdb,
            'error': false,
            'errorMsg': ''
        };
        mongoose.connection.close();
        req.status = 200;
        req.result = result;
        next();
    });
    mongoose.connection.on("error", function(err) {
        result = {
            'error': true,
            'errorMsg': 'Error: Could not connect to the given host.'
        }
        mongoose.connection.close();
        req.status = 400;
        req.result = result;
        next();
    });
};

module.exports.returnDb = function(req, res) {
    res.status(req.status).json(req.result);
};

function getUri(params)
{
    var uri = 'mongodb';
    var db = params.db ? params.db : 'mongocat';
    if(params.srv)
    {
        uri+='+srv';
        uri+=`://${params.username}:${params.password}@${params.host}/${db}?authSource=${params.authdb}`;
    }
    else
    {
        uri+=`://${params.username}:${params.password}@${params.host}:${params.port}/${db}?authSource=${params.authdb}`;
    }
    return uri;
}

function encrypt(text) {
    var cipher = crypto.createCipher('aes-256-cbc', cryptokey);
    var encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

function decrypt(cipher) {
    var decipher = crypto.createDecipher('aes-256-cbc', cryptokey);
    var decrypted = decipher.update(cipher, 'hex', 'utf8');
    decrypted += decipher.final("utf8");
    return decrypted;
}

module.exports.getDBs = function(req, res) {
    if(!req.headers.token)
    {
        res.status(401).json({"error":"no token provided"});
        return;
    }
    var token = decrypt(req.headers.token);
    var payload = {};
    jwt.verify(token, jwtkey, function(err, decoded) {
        if(err) {
            res.status(401).json({"error": "bad token"});
        }
        else {
            payload = decoded;
            payload.password = decrypt(payload.password);
            var uri = getUri(payload);
            var admin = mongoose.mongo.Admin;
            var connection = mongoose.createConnection(uri, {useNewUrlParser:true});
            connection.on('open', function() {
                new admin(connection.db).listDatabases(function(err, result) {
                    if(err)
                        res.status(500).json(err);
                    else {
                        res.status(200).json(result.databases);
                        connection.close();
                    }
                });
            });
        }
    });
};

module.exports.listCollections = function(req, res) {
    if(!req.headers.token)
    {
        res.status(401).json({"error":"no token provided"});
        return;
    }
    var token = decrypt(req.headers.token);
    var payload = {};
    jwt.verify(token, jwtkey, function(err, decoded) {
        if(err) {
            res.status(401).json({"error": "bad token"});
        }
        else {
            payload = decoded;
            payload.password = decrypt(payload.password);
            payload.db = req.params.dbName;
            var uri = getUri(payload);
            var connection = mongoose.createConnection(uri, {useNewUrlParser:true});
            connection.on('open', function() {
                connection.db.listCollections().toArray((error, collections) => {
                    if(error)
                        res.status(500).json({"error": error});
                    else {
                        res.status(200).json(collections);
                        connection.close();
                    }
                });
            });
        }
    });
};

module.exports.viewCollection = function(req, res) {

};