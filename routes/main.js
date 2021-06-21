const express = require('express');
const router = express.Router();
const con = require('./mysql_connection');
const bcrypt = require('bcrypt');


const path = require('path');

var admin=false;



router.get('/',isLoggedIn, (req, res) => {

	con.query('select * from BOOK', (err, row) => {
		if(err) throw err;
		res.render('home', {book: row, login: req.session.isLoggedIn});
	});
	
});

router.get('/view', (req,res)=>{
	var genre = req.query.genre;
	con.query('select * from BOOK where genre = ?', [genre], (err, row) => {
			if(err) throw err;
			res.render('home', {book: row, login: req.session.isLoggedIn});
	});
});

router.get('/login', (req, res) => {
	res.render('login', {login: req.session.isLoggedIn});
});

router.post('/login', (req, res) =>{
	var username = req.body.username;
	var password = req.body.password;
	if(username && password){
		
		con.query("SELECT * FROM USER WHERE email_id = ?", [username], (err, row) =>{
			if (err) throw err;
			if (row.length>0 && bcrypt.compareSync(password,row[0].password)){
				req.session.isLoggedIn = true
				req.session.username = username;
				res.redirect('/user/');
			}else{
				res.render('login', {er:"Incorrect Username or Password", login: req.session.isLoggedIn});
			}
		});
	}else{
		res.render('login', {er: "Enter Username and Password", login:req.session.isLoggedIn});
	}
});


router.post('/register', (req, res) => {
	var fname = req.body.first;
	var lname = req.body.last;
	var mname = req.body.middle;
	var add = req.body.address;
	var city = req.body.city;
	var pin = req.body.pin;
	var phone = req.body.phone_no;
	var email = req.body.email_id;
	var password = bcrypt.hashSync(req.body.password,10);
	var gender = req.body.gender;

	var user = [fname,mname,lname,add,city,pin,email,password,phone,gender];

	if(!(fname&&lname&&mname&&add&&city&&pin&&phone&&email&&password&&gender))
	{
		res.render('register', {er: "Enter all Detail"});
	}
	else{
		con.query('select * from BANNED_USER where email_id=?',[email],(er,re)=>{
			console.log(re)
			if(re.length>0) 
			{
				res.render('register', {er: "User is banned"});
			}else{
				con.query('SELECT * FROM USER WHERE email_id = ?',[email], (err, row) =>{

					if(row.length==0){
					
						con.query('Insert into USER (first_name,middle_name,last_name,address,city,pin,email_id,password,phone_no,gender) values(?,?,?,?,?,?,?,?,?,?)', user, (er, rw) => {
							if (er) throw er;
							else
								res.redirect('/login');
						});
					}else{
						res.render('register', {er: "User is already exists"});
					}
					
				});
			}

		});
	}
});


router.get('/register', (req,res) => {
	res.render('register',{login: req.session.isLoggedIn});
});


router.get('/bookdetail', (req,res)=>{
	var id = req.query.id;
	var del = req.query.delete;
	var status=true;
	con.query("select * from BOOK where book_id = ?",[id], (er, row)=>{
		if(row[0].status=="Not Available") status=false;
		res.render('bookdetail', {book: row[0], login: req.session.isLoggedIn, status:status});
	});
});


router.get('/admin-login', (req,res)=>{
	res.render('admin_login',{login:req.session.isLoggedIn});
});

router.post('/admin-login', (req,res)=>{
	var username = req.body.username;
	var password = req.body.password;
    
	if(username=="admin@gmail.com" && password=="admin123")
	{
		req.session.username=username;
		res.redirect('/admin/');
	}else{
		var error="Incorrect Username or Password";
		res.render('admin_login',{er:error, login:req.session.isLoggedIn});
	}
});

router.get('/search',(req,res)=>{
	var search = req.query.book;
	var sql = "select * from BOOK where name like '%"+search+"%'";
	con.query(sql, (error,row)=>{
		res.render('home',{login:req.session.isLoggedIn, book:row});
	});
});


router.post('/search', (req,res)=>{
	var search=req.body.search;
	var se;
	if(req.session.isLoggedIn){
		se = 'user/search?book='+search;	
	} 
	else{
		se = 'search?book='+search;
	}
	res.redirect(se);
});

router.get('/about', (req,res)=>{
	if(req.session.isLoggedIn) res.redirect('/user/about');
	res.render('about',{login:req.session.isLoggedIn});
});


router.get('/', (req,res)=>{
	res.write("<center><h1 style='margin: 60px auto;'>404 Page Not Found</h1></center>")
});

module.exports = router;

function isLoggedIn(req,res,next) {
	if(!req.session.isLoggedIn) return next();
	res.redirect('/user/');
}