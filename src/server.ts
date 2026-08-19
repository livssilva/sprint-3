// Importa o framework Express — é ele quem cria e gerencia o servidor web da aplicação
import express from "express";

// Importa o middleware CORS (Cross-Origin Resource Sharing)
// CORS é um mecanismo de segurança do navegador que bloqueia requisições feitas de um domínio diferente
// Ex: se o front-end está em localhost:3000 e a API em localhost:3333, sem CORS o navegador bloquearia a requisição
// O middleware cors() do Express resolve isso, permitindo configurar quais origens têm acesso à API
import cors from "cors";

// Importa o router com todos os endpoints da aplicação (aluno, livro, empréstimo)
// O router foi criado e exportado no arquivo routes.ts
import { router } from "./routes.js";

// Cria a instância do servidor Express e armazena na variável "server"
// É este objeto que recebe todos os middlewares, rotas e configurações
// Ele será exportado e iniciado no arquivo index.ts
const server = express();

// Registra o middleware que permite ao servidor ler corpos de requisição em formato JSON
// Sem isso, req.body chegaria como undefined em todos os controllers
// O "limit" define o tamanho máximo aceito no body — evita que payloads muito grandes sobrecarreguem o servidor
server.use(express.json({ limit: "10mb" }));

// Registra o middleware CORS com as configurações de segurança
// "origin" define quais domínios têm permissão para acessar a API:
//   - Em produção: lê a variável CORS_ORIGIN do arquivo .env (ex: https://meu-frontend.com)
//   - Em desenvolvimento: usa "*" como fallback, que permite qualquer origem
// "methods" lista explicitamente quais métodos HTTP são permitidos nas requisições
//   - GET: leitura de dados
//   - POST: criação de recursos
//   - PUT: atualização de recursos
//   - DELETE: remoção de recursos
server.use(cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

// Registra o router com todos os endpoints da aplicação
// A partir daqui, toda requisição recebida pelo servidor será analisada pelo router,
// que identifica o método HTTP e o caminho da URL e direciona para o controller correto
server.use(router);

// Exporta o servidor para que possa ser importado e iniciado no index.ts
// O uso de exportação nomeada { server } mantém consistência com as demais exportações do projeto
export { server };