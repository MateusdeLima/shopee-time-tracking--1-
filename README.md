# Shopee Page Control

Sistema interno para controle de horas extras e ausências dos funcionários da Shopee External.

## Requisitos

- Node.js 18.x ou superior
- npm ou yarn
- Conta no Supabase

## Configuração

1. Clone o repositório:
```bash
git clone <repositório>
cd shopee-time-tracking
```

2. Instale as dependências:
```bash
npm install --legacy-peer-deps
# ou
yarn install --legacy-peer-deps
```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env.local` na raiz do projeto
   - Adicione as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_supabase_service_role_key
```

4. Configure o banco de dados Supabase:
   - Abra o [Supabase Studio](https://app.supabase.com) e acesse seu projeto
   - Vá para a seção "SQL Editor"
   - Abra o arquivo `sql/setup-tables.sql` do projeto
   - Copie e cole o conteúdo no editor SQL do Supabase
   - Execute o script para criar as tabelas necessárias

## Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

Acesse `http://localhost:3000` para visualizar a aplicação.

## Build para produção

Para criar uma build de produção:

```bash
npm run build
# ou
yarn build
```

Para iniciar o servidor de produção:

```bash
npm run start
# ou
yarn start
```

## Implantação

### Vercel (Recomendado)

A forma mais fácil de implantar este projeto é usando a [Vercel](https://vercel.com):

1. Crie uma conta na Vercel (caso ainda não tenha)
2. Importe o projeto do Git
3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Implante!

### Outras plataformas

O projeto pode ser hospedado em qualquer plataforma que suporte Next.js:

- [Netlify](https://netlify.com)
- [AWS Amplify](https://aws.amazon.com/amplify/)
- [Railway](https://railway.app)
- [Render](https://render.com)

Para todas as plataformas, certifique-se de configurar corretamente as variáveis de ambiente.

## Estrutura do Projeto

- `/app` - Rotas e páginas da aplicação
- `/components` - Componentes reutilizáveis
- `/lib` - Funções de utilidade e configurações
- `/public` - Arquivos estáticos
- `/sql` - Scripts SQL para configuração do banco de dados
- `/styles` - Folhas de estilo global e utilitários

## Banco de Dados

O projeto utiliza o Supabase como banco de dados. Para configurá-lo:

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Na seção "Project Settings" > "API", obtenha:
   - URL do projeto (para `NEXT_PUBLIC_SUPABASE_URL`)
   - chave anônima (para `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - chave de serviço (para `SUPABASE_SERVICE_ROLE_KEY`)
4. Adicione essas credenciais ao arquivo `.env.local`

5. Configure o banco de dados executando o script SQL:
   - Acesse o painel do Supabase
   - Vá para a seção "SQL Editor"
   - Crie uma nova consulta
   - Copie e cole o conteúdo do arquivo `sql/setup-tables.sql`
   - Execute o script para criar todas as tabelas necessárias

## Solução de Problemas

Se você encontrar problemas com o método `query` no Supabase, isso ocorre porque a API atual do Supabase não suporta diretamente a execução de consultas SQL personalizadas através do cliente. É por isso que fornecemos um script SQL separado para configurar o banco de dados manualmente. 