const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || "app-aleatorio";

app.use((req, res, next) => {
  res.set('X-Served-By', INSTANCE_ID);
  next();
});

const COLORS = {
  'app-01': '#2563eb', 
  'app-02': '#16a34a', 
  'app-03': '#ea580c', 
};
const color = COLORS[INSTANCE_ID] || '#334155';

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <title>${INSTANCE_ID}</title>
      <style>
        body {
          margin: 0;
          font-family: system-ui, sans-serif;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        .card {
          background: ${color};
          color: white;
          padding: 3rem 4rem;
          border-radius: 16px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Respondido por: ${INSTANCE_ID}</h1>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', instancia: INSTANCE_ID });
});

app.listen(PORT, () => {
  console.log(`[${INSTANCE_ID}] rodando na porta ${PORT}`);
});