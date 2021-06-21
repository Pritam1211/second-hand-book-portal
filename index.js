const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const fileupload = require('express-fileupload');
const busboy = require('express-busboy');
const cors = require('cors');


const app = express();


const main = require('./routes/main');
const admin = require('./routes/admin');
const user = require('./routes/user');

app.engine('hbs', exphbs({
	defaultLayout: 'main',
	extname: '.hbs'
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));


app.use(fileupload({createParentPath:true}));


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: false
}));

app.use("/admin", admin);
	
app.use("/user", user); 
app.use("/", main);




app.use('/', express.static(path.join(__dirname, "/public")));

app.use('/user', express.static(path.join(__dirname, "/public")));


app.listen(1234, () => {
	console.log("server is running");
});