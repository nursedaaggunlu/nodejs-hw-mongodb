/* global process */
import mongoose from "mongoose";
import { env } from "../utils/env.js";

export async function initMongoConnection() {
  try {
    const user = env("MONGODB_USER");
    const pwd = env("MONGODB_PASSWORD");
    const url = env("MONGODB_URL");
    const db = env("MONGODB_DB");

    await mongoose.connect(
      `mongodb+srv://${user}:${pwd}@${url}/${db}?retryWrites=true&w=majority`,
      {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      },
    );

    console.log("Mongo connection successfully established!");
  } catch (e) {
    console.error("Error while setting up mongo connection", e);
    throw e;
  }
}
