export default interface UsuarioDTO {
    id_usuario?: number;
    nome: string;
    email: string;
    senha?: string;
    role?: string;
}

export interface LoginDTO {
    email: string;
    senha: string;
}