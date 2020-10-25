const mysql = require('mysql');
const fs = require('fs');
const chalk = require('chalk');

const db_config = {
    host : 'localhost',
    user : 'root',
    password : 'root',
    multipleStatements : true,
};

class Database {
    constructor(){
        this.connection = mysql.createConnection(db_config);
        const database = fs.readFileSync('./src/db/database.sql').toString();
        this.connection.query(database, (err, result) => {
            if (err) 
                throw err;
            else
                console.log(chalk.blue.bold('Database connection successfull'));
        });
    };

}

module.exports = Database;