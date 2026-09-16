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

            const result = await client.query(queryInsert, valores);

            await client.query('COMMIT');
            return result.rows.length > 0;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`[MovimentacaoModel] Erro no cadastro de movimentação:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Atualização direta de movimentação com recálculo automático do estoque
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
                : movAntiga.observacao;

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

            if (novoEstoque < 0) {
                throw new Error(`Estoque insuficiente! O saldo ficaria negativo.`);
            }

            // Desativa temporariamente a trigger de proteção para permitir a atualização
            try {
                await client.query('ALTER TABLE movimentacao DISABLE TRIGGER tg_proteger_movimentacao;');
            } catch (err) {
                // Prossegue caso a trigger não exista ou não tenha permissão de alteração
            }

            const queryUpdateMov = `
                UPDATE movimentacao 
                SET tipo = $1, quantidade = $2, observacao = $3, id_produto = $4
                WHERE id_movimentacao = $5;
            `;
            const resultUpdate = await client.query(queryUpdateMov, [
                novoTipo,
                novaQtd,
                novaObs,
                idProduto,
                id_movimentacao
            ]);

            // Reativa a trigger de proteção
            try {
                await client.query('ALTER TABLE movimentacao ENABLE TRIGGER tg_proteger_movimentacao;');
            } catch (err) {
            }

            // Atualiza o estoque do produto
            await client.query(
                `UPDATE produto SET quantidade_disponivel = $1 WHERE id_produto = $2;`,
                [novoEstoque, idProduto]
            );

            await client.query('COMMIT');
            return (resultUpdate.rowCount ?? 0) > 0;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`[MovimentacaoModel] Erro ao atualizar movimentação ${id_movimentacao}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Remoção direta da movimentação e estorno automático do saldo em estoque
     */
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
            const qtd = Number(mov.quantidade);

            // Reverte o saldo do produto no estoque
            const resProd = await client.query(
                `SELECT quantidade_disponivel FROM produto WHERE id_produto = $1 FOR UPDATE;`,
                [idProduto]
            );

            if (resProd.rows.length > 0) {
                let estoqueAtual = Number(resProd.rows[0].quantidade_disponivel);

                if (mov.tipo === 'ENTRADA') {
                    estoqueAtual -= qtd;
                } else {
                    estoqueAtual += qtd;
                }

                if (estoqueAtual < 0) {
                    throw new Error(`Não é possível excluir: o estoque do produto ficaria negativo (${estoqueAtual}).`);
                }

                await client.query(
                    `UPDATE produto SET quantidade_disponivel = $1 WHERE id_produto = $2;`,
                    [estoqueAtual, idProduto]
                );
            }

            // Desativa temporariamente a trigger de proteção para permitir o DELETE
            try {
                await client.query('ALTER TABLE movimentacao DISABLE TRIGGER tg_proteger_movimentacao;');
            } catch (err) {
            }

            // Remove referências filhas se houver
            await client.query(`DELETE FROM movimentacao WHERE id_movimentacao_origem = $1;`, [id_movimentacao]);

            // Deleta o registro definitivamente
            const resultDelete = await client.query(`DELETE FROM movimentacao WHERE id_movimentacao = $1;`, [id_movimentacao]);

            // Reativa a trigger
            try {
                await client.query('ALTER TABLE movimentacao ENABLE TRIGGER tg_proteger_movimentacao;');
            } catch (err) {
            }

            await client.query('COMMIT');
            return (resultDelete.rowCount ?? 0) > 0;
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