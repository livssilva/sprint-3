import { Router, type Request, type Response } from "express";
import ProdutoController from "./controller/ProdutoController.js";
import CategoriaController from "./controller/CategoriaController.js";
import MovimentacaoController from "./controller/MovimentacaoController.js";
import UsuarioController from "./controller/UsuarioController.js";
import AuthController from "./controller/AuthController.js";
import EstoqueController from "./controller/EstoqueController.js";
import { verifyToken } from "./middleware/Auth.js";

const router = Router();

// ==================== ROTA DE STATUS DA API ====================
router.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        mensagem: "TechForge API Online",
        timestamp: new Date()
    });
});

// ==================== ROTAS PÚBLICAS DE AUTENTICAÇÃO ====================
router.post("/login", AuthController.login);
router.post("/auth/login", AuthController.login);
router.post("/usuario", UsuarioController.cadastrar);

// ==================== ROTAS DE VERIFICAÇÃO / USUÁRIOS ====================
router.get("/auth/me", verifyToken, AuthController.verificar);
router.get("/auth/verificar", verifyToken, AuthController.verificar);
router.get("/usuarios", verifyToken, UsuarioController.todos);

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

// ==================== ROTAS DE MOVIMENTAÇÃO (Suporte a Singular e Plural) ====================
router.get("/movimentacao", MovimentacaoController.listar);
router.get("/movimentacoes", MovimentacaoController.listar);
router.get("/movimentacao/:id", MovimentacaoController.buscarPorId);
router.get("/movimentacoes/:id", MovimentacaoController.buscarPorId);
router.post("/cadastrar/movimentacao", MovimentacaoController.cadastrar);
router.post("/movimentacao", MovimentacaoController.cadastrar);
router.post("/movimentacoes", MovimentacaoController.cadastrar);
router.put("/movimentacao/:id", MovimentacaoController.atualizar);
router.put("/movimentacoes/:id", MovimentacaoController.atualizar);
router.delete("/movimentacao/:id", MovimentacaoController.remover);
router.delete("/movimentacoes/:id", MovimentacaoController.remover);

// ==================== ROTAS DE ESTOQUE & RELATÓRIOS (Views SQL) ====================
// Consulta produtos que precisam de reposição (vw_produtos_reposicao)
router.get("/estoque/reposicao", EstoqueController.reposicao);
router.get("/produtos/reposicao", EstoqueController.reposicao);

// Consulta valor financeiro de cada produto (vw_valor_produto_estoque)
router.get("/estoque/valor-produtos", EstoqueController.valorPorProduto);
router.get("/relatorio/valor-produtos", EstoqueController.valorPorProduto);

// Consulta valor financeiro total do estoque (vw_valor_total_estoque)
router.get("/estoque/valor-total", EstoqueController.valorTotal);
router.get("/relatorio/valor-total", EstoqueController.valorTotal);

// Consulta posição atual do estoque
router.get("/estoque/posicao", EstoqueController.posicao);

// Consulta histórico de movimentações com filtros por produto, tipo e período
router.get("/estoque/historico", EstoqueController.historico);

export { router };