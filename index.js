/*
	secret key + payload (data) + expire
*/
var session = require('express-session')
const express = require("express");
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
var validator = require('validator');
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);
var jwt = require('jsonwebtoken');
var exp = 60*5;
var exp1 = 360000*5;
var cookieParser = require('cookie-parser')
// mongoose databse connection
mongoose.connect('mongodb://localhost:27017/mydb', {
  
});
// initialize schema
const Schema = mongoose.Schema;

// schema for create blog table
const forBlog = new Schema({
  title: String,
  description: String
});
// defining blog model
const blogModel = mongoose.model('blog', forBlog);

// importing express
const app = express();
app.use(cookieParser())
app.use(express.static('assets'))

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: exp1 }
}))
// for parsing form data
app.use(bodyParser.urlencoded({ extended: false }));

// initialize template engine
app.set("view engine","ejs");

/********************************/
//middleware token exists , expire

app.use(function(req,res,next){
	// console.log('middle')
	// console.log(req.url)
	console.log(req.cookies.tokenval)

	if(req.cookies.tokenval){
		// console.log("yes login")
		var arr = ["/login","/register"];
		if(arr.indexOf(req.url) > -1){
			console.log('arr');
			res.redirect("/dash");
		}
		else{
			jwt.verify(req.cookies.tokenval, 'qwerty', function(err, decoded) {
				if(!err){
					console.log(decoded)
					app.locals.uname = req.session.uname;
					next();
				}
				else{
					console.log(err)
					////////
					res.clearCookie('tokenval');
					jwt.sign({
					  data: ""
					}, 'qwerty', { expiresIn: 0 });
					delete app.locals.uname;
					req.session.destroy(function(err) {
						console.log('uuu');
				  		// cannot access session here
						res.redirect("/login");
					})
					/////
				}
			});
			// next();
		}
	}
	else{
		next()
	}	
})

app.use(function(req,res,next){
	// console.log('middle')
	// console.log(req.url)
	console.log(req.cookies)

	if(!req.cookies.tokenval){
		// console.log("yes login")
		var arr = ["/password","/dash","/category","/category-action"];
		// console.log(arr);
		if(arr.indexOf(req.url) > -1){
			res.redirect("/login");
			// console.log('test')
		}
		else{
			next();
		}
	}	
	else{
		next()
	}
})


/********************************/


// get data from database
app.get("/" , function(req,res){
	// res.render("blogList");
	blogModel.find({}, function(err,result){
		if(!err){
			console.log(result);
		}else{
			console.log(err);
		}
	})
});
// view blogForm page
app.get("/blogForm", function(req, res){
	res.render("blogForm");
});
// post data into database
app.post("/formAction" , function(req,res){
	console.log(req.body);
	const instance = new blogModel(req.body);
	instance.save(function(err, result){
		if(!err){
			console.log(result);
		}else{
			console.log(err);
		}
	});
});

/***************************/
app.get("/login",function(req,res){
	res.render("loginform")
})
app.get("/register",function(req,res){
	res.render("registerform")
})
app.get("/password",function(req,res){
	res.render("passwordform")
})

/////////////////////
    // schema for create blog table
const forUsers = new Schema({
  name: String,
  mobile: String,
  email: String,
  password: String
});
// defining blog model
const userModel = mongoose.model('userRecord', forUsers);

/////////////////
app.post("/register-action",function(req,res){
	console.log(req.body)
	if(validator.isEmpty(req.body.name) || !validator.matches(req.body.name,/^[a-zA-Z]([a-zA-Z ]{1,})?[a-zA-Z]$/)){
		res.send("Invalid Name")
	}
	else if(validator.isEmpty(req.body.mobile) || !validator.matches(req.body.mobile,/^[1-9][0-9]{9}$/)){
		res.send("Invalid Mobile")
	}
	else if(validator.isEmpty(req.body.email) || !validator.isEmail(req.body.email)){
		res.send("Invalid Email")
	}
	else if(validator.isEmpty(req.body.password) || !validator.isAlphanumeric(req.body.password)){
		res.send("Invalid Password")
	}
	else if(!validator.equals(req.body.password,req.body.cpassword)){
		res.send("Invalid Confirm Password")
	}
	else{
		// res.send("ok")
		 bcrypt.hash(req.body.password, salt, function(err, hash) {
	        console.log(hash)
	        var obj = {
	        	name:req.body.name,
	        	mobile:req.body.mobile,
	        	email:req.body.email,
	        	password:hash
	        }
	        // Store hash in your password DB.
	        /*************************************/
	    
			const instance = new userModel(obj);
			instance.save(function(err, result){
				if(!err){
					console.log(result);
					res.send("User Added");
				}else{
					console.log(err);
				}
			});
	        /*************************************/
	    });
	}
})

app.post("/login-action",function(req,res){
	// console.log(req.body)
	if(validator.isEmpty(req.body.email) || !validator.isEmail(req.body.email)){
		res.send("Invalid Email")
	}
	else if(validator.isEmpty(req.body.password) || !validator.isAlphanumeric(req.body.password)){
		res.send("Invalid Password")
	}
	else{
		userModel.find({email:req.body.email}, function(err,result){
			if(!err){
				console.log(result);
				// res.send("ok")
				// if(!result.password){}
				if(result.length>0){
					var dbpass = result[0]['password']
					bcrypt.compare(req.body.password, dbpass, function(err, response_from_bcrypt) {
					    // res === true
					    console.log(response_from_bcrypt)
					    console.log(req.body.password)
					    if(response_from_bcrypt===true){
					    	// res.send("auth done")
					    	var data_for_token = {
					    		name:result[0]['name'],
					    		id:result[0]['_id'],
					    		email:result[0]['email'],
					    		mobile:result[0]['mobile']
					    	}
					    	var token_from_node = jwt.sign({
							  data: data_for_token
							}, 'qwerty', { expiresIn: exp });

					    	// res.send(token_from_node)
					    	req.session.uname = result[0]['name'];
					    	
					    	console.log(req.session.uname)
					    	res.cookie("tokenval",token_from_node , {maxAge: exp1}).send("success");
					    }
					    else{
					    	res.send("password mismatch")
					    }
					});
				}
				else{
					res.send("Email does not exists")
				}
			}else{
				console.log(err);
			}
		})
	}
})


app.get("/dash",function(req,res){
	// console.log(req.cookies)
	userdata = {name:req.cookies.tokenval.name}
	res.render("dashboard",userdata)
})
/***************************/
app.get("/logout",function(req,res){
	res.clearCookie('tokenval');
	jwt.sign({
	  data: ""
	}, 'qwerty', { expiresIn: 0 });
	delete app.locals.uname;
	req.session.destroy(function(err) {
  		// cannot access session here
		res.redirect("/login");
	})
})

app.get("/category",function(req,res){
	res.render("categoryPage")
})

const forCat = new Schema({
  name: String
});
const catModel = mongoose.model('category', forCat);

app.post("/category-action",function(req,res){
	// res.send("test");
	
	const instance1 = new catModel(req.body);
	instance1.save(function(err, result){
		if(!err){
			// console.log(result);
			res.send("Category Added");
		}else{
			console.log(err);
		}
	});
	
})

app.listen(4000);