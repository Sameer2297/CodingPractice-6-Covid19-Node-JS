const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

let db;

const dbPath = path.join(__dirname,"covid19India.db");

const initializeDBAndServer = async() => {
    try{
        db = await open({filename:dbPath,driver:sqlite3.Database});
        app.listen(5000, () => console.log("Server Started Running"));
    }catch(err){
        console.log(`DB Error: ${err.message}`);
        process.exit(1);
    }
}

initializeDBAndServer();

convertStateTable = (dbObject) => {
    return {
        stateId:dbObject.state_id,
        stateName:dbObject.state_name,
        population:dbObject.population
    }
}

convertDistrictTable = (dbObject) => {
    return {
        districtId:dbObject.district_id,
        districtName:dbObject.district_name,
        stateId:dbObject.state_id,
        cases:dbObject.cases,
        cured:dbObject.cured,
        active:dbObject.active,
        deaths:dbObject.deaths
    }
}

//Get States API
app.get("/states/", async(request,response) => {
    const getStatesQuery = `SELECT * FROM state;`;
    const statesArray = await db.all(getStatesQuery);
    response.send(statesArray.map((each) => convertStateTable(each)));
});

//Get State API
app.get("/states/:stateId/", async(request,response) => {
    const {stateId} = request.params;
    const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
    const stateDetails = await db.get(getStateQuery);
    response.send(convertStateTable(stateDetails));
});

//Post District API
app.post("/districts/", async(request,response) => {
    const {districtName,stateId,cases,cured,active,deaths} = request.body;
    const createRowQuery = `INSERT INTO district (state_id,district_name,cases,cured,active,deaths) 
                        VALUES (${stateId},'${districtName}',${cases},${cured},${active},${deaths});`;
    await db.run(createRowQuery);
    response.send("District Successfully Added");
});

//Get District API
app.get("/districts/:districtId/", async(request,response) => {
    const {districtId} = request.params;
    const getDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
    const districtDetails = await db.get(getDistrictQuery);
    response.send(convertDistrictTable(districtDetails));
});

//Delete District API
app.delete("/districts/:districtId/", async(request,response) => {
    const {districtId} = request.params;
    const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
    await db.run(deleteDistrictQuery);
    response.send("District Removed");
});

//Update District API
app.put("/districts/:districtId/", async(request,response) => {
    const {districtId} = request.params;
    const{districtName,stateId,cases,cured,active,deaths} = request.body;
    const updateDistrictQuery = `UPDATE district SET district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths};`;
    await db.run(updateDistrictQuery);
    response.send("District Details Updated");
});

//Get stateWise Statistics
app.get("/states/:stateId/stats/", async(request,response) => {
    const {stateId} = request.params;
    const statisticsQuery = `SELECT SUM(cases) AS totalCases, SUM(cured) AS totalCured, SUM(active) AS totalActive, SUM(deaths) AS totalDeaths FROM district WHERE state_id = ${stateId};`;
    const statisticsArray = await db.get(statisticsQuery);
    response.send(statisticsArray);
});

//Get StateName based on DistrictId
app.get("/districts/:districtId/details/", async(request,response) => {
    const {districtId} = request.params;
    const query = `SELECT state.state_name AS stateName FROM state JOIN district ON state.state_id = district.state_id WHERE district.district_id = ${districtId};`;
    const result = await db.get(query);
    response.send(result);
});

module.exports = app;