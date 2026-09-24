import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Cinema } from '../models/Cinema.js';
import { Screen } from '../models/Screen.js';
import { Seat } from '../models/Seat.js';
import { Show } from '../models/Show.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';

const rowLabel = (idx) => {
  let n = idx;
  let label = '';
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
};

const generateSeats = async (screen, cfg = {}) => {
  const docs = [];
  for (let r = 0; r < screen.rows; r++) {
    const label = rowLabel(r);
    const rowCfg = cfg[label] || { seatType: 'REGULAR', priceMultiplier: 1 };
    for (let c = 1; c <= screen.columns; c++) {
      docs.push({
        screen: screen._id,
        seatNumber: `${label}${c}`,
        row: label,
        column: c,
        seatType: rowCfg.seatType,
        priceMultiplier: rowCfg.priceMultiplier,
        status: 'ACTIVE',
      });
    }
  }
  await Seat.insertMany(docs);
  return docs.length;
};

const img = (path) => `https://image.tmdb.org/t/p/original${path}`;

const MOVIES = [
  {
    title: 'Inception',
    description:
      'A skilled thief is offered a chance at redemption if he can successfully perform an impossible task: planting an idea in a target’s subconscious.',
    poster: img('/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'),
    backdrop: img('/s3TBrRGB1iav7gFOCNx3H31MoES.jpg'),
    trailer: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    language: 'EN',
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    duration: 148,
    releaseDate: new Date('2010-07-16'),
    rating: 8.4,
    popularity: 90,
    status: 'NOW_SHOWING',
    cast: [
      { name: 'Leonardo DiCaprio', character: 'Cobb', order: 0 },
      { name: 'Joseph Gordon-Levitt', character: 'Arthur', order: 1 },
      { name: 'Elliot Page', character: 'Ariadne', order: 2 },
      { name: 'Tom Hardy', character: 'Eames', order: 3 },
    ],
  },
  {
    title: 'Interstellar',
    description:
      'When Earth becomes uninhabitable, a farmer and ex-NASA pilot is tasked with piloting a spacecraft to find a new home for humanity.',
    poster: img('/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'),
    backdrop: img('/xJHokMbljvjADYdit5fK5VQsXEG.jpg'),
    trailer: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    language: 'EN',
    genre: ['Adventure', 'Drama', 'Sci-Fi'],
    duration: 169,
    releaseDate: new Date('2014-11-07'),
    rating: 8.5,
    popularity: 88,
    status: 'NOW_SHOWING',
    cast: [
      { name: 'Matthew McConaughey', character: 'Cooper', order: 0 },
      { name: 'Anne Hathaway', character: 'Brand', order: 1 },
      { name: 'Jessica Chastain', character: 'Murph', order: 2 },
    ],
  },
  {
    title: 'The Dark Knight',
    description:
      'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham City into anarchy.',
    poster: img('/qJ2tW6WMUDux911r6m7haRef0WH.jpg'),
    backdrop: img('/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg'),
    trailer: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    language: 'EN',
    genre: ['Action', 'Crime', 'Drama'],
    duration: 152,
    releaseDate: new Date('2008-07-18'),
    rating: 9.0,
    popularity: 95,
    status: 'NOW_SHOWING',
    cast: [
      { name: 'Christian Bale', character: 'Bruce Wayne', order: 0 },
      { name: 'Heath Ledger', character: 'Joker', order: 1 },
      { name: 'Aaron Eckhart', character: 'Harvey Dent', order: 2 },
    ],
  },
  {
    title: 'Dune: Part Two',
    description:
      'Paul Atreides unites with the Fremen to wage war against the House Harkonnen.',
    poster: img('/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'),
    backdrop: img('/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg'),
    trailer: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    language: 'EN',
    genre: ['Action', 'Adventure', 'Drama'],
    duration: 166,
    releaseDate: new Date('2024-03-01'),
    rating: 8.2,
    popularity: 92,
    status: 'NOW_SHOWING',
    cast: [
      { name: 'Timothée Chalamet', character: 'Paul', order: 0 },
      { name: 'Zendaya', character: 'Chani', order: 1 },
      { name: 'Rebecca Ferguson', character: 'Jessica', order: 2 },
    ],
  },
  {
    title: 'Oppenheimer',
    description:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    poster: img('/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'),
    backdrop: img('/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg'),
    trailer: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    language: 'EN',
    genre: ['Biography', 'Drama', 'History'],
    duration: 181,
    releaseDate: new Date('2023-07-21'),
    rating: 8.3,
    popularity: 85,
    status: 'NOW_SHOWING',
    cast: [
      { name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', order: 0 },
      { name: 'Emily Blunt', character: 'Katherine Oppenheimer', order: 1 },
      { name: 'Robert Downey Jr.', character: 'Lewis Strauss', order: 2 },
    ],
  },
  {
    title: 'Spirited Away',
    description:
      'A young girl wanders into a world ruled by gods, witches, and spirits, where humans are changed into beasts.',
    poster: img('/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'),
    backdrop: img('/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg'),
    trailer: 'https://www.youtube.com/watch?v=ByXuk9QqQkk',
    language: 'JA',
    genre: ['Animation', 'Adventure', 'Family'],
    duration: 125,
    releaseDate: new Date('2001-07-20'),
    rating: 8.6,
    popularity: 80,
    status: 'NOW_SHOWING',
    cast: [
      { name: 'Rumi Hiiragi', character: 'Chihiro', order: 0 },
      { name: 'Miyu Irino', character: 'Haku', order: 1 },
    ],
  },
  {
    title: 'The Batman',
    description:
      'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city’s hidden corruption.',
    poster: img('/74xTEgt7R36Fpooo50r9T25onhq.jpg'),
    backdrop: img('/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg'),
    trailer: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
    language: 'EN',
    genre: ['Action', 'Crime', 'Drama'],
    duration: 176,
    releaseDate: new Date('2022-03-04'),
    rating: 7.8,
    popularity: 82,
    status: 'NOW_SHOWING',
    cast: [
      { name: 'Robert Pattinson', character: 'Bruce Wayne', order: 0 },
      { name: 'Zoë Kravitz', character: 'Selina Kyle', order: 1 },
    ],
  },
  {
    title: 'Kalki 2898 AD',
    description:
      'A modern avatar of Vishnu descends to Earth to protect the last hope of humanity in a dystopian future.',
    poster: img('/6Q8MKxvXyf2fY3grALDwfMpA1yN.jpg'),
    backdrop: img('/9vJv9nKsK2hF8nl1xLMpR50vxPw.jpg'),
    trailer: 'https://www.youtube.com/watch?v=kQDd1PPD_YA',
    language: 'TE',
    genre: ['Action', 'Sci-Fi', 'Fantasy'],
    duration: 181,
    releaseDate: new Date('2024-06-27'),
    rating: 7.4,
    popularity: 78,
    status: 'NOW_SHOWING',
    cast: [
      { name: 'Prabhas', character: 'Bhairava', order: 0 },
      { name: 'Deepika Padukone', character: 'Sumathi', order: 1 },
      { name: 'Amitabh Bachchan', character: 'Ashwatthama', order: 2 },
    ],
  },
];

const CINEMAS = [
  {
    name: 'PVR: Phoenix Marketcity',
    description: 'Premium multiplex in the heart of the city.',
    address: 'Phoenix Marketcity, LBS Road',
    city: 'Mumbai',
    state: 'MH',
    postalCode: '400070',
    country: 'IN',
    facilities: ['Dolby Atmos', 'Recliners', 'Food Court', 'Parking'],
    images: [img('/9ghgSC0MA082EL6HLCW3GalykFD.jpg')],
  },
  {
    name: 'INOX: Nexus Mall',
    description: 'Modern screens with immersive sound.',
    address: 'Nexus Mall, Koramangala',
    city: 'Bengaluru',
    state: 'KA',
    postalCode: '560095',
    country: 'IN',
    facilities: ['IMAX', 'Dolby Atmos', 'Parking'],
    images: [img('/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg')],
  },
  {
    name: 'Cinepolis: DLF Place',
    description: 'Comfortable seating and blockbuster lineup.',
    address: 'DLF Place, Saket',
    city: 'New Delhi',
    state: 'DL',
    postalCode: '110017',
    country: 'IN',
    facilities: ['4DX', '3D', 'Food Court'],
    images: [img('/dK3b9iWkH4DTnpxmLlT81n0h6nq.jpg')],
  },
];

const startOfUTCDay = (d) => {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
};

const pickShowTimes = () => [
  { hour: 10, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 17, minute: 0 },
  { hour: 20, minute: 30 },
];

const run = async () => {
  await connectDB();
  console.log('[seed] connected');

  console.log('[seed] clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    Cinema.deleteMany({}),
    Screen.deleteMany({}),
    Seat.deleteMany({}),
    Show.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
  ]);

  console.log('[seed] creating users…');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@quick.com',
    password: 'admin123',
    role: 'ADMIN',
    phone: '+10000000000',
  });

  const normalUser = await User.create({
    name: 'Jane Doe',
    email: 'user@quick.com',
    password: 'user123',
    role: 'USER',
  });

  console.log('[seed] creating movies…');
  const movies = await Movie.insertMany(MOVIES);

  console.log('[seed] creating cinemas, screens, seats…');
  const screensByCinema = [];
  for (const c of CINEMAS) {
    const cinema = await Cinema.create(c);
    const screens = [];

    const screenPlan = [
      { name: 'Screen 1', screenNumber: 1, rows: 8, columns: 10, screenType: 'DOLBY' },
      { name: 'Screen 2', screenNumber: 2, rows: 6, columns: 10, screenType: 'STANDARD' },
      { name: 'Screen 3', screenNumber: 3, rows: 5, columns: 8, screenType: 'IMAX' },
    ];

    for (const plan of screenPlan) {
      const capacity = plan.rows * plan.columns;
      const seatConfiguration = [
        { row: rowLabel(plan.rows - 1), seatType: 'PREMIUM', priceMultiplier: 1.5 },
        { row: rowLabel(plan.rows - 2), seatType: 'PREMIUM', priceMultiplier: 1.5 },
      ];
      const screen = await Screen.create({
        cinema: cinema._id,
        ...plan,
        capacity,
        seatConfiguration,
      });
      await generateSeats(screen, {
        [rowLabel(plan.rows - 1)]: { seatType: 'PREMIUM', priceMultiplier: 1.5 },
        [rowLabel(plan.rows - 2)]: { seatType: 'PREMIUM', priceMultiplier: 1.5 },
      });
      screens.push(screen);
    }

    screensByCinema.push({ cinema, screens });
  }

  console.log('[seed] creating shows for the next 7 days…');
  const today = startOfUTCDay(new Date());
  const basePrice = 12;

  const showDocs = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() + dayOffset);

    for (const { cinema, screens } of screensByCinema) {
      for (const screen of screens) {
        // Two movies per screen per day, rotating through the library.
        const picks = [
          movies[(dayOffset + screen.screenNumber) % movies.length],
          movies[(dayOffset + screen.screenNumber + 3) % movies.length],
        ];

        const times = pickShowTimes();
        for (let i = 0; i < picks.length; i++) {
          const movie = picks[i];
          const startT = times[(i + screen.screenNumber) % times.length];

          const startTime = new Date(day);
          startTime.setUTCHours(startT.hour, startT.minute, 0, 0);

          const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000);

          const priceByScreen =
            screen.screenType === 'IMAX'
              ? basePrice + 6
              : screen.screenType === 'DOLBY'
              ? basePrice + 4
              : basePrice;

          showDocs.push({
            movie: movie._id,
            cinema: cinema._id,
            screen: screen._id,
            date: day,
            startTime,
            endTime,
            ticketPrice: priceByScreen,
            totalSeats: screen.capacity,
            occupiedSeats: [],
            status: 'SCHEDULED',
          });
        }
      }
    }
  }

  // Sanity: avoid the unique { screen, startTime } index collision if two
  // picks landed on the same slot for the same screen.
  const seen = new Set();
  const deduped = [];
  for (const doc of showDocs) {
    const key = `${doc.screen.toString()}::${doc.startTime.toISOString()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(doc);
  }

  await Show.insertMany(deduped);

  console.log('[seed] done');
  console.log(`[seed]   users:    admin=admin@quick.com / admin123`);
  console.log(`[seed]             user =user@quick.com / user123`);
  console.log(`[seed]   movies:   ${movies.length}`);
  console.log(`[seed]   cinemas:  ${CINEMAS.length}`);
  console.log(`[seed]   shows:    ${deduped.length}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});