const mysql = require("mysql");
const http = require('http');
const port = 3000;
const url = require('url');
const querystring = require('querystring');

var con = mysql.createConnection({ host: "isalab5.mysql.database.azure.com", user: "root_1", password: "Isapassword12", database: "patients", port: 3306 });

// create table if it doesn't exist yet
con.connect(function (err) {
    if (err) throw err;

    con.query("SHOW TABLES LIKE 'patient'", function (err, result) {
        if (err) throw err;

        if (result.length === 0) {
            const createTableSQL = `
            CREATE TABLE patient (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            dateOfBirth VARCHAR(10)
        )   ENGINE=InnoDB;
    `;

            con.query(createTableSQL, function (err) {
                if (err) throw err;
                console.log('Table "patient" created successfully with InnoDB engine');
            });
        } else {
            console.log('Table "patient" already exists');
        }
    });
});



const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    const baseDomain = `http://${req.headers.host}`
    const parsedUrl = new URL(req.url, baseDomain);
    const path = parsedUrl.pathname;

    if (req.method === 'GET' && path.startsWith('/lab5/api/v1/sql/')) {

        // clean sql query
        let sqlQuery = decodeURIComponent(path.replace('/lab5/api/v1/sql/', ''));
        if (sqlQuery.startsWith('"') && sqlQuery.endsWith('"')) {
            sqlQuery = sqlQuery.slice(1, -1);
        }

        con.connect(function (err) {

            console.log("Connected");

            con.query(sqlQuery, function (err, result) {

                if (err) throw err;

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.end(JSON.stringify(result));
            })

        })
    }
    else if (req.method === 'POST' && url.pathname === "/lab5/api/v1/insert-default-patients") {

        let data = '';

        req.on('data', (chunk) => {
            data += chunk.toString();
        });

        req.on('end', () => {
            con.connect(function (err) {
                console.log("Connected");
                let sql = "INSERT INTO `patient`(`name`, `dateOfBirth`) VALUES ('Sara Brown','1901-01-01'), ('John Smith', '1941-01-01'), ('Jack Ma', '1961-01-31'), ('Elon Musk', '1999-01-01')"
                con.query(sql, function (err, result) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.end(JSON.stringify("4 rows have been inserted into the database."));
                })
            })
        });
    }
    else if (req.method === 'POST' && url.pathname === "/lab5/api/v1/insert-patient-by-query") {

        let data = '';

        req.on('data', (chunk) => {
            data += chunk.toString();
        });

        req.on('end', () => {
            con.connect(function (err) {
                let sql = "explain " + data
                con.query(sql, function (err, result) {
                    if (result === undefined) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Access-Control-Allow-Origin', '*')
                        res.end("Invalid SQL Query!");
                    }
                    else {
                        con.query(data, function (err, result) {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.setHeader('Access-Control-Allow-Origin', '*')
                            res.end("Patient entered!");
                        })
                    }
                })
            })
        });
    }
    else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.statusCode = 404;
        res.end("Invalid request!");
    }
});


server.listen(process.env.PORT || port, () => {
    console.log(`Server is running on port ${port}`);
});


