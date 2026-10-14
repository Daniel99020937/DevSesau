const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
//conexão banco
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tarefas'
});
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.message);
    return;
  }
  console.log('Conectado ao MySQL com sucesso!');
});
//salvar no banco
app.post('/tarefas', (req, res) => {
  const { descricao } = req.body;
  const sql = 'INSERT INTO tarefas (descricao) VALUES (?)';
  db.query(sql, [descricao], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, descricao });
  });
});
//buscar do banco
app.get('/tarefas', (req, res) => {
  const sql = 'SELECT * FROM tarefas ORDER BY id DESC'; // Mudado de ASC para DESC
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
//atualiza banco
app.put('/tarefas/:id', (req, res) => {
  const { id } = req.params;
  const { descricao } = req.body;
  const sql = 'UPDATE tarefas SET descricao = ? WHERE id = ?';
  db.query(sql, [descricao, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tarefa atualizada com sucesso!' });
  });
});
//apagar do banco
app.delete('/tarefas/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM tarefas WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tarefa deletada com sucesso!' });
  });
});
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});