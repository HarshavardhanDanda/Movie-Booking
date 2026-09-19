# Simple Razorpay checkout

The backend flow is:
1. POST /bookings with a showtime ID and selected seats.
2. POST /payments/order with the booking ID.
3. Open Razorpay Checkout using the returned public key and order ID.
4. POST /payments/verify with the booking ID and Razorpay's payment response.
5. Show confirmation only when the backend returns a confirmed booking.

Customer requests use the existing Bearer login token. Booking creation also uses an Idempotency-Key header so retrying a request does not create another seat reservation. GET /bookings/:id loads checkout after a refresh, and GET /bookings/my lists the user's bookings.

Set only these payment settings in server/.env:
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

Use Test Mode keys and automatic capture in Razorpay while developing. Run npm start from server/. No webhook or separate worker is needed.

Admins enter ticket prices through the frontend. The backend stores prices as integer paise (15000 = INR 150) and calculates booking totals itself.

Seat reservations last five minutes. Database transactions keep the seat and booking updates together, so Atlas or a local MongoDB replica set is required.

There is no background payment recovery, automatic refund, refund dashboard, or catalog locking. If a customer closes the browser before verification, the booking may remain unconfirmed even if payment succeeded. The checkout can retry a saved browser response; other cases must be checked manually in Razorpay. If a payment is verified after its reservation expired, it is recorded but no ticket is issued; any refund must be made manually.

server.js contains the Express setup and starts listening as before. Connection errors are logged with database URIs redacted. No database reset or change to existing .env secrets is required.

Run npm test for model checks and a temporary local MongoDB checkout test. Razorpay is mocked and Atlas is not used by the tests.
