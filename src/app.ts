import "./config/env.js"; // Carrega as variáveis de ambiente do arquivo .env antes de qualquer outra coisa

// Importa a classe DatabaseModel — usada para testar a conexão com o banco antes de subir o servidor
import { DatabaseModel } from "./model/DatabaseModel.js";

// Importa o servidor Express configurado no server.ts — é ele quem será iniciado após a conexão com o banco
import { server } from "./server.js";

// Importa a biblioteca dotenv — responsável por carregar as variáveis de ambiente do arquivo .env
// Variáveis de ambiente guardam informações sensíveis (senhas, portas, hosts) fora do código-fonte
// sem precisar colocá-las diretamente no código — o arquivo .env nunca deve ser commitado no Git
import dotenv from "dotenv";

// Carrega as variáveis definidas no arquivo .env para dentro do process.env
// Deve ser chamado antes de qualquer leitura de process.env
// Sem esta linha, process.env.PORT e process.env.HOST retornariam undefined
dotenv.config();

// Lê a variável PORT do arquivo .env e converte de string para número inteiro
// parseInt retorna NaN se o valor não for um número válido (ex: PORT não definido ou PORT="abc")
// O operador "??" garante que, se PORT for undefined, passa uma string vazia para o parseInt
// Ex: se .env tiver PORT=3333, a variável port receberá o número 3333
const port: number = parseInt(process.env.PORT ?? "");

// Valida se a porta é um número válido antes de continuar
// isNaN() retorna true se o valor não for um número — o que indica que PORT está ausente ou incorreto
// process.exit(1) encerra o processo Node com código 1, que por convenção indica erro
// Isso evita que o servidor suba com uma porta inválida e falhe silenciosamente
if (isNaN(port)) {
    console.error("Variável de ambiente PORT não definida ou inválida.");
    process.exit(1);
}

// Lê a variável HOST do arquivo .env
// O operador "??" garante que, se HOST não estiver definido no .env, usa string vazia como padrão
// Ex: se .env tiver HOST=http://localhost, a variável host receberá "http://localhost"
const host: string = process.env.HOST ?? "";

// Testa a conexão com o banco de dados antes de iniciar o servidor
// "await" pausa a execução aqui até o banco responder — só então o código abaixo é executado
// Isso garante que o servidor nunca sobe sem uma conexão válida com o banco
// testeConexao() retorna true se a conexão foi bem-sucedida, false caso contrário
const ok = await new DatabaseModel().testeConexao();

if (ok) {
    // Conexão com o banco estabelecida — inicia o servidor Express na porta e host definidos no .env
    // O callback é executado assim que o servidor estiver pronto para receber requisições
    server.listen(port, () => {
        console.info(`Servidor executando no endereço ${host}:${port}`);
    });
} else {
    // Conexão com o banco falhou — exibe o erro e encerra o processo
    // Subir o servidor sem banco de dados causaria erro em todas as rotas que acessam dados
    // process.exit(1) sinaliza para o sistema operacional que o processo terminou com erro
    console.error("Não foi possível conectar com o banco de dados.");
    process.exit(1);
}