const express = require('express');
const app = express();
const chalk = require('chalk');
const Database = require('./db/database');

database = new Database;


app.listen(8080, () => {
    console.log(chalk.bgCyan.bold('Server listen on port 8080: \'Ctrl\' + \'C\' to stop.'));
});