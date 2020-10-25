CREATE DATABASE IF NOT EXISTS soccer_leagues_db;
USE soccer_leagues_db;

CREATE TABLE IF NOT EXISTS competition(
 code INTEGER NOT NULL,
 name VARCHAR(50),
 areaName VARCHAR(50),
 PRIMARY KEY(code)
);

CREATE TABLE IF NOT EXISTS team(
    id INTEGER NOT NULL,
    name VARCHAR(50),
    tla  VARCHAR(3),
    shortName VARCHAR(50),
    areaName VARCHAR(50),
    email VARCHAR(50),
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS player(
    id INTEGER NOT NULL,
    name VARCHAR(50),
    position VARCHAR(50),
    nationality VARCHAR(50),
    countryOfBirth VARCHAR(50),
    dateOfBirth DATE,
    idTeam INTEGER,
    PRIMARY KEY(id),
    CONSTRAINT teamPlayerFK FOREIGN KEY teamPlayerFK(idTeam) REFERENCES team(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teamCompetition(
    id INTEGER NOT NULL,
    code INTEGER NOT NULL,
    CONSTRAINT teamFK FOREIGN KEY teamFK(id) REFERENCES team(id) ON DELETE CASCADE,
    CONSTRAINT competitionFK FOREIGN KEY competitionFK(code) REFERENCES competition(code) ON DELETE CASCADE
);