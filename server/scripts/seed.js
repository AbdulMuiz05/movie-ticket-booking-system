import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Cinema } from '../models/Cinema.js';
import { Screen } from '../models/Screen.js';
import { Seat } from '../models/Seat.js';
import { Show } from '../models/Show.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import {
  getTmdbMovieDetails,
  mapTmdbToMovie,
} from '../services/tmdb.service.js';

const TMDB_MOVIE_IDS = [
  27205,
  157336,
  155,
  438631,
  872585,
  129,
  414906,
  533535,
];

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
    const rowCfg =
      cfg[label] || {
        seatType: 'REGULAR',
        priceMultiplier: 1,
      };

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

const img = (path) =>
  `https://image.tmdb.org/t/p/original${path}`;

const CINEMAS = [
  {
    name: 'PVR: Phoenix Marketcity',
    description:
      'Premium multiplex in the heart of the city.',
    address: 'Phoenix Marketcity, LBS Road',
    city: 'Mumbai',
    state: 'MH',
    postalCode: '400070',
    country: 'IN',
    facilities: [
      'Dolby Atmos',
      'Recliners',
      'Food Court',
      'Parking',
    ],
    images: [
      img('/9ghgSC0MA082EL6HLCW3GalykFD.jpg'),
    ],
  },
  {
    name: 'INOX: Nexus Mall',
    description:
      'Modern screens with immersive sound.',
    address: 'Nexus Mall, Koramangala',
    city: 'Bengaluru',
    state: 'KA',
    postalCode: '560095',
    country: 'IN',
    facilities: [
      'IMAX',
      'Dolby Atmos',
      'Parking',
    ],
    images: [
      img('/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg'),
    ],
  },
  {
    name: 'Cinepolis: DLF Place',
    description:
      'Comfortable seating and blockbuster lineup.',
    address: 'DLF Place, Saket',
    city: 'New Delhi',
    state: 'DL',
    postalCode: '110017',
    country: 'IN',
    facilities: [
      '4DX',
      '3D',
      'Food Court',
    ],
    images: [
      img('/dK3b9iWkH4DTnpxmLlT81n0h6nq.jpg'),
    ],
  },
];

const startOfUTCDay = (date) => {
  const value = new Date(date);

  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate()
    )
  );
};

const pickShowTimes = () => [
  { hour: 10, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 17, minute: 0 },
  { hour: 20, minute: 30 },
];

const createMovieSnapshots = async () => {
  console.log('[seed] fetching movies from TMDB…');

  const movies = [];

  for (const tmdbId of TMDB_MOVIE_IDS) {
    const details = await getTmdbMovieDetails(tmdbId);
    const movie = mapTmdbToMovie(details);

    movies.push(movie);

    console.log(
      `[seed]   TMDB ${tmdbId}: ${movie.title}`
    );
  }

  return movies;
};

const run = async () => {
  await connectDB();

  console.log('[seed] connected');

  console.log('[seed] clearing existing data…');

  await Promise.all([
    User.deleteMany({}),
    Cinema.deleteMany({}),
    Screen.deleteMany({}),
    Seat.deleteMany({}),
    Show.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
  ]);

  console.log('[seed] creating users…');

  await User.create({
    name: 'Admin User',
    email: 'admin@quick.com',
    password: 'admin123',
    role: 'ADMIN',
    phone: '+10000000000',
  });

  await User.create({
    name: 'Jane Doe',
    email: 'user@quick.com',
    password: 'user123',
    role: 'USER',
  });

  const movies = await createMovieSnapshots();

  console.log(
    '[seed] creating cinemas, screens, seats…'
  );

  const screensByCinema = [];

  for (const cinemaData of CINEMAS) {
    const cinema = await Cinema.create(cinemaData);

    const screens = [];

    const screenPlan = [
      {
        name: 'Screen 1',
        screenNumber: 1,
        rows: 8,
        columns: 10,
        screenType: 'DOLBY',
      },
      {
        name: 'Screen 2',
        screenNumber: 2,
        rows: 6,
        columns: 10,
        screenType: 'STANDARD',
      },
      {
        name: 'Screen 3',
        screenNumber: 3,
        rows: 5,
        columns: 8,
        screenType: 'IMAX',
      },
    ];

    for (const plan of screenPlan) {
      const capacity =
        plan.rows * plan.columns;

      const seatConfiguration = [
        {
          row: rowLabel(plan.rows - 1),
          seatType: 'PREMIUM',
          priceMultiplier: 1.5,
        },
        {
          row: rowLabel(plan.rows - 2),
          seatType: 'PREMIUM',
          priceMultiplier: 1.5,
        },
      ];

      const screen = await Screen.create({
        cinema: cinema._id,
        ...plan,
        capacity,
        seatConfiguration,
      });

      await generateSeats(screen, {
        [rowLabel(plan.rows - 1)]: {
          seatType: 'PREMIUM',
          priceMultiplier: 1.5,
        },
        [rowLabel(plan.rows - 2)]: {
          seatType: 'PREMIUM',
          priceMultiplier: 1.5,
        },
      });

      screens.push(screen);
    }

    screensByCinema.push({
      cinema,
      screens,
    });
  }

  console.log(
    '[seed] creating shows for the next 7 days…'
  );

  const today = startOfUTCDay(new Date());
  const basePrice = 12;
  const showDocs = [];

  for (
    let dayOffset = 0;
    dayOffset < 7;
    dayOffset++
  ) {
    const day = new Date(today);

    day.setUTCDate(
      day.getUTCDate() + dayOffset
    );

    for (const { cinema, screens } of screensByCinema) {
      for (const screen of screens) {
        const picks = [
          movies[
            (dayOffset + screen.screenNumber) %
              movies.length
          ],
          movies[
            (dayOffset +
              screen.screenNumber +
              3) %
              movies.length
          ],
        ];

        const times = pickShowTimes();

        for (let i = 0; i < picks.length; i++) {
          const movie = picks[i];
          const startT =
            times[
              (i + screen.screenNumber) %
                times.length
            ];

          const startTime = new Date(day);

          startTime.setUTCHours(
            startT.hour,
            startT.minute,
            0,
            0
          );

          const endTime = new Date(
            startTime.getTime() +
              movie.duration * 60 * 1000
          );

          const priceByScreen =
            screen.screenType === 'IMAX'
              ? basePrice + 6
              : screen.screenType === 'DOLBY'
                ? basePrice + 4
                : basePrice;

          showDocs.push({
            movie: {
              tmdbId: movie.tmdbId,
              title: movie.title,
              poster: movie.poster,
              backdrop: movie.backdrop,
              duration: movie.duration,
              language: movie.language,
              rating: movie.rating,
              genre: movie.genre,
            },
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

  const seen = new Set();
  const deduped = [];

  for (const doc of showDocs) {
    const key = `${doc.screen.toString()}::${doc.startTime.toISOString()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(doc);
  }

  await Show.insertMany(deduped);

  console.log('[seed] done');
  console.log(
    '[seed]   users:    admin=admin@quick.com / admin123'
  );
  console.log(
    '[seed]             user =user@quick.com / user123'
  );
  console.log(
    `[seed]   TMDB movies used: ${movies.length}`
  );
  console.log(
    `[seed]   cinemas:  ${CINEMAS.length}`
  );
  console.log(
    `[seed]   shows:    ${deduped.length}`
  );

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});