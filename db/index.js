const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'mery',
  password: 'merisqlpass',
  database: 'cinemaapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function getBookings(req, res) {
  const showing = req.query.showing;
  const movieId = req.query.id;
  try {
    const [rows] = await pool.query(
      `SELECT seats 
         FROM bookings 
        WHERE showing = ? 
          AND movie_id = ?`,
      [showing, movieId]
    );

    const bookings = rows.map(r => ({ seats: JSON.parse(r.seats) }));
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).send('Database query error');
  }
}

async function addBooking(req, res) {
  const { movie, region, showing, seats, person } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [personResult] = await conn.execute(
      `INSERT INTO persons 
         (first_name, last_name, email, phone_number) 
       VALUES (?,?,?,?)`,
      [person.first_name, person.last_name, person.email, person.phone_number]
    );
    const personId = personResult.insertId;

    const [bookingResult] = await conn.execute(
      `INSERT INTO bookings 
         (movie_id, region_region, region_lang, showing, seats, person_id) 
       VALUES (?,?,?,?,?,?)`,
      [
        movie.id,
        region.region,
        region.lang,
        showing,
        JSON.stringify(seats),
        personId
      ]
    );

    await conn.commit();
    res.json({ bookingId: bookingResult.insertId });
  } catch (err) {
    await conn.rollback();
    console.error('Error inserting booking:', err);
    res.status(500).send('Database insert error');
  } finally {
    conn.release();
  }
}

module.exports = { getBookings, addBooking };
