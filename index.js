'use strict';


const express = require('express');
const request = require('superagent');
const PORT = process.env.PORT|| 3000;

const app = express();

function respond(org, numberOfRepos) {
    return `Organization "${org}" has ${numberOfRepos} public repositories.`;
}

function getNumberOfRepos(req, res, next) {
    const org = req.query.org;
    request.get(`https://api.github.com/orgs/${org}/repos`, function (err, response) {
        if (err) throw err;

        // response.body contains an array of public repositories
        var repoNumber = response.body.length;
        res.send(respond(org, repoNumber));
    });
};

app.get('/repos', getNumberOfRepos);

app.listen(PORT, function () {
    console.log('app listening on port', PORT);
});