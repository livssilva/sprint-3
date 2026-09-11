import Produto from "../model/Produto.js";
import { type Request, type Response } from "express";
import type ProdutoDTO from "../interface/ProdutoDTO.js";

class ProdutoController extends Produto {

    static async todos(req: Request, res: Response): Promise<void> {
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

    static async produto(req: Request, res: Response): Promise<void> {
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

    static async cadastrar(req: Request, res: Response): Promise<void> {
        try {
            const dadosRecebidos: ProdutoDTO = req.body;

            // Validação de presença
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

            const preco = Number(dadosRecebidos.preco_unitario);
            const idCategoria = Number(dadosRecebidos.id_categoria);
            const qtdMinima = Number(dadosRecebidos.quantidade_minima ?? 0);

            // Validação de tipos e regras de domínio
            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({ mensagem: "ID de categoria inválido. Deve ser um número positivo." });
                return;
            }

            if (isNaN(preco) || preco < 0) {
                res.status(400).json({ mensagem: "Preço unitário inválido. Não pode ser negativo." });
                return;
            }

            if (isNaN(qtdMinima) || qtdMinima < 0) {
                res.status(400).json({ mensagem: "Quantidade mínima inválida. Não pode ser negativa." });
                return;
            }

            const codigoLimpo = String(dadosRecebidos.codigo).trim().toUpperCase();
            const nomeLimpo = String(dadosRecebidos.nome).trim();

            if (codigoLimpo.length < 2) {
                res.status(400).json({ mensagem: "O código do produto deve conter pelo menos 2 caracteres." });
                return;
            }

            if (nomeLimpo.length < 2) {
                res.status(400).json({ mensagem: "O nome do produto deve conter pelo menos 2 caracteres." });
                return;
            }

            const novoProduto = new Produto(
                idCategoria,
                codigoLimpo,
                nomeLimpo,
                preco,
                dadosRecebidos.descricao ? String(dadosRecebidos.descricao).trim() : null,
                0,
                qtdMinima
            );

            const result = await Produto.cadastrarProduto(novoProduto);

            if (result) {
                res.status(201).json({ mensagem: "Produto cadastrado com sucesso." });
            } else {
                res.status(400).json({ mensagem: "Não foi possível cadastrar o produto." });
            }
        } catch (error: any) {
            console.error(`[ProdutoController] Erro ao cadastrar produto:`, error);

            if (error.code === '23505') {
                res.status(409).json({ mensagem: "Já existe um produto com este código cadastrado." });
                return;
            }

            if (error.code === '23503') {
                res.status(400).json({ mensagem: "A categoria informada não existe no banco de dados." });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao cadastrar o produto." });
        }
    }

    static async remover(req: Request, res: Response): Promise<void> {
        try {
            const idProduto = parseInt(req.params.id as string);

            if (isNaN(idProduto) || idProduto <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const result = await Produto.removerProduto(idProduto);

            if (result) {
                res.status(200).json({ mensagem: "Produto desativado/removido com sucesso." });
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

    static async atualizar(req: Request, res: Response): Promise<void> {
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

            const preco = Number(dadosRecebidos.preco_unitario);
            const idCategoria = Number(dadosRecebidos.id_categoria);
            const qtdMinima = Number(dadosRecebidos.quantidade_minima ?? 0);

            if (isNaN(idCategoria) || idCategoria <= 0) {
                res.status(400).json({ mensagem: "ID de categoria inválido. Deve ser um número positivo." });
                return;
            }

            if (isNaN(preco) || preco < 0) {
                res.status(400).json({ mensagem: "Preço unitário inválido. Não pode ser negativo." });
                return;
            }

            if (isNaN(qtdMinima) || qtdMinima < 0) {
                res.status(400).json({ mensagem: "Quantidade mínima inválida. Não pode ser negativa." });
                return;
            }

            const codigoLimpo = String(dadosRecebidos.codigo).trim().toUpperCase();
            const nomeLimpo = String(dadosRecebidos.nome).trim();

            const produto = new Produto(
                idCategoria,
                codigoLimpo,
                nomeLimpo,
                preco,
                dadosRecebidos.descricao ? String(dadosRecebidos.descricao).trim() : null,
                Number(dadosRecebidos.quantidade_disponivel ?? 0),
                qtdMinima,
                idProduto
            );

            const result = await Produto.atualizarProduto(produto);

            if (result) {
                res.status(200).json({ mensagem: "Produto atualizado com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Produto não encontrado ou já está inativo." });
            }
        } catch (error: any) {
            console.error(`[ProdutoController] Erro ao atualizar produto (id: ${req.params.id}):`, error);

            if (error.code === '23505') {
                res.status(409).json({ mensagem: "Este código de produto já está em uso por outro registro." });
                return;
            }

            if (error.code === '23503') {
                res.status(400).json({ mensagem: "A categoria informada não existe no banco de dados." });
                return;
            }

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao atualizar o produto." });
        }
    }
}

export default ProdutoController;