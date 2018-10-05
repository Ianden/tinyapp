const express = require('express');
const bodyParser = require('body-parser');
const cookieMonster = require('cookie-parser');

const PORT = 8080;
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieMonster());

const database = {
	urls: {
		// url_id: { owner, url_id, long }
	},

	users: {
		// user_id: { email, password }
	}
};

function find(thing, value) {
	const all = database.users;

	if (thing === 'id') {
	for (let user_id in all) {
		if (all[user_id].email === value) return user_id;
	}
	return null;

	} else if (thing === 'exists') {
		return all.hasOwnProperty(value) || false;
	}
}

function checkCredentials(user_id, email, password) {
	const user = database.users[user_id];
	if (user.email === email && user.password === password) {
		return true;
	}
	return false;
}

function generateAlphanumericString(length = 6) {
  let alpha = "";
  for (let i = 0; i < length; i++) {
  	let n = Math.floor(Math.random() * 36).toString(36);
  	// 50-50 chance of n.toUpperCase()
    alpha += Math.floor(Math.random() * 2) === 0 ? n : n.toUpperCase();
  }
  return alpha;
}

function validate(url) {
	if (!url.substr(0, 7) === 'http://' || !url.substr(0, 8) === 'https://') {
		return 'https://' + url
	}
	return url;
}

app.get('/', (req, res) => {
	res.redirect(database.users[req.cookies.user_id] ? '/urls' : '/login');
});

app.get('/login', (req, res) => {
	res.render('login');
});

app.post('/login', (req, res) => {
	const {email, password} = req.body || undefined;
	const user_id = find('id', email);

	if (user_id && checkCredentials(user_id, email, password)) {
		res.cookie('user_id', user_id);
		res.redirect('/urls');
	} else {
		res.status(403);
		res.send('invalid email/password.');
	}

});

app.get('/register', (req, res) => {
	res.render('register');
});

app.post('/register', (req, res) => {
	const {email, password} = req.body || undefined;
	if (email && password) {

		if (find('id', email)) {
			res.status(400);
			res.send('email already exists.');
		} else {
			const user_id = generateAlphanumericString();
			database.users[user_id] = {email, password};
			res.cookie('user_id', user_id);
			console.log(database.users);
			res.redirect('/urls');
		}

	} else {
		res.status(400);
		res.send('email/password fields cannot be blank.');
	}

});

app.get('/logout', (req, res) => {
	res.clearCookie('user_id');
  res.redirect('/login');
})

app.get('/urls', (req, res) => {
	const user_id = req.cookies.user_id;
	if (user_id && find('exists', user_id)) {

		res.render('urls', {
			urls: database.urls,
			email: database.users[user_id].email,
			user_id
		});

	} else {
		res.redirect('/login');
	}
	
});

app.get('/urls/new', (req, res) => {
	if (database.users[req.cookies.user_id]) {
		res.render('new');
	} else {
		res.redirect('/login');
	}
});

app.post('/urls/new', (req, res) => {
	const owner = req.cookies.user_id;
	const long = validate(req.body.long);
	const url_id = generateAlphanumericString();
	database.urls[url_id] = {owner, url_id, long};
	res.redirect('/urls');
});

app.get('/urls/:url_id', (req, res) => {
	const url_id = req.params.url_id;
	const all = database.urls;
	let long;
	if (all.hasOwnProperty(url_id)) {
		long = all[url_id].long
		res.render('url_show', {url_id, long})
	} else {
		res.status(404);
		res.send('url does not exist.');
	}
});

app.post('/urls/:url_id/delete', (req, res) => {
	const url_id = req.params.url_id;
	if (req.cookies.user_id !== database.urls[url_id].owner) {
		res.status(401);
		res.send("ACCESS DENIED. FBI NOTIFIED");
	} else {
		delete database.urls[url_id];
		res.redirect('/urls');
	}
});

app.post('/urls/:url_id', (req, res) => {
	const url_id = req.params.url_id;
	if (req.cookies.user_id !== database.urls[url_id].owner) {
		res.status(401);
		res.send("ACCESS DENIED. FBI NOTIFIED");
	} else {
		database.urls[url_id].long = req.body.new;
		res.redirect('/urls');
	}
});

app.get('/u/:url_id', (req, res) => {
	const url_id = req.params.url_id;
	const long = database.urls[url_id].long
	res.redirect(long);
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});