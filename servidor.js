const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Conecta inicialmente na raiz do MySQL (sem especificar banco) para evitar erros de login
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
});

db.connect((err) => {
  if (err) {
    console.error('❌ ERRO CRÍTICO: Não foi possível acessar o MySQL local.', err.message);
    return;
  }
  console.log('✅ Conectado ao servidor MySQL com sucesso!');

  // 2. Cria o banco de dados de produção de forma segura se ele não existir
  db.query("CREATE DATABASE IF NOT EXISTS db_tarefas_SaaS", (err) => {
    if (err) {
      console.error('Erro ao criar banco de dados:', err.message);
      return;
    }

    // 3. Altera a conexão dinamicamente para usar o novo banco garantido
    db.changeUser({ database: 'db_tarefas_SaaS' }, (err) => {
      if (err) {
        console.error('Erro ao alternar para o banco de dados:', err.message);
        return;
      }
      console.log('📦 Banco de dados [db_tarefas_SaaS] selecionado e pronto.');

      // 4. Cria a tabela com a estrutura de colunas perfeita e corrigida
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS tarefas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          descricao VARCHAR(255) NOT NULL,
          concluida TINYINT(1) DEFAULT 0
        )
      `;
      db.query(createTableSql, (err) => {
        if (err) console.error('Erro ao estruturar tabela de tarefas:', err.message);
        else console.log('🚀 Tabela [tarefas] verificada e estruturada com sucesso!');
      });
    });
  });
});

// ==========================================================================
// ROTAS DO SISTEMA (API REST)
// ==========================================================================

app.post('/tarefas', (req, res) => {
  const { descricao } = req.body;
  const sql = 'INSERT INTO tarefas (descricao, concluida) VALUES (?, 0)';
  db.query(sql, [descricao], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, descricao, concluida: 0 });
  });
});

app.get('/tarefas', (req, res) => {
  const sql = 'SELECT id, descricao, concluida FROM tarefas ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.put('/tarefas/:id', (req, res) => {
  const { id } = req.params;
  const { descricao, concluida } = req.body;
  const sql = 'UPDATE tarefas SET descricao = ?, concluida = COALESCE(?, concluida) WHERE id = ?';
  db.query(sql, [descricao, concluida, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tarefa atualizada com sucesso!' });
  });
});

app.delete('/tarefas/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM tarefas WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Tarefa deletada com sucesso!' });
  });
});

app.listen(3000, () => {
  console.log('🔥 Servidor backend rodando na porta 3000');
});
