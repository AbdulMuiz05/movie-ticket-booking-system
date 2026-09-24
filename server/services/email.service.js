import nodemailer from 'nodemailer';
import { User } from '../models/User.js';

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

const send = async ({ to, subject, html }) => {
  const mailer = getTransporter();
  if (!mailer || !to) return { skipped: true };
  return mailer.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to, subject, html });
};

const esc = (value = '') => String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

export const sendBookingConfirmationEmail = async (booking) => {
  const user = booking.user?.email ? booking.user : await User.findById(booking.user).select('name email');
  if (!user?.email) return { skipped: true };
  return send({
    to: user.email,
    subject: `Booking confirmed — ${booking.movie?.title || 'Movie Ticket'}`,
    html: `<h2>Booking Confirmed</h2><p>Hi ${esc(user.name)}, your movie ticket booking is confirmed.</p><p><strong>Reference:</strong> ${esc(booking.bookingReference)}</p><p><strong>Movie:</strong> ${esc(booking.movie?.title)}</p><p><strong>Cinema:</strong> ${esc(booking.cinema?.name)}</p><p><strong>Seats:</strong> ${esc((booking.seats || []).join(', '))}</p><p><strong>Show:</strong> ${esc(new Date(booking.show?.startTime).toLocaleString())}</p><p><strong>Total:</strong> ${esc(booking.totalAmount)} ${esc(booking.paymentStatus === 'paid' ? 'paid' : '')}</p>`,
  });
};

export const sendShowAddedNotification = async (show) => {
  const users = await User.find({ active: true }).select('name email').lean();
  const recipients = users.filter((u) => u.email);
  if (!recipients.length) return { skipped: true, sent: 0 };
  let sent = 0;
  for (const user of recipients) {
    try {
      await send({
        to: user.email,
        subject: `New show added — ${show.movie?.title || 'Movie'}`,
        html: `<h2>New Show Available</h2><p>Hi ${esc(user.name)}, a new show has been added.</p><p><strong>Movie:</strong> ${esc(show.movie?.title)}</p><p><strong>Cinema:</strong> ${esc(show.cinema?.name)}</p><p><strong>Show:</strong> ${esc(new Date(show.startTime).toLocaleString())}</p><p><strong>Ticket price:</strong> ${esc(show.ticketPrice)}</p>`,
      });
      sent += 1;
    } catch (err) {
      console.error('[email] show notification failed:', user.email, err.message);
    }
  }
  return { sent };
};

export const sendBookingReminderEmail = async (booking) => {
  const user = booking.user?.email ? booking.user : await User.findById(booking.user).select('name email');
  if (!user?.email) return { skipped: true };
  return send({
    to: user.email,
    subject: `Reminder — ${booking.movie?.title || 'your movie show'} is coming up`,
    html: `<h2>Movie Reminder</h2><p>Hi ${esc(user.name)}, your booked show is coming up within 8 hours.</p><p><strong>Reference:</strong> ${esc(booking.bookingReference)}</p><p><strong>Movie:</strong> ${esc(booking.movie?.title)}</p><p><strong>Cinema:</strong> ${esc(booking.cinema?.name)}</p><p><strong>Seats:</strong> ${esc((booking.seats || []).join(', '))}</p><p><strong>Show:</strong> ${esc(new Date(booking.show?.startTime).toLocaleString())}</p>`,
  });
};
