/**
 * Script para ajudar na configuração inicial do projeto
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Cria uma interface para leitura de input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("\n===== Configuração do Shopee Page Control =====\n");
console.log("Este script irá ajudá-lo a configurar o projeto.\n");

// Verifica se o arquivo .env.local existe
const envPath = path.join(process.cwd(), '.env.local');
let envExists = fs.existsSync(envPath);

if (envExists) {
  console.log("Arquivo .env.local encontrado. Deseja sobrescrevê-lo? (s/n)");
  
  rl.question("", (answer) => {
    if (answer.toLowerCase() === 's') {
      createEnvFile();
    } else {
      console.log("\nMantendo o arquivo .env.local existente.");
      console.log("\nPara que o projeto funcione corretamente, certifique-se de que ele contém as seguintes variáveis:");
      console.log("- NEXT_PUBLIC_SUPABASE_URL");
      console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
      console.log("- SUPABASE_SERVICE_ROLE_KEY\n");
      finalInstructions();
    }
  });
} else {
  createEnvFile();
}

// Função para criar o arquivo .env.local
function createEnvFile() {
  console.log("\nPor favor, forneça as informações do seu projeto Supabase:");
  
  rl.question("URL do Supabase (NEXT_PUBLIC_SUPABASE_URL): ", (url) => {
    rl.question("Chave anônima do Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY): ", (anonKey) => {
      rl.question("Chave de serviço do Supabase (SUPABASE_SERVICE_ROLE_KEY): ", (serviceKey) => {
        
        const envContent = `# Configuração do Supabase
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}
`;
        
        try {
          fs.writeFileSync(envPath, envContent);
          console.log("\nArquivo .env.local criado com sucesso!");
          finalInstructions();
        } catch (error) {
          console.error("\nErro ao criar arquivo .env.local:", error);
          rl.close();
        }
      });
    });
  });
}

// Instruções finais
function finalInstructions() {
  console.log("\n===== Próximos passos =====");
  console.log("1. Execute `npm run dev` para iniciar o servidor de desenvolvimento");
  console.log("2. Acesse http://localhost:3000 no seu navegador");
  console.log("3. Na primeira execução, o banco de dados será inicializado automaticamente");
  console.log("\nPara mais informações, consulte o arquivo README.md\n");
  rl.close();
} 