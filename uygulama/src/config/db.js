const mysql = require('mysql2/promise');

// İki havuzda da aynı olan ayarlar (compose'daki ortam değişkenlerinden gelir)
const ortakAyarlar = {
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_KULLANICI,
  password: process.env.DB_SIFRE,
  database: process.env.DB_ADI,
  charset: 'utf8mb4',
  dateStrings: true,            
  waitForConnections: true,
  connectionLimit: 10,
};

// Yazma: INSERT/UPDATE ve stored procedure çağrıları → kaynak sunucu
const yazmaHavuzu = mysql.createPool({ ...ortakAyarlar, host: process.env.DB_YAZMA_HOST });

// Okuma: listeleme ve raporlar → replika (salt okunur)
const okumaHavuzu = mysql.createPool({ ...ortakAyarlar, host: process.env.DB_OKUMA_HOST });

module.exports = { yazmaHavuzu, okumaHavuzu };