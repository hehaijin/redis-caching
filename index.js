'use strict';


const express = require('express');
const request = require('superagent');
const PORT = process.env.PORT|| 3000;

const app = express();

const redis = require('redis');
const REDIS_PORT = process.env.REDIS_PORT||4000;

const client = redis.createClient(REDIS_PORT);
const onFinished = require('on-finished');
const mung=require('express-mung');

function saveToRedis(body, req, res) {
    //if (body.secret) body.secret = '****';
    // ...
    console.log("saving body to redis");
    console.log(body);
    return body;
}

const mung_redis =mung.json(saveToRedis);

function respond(org, numberOfRepos) {
    return `Organization "${org}" has ${numberOfRepos} public repositories.`;
}



function reqToKey(req)
{
    return 1;
}



function cache(req, res, next) {

    //get key for req
    console.log("cache middleware");
    const key= reqToKey(req);
    if(key === undefined) next();


    //redefine send to save value to cache.
    const sendo=res.send;
    res.send= function(str)
    {
        console.log("redefined send");
        client.set(key, str, 'EX', 10);
        sendo.call(this,str);
    }

    //get values from cache

    console.log("getting values from cache");
    client.get(key, function (err, data) {
        if (err) throw err;
        if (data != null) {
            console.log("hitting cache value");
            res.write(data);
            res.end();
            console.log("after");
           // next(false);
        } else {
            next();
        }
    });
}






function getNumberOfRepos(req, res, next) {
    const org = req.query.org;
    request.get(`https://api.github.com/orgs/${org}/repos`, function (err, response) {
        if (err) {

             res.send("SOMETHING IS WRONG");
             next();
        };

        // response.body contains an array of public repositories
        // 5 s
        client.set(org,repoNumber,'EX',5);
        var repoNumber = response.body.length;
        res.send(respond(org, repoNumber));
        next();
    });
};

app.use(cache);
app.get('/repos', getNumberOfRepos);

app.listen(PORT, function () {
    console.log('app listening on port', PORT);
});