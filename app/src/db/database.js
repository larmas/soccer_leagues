const mysql = require('mysql');
const chalk = require('chalk');

//require('dotenv').config();

/**
 * Database configurations.
 */
const db_config = {
    host : process.env.MYSQL_HOST,
    user : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements : true,
};

class Database {
    /**
     * Establishes a connection to the database and runs an sql script that 
     * creates the database structure if it does not exist.
     */
    constructor(){
        this.connection = mysql.createConnection(db_config);
        /*const database = fs.readFileSync('./src/db/database.sql').toString();
        this.connection.query(database, (err, result) => {
            if (err) 
                throw err;
            else
                console.log(chalk.blue.bold('Database connection successfull'));
        });*/
    };

    /**
     * Execute a query on the database.
     * @param query 
     * @param values 
     * @return {Promise}
     */
    executeQuery(query, values) {
        return new Promise((resolve, reject) => {
            this.connection.query(query, values, (err, rows) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    /**
     * Close a connection with the database.
     * @return {Promise}
     */
    endConnection(){
        return new Promise((resolve, reject) => {
            this.connection.end( err => {
                if (err)
                    return reject(err);
                resolve();
            })
        });
    }

}

module.exports = Database;