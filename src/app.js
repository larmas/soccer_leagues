const express = require('express');
const app = express();
const chalk = require('chalk');
const Database = require('./db/database');
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
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

function addCompetition(competition){
    database = new Database;
    console.log(chalk.green.bold('Adding league: '+ competition.name));
    return database.executeQuery(`SELECT * FROM competition WHERE id=?`, competition.id)
        .then((queryResult) => {
            if (queryResult == ''){
                return database.executeQuery(`INSERT INTO competition (id, code, name, areaName) VALUES (?,?,?,?)`, 
                [competition.id, competition.code, competition.name, competition.area.name]);
            }
            return Promise.reject({message: "League already imported", code : 409});
        })
        .catch((err) => {
            return Promise.reject(err);
        })
        .finally(() => database.endConnection());
}

function mapInsert(array, f, id){
    return array.reduce((promise, item) => {
        return promise.then(() => {
            return f(item, id);
        });
    }, Promise.resolve());
}

function addTeam(team, competition){
    var alreadyExists;
    return new Promise((resolve, reject) => {
    database = new Database;
    console.log(chalk.green.bold('Adding team: '+ team.name));
    getRequest('/v2/teams/'+team.id, apiFootball)
        .then((resp) => {
            team = resp.data;
            return database.executeQuery(`SELECT * FROM team WHERE id=?`, [team.id])
        })
        .then((queryResult) => {
            if (queryResult == ''){
                alreadyExists = false;
                return database.executeQuery(`INSERT INTO team (id, name, tla, shortName, areaName, email) VALUES (?,?,?,?,?,?)`,
                [team.id, team.name, team.tla, team.shortName, team.area.name, team.email])
            }
            alreadyExists = true;
            return Promise.resolve();
        })
        .then(() => {
            return database.executeQuery(`SELECT * FROM teamCompetition WHERE teamId=? AND competitionId=?`, 
            [team.id, competition])
        })
        .then((queryResult) => {
            if (queryResult == '')
                return database.executeQuery(`INSERT INTO teamCompetition (teamId, competitionId) VALUES (?,?)`,
                [team.id, competition]);
            return Promise.resolve();
        })
        .then(() => {
            database.endConnection();
            if(!alreadyExists){
                players = team.squad.filter((player) => {
                    return player.role == 'PLAYER';
                });
                return mapInsert(players, addPlayer, team.id);
            }
            return Promise.resolve();
        })
        .then(() => {
            resolve();
        })
        .catch((err) => {
            console.log(err);
        })
    });
}

function addPlayer(player, team){
    return new Promise((resolve, reject) => {
        database = new Database;
        console.log(chalk.green.bold('Adding player: '+player.name));
        database.executeQuery(`SELECT * FROM player WHERE id=?`, [player.id])
        .then((queryResult) => {
            if (queryResult == ''){
                if (player.dateOfBirth != null)
                    dateOfBirth = player.dateOfBirth.substring(0,10);
                else
                    dateOfBirth = player.dateOfBirth;
                return database.executeQuery(`INSERT INTO player (id, name, position, nationality, dateOfBirth, countryOfBirth) VALUES (?,?,?,?,?,?)`, 
                [player.id, player.name, player.position, player.nationality, dateOfBirth, player.countryOfBirth])
            }
            return Promise.resolve();
        })
        .then(() => {
            return database.executeQuery(`SELECT * FROM playerTeam WHERE playerId=? AND teamId=?`,[player.id, team])
        })
        .then((queryResult) => {
            if(queryResult == '')
                return database.executeQuery(`INSERT INTO playerTeam (playerId, teamId) VALUES (?,?)`, [player.id, team]);
            return Promise.resolve();
        })
        .then(() => {
            database.endConnection();
            resolve();
        })
        .catch((err) => {
            console.log(err);
        })
    });
}

axios.interceptors.response.use(null,(err) => {
    if (err.response.status == 429){
        return axios.request(err.config);
    }
    return Promise.reject(err);
})

app.get('/import-league/:codeLeague', (req, res) => {
    codeLeague = req.params.codeLeague;
    expressionCode = /^[A-Z]+[A-Z,0-9]$/;
    if (codeLeague.match(expressionCode)){
        getRequest('/v2/competitions/'+req.params.codeLeague, apiFootball)
            .then((resp) => {
                // Insertar liga en db
                return addCompetition(resp.data);
            })
            .then((resp) => {
                // Obtener equipos de la competicion
                return getRequest('/v2/competitions/'+ req.params.codeLeague + '/teams', apiFootball);
            })
            .then((resp) => {
                // Insertar equipos en db
                return mapInsert(resp.data.teams, addTeam, resp.data.competition.id);
            })
            .then(() => {
                res.status(201).json({message: 'Successfully imported'});
            })
            .catch((err) => {
                if (err.response)
                    res.status(404).json({message: 'Not found'});
                else if (err.code == 409)
                    res.status(409).json({message: err.message});
                else
                    res.status(504).json({message: 'Server error'});
            })
    } else {
        res.status(400).json({message: 'Wrong league code format. Regular expression of the correct format: /^[A-Z]+[A-Z,0-9]$/ '})
        throw new Error('Wrong league code format. Regular expression of the correct format: /^[A-Z]+[A-Z,0-9]$/ ');
    }
});

app.get('/total-players/:codeLeague', (req, res) => {
    database = new Database;
    codeLeague = req.params.codeLeague;
    expressionCode = /^[A-Z]+[A-Z,0-9]$/;
    var query;
    if(codeLeague.match(expressionCode)){
        query = 'SELECT COUNT(playerId) AS cantPlayers FROM (SELECT teamId,code FROM competition, teamCompetition WHERE competition.id = teamCompetition.competitionId) competitionTeam NATURAL JOIN playerTeam WHERE code=?';
    }else{
        res.status(400).json({message: 'Wrong league code format. Regular expression of the correct format: /^[A-Z]+[A-Z,0-9]$/ '})
        throw new Error('Wrong league code format. Regular expression of the correct format: /^[A-Z]+[A-Z,0-9]$/ ');
    }
    database.executeQuery(query,codeLeague)
        .then(([queryResult]) => {
            if (queryResult.cantPlayers == 0){
                return Promise.reject();
            }
            res.status(200).json({total: queryResult.cantPlayers});
            database.endConnection();
        })
        .catch((err) => {
            res.status(404).json({message: 'Not found'})
        })
});


app.listen(8080, () => {
    console.log(chalk.bgCyan.bold('Server listen on port 8080: \'Ctrl\' + \'C\' to stop.'));
});