const express = require('express');
const app = express();
const chalk = require('chalk');
const Database = require('./db/database');
const axios = require('axios');

const header = {'X-Auth-Token' : '43536e2a56ca4a64aaf34ed57ba1c2fb'};

const apiFootball = {
    host : 'https://api.football-data.org',
    path : '',
    method : 'get',
    headers : header
};

const getRequest = (uri, apiInfo) => {
    apiInfo.url = apiInfo.host + uri;
    return axios(apiInfo);
}

app.get('/import-league/:cl', (req, res) => {
    getRequest('/v2/competitions/'+req.params.cl, apiFootball)
        .then((resp) => {
            // Insertar liga en db
            console.log(chalk.green.bold(resp.data.name));
        })
        .then((resp) => {
            // Obtener equipos de la competicion
            return getRequest('/v2/competitions/'+ req.params.cl + '/teams', apiFootball);
        })
        .then((resp) => {
            // Insertar equipos en db
        })
        .then(() => {
            // Send status code 
        })
        .catch((err) => {
            console.log(chalk.red.bold(err));
        })
});


app.listen(8080, () => {
    console.log(chalk.bgCyan.bold('Server listen on port 8080: \'Ctrl\' + \'C\' to stop.'));
});