export default async function handler(_req: any, res: any) {
  try {
    const express = require('express');
    res.json({ status: 'ok', express: true });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message, code: err.code });
  }
}
