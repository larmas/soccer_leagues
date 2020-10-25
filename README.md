# soccer_leagues

The goal is to make a project that exposes an API with an HTTP GET in this URI: /import-league/{leagueCode} . E.g., it must be possible to invoke the service using this URL: <br />
**http://localhost:{port}/import-league/{leagueCode}** <br />
 
The service implementation must get data using the given {leagueCode}, by making requests to the http://www.football-data.org/ API (you can see the documentation entering to the site, use the API v2),  and import the data into a DB (MySQL is suggested, but you can use any DB of your preference). The data requested is:<br />
<br />
Competition ("name", "code", "areaName")<br />
Team ("name", "tla", "shortName", "areaName", "email")<br />
Player("name", "position", "dateOfBirth", "countryOfBirth", "nationality")<br />
 
Feel free to add to this data structure any other field that you might need (for the foreign keys relationship).
 
Additionally, expose an HTTP GET in URI /total-players/{leagueCode}  , with a simple JSON response like this:<br />
{"total" : N } and HTTP Code 200.<br />
where N is the total amount of players belonging to all teams that participate in the given league (leagueCode). This service must rely exclusively on the data saved inside the DB (it must not access the API football-data.org). If the given leagueCode is not present into the DB, it should respond an HTTP Code 404.
 
**Remarks**<br />
 
●	You are allowed to use any library related to the language in which you are implementing the project.<br />
●	You must provide the SQL for data structure creation; it is a plus that the project automatically creates the structure (if it doesn't exist) when it runs the first time.<br />
●	All the mentioned DB entities must keep their proper relationships (the players with which team they belong to; the teams in which leagues participate).<br />
●	The API responses for /import-league/{leagueCode} are:<br />
&nbsp;&nbsp;&nbsp;&nbsp;○	 HttpCode 201, {"message": "Successfully imported"} --> When the leagueCode was successfully imported.<br />
&nbsp;&nbsp;&nbsp;&nbsp;○	 HttpCode 409, {"message": "League already imported"} --> If the given leagueCode was already imported into the DB (and in this case, it doesn't need to be         imported again).<br />
&nbsp;&nbsp;&nbsp;&nbsp;○	 HttpCode 404, {"message": "Not found" } --> if the leagueCode was not found.<br />
&nbsp;&nbsp;&nbsp;&nbsp;○	 HttpCode 504, {"message": "Server Error" } --> If there is any connectivity issue either with the football API or the DB server.<br />
 
●	It might happen that when a given leagueCode is being imported, the league has participant teams that are already imported (because each team might belong to one or more leagues). For these cases, it must add the relationship between the league and the team(s) (and omit the process of the preexistent teams and their players).<br />
