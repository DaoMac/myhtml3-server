'use strict';

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'port-activity.txt');

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const accessMap = {}; // theo dõi IP

function ghiLog(type, req, extra = '') {
  const time = new Date().toLocaleString('vi-VN');
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const url = req.originalUrl;
  const method = req.method;

  const line = `[${time}] ${type} | IP=${ip} | ${method} ${url} ${extra}\n`;

  console.log(line.trim());
  fs.appendFileSync(logFile, line);
}

function portGuard(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  // ===== THEO DÕI TẦN SUẤT =====
  if (!accessMap[ip]) accessMap[ip] = [];
  accessMap[ip] = accessMap[ip].filter(t => now - t < 10000);
  accessMap[ip].push(now);

  // ===== PHÁT HIỆN QUÉT SERVER / FLOOD =====
  if (accessMap[ip].length > 50) {
    ghiLog('⚠️ FLOOD / SCAN', req);
    return res.status(429).send('Too many requests');
  }

  // ===== PHÁT HIỆN TRUY CẬP NGHI VẤN =====
  const badPaths = ['/admin', '/phpmyadmin', '/wp-login', '.env'];

  if (badPaths.some(p => req.originalUrl.includes(p))) {
    ghiLog('🚨 TRUY CẬP NGHI VẤN', req);
    return res.status(403).send('Forbidden');
  }

  // ===== LOG TRUY CẬP BÌNH THƯỜNG =====
  ghiLog('ACCESS', req);

  next();
}

module.exports = portGuard;
