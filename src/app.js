const express = require('express');
const app = express();
const chalk = require('chalk');
const Database = require('./db/database');
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

/**
 * Data for the connection with de Football-data API.
 */
const apiFootball = {
    host : 'https://api.football-data.org',
    path : '',
    method : 'get',
    headers : {
        'X-Auth-Token' : '43536e2a56ca4a64aaf34ed57ba1c2fb'
    }
};

/**
 * Send a get request through via axios(HTTP client).
 * @param uri Request destination.
 * @param apiInfo Data to make the request.
 * @return {Promise} 
 */
const getRequest = (uri, apiInfo) => {
    apiInfo.url = apiInfo.host + uri;
    return axios(apiFootball);
}

/**
 * Add a competition to the databse if it doesn't exists.
 * @param competition Competition data.
 * @return {Promise} 
 */
function addCompetition(competition){
    database = new Database;
    console.log(chalk.green.bold('Adding league: '+ competition.name));
    // Check if the competition already exists in the database.
    return database.executeQuery(`SELECT * FROM competition WHERE id=?`, competition.id)
        .then((queryResult) => {
            if (queryResult == ''){
                //If it doesn't exists, add it.
                return database.executeQuery(`INSERT INTO competition (id, code, name, areaName) VALUES (?,?,?,?)`, 
                [competition.id, competition.code, competition.name, competition.area.name]);
            }
            return Promise.reject({message: "League already imported", code : 409});
        })
        .catch((err) => {
            return Promise.reject(err);
        })
        // End database connection
        .finally(() => database.endConnection());
}

/**
 * Apply a function to each element of an array of items
 * @param array Array of items
 * @param f Function that takes an array item and an integer and returns a promise.
 * @param id Identifier for a team or player.
 * @return {Promise} 
 */
function mapInsert(array, f, int){
    return array.reduce((promise, item) => {
        return promise.then(() => {
            return f(item, int);
        });
    }, Promise.resolve());
}

/**
 * Add a team to the database if it doesn't exist. Also add a relationship between the 
 * team and a competition.
 * @param team Team data.
 * @param competition Competition in which the team participates.
 * @return {Promise}
 */
