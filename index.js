import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "8rPathakpg8r",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



async function getUsers(){
  const res= await db.query("SELECT * FROM users");
  let users= [];
  res.rows.forEach((user)=>{
    users.push({
      id: user.id,
      name : user.name,
      color : user.color,
    });
  });
  return users;
}
let current_id=1;
async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id=user_id WHERE user_id=$1;",[current_id]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
async function getCurrentUser(){
  const users= await getUsers();
  const currentUserIndex=users.findIndex((user)=>user.id==current_id);
  console.log(currentUserIndex);
  console.log(current_id);
  return currentUserIndex;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const users =await getUsers();
  const currentUserIndex=await getCurrentUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: users[currentUserIndex].color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode,current_id]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if(req.body.add=="new"){
    res.render("new.ejs");
  }
  else{
  current_id=req.body.user;
  res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name =req.body.name;
  const color=req.body.color;
  const res1=await db.query("INSERT INTO users (name,color) VALUES ($1,$2) RETURNING*;",[name,color]);
  const id=res1.rows[0].id;
  current_id=id;
  res.redirect("/");

  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
