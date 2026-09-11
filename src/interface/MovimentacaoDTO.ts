export default interface MovimentacaoDTO {
    id_movimentacao?: number;
    id_produto: number;
    id_movimentacao_origem?: number | null;
    tipo: 'ENTRADA' | 'SAIDA';
    motivo?: 'RECEBIMENTO' | 'VENDA' | 'USO_INTERNO' | 'PERDA' | 'DANIFICADO' | 'CORRECAO';
    quantidade: number;
    preco_unitario_praticado?: number | null;
    valor_total?: number | null;
    data_movimentacao?: string | Date;
    observacao?: string | null;
}