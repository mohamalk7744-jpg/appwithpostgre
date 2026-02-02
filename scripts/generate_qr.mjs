#!/usr/bin/env node
import QRCode from "qrcode";

// Fix: Cast process to any to access argv
const url = (process as any).argv[2];

if (!url) {
  console.error('Usage: node scripts/generate_qr.mjs "exps://..."');
  // Fix: Cast process to any to access exit
  (process as any).exit(1);
}

await QRCode.toFile("expo-qr-code.png", url, { width: 512 });
console.log(`✅ QR code saved to expo-qr-code.png`);
