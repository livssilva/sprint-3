import Produto from "../model/Produto.js";
import { type Request, type Response } from "express";
import type ProdutoDTO from "../interface/ProdutoDTO.js";

class ProdutoController extends Produto {

    /**
     * Lista todos os produtos ativos.
     */
    static async todos(req: Request, res: Response) {
        try {
            const listaDeProdutos = await Produto.listarProdutos();

            if (listaDeProdutos.length === 0) {
                res.status(204).send();
                return;
            }

            res.status(200).json(listaDeProdutos);
        } catch (error) {
            console.error(`[ProdutoController] Erro ao listar produtos:`, error);
            res.status(500).json({ mensagem: "Erro interno ao recuperar a lista de produtos." });
        }
    }

    /**
     * Busca um produto por ID.
     */
    static async produto(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const produto = await Produto.listarProduto(idProduto);
            res.status(200).json(produto);
        } catch (error: any) {
            console.error(`[ProdutoController] Erro ao buscar produto (id: ${req.params.id}):`, error);

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao recuperar o produto." });
        }
    }

    /**
     * Cadastra um novo produto.
     */
    static async cadastrar(req: Request, res: Response) {
        try {
            const dadosRecebidos: ProdutoDTO = req.body;

            if (
                !dadosRecebidos.id_categoria ||
                !dadosRecebidos.codigo ||
                !dadosRecebidos.nome ||
                dadosRecebidos.preco_unitario === undefined
            ) {
                res.status(400).json({
                    mensagem: "Campos obrigatórios ausentes: id_categoria, codigo, nome e preco_unitario."
                });
                return;
            }

            const novoProduto = new Produto(
                dadosRecebidos.id_categoria,
                dadosRecebidos.codigo,
                dadosRecebidos.nome,
                dadosRecebidos.preco_unitario,
                dadosRecebidos.descricao,
                0, // Quantidade disponível inicial é gerada no banco/trigger
                dadosRecebidos.quantidade_minima ?? 0
            );

            const result = await Produto.cadastrarProduto(novoProduto);

            if (result) {
                res.status(201).json({ mensagem: "Produto cadastrado com sucesso." });
            } else {
                res.status(400).json({ mensagem: "Não foi possível cadastrar o produto." });
            }
        } catch (error) {
            console.error(`[ProdutoController] Erro ao cadastrar produto:`, error);
            res.status(500).json({ mensagem: "Erro interno ao cadastrar o produto." });
        }
    }

    /**
     * Desativa (remove logicamente) um produto por ID.
     */
    static async remover(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const result = await Produto.removerProduto(idProduto);

            if (result) {
                res.status(200).json({ mensagem: "Produto removido com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Produto não encontrado ou já está inativo." });
            }
        } catch (error: any) {
            console.error(`[ProdutoController] Erro ao remover produto (id: ${req.params.id}):`, error);

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao remover o produto." });
        }
    }

    /**
     * Atualiza um produto por ID.
     */
    static async atualizar(req: Request, res: Response) {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const dadosRecebidos: ProdutoDTO = req.body;

            if (
                !dadosRecebidos.id_categoria ||
                !dadosRecebidos.codigo ||
                !dadosRecebidos.nome ||
                dadosRecebidos.preco_unitario === undefined
            ) {
                res.status(400).json({
                    mensagem: "Campos obrigatórios ausentes: id_categoria, codigo, nome e preco_unitario."
                });
                return;
            }

            const produto = new Produto(
                dadosRecebidos.id_categoria,
                dadosRecebidos.codigo,
                dadosRecebidos.nome,
                dadosRecebidos.preco_unitario,
                dadosRecebidos.descricao,
                dadosRecebidos.quantidade_disponivel ?? 0,
                dadosRecebidos.quantidade_minima ?? 0
            );

            produto.setIdProduto(idProduto);

            const result = await Produto.atualizarProduto(produto);

            if (result) {
                res.status(200).json({ mensagem: "Produto atualizado com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Produto não encontrado ou já está inativo." });
            }
        } catch (error: any) {
            console.error(`[ProdutoController] Erro ao atualizar produto (id: ${req.params.id}):`, error);

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao atualizar o produto." });
        }
    }
}

export default ProdutoController;