// npm import mysql2 express
const mysql = require('mysql2');
const express = require('express');
const app = express();
const port = 3000;

// ใช้สำหรับการ LOGIN
// npm install bcrypt
const bcrypt = require('bcryptjs'); // ใช้ bcrypt สำหรับเข้ารหัสรหัสผ่าน
const bodyParser = require('body-parser');

app.use(bodyParser.json()); // ใช้ body-parser เพื่ออ่าน JSON จาก request


// สร้างการเชื่อมต่อกับฐานข้อมูล
const connection = mysql.createConnection({
    host: 'localhost',  // หรือที่อยู่ของ MySQL Server หรือ IP ของเครื่องที่รัน MySQL 192.168.1.102
    user: 'root',       // ชื่อผู้ใช้
    password: 'group13', // รหัสผ่าน
    database: 'db_flightbooking' // ชื่อฐานข้อมูล
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database as ID', connection.threadId);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


// LOGIN API
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // ตรวจสอบผู้ใช้จากฐานข้อมูล
    connection.query("SELECT * FROM Users WHERE email = ?", [email], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = results[0];

        // ตรวจสอบรหัสผ่านจากการนำค่าที่ป้อนเข้ามาแล้วนำไป hash แล้วค่อยไปเช็คใน database ว่าตรงไหม
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                return res.status(500).send(err);
            }

            if (match) {
                // รหัสผ่านถูกต้อง
                res.json({ message: "Login successful", userId: user.id });
            } else {
                // รหัสผ่านไม่ถูกต้อง
                res.status(401).json({ message: "Invalid email or password" });
            }
        });
    });
});

// REGISTER API
app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    // เข้ารหัสรหัสผ่านและบันทึกลงในฐานข้อมูล
    // จะทำการเข้ารหัสของรหัสผ่านเพื่อความปลอดภัย (hashedPassword)
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.log('error');
            return res.status(500).send(err);
        }

        connection.query("INSERT INTO Users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword], (err, results) => {
            if (err) {
                connection.query("SELECT COUNT(*) AS user_count FROM Users", (err, results) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    
                    const userCount = results[0].user_count;
                    connection.query("ALTER TABLE Users AUTO_INCREMENT = ?", [userCount], (err, results) => {
                        if (err) {
                            return res.status(500).send(err);
                        }
                    })
                })
                return res.status(500).send(err);
            }
            res.json({ message: "User registered successfully" });
        });
    });
});




app.get("/users", (req, res) => {
    connection.query("SELECT * FROM Users", (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

