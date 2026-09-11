import type { Request, Response } from "express";
import Estoque from "../model/Estoque.js";

class EstoqueController {

    /**
     * Endpoint GET /estoque/reposicao ou GET /produtos/reposicao
     * Retorna a lista de produtos cuja quantidade disponível <= quantidade mínima
     */
    static async reposicao(req: Request, res: Response): Promise<void> {
        try {
            const produtosReposicao = await Estoque.listarProdutosReposicao();

            if (produtosReposicao.length === 0) {
                res.status(200).json({
                    mensagem: "Nenhum produto necessita de reposição no momento.",
                    produtos: []
                });
                return;
            }

            res.status(200).json(produtosReposicao);
        } catch (error) {
            console.error(`[EstoqueController] Erro ao buscar produtos para reposição:`, error);
            res.status(500).json({ mensagem: "Erro interno ao consultar produtos para reposição." });
        }
    }

    /**
     * Endpoint GET /estoque/valor-produtos
     * Retorna o valor financeiro armazenado de cada item em estoque
     */
    static async valorPorProduto(req: Request, res: Response): Promise<void> {
        try {
            const itensValor = await Estoque.listarValorProdutosEstoque();
            res.status(200).json(itensValor);
        } catch (error) {
            console.error(`[EstoqueController] Erro ao consultar valor por produto:`, error);
            res.status(500).json({ mensagem: "Erro interno ao calcular valor por produto." });
        }
    }

    /**
     * Endpoint GET /estoque/valor-total
     * Retorna a soma financeira de todo o estoque armazenado
     */
    static async valorTotal(req: Request, res: Response): Promise<void> {
        try {
            const valorTotal = await Estoque.consultarValorTotalEstoque();
            res.status(200).json(valorTotal);
        } catch (error) {
            console.error(`[EstoqueController] Erro ao consultar valor total do estoque:`, error);
            res.status(500).json({ mensagem: "Erro interno ao calcular valor total do estoque." });
        }
    }

    /**
     * Endpoint GET /estoque/posicao
     * Retorna a posição atual do estoque de todos os produtos
     */
    static async posicao(req: Request, res: Response): Promise<void> {
        try {
            const posicaoAtual = await Estoque.consultarPosicaoAtual();
            res.status(200).json(posicaoAtual);
        } catch (error) {
            console.error(`[EstoqueController] Erro ao consultar posição do estoque:`, error);
            res.status(500).json({ mensagem: "Erro interno ao consultar posição do estoque." });
        }
    }

    /**
     * Endpoint GET /estoque/historico
     * Retorna o histórico de movimentações com filtros opcionais via Query Params:
     * - id_produto
     * - tipo (ENTRADA | SAIDA)
     * - data_inicio (YYYY-MM-DD)
     * - data_fim (YYYY-MM-DD)
     */
    static async historico(req: Request, res: Response): Promise<void> {
        try {
            const { id_produto, tipo, data_inicio, data_fim } = req.query;

            const filtros: {
                id_produto?: number;
                tipo?: string;
                dataInicio?: string;
                dataFim?: string;
            } = {};

            if (id_produto) {
                const idProd = Number(id_produto);
                if (!isNaN(idProd) && idProd > 0) {
                    filtros.id_produto = idProd;
                }
            }

            if (tipo) {
                const tipoFormatado = String(tipo).toUpperCase();
                if (tipoFormatado === "ENTRADA" || tipoFormatado === "SAIDA") {
                    filtros.tipo = tipoFormatado;
                }
            }

            if (data_inicio) {
                filtros.dataInicio = String(data_inicio);
            }

            if (data_fim) {
                filtros.dataFim = String(data_fim);
            }

            const historico = await Estoque.consultarHistorico(filtros);
            res.status(200).json(historico);
        } catch (error) {
            console.error(`[EstoqueController] Erro ao consultar histórico de estoque:`, error);
            res.status(500).json({ mensagem: "Erro interno ao consultar histórico de estoque." });
        }
    }
}

export default EstoqueController;
