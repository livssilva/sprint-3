import type MovimentacaoDTO from "../interface/MovimentacaoDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Movimentacao {
    private id_movimentacao: number = 0;
    private id_produto: number;
    private id_movimentacao_origem: number | null = null;
    private tipo: 'ENTRADA' | 'SAIDA';
    private motivo: 'RECEBIMENTO' | 'VENDA' | 'USO_INTERNO' | 'PERDA' | 'DANIFICADO' | 'CORRECAO';
    private quantidade: number;
    private preco_unitario_praticado: number | null = null;
    private valor_total: number | null = null;
    private observacao: string;

    constructor(
        _id_produto: number,
        _tipo: 'ENTRADA' | 'SAIDA',
        _quantidade: number,
        _observacao?: string | null,
        _motivo?: string | null,
        _id_movimentacao_origem?: number | null,
        _preco_unitario_praticado?: number | null
    ) {
        this.id_produto = Number(_id_produto);
        this.tipo = _tipo;
        this.quantidade = Number(_quantidade);
        this.observacao = _observacao && String(_observacao).trim().length > 0 
            ? String(_observacao).trim() 
            : `Movimentação de ${_tipo}`;
        
        // Mapeia o motivo de acordo com as regras de negócio
        if (_motivo && ['RECEBIMENTO', 'VENDA', 'USO_INTERNO', 'PERDA', 'DANIFICADO', 'CORRECAO'].includes(_motivo)) {
            this.motivo = _motivo as any;
        } else {
            this.motivo = this.tipo === 'ENTRADA' ? 'RECEBIMENTO' : 'USO_INTERNO';
        }

        this.id_movimentacao_origem = _id_movimentacao_origem ? Number(_id_movimentacao_origem) : null;

        if (this.motivo === 'VENDA' && _preco_unitario_praticado !== undefined && _preco_unitario_praticado !== null) {
            this.preco_unitario_praticado = Number(_preco_unitario_praticado);
            this.valor_total = this.quantidade * this.preco_unitario_praticado;
        } else {
            this.preco_unitario_praticado = null;
            this.valor_total = null;
        }
    }

    public getIdMovimentacao(): number { return this.id_movimentacao; }
    public setIdMovimentacao(value: number): void { this.id_movimentacao = Number(value); }

    public getIdProduto(): number { return this.id_produto; }
    public setIdProduto(value: number): void { this.id_produto = Number(value); }

    public getIdMovimentacaoOrigem(): number | null { return this.id_movimentacao_origem; }
    public setIdMovimentacaoOrigem(value: number | null): void { this.id_movimentacao_origem = value ? Number(value) : null; }

    public getTipo(): 'ENTRADA' | 'SAIDA' { return this.tipo; }
    public setTipo(value: 'ENTRADA' | 'SAIDA'): void { this.tipo = value; }

    public getMotivo(): 'RECEBIMENTO' | 'VENDA' | 'USO_INTERNO' | 'PERDA' | 'DANIFICADO' | 'CORRECAO' { return this.motivo; }
    public setMotivo(value: 'RECEBIMENTO' | 'VENDA' | 'USO_INTERNO' | 'PERDA' | 'DANIFICADO' | 'CORRECAO'): void { this.motivo = value; }

    public getQuantidade(): number { return this.quantidade; }
    public setQuantidade(value: number): void { this.quantidade = Number(value); }

    public getPrecoUnitarioPraticado(): number | null { return this.preco_unitario_praticado; }
    public setPrecoUnitarioPraticado(value: number | null): void { this.preco_unitario_praticado = value !== null ? Number(value) : null; }

    public getValorTotal(): number | null { return this.valor_total; }
    public setValorTotal(value: number | null): void { this.valor_total = value !== null ? Number(value) : null; }

    public getObservacao(): string { return this.observacao; }
    public setObservacao(value: string): void { this.observacao = value; }

    private static toDTO(mov: any): MovimentacaoDTO {
        return {
            id_movimentacao: Number(mov.id_movimentacao ?? mov.id),
            id_produto: Number(mov.id_produto ?? mov.produto_id),
            id_movimentacao_origem: mov.id_movimentacao_origem ? Number(mov.id_movimentacao_origem) : null,
            tipo: mov.tipo,
            motivo: mov.motivo,
            quantidade: Number(mov.quantidade),
            preco_unitario_praticado: mov.preco_unitario_praticado ? parseFloat(mov.preco_unitario_praticado) : null,
            valor_total: mov.valor_total ? parseFloat(mov.valor_total) : null,
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

    /**
     * Cadastra uma nova movimentação. O trigger tg_atualizar_estoque do PostgreSQL
     * atualiza o saldo e impede saldo negativo automaticamente.
     */
    static async cadastrarMovimentacao(mov: Movimentacao): Promise<boolean> {
        try {
            const queryInsert = `
                INSERT INTO movimentacao (
                    id_produto, 
                    id_movimentacao_origem, 
                    tipo, 
                    motivo, 
                    quantidade, 
                    preco_unitario_praticado, 
                    valor_total, 
                    observacao
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id_movimentacao;
            `;

            const valores = [
                mov.getIdProduto(),
                mov.getIdMovimentacaoOrigem(),
                mov.getTipo(),
                mov.getMotivo(),
                mov.getQuantidade(),
                mov.getPrecoUnitarioPraticado(),
                mov.getValorTotal(),
                mov.getObservacao()
            ];

            const result = await database.query(queryInsert, valores);
            return result.rows.length > 0;
        } catch (error) {
            console.error(`[MovimentacaoModel] Erro no cadastro de movimentação:`, error);
            throw error;
        }
    }

    /**
     * Atualização de movimentação:
     * Conforme a regra de negócio e trigger de proteção do banco, movimentações
     * não podem ser alteradas diretamente. Uma retificação (CORREÇÃO) é registrada
     * estornando o impacto anterior e inserindo o novo registro retificado.
     */
    static async atualizarMovimentacao(id_movimentacao: number, movAtualizada: Partial<MovimentacaoDTO>): Promise<boolean> {
        const client = await database.connect();
        try {
            await client.query('BEGIN');

            const resMovAntiga = await client.query(
                `SELECT * FROM movimentacao WHERE id_movimentacao = $1 FOR UPDATE;`,
                [id_movimentacao]
            );

            if (resMovAntiga.rows.length === 0) {
                await client.query('ROLLBACK');
                return false;
            }

            const movAntiga = resMovAntiga.rows[0];
            const idProduto = movAtualizada.id_produto ? Number(movAtualizada.id_produto) : Number(movAntiga.id_produto);
            const novoTipo = (movAtualizada.tipo ?? movAntiga.tipo) as 'ENTRADA' | 'SAIDA';
            const novaQtd = movAtualizada.quantidade ? Number(movAtualizada.quantidade) : Number(movAntiga.quantidade);
            const novaObs = movAtualizada.observacao !== undefined && String(movAtualizada.observacao).trim().length > 0 
                ? String(movAtualizada.observacao).trim() 
                : `Retificação da movimentação #${id_movimentacao}`;

            // 1. Estorna a movimentação original com uma CORREÇÃO
            const tipoEstorno = movAntiga.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA';
            const obsEstorno = `Ajuste: estorno para retificação da movimentação #${id_movimentacao}`;

            await client.query(`
                INSERT INTO movimentacao (
                    id_produto,
                    id_movimentacao_origem,
                    tipo,
                    motivo,
                    quantidade,
                    observacao
                )
                VALUES ($1, $2, $3, 'CORRECAO', $4, $5);
            `, [
                movAntiga.id_produto,
                id_movimentacao,
                tipoEstorno,
                movAntiga.quantidade,
                obsEstorno
            ]);

            // 2. Insere a nova movimentação corrigida
            await client.query(`
                INSERT INTO movimentacao (
                    id_produto,
                    id_movimentacao_origem,
                    tipo,
                    motivo,
                    quantidade,
                    observacao
                )
                VALUES ($1, $2, $3, 'CORRECAO', $4, $5);
            `, [
                idProduto,
                id_movimentacao,
                novoTipo,
                novaQtd,
                novaObs
            ]);

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`[MovimentacaoModel] Erro ao atualizar/corrigir movimentação ${id_movimentacao}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Remoção de movimentação:
     * Conforme a regra de negócio e trigger de proteção do banco, movimentações
     * não podem ser deletadas diretamente. Um estorno de CORREÇÃO é registrado
     * revertendo o estoque e mantendo o histórico de auditoria intacto.
     */
    static async removerMovimentacao(id_movimentacao: number): Promise<boolean> {
        try {
            const resMov = await database.query(
                `SELECT * FROM movimentacao WHERE id_movimentacao = $1`,
                [id_movimentacao]
            );

            if (resMov.rows.length === 0) {
                return false;
            }

            const mov = resMov.rows[0];
            const idProduto = Number(mov.id_produto ?? mov.produto_id);
            const tipoEstorno = mov.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA';
            const quantidade = Number(mov.quantidade);
            const obsEstorno = `Correção/Cancelamento da movimentação #${id_movimentacao}`;

            const queryInsertCorrecao = `
                INSERT INTO movimentacao (
                    id_produto,
                    id_movimentacao_origem,
                    tipo,
                    motivo,
                    quantidade,
                    observacao
                )
                VALUES ($1, $2, $3, 'CORRECAO', $4, $5)
                RETURNING id_movimentacao;
            `;

            const resCorrecao = await database.query(queryInsertCorrecao, [
                idProduto,
                id_movimentacao,
                tipoEstorno,
                quantidade,
                obsEstorno
            ]);

            return resCorrecao.rows.length > 0;
        } catch (error) {
            console.error(`[MovimentacaoModel] Erro ao registrar estorno da movimentação ${id_movimentacao}:`, error);
            throw error;
        }
    }
}

export default Movimentacao;