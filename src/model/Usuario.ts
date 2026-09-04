import type UsuarioDTO from "../interface/UsuarioDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";
import bcrypt from "bcryptjs";

const database = new DatabaseModel().pool;

class Usuario {
    private id_usuario: number = 0;
    private nome: string;
    private email: string;
    private senha: string = '';
    private role: string = 'admin';

    constructor(
        _nome: string,
        _email: string,
        _senha?: string,
        _role?: string
    ) {
        this.nome = _nome;
        this.email = _email;
        this.senha = _senha ?? this.nome;
        this.role = _role ?? 'admin';
    }

    public getIdUsuario(): number { return this.id_usuario; }
    public setIdUsuario(id_usuario: number): void { this.id_usuario = id_usuario; }

    public getNome(): string { return this.nome; }
    public setNome(nome: string): void { this.nome = nome; }

    public getEmail(): string { return this.email; }
    public setEmail(email: string): void { this.email = email; }

    public getSenha(): string { return this.senha; }
    public setSenha(senha: string): void { this.senha = senha; }

    public getRole(): string { return this.role; }
    public setRole(role: string): void { this.role = role; }

    private static toDTO(usuario: any): UsuarioDTO {
        return {
            id_usuario: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role
        };
    }

    static async listarUsuarios(): Promise<UsuarioDTO[]> {
        try {
            const query = `SELECT id_usuario, nome, email, role FROM usuario;`;
            const respostaBD = await database.query(query);

            return respostaBD.rows.map(Usuario.toDTO);
        } catch (error) {
            console.error(`[UsuarioModel] Erro ao listar usuários. ${error}`);
            throw error;
        }
    }

    /**
     * Busca usuário por e-mail trazendo a senha criptografada para o Login
     */
    static async buscarPorEmail(email: string): Promise<Usuario | null> {
        try {
            const query = `SELECT * FROM usuario WHERE email = $1;`;
            const respostaBD = await database.query(query, [email.toLowerCase()]);

            if (respostaBD.rows.length === 0) return null;

            const row = respostaBD.rows[0];
            const usuario = new Usuario(row.nome, row.email, row.senha, row.role);
            usuario.setIdUsuario(row.id_usuario);
            return usuario;
        } catch (error) {
            console.error(`[UsuarioModel] Erro ao buscar usuário por e-mail. ${error}`);
            throw error;
        }
    }

    static async cadastrarUsuario(usuario: UsuarioDTO): Promise<boolean> {
        try {
            const queryInsertUsuario = `
                INSERT INTO usuario (nome, email, senha, role)
                VALUES ($1, $2, $3, $4)
                RETURNING id_usuario;
            `;

            // Criptografa a senha com hash de custo 10
            const senhaTratada = usuario.senha || '123456';
            const senhaHash = await bcrypt.hash(senhaTratada, 10);

            const valoresUsuario = [
                usuario.nome.toUpperCase(),
                usuario.email.toLowerCase(),
                senhaHash,
                usuario.role || 'admin'
            ];

            const resultUsuario = await database.query(queryInsertUsuario, valoresUsuario);

            if (resultUsuario.rows.length === 0) {
                throw new Error('INSERT de usuario não retornou dados - cadastro pode ter falhado silenciosamente.');
            }

            console.info(`[UsuarioModel] Usuário cadastrado. ID: ${resultUsuario.rows[0].id_usuario}`);
            return true;
        } catch (error) {
            console.error(`[UsuarioModel] Erro ao cadastrar usuário. ${error}`);
            throw error;
        }
    }
}

export default Usuario;