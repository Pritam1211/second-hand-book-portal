const express = require('express');
const router = express.Router();
const con = require('./mysql_connection');
const bcrypt = require('bcrypt');
const ObjectToCsv = require('objects-to-csv');
const python = require('python-shell');

const path = require('path');

router.get('/', isLoggedIn, (req, res) => {
		con.query('select * from BOOK where owner<>(select user_id from USER where email_id=?)',[req.session.username], (err, row) => {
			if(err) throw err;
			res.render('home', {book: row, login: req.session.isLoggedIn});
	});
	
});

router.get('/addBook',isLoggedIn, (req,res) => {
	res.render('addbook', {login : req.session.isLoggedIn});
});


router.post('/addBook', (req,res) => {
	var name = req.body.name;
	var author = req.body.author;
	var isbn = req.body.isbn;
	var genre = req.body.genre;
	var actualPrice = req.body.actualPrice;
	var coverpage = req.files.coverpage.name;
	var proposed_price = actualPrice*0.7;
	var description = req.body.description;
	proposed_price = Math.floor(proposed_price);
	
	var msg='';

	if(description.length<500)
	{
		con.query('select user_id from USER where email_id = ?', [req.session.username], (err, result) => {
			if(result.length == 1){
				var book = [name, author, genre, description,coverpage, isbn,actualPrice, proposed_price, result[0].user_id];
		
				con.query('Insert into BOOK (name,author,genre,description,coverpage,isbn,actual_price,proposed_id,owner)values(?,?,?,?,?,?,?,?,?)',book, (er, row)=>{
					if(er){
						throw er;
					}else{
						req.files.coverpage.mv(path.resolve(__dirname,'../public/images', req.files.coverpage.name),(error)=>{
							if(error) throw error;
						})
						res.redirect('/user/book');
					} 
				});
			}
		});
	}
	else{
		res.render('addbook', {msg:'Description max length is 500.', login : req.session.isLoggedIn})
	}
	
	
	
});

router.get('/dashboard',isLoggedIn, (req, res) => {
	var content;
	if(req.query.action == 'detail')
		content=true;
	else
		content=false;

	con.query('select * from USER where email_id = ?', [req.session.username], (err, result) => {
		if (err) throw err;
		res.render('dashboard', {content:content, user:result[0], login: req.session.isLoggedIn});
	});
});

router.post('/edit', (req,res) =>{
	var fname = req.body.first;
	var lname = req.body.last;
	var mname = req.body.middle;
	var add = req.body.address;
	var city = req.body.city;
	var pin = req.body.pin;
	var phone = req.body.phone_no;


	con.query('SELECT * FROM USER WHERE email_id = ?',[req.session.username], (err, row) =>{
		if(row.length == 1){
			var user = [fname,mname,lname,add,city,pin,phone,row[0].user_id];
			con.query('Update USER set first_name=?,middle_name=?,last_name=?,address=?,city=?,pin=?,phone_no=? where user_id=?', user, (er, rw) => {
				if (er) throw er;
				else
					res.redirect('/user/dashboard?action=detail');
			});
		}
	});
});


router.get('/book', isLoggedIn,  (req, res) => {
	var username = req.session.username;

	con.query('select * from BOOK where owner=(select user_id from USER where email_id=?)',[req.session.username], (er,row) => {
		if(er) throw er;
		res.render('mybooks', {book: row, login: req.session.isLoggedIn});
	});
	

});

router.get('/bookdel',isLoggedIn, (req,res)=>{
	var id = req.query.id;
	
	con.query("select * from BOOK where book_id = ?",[id], (er, book)=>{
		con.query( "select * from REQUEST where status in ('Accepted','Not Viewed') and book=?",[id], (err, requ)=>{
			if(requ.length>0){

				con.query('select * from USER where user_id=?',[requ[0].buyer], (error, buyer)=>{
					var name=buyer[0].first_name+' '+buyer[0].middle_name+' '+buyer[0].last_name;
					var accept = true;
					if(requ[0].status=='Accepted') accept=false;
					requ[0] = Object.assign({name:name}, requ[0]);
					res.render('bookdel', {book: book[0], login: req.session.isLoggedIn, request:requ[0], accept:accept});
				});
			}else{
				res.render('bookdel', {book: book[0], login: req.session.isLoggedIn, req:true});
			}
		});
		
	});
});

