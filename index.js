const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ovxjb0p.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const AppointmentOptionsCollection = client
      .db("doctorsPortal")
      .collection("AppointmentOptions");
    const bookingsCollection = client
      .db("doctorsPortal")
      .collection("bookings");
    const usersCollection = client.db("doctorsPortal").collection("users");

    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await AppointmentOptionsCollection.find(query).toArray();
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();

      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatment === option.name
        );
        const bookedSlot = optionBooked.map((book) => book.slot);

        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlot.includes(slot)
        );
        option.slots = remainingSlots;
      });
      res.send(options);
    });

    // app.get("/v2/appointmentOptions", (req, res) => {
    //   const date = req.query.date;
    //   const option = AppointmentOptionsCollection.aggregate([
    //     {
    //       $lookup: {
    //         from: "bookings",
    //         localField: "name",
    //         foreignField: "treatment",
    //         pipeline: [
    //           {
    //             $match: {
    //               $expr: {
    //                 $eq: [$appointmentDate, date],
    //               },
    //             },
    //           },
    //         ],
    //         as: "booked",
    //       },
    //     },
    //     {
    //       $project: {
    //         name: 1,
    //         slots: 1,
    //         booked: {
    //           $map: {
    //             input: "$booked",
    //             as: "book",
    //             in: "$$booked.slot",
    //           },
    //         },
    //       },
    //     },
    //     {
    //       $project: {
    //         name: 1,
    //         slots: {
    //           $setDifference: ["$slots", "$booked"],
    //         },
    //       },
    //     },
    //   ]).toArray();
    //   res.send(option);
    // });

    /**
     * API Naming Convention
     * app.get("'/bookings") find all
     * app.get("/bookings/:id") find one
     * app.post("/bookings") create
     * app.patch("/bookings/:id)
     * app.put("/bookings/:id")
     * app.delete("bookings/:id")
     */

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment,
      };
      const alreadyBooked = await bookingsCollection.find(query).toArray();

      if (alreadyBooked.length) {
        const message = `You have already a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });
  } finally {
  }
};
run().catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("Welcome to our Doctors Portal Server site");
});

app.listen(port, () => {
  console.log(`Server is running http://localhost:${port}`);
});
