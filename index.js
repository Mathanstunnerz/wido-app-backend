import express, { query } from "express"; // "type": "module"
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import randomnumber from "random-number";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import cors from "cors";
const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
// const MONGO_URL = "mongodb://127.0.0.1";
const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL); 
await client.connect(); 
console.log("Mongo is connected !!!  ");

async function generateHashedpassword(pass) {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword = await bcrypt.hash(pass, salt);
  return hashedPassword;
}

app.get("/Searchbar",   async function (request, response) {
  const data = await client .db("wido").collection("userdata").find({}).toArray()
  response.send(data)
});
app.get("/Homeitem",   async function (request, response) {
  const data = await client .db("wido").collection("postdata").find({}).toArray()
  response.send(data)
});
app.post("/folowers/:usertoken/:currentuser",   async function (request, response) {
  const fgh = request.body
  const currentuser ={
     following_id : request.params.usertoken,
     follow_id :fgh.follow_id
  }
  const checkfolowing = await client .db("wido").collection("userdata").findOne({ usertoken : request.params.currentuser, "following.following_id": request.params.usertoken })
                     
     if(!checkfolowing){
      const data = await client .db("wido").collection("userdata").updateOne({usertoken : request.params.usertoken},{$push:{followers :fgh}})
      const data2 = await client .db("wido").collection("userdata").updateOne({usertoken : request.params.currentuser},{$push:{following :currentuser }})
      response.send(data)
      // console.log("not following")
    }else{
      response.status(404).send("Following is already")
      // console.log("Following is already")
    }
  console.log(checkfolowing)
  
});
app.put("/folowers/remove/:usertoken/:follow_id/:followerid",   async function (request, response) {

  const checkfolowing = await client .db("wido").collection("userdata").updateOne({ usertoken : request.params.usertoken},{$pull:{followers: {follow_id: request.params.follow_id  }}})
  const checkfolowing2 = await client .db("wido").collection("userdata").updateOne({ usertoken : request.params.followerid},{$pull:{ following : {follow_id: request.params.follow_id  }}})
  
  response.send(checkfolowing)
  console.log(checkfolowing)
  
});
app.put("/folowing/remove/:usertoken/:follow_id/:followerid",   async function (request, response) {

  const checkfolowing = await client .db("wido").collection("userdata").updateOne({ usertoken : request.params.usertoken},{$pull:{following : {follow_id: request.params.follow_id  }}})
  const checkfolowing2 = await client .db("wido").collection("userdata").updateOne({ usertoken : request.params.followerid},{$pull:{followers : {follow_id: request.params.follow_id  }}})
  
  response.send(checkfolowing)
  // console.log(checkfolowing)
  
});
app.put('/postuser/likeupdate/:product_id/:usertoken', async function (request, response) {
  const {like} = request.body  
  const num = +like+1
  // console.log(typeof(num ))  
  const data = await client .db("wido").collection("userdata").updateOne({usertoken :request.params.usertoken,"post.post_id" : request.params.product_id },{$set:{"post.$.like" : num}})
  const data2 = await client .db("wido").collection("postdata").updateOne({post_id :request.params.product_id },{$set:{like:num}})
  response.send(data)
  console.log(data2)

});
app.put('/postuser/commentdelete/:comment_id/:usertoken/:post_id', async function (request, response) {
  // console.log(request.params.comment_id)
  const data = await client .db("wido").collection("userdata").updateOne({usertoken :request.params.usertoken,"post.post_id" : request.params.post_id},{$pull:{ "post.$.comments" :{ comment_id : request.params.comment_id }}})
  const data2 = await client .db("wido").collection("postdata").updateOne({post_id:request.params.post_id},{$pull:{ comments :{ comment_id : request.params.comment_id }}})
  response.send(data2)
  // console.log(data)

});
app.put('/postuser/commentupdate/:product_id/:usertoken', async function (request, response) {
  const ddd = request.body  

  const data = await client .db("wido").collection("userdata").updateOne({usertoken :request.params.usertoken,"post.post_id" : request.params.product_id },{$push:{"post.$.comments" :ddd }})
  const data2 = await client .db("wido").collection("postdata").updateOne({post_id :request.params.product_id },{$push:{comments: ddd }})
  response.send(data2)
  // console.log("data")

});
app.get("/user/post/item/:usertoken", async function (request, response) {
  const usertoken = request.params.usertoken
  const finduserpost = await client .db("wido").collection("userdata").find({ usertoken :usertoken},{_id:0,post:1}).toArray()
  response.send(finduserpost )
});
app.put("/Profileupdate/:usertoken", async function (request, response) {
  const data = request.body
  // console.log(data)
  const update =  await client .db("wido").collection("userdata").updateOne({usertoken : request.params.usertoken},{ $set :{name:data.name,Bio : data.Bio ,dp:data.dp} })
  response.send(update)
});
app.put("/UserProfilepost/:usertoken", async function (request, response) {
  const data = request.body
  // console.log(data)
  const update =  await client .db("wido").collection("userdata").updateOne({usertoken : request.params.usertoken},{ $push :{post:data} })
  const postitem = await client .db("wido").collection("postdata").insertOne(data)
  console.log(postitem)
  response.send(update)
});
app.get("/Userprofile/:usertoken", async function (request, response) {
  const userdata = await client .db("wido").collection("userdata").findOne({usertoken : request.params.usertoken});
  response.send(userdata)
});
app.delete("/Accountdelete/:usertoken", async function (request,response){
  const userremove = await client .db("wido").collection("userdata").deleteOne({usertoken : request.params.usertoken});
   response.send(userremove)
})
app.put("/postdelete/:post_id/:usertoken", async function (request,response){
  const postremove = await client .db("wido").collection("userdata").updateOne({usertoken : request.params.usertoken },{$pull:{ post :{post_id :request.params.post_id}}});
  const postremove2 = await client .db("wido").collection("postdata").deleteOne({post_id : request.params.post_id })
   response.send(postremove)                                        
  //  console.log("sd",postremove)
})
app.post("/Signup", async function (request, response) {
  const ddd = request.body;

  const userCheck = await client
    .db("wido")
    .collection("userdata")
    .findOne({ name: ddd.name });
  if (userCheck) {
    response.status(400).send({ message: "username already exists" });
  } else if (ddd.password.length < 8) {
    response
      .status(400)
      .send({ message: "password must be at least 8 characters" });
  } else {
    const pass = ddd.password;
    const password_hash = await generateHashedpassword(pass);
    const usertoken2 = jwt.sign({ name: ddd.name }, process.env.SECRET_KEY);
    const da = {
      name: ddd.name,
      password: password_hash,
      usertoken: usertoken2,
      email: ddd.email,
      dateofbirth: ddd.dateofbirth,
      followers:[],
      following: [],
      post:[],
    };
    const post = await client.db("wido").collection("userdata").insertOne(da);
    const userCheck2 = await client
      .db("wido")
      .collection("userdata")
      .findOne({ name: ddd.name });
    const token = jwt.sign({ id: userCheck2._id }, process.env.SECRET_KEY);
    console.log("token: " + token);
    response.send({ user_id: userCheck2.usertoken, token: token })
  }
});
app.post("/Login", async function (request, response) {
  const { name, password } = request.body;
  const userCheck = await client.db("wido").collection("userdata").findOne({ name: name });
    if(!userCheck){
      response.status(400).send({ message: "invalid credentials" });
    }else{
      const comparepassword = await bcrypt.compare(password, userCheck.password);
    if (comparepassword) {
      const token = jwt.sign({ id: userCheck._id }, process.env.SECRET_KEY);
      // console.log("token: " + token);
      response.send({ user_id: userCheck.usertoken, token: token });
    } else {
      response.status(400).send({ message: "invalid credentials" });
    }
    }
  
});

app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