router.post('/accept', (req,res)=>{
	var id = req.body.id;
	con.query("update REQUEST set status='Accepted' where request_id=?", [id], (er, result)=>{
		var link = '/user/bookdel?id='+req.body.book;
		res.redirect(link);
	});
});

router.post('/reject', (req,res)=>{
	var id = req.body.id;
	con.query("update REQUEST set status='Rejected' where request_id=?", [id], (er, result)=>{
		var link = '/user/bookdel?id='+req.body.book;
		res.redirect(link);
	});
});


router.post('/successfull', (req,res)=>{
	con.query('delete from SEARCH where book=?',[req.body.book], (er,result)=>{
		con.query('delete from REQUEST where book=?',[req.body.book], (er,result)=>{
			con.query('delete from BOOK where book_id=?', [req.body.book], (err,row)=>{
				res.redirect('/user/book');
			});
		});
	});
});

router.post('/cancle', (req,res)=>{
	con.query("update BOOK set status='Available' where book_id=?",[req.body.book], (er,result)=>{
		con.query('delete from REQUEST where request_id=?', [req.body.id], (err,row)=>{
			res.redirect('/user/book');
		});
	})
});

router.post('/canclereq', (req,res)=>{
	con.query("update BOOK set status='Available' where book_id=?",[req.body.book], (er,result)=>{
		con.query('delete from REQUEST where request_id=?', [req.body.id], (err,row)=>{
			res.redirect('/user/book');
		});
	})
});

router.get("/profile",isLoggedIn, (req,res)=>{
	var id = req.query.id;
	con.query('select * from USER where user_id=?', [id], (err,user)=>{
		res.render('profile', {login: req.session.isLoggedIn, user:user[0]});
	});
});

router.get('/view',isLoggedIn, (req,res)=>{
	var genre = req.query.genre;
	con.query('select * from BOOK where genre = ? and owner<>(select user_id from USER where email_id=?)', [genre,req.session.username], (err, row) => {
			if(err) throw err;
			res.render('home', {book: row, login: req.session.isLoggedIn});
	});
});

router.post('/bookdelete', (req,res)=>{
	var id=req.body.id;

	con.query('delete from SEARCH where book=?',[id], (er,result)=>{
		con.query('delete from REQUEST where book=?',[id], (er,result)=>{
			con.query('delete from BOOK where book_id=?', [id], (err,row)=>{
				res.redirect('/user/book');
			});
		});
	});
});

router.get('/bookdetail', (req,res)=>{
	var id = req.query.id;
	con.query('select user_id from USER where email_id=?',[req.session.username], (e,r)=>{

		con.query('insert into SEARCH (user,book) values (?,?)', [r[0].user_id,id],(er,row)=>{
			var status=true;
			con.query("select * from BOOK where book_id = ?",[id], (er, row)=>{
				if(row[0].status=="Not Available") status=false;
				res.render('bookdetail', {book: row[0], login: req.session.isLoggedIn, status:status});
			});
		});
	})
	
});


router.post('/request', (req,res)=>{
	if(!req.session.isLoggedIn)
		res.redirect('/login');
	else{
		var id = req.body.id;

		con.query('select * from USER where email_id=?',[req.session.username],(er, buyer)=>{
			con.query('select * from BOOK where book_id=?',[id],(err, book)=>{
				var request=[book[0].book_id,buyer[0].user_id,book[0].owner];
				con.query('insert into REQUEST (book,buyer,seller) values (?,?,?)', request, (err,result)=>{
					con.query("update BOOK set status='Not Available' where book_id=?",[id], (error, row)=>{
						if(error) throw error;
						res.redirect('/user/request');
					});	
				});
			});
		});
	}
});



