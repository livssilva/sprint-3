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
        this.id_produto = _id_produto;
        this.tipo = _tipo;
        this.quantidade = _quantidade;
        this.observacao = _observacao ?? null;
    }

    public getIdMovimentacao(): number { return this.id_movimentacao; }
    public setIdMovimentacao(value: number): void { this.id_movimentacao = value; }

    public getIdProduto(): number { return this.id_produto; }
    public setIdProduto(value: number): void { this.id_produto = value; }

    public getTipo(): 'ENTRADA' | 'SAIDA' { return this.tipo; }
    public setTipo(value: 'ENTRADA' | 'SAIDA'): void { this.tipo = value; }

    public getQuantidade(): number { return this.quantidade; }
    public setQuantidade(value: number): void { this.quantidade = value; }

    public getObservacao(): string | null { return this.observacao; }
    public setObservacao(value: string | null): void { this.observacao = value; }

    private static toDTO(mov: any): MovimentacaoDTO {
        return {
            id_movimentacao: mov.id_movimentacao,
            id_produto: mov.id_produto,
            tipo: mov.tipo,
            quantidade: mov.quantidade,
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

    static async listarPorProduto(id_produto: number): Promise<MovimentacaoDTO[]> {
        try {
            const querySelect = `SELECT * FROM movimentacao WHERE id_produto = $1 ORDER BY data_movimentacao DESC;`;
            const respostaBD = await database.query(querySelect, [id_produto]);
            return respostaBD.rows.map(Movimentacao.toDTO);
        } catch (error) {
            console.error(`[MovimentacaoModel] Erro ao buscar movimentações do produto ${id_produto}:`, error);
            throw error;
        }
    }

    static async cadastrarMovimentacao(mov: Movimentacao): Promise<boolean> {
        try {
            const queryInsert = `
                INSERT INTO movimentacao (id_produto, tipo, quantidade, observacao)
                VALUES ($1, $2, $3, $4)
                RETURNING id_movimentacao;
            `;

            const valores = [
                mov.getIdProduto(),
                mov.getTipo(),
                mov.getQuantidade(),
                mov.getObservacao()
            ];

            const result = await database.query(queryInsert, valores);
            return result.rows.length > 0;
        } catch (error) {
            console.error(`[MovimentacaoModel] Erro ao registrar movimentação:`, error);
            throw error;
        }
    }
}

export default Movimentacao;