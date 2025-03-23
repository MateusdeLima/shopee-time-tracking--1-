/**
 * Script para inicializar o banco de dados
 */
const http = require('http');

console.log('Inicializando banco de dados...');

// Função para fazer uma requisição HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve({ success: false, message: 'Erro ao processar resposta' });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Função para chamar a API de inicialização do banco de dados
async function initializeDatabase() {
  try {
    // Tentar acessar a API setup-db
    console.log('Tentando inicializar banco de dados via /api/setup-db...');
    const data = await makeRequest('http://localhost:3000/api/setup-db');
    
    if (data.success) {
      console.log('Banco de dados inicializado com sucesso!');
    } else {
      console.error('Falha ao inicializar o banco de dados:', data.message);
    }
  } catch (error) {
    console.error('Erro ao chamar API de inicialização:', error.message);
    console.log('\nTentando método alternativo...');
    
    try {
      // Método alternativo - usando a API init-db
      console.log('Tentando inicializar banco de dados via /api/init-db...');
      const altData = await makeRequest('http://localhost:3000/api/init-db');
      
      if (altData.success) {
        console.log('Banco de dados inicializado com sucesso (método alternativo)!');
      } else {
        console.error('Falha ao inicializar o banco de dados (método alternativo):', altData.message);
      }
    } catch (altError) {
      console.error('Erro ao chamar API alternativa de inicialização:', altError.message);
      console.log('\nPor favor, acesse a aplicação no navegador para que o banco de dados seja inicializado automaticamente.');
    }
  }
}

initializeDatabase(); 