function addTeam(team, competition){
    var alreadyExists;
    return new Promise((resolve, reject) => {
        database = new Database;
        console.log(chalk.green.bold('Adding team: '+ team.name));
        // Obtain complete info about the team.(Need players).
        getRequest('/v2/teams/'+team.id, apiFootball)
            .then((resp) => {
                team = resp.data;
                // Check if the team already exists in the database.
                return database.executeQuery(`SELECT * FROM team WHERE id=?`, [team.id])
            })
            .then((queryResult) => {
                if (queryResult == ''){
                    // Add team in the database.
                    alreadyExists = false;
                    return database.executeQuery(`INSERT INTO team (id, name, tla, shortName, areaName, email) VALUES (?,?,?,?,?,?)`,
                    [team.id, team.name, team.tla, team.shortName, team.area.name, team.email])
                }
                alreadyExists = true;
                return Promise.resolve();
            })
            .then(() => {
                // Check if the relationship already exists in the database.
                return database.executeQuery(`SELECT * FROM teamCompetition WHERE teamId=? AND competitionId=?`, 
                [team.id, competition])
            })
            .then((queryResult) => {
                if (queryResult == '')
                    // Add the relationship in the database.
                    return database.executeQuery(`INSERT INTO teamCompetition (teamId, competitionId) VALUES (?,?)`,
                    [team.id, competition]);
                return Promise.resolve();
            })
            .then(() => {
                database.endConnection();
                if(!alreadyExists){
                    // Get only team players.
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

/**
 * Add a player to the database if it doesn't exists. Also add a relationship between the 
 * player and his team.
 * @param player Player data.
 * @param team Team the player belongs to.
 * @return {Promise}
 */
function addPlayer(player, team){
    return new Promise((resolve, reject) => {
        database = new Database;
        console.log(chalk.green.bold('Adding player: '+player.name));
        // Check if the player already exists in the database.
        database.executeQuery(`SELECT * FROM player WHERE id=?`, [player.id])
        .then((queryResult) => {
            // Convert birthday date to SQL Date type.
            if (queryResult == ''){
                if (player.dateOfBirth != null)
                    dateOfBirth = player.dateOfBirth.substring(0,10);
                else
                    dateOfBirth = player.dateOfBirth;
                // Add player in the database.
                return database.executeQuery(`INSERT INTO player (id, name, position, nationality, dateOfBirth, countryOfBirth) VALUES (?,?,?,?,?,?)`, 
                [player.id, player.name, player.position, player.nationality, dateOfBirth, player.countryOfBirth])
            }
            return Promise.resolve();
        })
        .then(() => {
            // Check if the relationship already exists in the database.
            return database.executeQuery(`SELECT * FROM playerTeam WHERE playerId=? AND teamId=?`,[player.id, team])
        })
        .then((queryResult) => {
            if(queryResult == '')
                // Add relationship
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

/**
 * If the error code is 429, send request again.
 */
axios.interceptors.response.use(null,(err) => {
    if (err.response.status == 429){
        return axios.request(err.config);
    }
    return Promise.reject(err);
})

/**
 * GET request /import-league/{leagueCode}
 * This request gets data from a competition with your selected teams and 
 * players through a competition code and save it to the database. It should be considered 
 * that a team can participate in one or more leagues and a player can belong to one or more teams.
 * The API responses for /import-league/{leagueCode} are:
 *      HttpCode 201, {"message": "Successfully imported"} --> When the leagueCode was successfully 
 *      imported.
 *      HttpCode 409, {"message": "League already imported"} --> If the given leagueCode was already 
 *      imported into the DB (and in this case, it doesn't need to be imported again).
 *      HttpCode 404, {"message": "Not found" } --> if the leagueCode was not found.
 *      HttpCode 504, {"message": "Server Error" } --> If there is any connectivity issue either with 
 *      the football API or the DB server.
 *      HttpCode 400, {"message": "Wrong league code format. Regular expression of the correct 
 *      format: /^[A-Z]+[A-Z,0-9]$/"} --> If the format of the league code is wrong.
 */
app.get('/import-league/:codeLeague', (req, res) => {
    codeLeague = req.params.codeLeague;
    expressionCode = /^[A-Z]+[A-Z,0-9]$/;
    if (codeLeague.match(expressionCode)){
        getRequest('/v2/competitions/'+req.params.codeLeague, apiFootball)
            .then((resp) => {
                // Insert competition into database.
                return addCompetition(resp.data);
            })
            .then((resp) => {
                // Get all the teams in the competition.
                return getRequest('/v2/competitions/'+ req.params.codeLeague + '/teams', apiFootball);
            })
            .then((resp) => {
                // Insert all the teams in te database.
                return mapInsert(resp.data.teams, addTeam, resp.data.competition.id);
            })
            .then(() => {
                // If all OK, return status code 201.
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
        // Wrong league code format
        res.status(400).json({message: 'Wrong league code format. Regular expression of the correct format: /^[A-Z]+[A-Z,0-9]$/ '})
        throw new Error('Wrong league code format. Regular expression of the correct format: /^[A-Z]+[A-Z,0-9]$/ ');
    }
});

/**
 * GET request /total-players/{leagueCode}
 * This request performs a query on the database to obtain the number of players participating 
 * in a competition. The responses for this request can be:
 *      HttpCode 200, {"message": "Total: N"} where N is the total amount of players belonging 
 *      to all teams that participate in the given league (leagueCode)
 *      HttpCode 404, {"message": "Not found"} --> If the given leagueCode is not present into the DB.
 *      HttpCode 400, {"message": "Wrong league code format. Regular expression of the correct 
 *      format: /^[A-Z]+[A-Z,0-9]$/"} --> If the format of the league code is wrong.
 */
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

/**
 * Set server port.
 */
app.listen(8080, () => {
    console.log(chalk.bgCyan.bold('Server listen on port 8080: \'Ctrl\' + \'C\' to stop.'));
});