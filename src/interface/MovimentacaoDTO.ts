export default interface MovimentacaoDTO {
    id_movimentacao?: number;
    id_produto: number;
    tipo: 'ENTRADA' | 'SAIDA';
    quantidade: number;
    data_movimentacao?: Date | string;
    observacao?: string | null;
}