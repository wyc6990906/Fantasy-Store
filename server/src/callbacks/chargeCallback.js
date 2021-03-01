//acquire nodemailer for sending email upon successful payment
const nodemailer = require("nodemailer");
const transport = {
  host: "smtp.gmail.com",
  auth: {
    user: "cross.aisle.app@gmail.com",
    pass: "hzezdenietpdefvo"
  }
};
const transporter = nodemailer.createTransport(transport);
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log(
      "/charge is ready to send messages from cross.aisle.app@gmail.com!"
    );
  }
});
const stripe = require("stripe")("sk_test_KXx4rnWNLRVPWRpE1qpFbNZ2");
// const accountSid = process.env.DB_ACCOUNTSID;
// const authToken = process.env.DB_AUTHTOKEN
const accountSid = "AC44c296aef0acfd3c9d89eb43323cc1c1";
const authToken = "a4213c0a7d60fe51572089a36504fb34";
const client = require("twilio")(accountSid, authToken);

module.exports = async function chargeCallback(req, res) {
  console.log("req.body:", req.body);
  const {
    description,
    token,
    // orderId, currently missing
    amount,
    email,
    deliveryAddress,
    deliveryDate,
    deliveryTime
  } = JSON.parse(req.body);
  try {
    let { status } = await stripe.charges
      .create({
        amount: amount * 100,
        currency: "usd",
        description: description,
        source: token,
        metadata: {
          email: email
        }
        //
      })
      .then(
        client.messages
          .create({
            body: `Hi, you have received an order from Cross Aisle! \nAmount:$${amount}\nDelivery Date: ${deliveryDate}, \nAddress: ${deliveryAddress}, \nTime: ${deliveryTime} \nPlease prepare the groceries for the driver.\nThank you!!! `,
            from: "+15878530743",
            to: "+1 403-903-9057"
          })
          .then(message => console.log("Message to the store", message.sid))
          .done()
      )
      .then(
        client.messages
          .create({
            body: `Hi, you have received a new delivery request from Cross Aisle!\nPlease deliver on: ${deliveryDate},\nTo: ${deliveryAddress},\nBetween: ${deliveryTime}.`,
            from: "+15878530743",
            to: "+1 780-708-4684"
          })
          .then(message => console.log("Message to the driver", message.sid))
          .done()
      );

    // console.log("status PLEASE", status);
    if (status === "succeeded") {
      const line1 = `<h2>Thank you for your purchase at Cross Aisle!</h2></br>`;
      // const line2 = `<h2>Order ID: ${orderId}!</h2></br>`;
      const line2 = `<h2>The total: ${amount}.</h2></br>`;
      const line3 = `<h2>Shipping Address: ${deliveryAddress}.</h2></br>`;
      const line4 = `<h2>Delivery Date: ${deliveryDate}.</h2></br>`;
      const line5 = `<h2>Shipping Window: ${deliveryTime}.</h2></br>`;
      // const line6 =
      //   "<h2>Go to <a href='http://localhost:3000/orderHistory'>Cross Aisle</a> to see your order history</h2>";
      const content = line1 + line2 + line3 + line4 + line5;
      const mail = {
        from: "cross.aisle.app@gmail.com",
        to: email,
        subject: "Order confirmation from Cross Aisle!",
        html: content
      };
      transporter.sendMail(mail, (err, data) => {
        if (err) {
          res.status(400).send("Failed to send email!!");
        } else {
          res.status(200).send("Purchase confirmation has been sent");
        }
      });
    }
    res.json({
      status
    });
  } catch (err) {
    switch (err.type) {
      case "StripeCardError":
        console.log("A declined card error");
        break;
      case "RateLimitError":
        console.log("Too many requests made to the API too quickly");
        break;
      case "StripeInvalidRequestError":
        console.log(" Invalid parameters were supplied to Stripe's API");
        break;
      case "StripeAPIError":
        console.log("An error occurred internally with Stripe's API");
        break;
      case "StripeConnectionError":
        console.log(
          "Some kind of error occurred during the HTTPS communication"
        );
        break;
      case "StripeAuthenticationError":
        console.log("You probably used an incorrect API key");
        break;
      default:
        console.log("Twillo Message Error");
        break;
    }
    res.status(400).end();
  }
};
