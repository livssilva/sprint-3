import { Router, type Request, type Response } from "express";
import ProdutoController from "./controller/ProdutoController.js";
import CategoriaController from "./controller/CategoriaController.js";
import MovimentacaoController from "./controller/MovimentacaoController.js";
import UsuarioController from "./controller/UsuarioController.js";
import { autenticarToken } from "./middleware/AuthMiddleware.js";

const router = Router();

// Rota de verificação de status da aplicação
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        mensagem: "Aplicação online.",
        timestamp: new Date()
    });
});

// ==================== ROTAS PÚBLICAS ====================
router.post("/login", UsuarioController.login);
router.post("/usuario", UsuarioController.cadastrar);

// ==================== ROTAS PROTEGIDAS (Exigem Token JWT) ====================
// Usuários
router.get("/usuarios", autenticarToken, UsuarioController.todos);

// ==================== ROTAS DE PRODUTO ====================
router.get("/produtos", ProdutoController.todos);
router.get("/produto/:id", ProdutoController.produto);
router.post("/produto", ProdutoController.cadastrar);
router.put("/produto/:id", ProdutoController.atualizar);
router.delete("/produto/:id", ProdutoController.remover);

// ==================== ROTAS DE CATEGORIA ====================
router.get("/categorias", CategoriaController.todos);
router.get("/categoria/:id", CategoriaController.categoria);
router.post("/categoria", CategoriaController.cadastrar);
router.put("/categoria/:id", CategoriaController.atualizar);
router.delete("/categoria/:id", CategoriaController.remover);

// ==================== ROTAS DE MOVIMENTAÇÃO ====================
router.get("/movimentacao", MovimentacaoController.listar);
router.get("/movimentacao/:id", MovimentacaoController.buscarPorId);
router.post("/cadastrar/movimentacao", MovimentacaoController.cadastrar);
router.put("/movimentacao/:id", MovimentacaoController.atualizar);
router.delete("/movimentacao/:id", MovimentacaoController.remover);

export { router };