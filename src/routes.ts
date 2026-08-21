import { Router, type Request, type Response } from "express";
import ProdutoController from "./controller/ProdutoController.js";
import CategoriaController from "./controller/CategoriaController.js";0
import MovimentacaoController from "./controller/MovimentacaoController.js";

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
router.get("/categorias", CategoriaController.todos);
router.get("/categoria/:id", CategoriaController.categoria);
router.post("/categoria", CategoriaController.cadastrar);
router.put("/categoria/:id", CategoriaController.atualizar);
router.delete("/categoria/:id", CategoriaController.remover);

// ==================== ROTAS DE MOVIMENTAÇÃO ====================
router.get("/movimentacoes", MovimentacaoController.todos);
router.get("/movimentacoes/produto/:idProduto", MovimentacaoController.porProduto);
router.post("/movimentacao", MovimentacaoController.cadastrar);

export { router };