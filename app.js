const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const saltRounds = 12;
const secretKey = 'S6nCNrmsX7vFeVIw4KlDTTUYLWRbflLj';
const user = {username: 'admin', password: '$2a$12$8vr1WQ8l705cQqU338B/iuOHQSuG6ZcF7zj5E1PXqzNIJFBqcj5Sq'};         // Set with runtime args later

app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', async (request, response) => {
    const { username, password } = request.body;
   
    //const hash = await hashPassword(password);

    bcrypt.compare(password, user.password, (err, result) => {
        if (username === user.username && result) {
            const token = jwt.sign({username: user.username}, secretKey, { expiresIn: '4h' });
            response.cookie('jwt', token, { httpOnly: true, secure: true});
            response.sendStatus(200);
        }
        else {
            response.status(401).json({ message: 'Authenticaion failed' });
        }
    });
});

app.get('/calcView', (request, response) => {
    response.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/calcDamage', (request, response) => {

    let {toughness, armour, damageDealt, weaponAP} = request.query;
    let newDamage = computeDamage(toughness, armour, damageDealt, weaponAP);
    response.json(newDamage);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('Server started on http://localhost:${PORT}');
});

function computeDamage(toughness, armour, damageDealt, weaponAP) {

    if (armour > weaponAP) {
        armour -= weaponAP;
    }
    else {
        armour = 0;
    }

    damageDealt = damageDealt - armour - toughness;
    if (damageDealt < 0) {
        damageDealt = 0;
    }

    return damageDealt;
}