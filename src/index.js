import express from "express";
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from 'path';
import bodyParser from 'body-parser';
import pg from 'pg'
import bcrypt, { hash } from 'bcrypt' ; 
import env from "dotenv"
env.config();


const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST ,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    
  });
  db.connect();
  
  
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const staticPath = path.join(__dirname, "../public");



app.use(express.static(staticPath))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const port = 3000;
const saltRounds = 10 ; 

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/register", (req, res) => {
    res.render('register');
});

app.get('/movie', async (req, res) => {
    
    let user_id = req.query.user_id;
    let movies = await db.query(`SELECT * FROM movie_info WHERE user_id = $1`, [user_id]);
    
    res.render('movie', { user_id: user_id , movies : movies.rows});
});


app.post('/login' , async (req , res) => {
    let email = req.body.email ; 
    let password = req.body.password ; 
    let login_email = await db.query(`select * from users where email = $1` , [email])
    
   

    try {
        if (login_email.rows.length > 0){
            console.log("inside ");
            let login_user = login_email.rows[0];
            let login_password = login_user.password_hash ; 
            let login_id = login_user.id;
            bcrypt.compare(password , login_password , (err , result) => {
                if (err){
                    res.send("error comparing password")
                } else {
                    if (result){
                        res.redirect(`/movie?user_id=${login_id}`)
                    } else {
                        res.send("wrong password bsdka")
                    }
                }
            } )
        } else {
            res.send("email not found first register your self")
        }

    } catch (error) {

    }
})

app.post('/Register' , async (req , res) => {
    let email = req.body.email ; 
    let password = req.body.password ; 

    
    try {

        let reg_email = await db.query(`select * from users where email = $1` , [email]) 
        console.log(reg_email.rows);

        if (reg_email.rows.length > 0){
            res.send("this account is already registered!");
        } else {
            bcrypt.hash(password , saltRounds , async (err , hash ) =>  {
                await db.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hash]);
            } )
           
            res.send("account registered")
        }
        
    } catch (error) {
        console.log("something wrong" , error);
    }
    console.log("your account has been sucessfully registerd" , email , password);
})

app.post('/add_movie' , async (req , res) => {
    let movie_name = req.body.name ; 
    let release_date = req.body.release_date ; 
    let movie_genre = req.body.genre ; 
    let user_id = req.body.user_id ;
    
    
    try {
        
        await db.query(`insert into movie_info (moviename , release_date , genre , user_id) values ($1 , $2 , $3 , $4)` , [movie_name , release_date , movie_genre , user_id ] )
        let movies = await db.query(`SELECT * FROM movie_info WHERE user_id = $1`, [user_id]);
        res.render('movie', { user_id: user_id  , movies : movies.rows});
       
    } catch (error) {
        res.send("some error occured!");
    }


})

app.listen(port, () => {
    console.log(`Live on server ${port}`);
});
