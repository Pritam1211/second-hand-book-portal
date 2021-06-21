const express = require('express');
const router = express.Router();
const con = require('./mysql_connection');

const path = require('path');


router.get('/', isAdmin, (req,res)=>{
	res.render('admin',{admin:true});
});

router.get('/books', isAdmin, (req,res)=>{
	con.query('select * from BOOK',(error,row)=>{
		if(error) throw error;
		res.render('books',{book:row, admin:true});	
	});

	
});

router.get('/users', isAdmin, (req,res)=>{
	con.query('select * from USER',(error,row)=>{
		if(error) throw error;
		res.render('users',{user:row, admin:true});	
	})
	
	
});


router.post('/users', (req,res)=>{
	var id = req.body.id;
	con.query('select * from USER where user_id=?',[id],(e,r)=>{		
			con.query("Delete from SEARCH where user = ? or book in (select book_id from BOOK where owner = ?)",[id,id],(p,y)=>{
				con.query("Delete from REPORT where victim = ? or reporter =?",[id,id],(j,k)=>{
					con.query("Delete from REQUEST where seller=? or buyer=? or book in (select book_id from BOOK where owner = ?)",[id,id,id],(d,l)=>{
						con.query("delete from BOOK where owner=?",[id],(c,v)=>{
							con.query("insert into BANNED_USER (email_id)values(?)",[r[0].email_id],(pp,ke)=>{
								con.query("Delete from USER where user_id=?",[id],(po,op)=>{
									res.redirect('/admin/users');
								});
							});
						});
					});
				});
			});
		});
		
	
});

router.get('/complaint', isAdmin, (req,res)=>{
	con.query('select * from USER', (er, users)=>{
		con.query('select * from REPORT',(err,complaints)=>{
			for (var i = 0; i < complaints.length; i++) {

				var victim = users.find((user,index)=>{
								if(user.user_id==complaints[i].victim)
									return true;
							});
		        var victim_name = victim.first_name + ' '+ victim.middle_name+' '+victim.last_name;

				var reporter = users.find((user,index)=>{
								if(user.user_id==complaints[i].reporter)
									return true;
							});
				var reporter_name = reporter.first_name + ' '+ reporter.middle_name+' '+reporter.last_name;
				complaints[i].date = complaints[i].date.toDateString();
				var ac = true;
				if(complaints[i].action=='Not Taken') ac=false;
				complaints[i] = Object.assign({victim_name:victim_name, reporter_name:reporter_name, report_count:victim.report_count, ac:ac}, complaints[i]);
				
			}
			res.render('complaint', {complaint:complaints, admin:true});
		});
	});
	
});

router.post('/action', (req,res)=>{
	var id = req.body.id;
	var comp_id = req.body.comp_id;

	if(req.body.report == 4)
	{
		con.query('select * from USER where user_id=?',[id],(e,r)=>{		
			con.query("Delete from SEARCH where user = ? or book in (select book_id from BOOK where owner = ?)",[id,id],(p,y)=>{
				con.query("Delete from REPORT where victim = ? or reporter =?",[id,id],(j,k)=>{
					con.query("Delete from REQUEST where seller=? or buyer=? or book in (select book_id from BOOK where owner = ?)",[id,id,id],(d,l)=>{
						con.query("delete from BOOK where owner=?",[id],(c,v)=>{
							con.query("insert into BANNED_USER (email_id)values(?)",[r[0].email_id],(pp,ke)=>{
								con.query("Delete from USER where user_id=?",[id],(po,op)=>{
									res.redirect('/admin/complaint');
								});
							});
						});
					});
				});
			});
		});
		
	}

				
	else{
		con.query("update USER set report_count = report_count+1 where user_id=?", [id], (er, re)=>{
			con.query("update REPORT set action = 'Taken' where report_id=?", [comp_id], (err, result)=>{
				res.redirect('/admin/complaint');
			});
		});
	}
	
});

router.get('/logout', (req,res)=>{
	req.session.username=null;
	res.redirect('/');
});


router.get('', (req,res)=>{
	res.write("<center><h1 style='margin: 60px auto;'>404 Page Not Found</h1></center>")
});

module.exports = router;

function isAdmin(req,res,next) {
	if(req.session.username=='admin@gmail.com') next();
	else res.redirect('/admin-login');
}