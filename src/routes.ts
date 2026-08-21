import { Router, type Request, type Response } from "express";
import ProdutoController from "./controller/ProdutoController.js";

const router = Router();

// Rota de verificação de status da aplicação
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        mensagem: "Aplicação online.",
        timestamp: new Date()
    });
});

// ==================== ROTAS DE PRODUTO ====================

// Listar todos os produtos ativos
router.get("/produtos", ProdutoController.todos);

// Buscar um produto por ID
router.get("/produto/:id", ProdutoController.produto);

// Cadastrar um novo produto
router.post("/produto", ProdutoController.cadastrar);

// Atualizar dados de um produto por ID
router.put("/produto/:id", ProdutoController.atualizar);

// Remover (desativar) um produto por ID
router.delete("/produto/:id", ProdutoController.remover);

// ==================== ROTAS DE CATEGORIA ====================


// ==================== ROTAS DE PRODUTO ====================

export { router };