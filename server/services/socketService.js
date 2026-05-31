/**
 * @fileoverview Socket.IO service.
 * Initialises a Socket.IO server, authenticates connections via JWT,
 * and exposes helper functions to broadcast real-time events to all
 * connected clients.
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/** @type {Server|null} */
let io = null;

/** Map of authenticated socket IDs → decoded user payloads. */
const connectedUsers = new Map();

/**
 * Initialise Socket.IO on top of an existing HTTP server.
 *
 * @param {import('http').Server} server - Node HTTP server instance.
 * @returns {Server} The Socket.IO server instance.
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // tighten in production
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60_000,
  });

  // ── Connection-level auth ────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: invalid token'));
    }
  });

  // ── Event handlers ───────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user.role}) [${socket.id}]`);
    connectedUsers.set(socket.id, socket.user);

    // Optionally join a department-specific room
    if (socket.user.department) {
      socket.join(`dept:${socket.user.department}`);
    }

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.user.name} [${socket.id}] — ${reason}`);
      connectedUsers.delete(socket.id);
    });
  });

  console.log('🔌 Socket.IO initialised');
  return io;
};

/**
 * Broadcast a student-updated event to all connected clients.
 * @param {Object} student - The updated student document.
 */
export const emitStudentUpdate = (student) => {
  if (io) {
    io.emit('student:updated', student);
  }
};

/**
 * Ask all dashboards to refresh their data.
 */
export const emitDashboardRefresh = () => {
  if (io) {
    io.emit('dashboard:refresh');
  }
};

/**
 * Broadcast a new audit-log activity to all clients.
 * @param {Object} activity - The newly created AuditLog document.
 */
export const emitNewActivity = (activity) => {
  if (io) {
    io.emit('activity:new', activity);
  }
};

/**
 * Return the current Socket.IO instance (may be null before init).
 * @returns {Server|null}
 */
export const getIO = () => io;
