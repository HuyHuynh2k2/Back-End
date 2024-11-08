import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";



export const collections: {books?: mongoDB.Collection } = {}

export async function connectToDatabase () {
  dotenv.config();

  const client: mongoDB.MongoClient = new mongoDB.MongoClient('mongodb+srv://kzafar:Khobi233@cluster0.95nla.mongodb.net/');
          
  await client.connect();
      
  const db: mongoDB.Db = client.db('TCSS460');
 
  const booksCollection: mongoDB.Collection = db.collection('Books');

  collections.books = booksCollection;
     
       console.log(`Successfully connected to database: ${db.databaseName} and collection: ${booksCollection.collectionName}`);
}


// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect('mongodb://Khobi:Test123@mongo:27017');

//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`Error:   
//  ${error.message}`);
//     process.exit(1);
//   }
// };

// export { connectDB };   