router.get('/logout',(req,res)=>{
	req.session.isLoggedIn=false;
	req.session.username=null;
	res.redirect('/');
});



router.get('/request',isLoggedIn, (req,res) => {

	con.query('select * from USER', (e,users)=>{
		var buyer = users.find((user,index)=>{
			if(user.email_id==req.session.username)
				return true;
		});

		con.query('select * from REQUEST where buyer=?',[buyer.user_id], (er,reques)=>{
			con.query('select * from BOOK', (err, books)=>{
				for (var i = 0; i < reques.length; i++) {
					var book = books.find((book,ind)=>{
						if(book.book_id==reques[i].book)
							return true;
					});

					var seller= users.find((user,index)=>{
						if(user.user_id==book.owner)
							return true;
					});
					var name = seller.first_name + ' '+ seller.middle_name+' '+seller.last_name;

					var link = true;
					if(reques[i].status!='Accepted')
						link=false;

					reques[i] = Object.assign({name:name, book_name:book.name, price:book.proposed_id, link:link}, reques[i]);
					

				}
				res.render('request',{login:req.session.isLoggedIn, request: reques});
			});
		});
	});
});

router.get('/report',isLoggedIn, (req,res)=>{
	res.render('report',{login: req.session.isLoggedIn});
});

router.post('/report', (req,res)=>{
	var name=req.body.name;
	var email=req.body.email;
	var reason=req.body.reason;
	con.query('select * from USER where email_id=? or email_id=?',[email,req.session.username], (er,row)=>{
		if(row.length>1){
			var us1 = us2 = row[0];
			if(us1.email_id==email) us2=row[1];
			else us1=row[1];
			var report = [us1.user_id, us2.user_id, reason];
			con.query('insert into REPORT (victim, reporter, reason, date) values (?,?,?,CURDATE())', report, (err,re)=>{
				res.render('report', {msg:'Complaint successfully sent to Admin' ,login:req.session.isLoggedIn});
			});
		}
		else{
			res.render('report',{er:'User not Exists' ,login:req.session.isLoggedIn});
		}
		
	});

});


router.get('/recommendation', (req,res)=>{
	con.query('select * from BOOK', (er,books)=>{
		const csv = new ObjectToCsv(books);
		csv.toDisk('book.csv');

		con.query("select * from SEARCH where user=(select user_id from USER where email_id=?) order by id desc",[req.session.username], (er, row)=>{
			var content=row[0].book;
			var n=3;
			if(row.length<3) n = row.length;
			for (var i = 1; i < n; i++) {
				content+=' '+row[i].book;
			}
			
			var options={
				args:content
			};

			python.PythonShell.run('rs_fin_opt.py', options, (err,result)=>{
				if(err) throw err;
				var a=result.toString();
				a = a.slice(1,a.length-1);;
				a=a.split(', ')
				var book=[];
				for (var i = 0; i < a.length; i++) {
					
					var b = books.find((user,index)=>{
							if(user.book_id==parseInt(a[i]))
								return true;
						});
					if(!book.includes(b,0)) book.push(b);
				}
				
				res.render('home',{login:req.session.isLoggedIn, book:book});
			});

			

		});

	});
});

router.get('/search',(req,res)=>{
	var search = req.query.book;
	var sql = "select * from BOOK where name like '%"+search+"%'";
	con.query(sql, (error,row)=>{
		res.render('home',{login:req.session.isLoggedIn, book:row});
	});
});



router.get('/about', (req,res)=>{
	res.render('about',{login:req.session.isLoggedIn});
});


router.get('', (req,res)=>{
	res.write("<center><h1 style='margin: 60px auto;'>404 Page Not Found</h1></center>")
});

module.exports = router;


function isLoggedIn(req,res,next) {
	if(req.session.isLoggedIn) return next();
	res.redirect('/login');
}

