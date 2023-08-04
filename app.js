const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

const saltRounds = 12;
const secretKey = 'S6nCNrmsX7vFeVIw4KlDTTUYLWRbflLj';
const user = {username: 'admin', password: '$2a$12$8vr1WQ8l705cQqU338B/iuOHQSuG6ZcF7zj5E1PXqzNIJFBqcj5Sq'};         // Default password

setCredentials();



/**---------------------    ROUTES    ----------------------------------------------------- */

app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', async (request, response) => {
    const { username, password } = request.body;

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

app.get('/calcView', authenticate, (request, response) => {

    response.sendFile(path.join(__dirname, 'views', 'calc.html'));
});

app.get('/calcDamage', (request, response) => {

    let {toughness, armour, damageDealt, weaponAP} = request.query;
    let newDamage = computeDamage(toughness, armour, damageDealt, weaponAP);
    response.json(newDamage);
});

const PORT = process.argv[4] || 3000;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});




/**---------------------    HELPER FUNCTIONS    ------------------------------------------- */

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

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

async function setCredentials() {

    if (process.argv.length === 4 || process.argv.length === 5) {
        const hashP = await hashPassword(process.argv[3]);
        user.username = process.argv[2];
        user.password = hashP;
    }
    else {
        console.log("Invalid number of command line arguments, using default --  # of command args can be two or three in this order: username, password, port");
    }
}

function authenticate(request, response, next) {

    if (!request.cookies.jwt) {
        return response.status(401).json({message: "Token Missing -- This probably means you didn't log in before accessing this page"});
    }

    const dToken = jwt.verify(request.cookies.jwt, secretKey);
    if (dToken.username === user.username) {
        next();
    }
    else {
        response.status(403).json({ message: "Access denied" });
    }
}