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
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team(
    id INTEGER NOT NULL,
    name VARCHAR(50),
    tla  VARCHAR(3),
    shortName VARCHAR(50),
    areaName VARCHAR(50),
    email VARCHAR(50),
    PRIMARY KEY(id)
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player(
    id INTEGER NOT NULL,
    name VARCHAR(50),
    position VARCHAR(50),
    nationality VARCHAR(50),
    countryOfBirth VARCHAR(50),
    dateOfBirth DATE,
    PRIMARY KEY(id)
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teamCompetition(
    teamId INTEGER NOT NULL,
    competitionId INTEGER NOT NULL,
    CONSTRAINT team_teamCompetition_FK FOREIGN KEY team_teamCompetition_FK(teamId) REFERENCES team(id) ON DELETE CASCADE,
    CONSTRAINT competition_teamCompetition_FK FOREIGN KEY competition_teamCompetition_FK(competitionId) REFERENCES competition(id) ON DELETE CASCADE
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS playerTeam(
    playerId INTEGER NOT NULL,
    teamId INTEGER NOT NULL,
    CONSTRAINT player_playerTeam_FK FOREIGN KEY player_playerTeam_FK(playerId) REFERENCES player(id) ON DELETE CASCADE,
    CONSTRAINT team_playerTeam_FK FOREIGN KEY team_playerTeam_FK(teamId) REFERENCES team(id) ON DELETE CASCADE
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;