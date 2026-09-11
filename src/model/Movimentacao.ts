import type MovimentacaoDTO from "../interface/MovimentacaoDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Movimentacao {
    private id_movimentacao: number = 0;
    private id_produto: number;
    private tipo: 'ENTRADA' | 'SAIDA';
    private quantidade: number;
    private observacao: string | null;

    constructor(
        _id_produto: number,
        _tipo: 'ENTRADA' | 'SAIDA',
        _quantidade: number,
        _observacao?: string | null
    ) {
        this.id_produto = Number(_id_produto);
        this.tipo = _tipo;
        this.quantidade = Number(_quantidade);
        this.observacao = _observacao ?? null;
    }

    public getIdMovimentacao(): number { return this.id_movimentacao; }
    public setIdMovimentacao(value: number): void { this.id_movimentacao = Number(value); }

    public getIdProduto(): number { return this.id_produto; }
    public setIdProduto(value: number): void { this.id_produto = Number(value); }

    public getTipo(): 'ENTRADA' | 'SAIDA' { return this.tipo; }
    public setTipo(value: 'ENTRADA' | 'SAIDA'): void { this.tipo = value; }

    public getQuantidade(): number { return this.quantidade; }
    public setQuantidade(value: number): void { this.quantidade = Number(value); }

    public getObservacao(): string | null { return this.observacao; }
    public setObservacao(value: string | null): void { this.observacao = value; }

    private static toDTO(mov: any): MovimentacaoDTO {
        return {
            id_movimentacao: Number(mov.id_movimentacao ?? mov.id),
            id_produto: Number(mov.id_produto ?? mov.produto_id),
            tipo: mov.tipo,
            quantidade: Number(mov.quantidade),
            data_movimentacao: mov.data_movimentacao,
            observacao: mov.observacao
        };
    }

    static async listarMovimentacoes(): Promise<MovimentacaoDTO[]> {
        try {
            const querySelect = `SELECT * FROM movimentacao ORDER BY data_movimentacao DESC;`;
            const respostaBD = await database.query(querySelect);
            return respostaBD.rows.map(Movimentacao.toDTO);
        } catch (error) {
            console.error(`[MovimentacaoModel] Erro ao listar movimentações:`, error);
            throw error;
        }
    }

    static async buscarPorId(id_movimentacao: number): Promise<MovimentacaoDTO | null> {
        try {
            const querySelect = `SELECT * FROM movimentacao WHERE id_movimentacao = $1;`;
            const respostaBD = await database.query(querySelect, [id_movimentacao]);
            if (respostaBD.rows.length === 0) return null;
            return Movimentacao.toDTO(respostaBD.rows[0]);
        } catch (error) {
            console.error(`[MovimentacaoModel] Erro ao buscar movimentação ${id_movimentacao}:`, error);
            throw error;
        }
    }

    static async cadastrarMovimentacao(mov: Movimentacao): Promise<boolean> {
        const client = await database.connect();
        try {
            await client.query('BEGIN');

            const resProd = await client.query(
                `SELECT quantidade_disponivel FROM produto WHERE id_produto = $1 FOR UPDATE;`, 
                [mov.getIdProduto()]
            );

            if (resProd.rows.length === 0) {
                throw new Error("Produto informado não existe.");
            }

            const estoqueAtual = Number(resProd.rows[0].quantidade_disponivel);

            if (mov.getTipo() === 'SAIDA' && estoqueAtual < mov.getQuantidade()) {
                throw new Error(`Estoque insuficiente! Estoque atual: ${estoqueAtual}`);
            }

            const queryInsert = `
                INSERT INTO movimentacao (id_produto, tipo, quantidade, observacao)
                VALUES ($1, $2, $3, $4)
                RETURNING id_movimentacao;
            `;
            await client.query(queryInsert, [
                mov.getIdProduto(),
                mov.getTipo(),
                mov.getQuantidade(),
                mov.getObservacao()
            ]);

            const novoEstoque = mov.getTipo() === 'ENTRADA' 
                ? estoqueAtual + mov.getQuantidade() 
                : estoqueAtual - mov.getQuantidade();

            await client.query(
                `UPDATE produto SET quantidade_disponivel = $1 WHERE id_produto = $2;`,
                [novoEstoque, mov.getIdProduto()]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`[MovimentacaoModel] Erro no cadastro com transação:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async atualizarMovimentacao(id_movimentacao: number, movAtualizada: Partial<MovimentacaoDTO>): Promise<boolean> {
        const client = await database.connect();
        try {
            await client.query('BEGIN');

            const resMovAntiga = await client.query(
                `SELECT * FROM movimentacao WHERE id_movimentacao = $1 FOR UPDATE;`,
                [id_movimentacao]
            );

            if (resMovAntiga.rows.length === 0) {
                throw new Error("Movimentação não encontrada.");
            }

            const movAntiga = resMovAntiga.rows[0];
            const idProduto = movAtualizada.id_produto ? Number(movAtualizada.id_produto) : Number(movAntiga.id_produto);
            const novoTipo = movAtualizada.tipo ?? movAntiga.tipo;
            const novaQtd = movAtualizada.quantidade ? Number(movAtualizada.quantidade) : Number(movAntiga.quantidade);
            const novaObs = movAtualizada.observacao !== undefined ? movAtualizada.observacao : movAntiga.observacao;

            const resProd = await client.query(
                `SELECT quantidade_disponivel FROM produto WHERE id_produto = $1 FOR UPDATE;`,
                [idProduto]
            );

            if (resProd.rows.length === 0) {
                throw new Error("Produto vinculado não existe no banco de dados.");
            }

            let estoqueAtual = Number(resProd.rows[0].quantidade_disponivel);

            // Reverte o efeito da movimentação antiga no estoque
            if (movAntiga.tipo === 'ENTRADA') {
                estoqueAtual -= Number(movAntiga.quantidade);
            } else {
                estoqueAtual += Number(movAntiga.quantidade);
            }

            // Valida o estoque após o estorno
            if (novoTipo === 'SAIDA' && estoqueAtual < novaQtd) {
                throw new Error(`Estoque insuficiente! Saldo disponível pós-reversão: ${estoqueAtual}`);
            }

            const novoEstoque = novoTipo === 'ENTRADA'
                ? estoqueAtual + novaQtd
                : estoqueAtual - novaQtd;

            const queryUpdateMov = `
                UPDATE movimentacao 
                SET tipo = $1, quantidade = $2, observacao = $3, id_produto = $4
                WHERE id_movimentacao = $5;
            `;
            await client.query(queryUpdateMov, [
                novoTipo,
                novaQtd,
                novaObs,
                idProduto,
                id_movimentacao
            ]);

            await client.query(
                `UPDATE produto SET quantidade_disponivel = $1 WHERE id_produto = $2;`,
                [novoEstoque, idProduto]
            );

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`[MovimentacaoModel] Erro ao atualizar movimentação ${id_movimentacao}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    static async removerMovimentacao(id_movimentacao: number): Promise<boolean> {
        const client = await database.connect();
        try {
            await client.query('BEGIN');

            const resMov = await client.query(
                `SELECT * FROM movimentacao WHERE id_movimentacao = $1 FOR UPDATE;`,
                [id_movimentacao]
            );

            if (resMov.rows.length === 0) {
                await client.query('ROLLBACK');
                return false;
            }

            const mov = resMov.rows[0];
            const idProduto = Number(mov.id_produto ?? mov.produto_id);

            const resProd = await client.query(
                `SELECT quantidade_disponivel FROM produto WHERE id_produto = $1 FOR UPDATE;`,
                [idProduto]
            );

            if (resProd.rows.length > 0) {
                let estoqueAtual = Number(resProd.rows[0].quantidade_disponivel);

                if (mov.tipo === 'ENTRADA') {
                    estoqueAtual -= Number(mov.quantidade);
                } else {
                    estoqueAtual += Number(mov.quantidade);
                }

                if (estoqueAtual < 0) {
                    throw new Error("Não é possível remover: o estoque do produto ficaria negativo.");
                }

                await client.query(
                    `UPDATE produto SET quantidade_disponivel = $1 WHERE id_produto = $2;`,
                    [estoqueAtual, idProduto]
                );
            }

            await client.query(`DELETE FROM movimentacao WHERE id_movimentacao = $1;`, [id_movimentacao]);

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`[MovimentacaoModel] Erro ao remover movimentação ${id_movimentacao}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }
}

export default Movimentacao;