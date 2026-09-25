import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { movieRouter } from './movie.routes.js';
import { cinemaRouter } from './cinema.routes.js';
import { screenRouter } from './screen.routes.js';
import { seatRouter } from './seat.routes.js';
import { showRouter } from './show.routes.js';
import { bookingRouter } from './booking.routes.js';
import { paymentRouter } from './payment.routes.js';
import { adminRouter } from './admin.routes.js';
import { jobsRouter } from './jobs.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ok',
    data: {
      timestamp: new Date().toISOString(),
    },
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/movies', movieRouter);
apiRouter.use('/cinemas', cinemaRouter);
apiRouter.use('/screens', screenRouter);
apiRouter.use('/seats', seatRouter);
apiRouter.use('/shows', showRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/jobs', jobsRouter);