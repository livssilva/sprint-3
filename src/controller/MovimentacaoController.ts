import { type Request, type Response } from "express";
import Movimentacao from "../model/Movimentacao.js";

class MovimentacaoController {

    // 1. LISTAR TODAS AS MOVIMENTAÇÕES
    static async listar(req: Request, res: Response): Promise<void> {
        try {
            const movimentacoes = await Movimentacao.listarMovimentacoes();
            if (movimentacoes.length === 0) {
                res.status(204).send();
                return;
            }
            res.status(200).json(movimentacoes);
        } catch (error: any) {
            console.error("[MovimentacaoController] Erro ao listar:", error);
            res.status(500).json({ mensagem: "Erro interno ao listar movimentações." });
        }
    }

    // 2. BUSCAR MOVIMENTAÇÃO POR ID
    static async buscarPorId(req: Request, res: Response): Promise<void> {
        try {
            const idMovimentacao = Number(req.params.id);
            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({ mensagem: "ID de movimentação inválido." });
                return;
            }

            const movimentacao = await Movimentacao.buscarPorId(idMovimentacao);
            if (!movimentacao) {
                res.status(404).json({ mensagem: "Movimentação não encontrada." });
                return;
            }

            res.status(200).json(movimentacao);
        } catch (error: any) {
            console.error("[MovimentacaoController] Erro ao buscar por ID:", error);
            res.status(500).json({ mensagem: "Erro interno ao buscar movimentação." });
        }
    }

    // 3. CADASTRAR NOVA MOVIMENTAÇÃO
    static async cadastrar(req: Request, res: Response): Promise<void> {
        try {
            const { id_produto, tipo, quantidade, observacao } = req.body;

            const idProduto = Number(id_produto);
            const qtd = Number(quantidade);

            if (!idProduto || isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "Informe um ID de produto válido." });
                return;
            }

            if (!tipo || (tipo !== 'ENTRADA' && tipo !== 'SAIDA')) {
                res.status(400).json({ mensagem: "O tipo deve ser 'ENTRADA' ou 'SAIDA'." });
                return;
            }

            if (!qtd || isNaN(qtd) || qtd <= 0) {
                res.status(400).json({ mensagem: "A quantidade deve ser um número maior que zero." });
                return;
            }

            const novaMovimentacao = new Movimentacao(
                idProduto,
                tipo,
                qtd,
                observacao ?? null
            );

            await Movimentacao.cadastrarMovimentacao(novaMovimentacao);
            res.status(201).json({ mensagem: "Movimentação cadastrada com sucesso!" });

        } catch (error: any) {
            const msg = error.message || "";
            if (
                msg.includes("Estoque insuficiente") ||
                msg.includes("não existe")
            ) {
                res.status(422).json({ mensagem: msg });
                return;
            }
            console.error("[MovimentacaoController] Erro ao cadastrar:", error);
            res.status(500).json({ mensagem: "Erro interno ao cadastrar movimentação." });
        }
    }

    // 4. ATUALIZAR MOVIMENTAÇÃO EXISTENTE
    static async atualizar(req: Request, res: Response): Promise<void> {
        try {
            const idMovimentacao = Number(req.params.id);
            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({ mensagem: "ID de movimentação inválido." });
                return;
            }

            const dadosAtualizados = req.body;

            await Movimentacao.atualizarMovimentacao(idMovimentacao, dadosAtualizados);
            res.status(200).json({ mensagem: "Movimentação e estoque atualizados com sucesso!" });

        } catch (error: any) {
            const msg = error.message || "";
            if (
                msg.includes("Estoque insuficiente") ||
                msg.includes("não encontrada") ||
                msg.includes("não existe")
            ) {
                res.status(422).json({ mensagem: msg });
                return;
            }
            console.error("[MovimentacaoController] Erro ao atualizar:", error);
            res.status(500).json({ mensagem: "Erro interno ao atualizar movimentação." });
        }
    }

    // 5. REMOVER MOVIMENTAÇÃO
    static async remover(req: Request, res: Response): Promise<void> {
        try {
            const idMovimentacao = Number(req.params.id);
            if (isNaN(idMovimentacao) || idMovimentacao <= 0) {
                res.status(400).json({ mensagem: "ID de movimentação inválido." });
                return;
            }

            const removido = await Movimentacao.removerMovimentacao(idMovimentacao);
            if (!removido) {
                res.status(404).json({ mensagem: "Movimentação não encontrada." });
                return;
            }

            res.status(200).json({ mensagem: "Movimentação removida e estoque estornado com sucesso!" });

        } catch (error: any) {
            const msg = error.message || "";
            if (msg.includes("estoque do produto ficaria negativo")) {
                res.status(422).json({ mensagem: msg });
                return;
            }
            console.error("[MovimentacaoController] Erro ao remover:", error);
            res.status(500).json({ mensagem: "Erro interno ao remover movimentação." });
        }
    }
}

export default MovimentacaoController;