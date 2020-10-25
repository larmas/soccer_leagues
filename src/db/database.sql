CREATE DATABASE IF NOT EXISTS soccer_leagues_db
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;
USE soccer_leagues_db;

CREATE TABLE IF NOT EXISTS competition(
    id INTEGER NOT NULL,
    code VARCHAR(3),
    name VARCHAR(50),
    areaName VARCHAR(50),
    PRIMARY KEY(id)
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
    teamId INTEGER NOT NULL,
    competitionId INTEGER NOT NULL,
    CONSTRAINT teamFK FOREIGN KEY teamFK(teamId) REFERENCES team(id) ON DELETE CASCADE,
    CONSTRAINT competitionFK FOREIGN KEY competitionFK(competitionId) REFERENCES competition(id) ON DELETE CASCADE
);