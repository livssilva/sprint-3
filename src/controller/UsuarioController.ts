import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../model/Usuario.js";
import type UsuarioDTO from "../interface/UsuarioDTO.js";
import type { LoginDTO } from "../interface/UsuarioDTO.js";

const JWT_SECRET = process.env.JWT_SECRET || "techforge_secret_key_2026";

class UsuarioController extends Usuario {

    static async todos(req: Request, res: Response) {
        try {
            const listaDeUsuarios = await Usuario.listarUsuarios();

            if (listaDeUsuarios.length === 0) {
                res.status(204).send();
                return;
            }

            res.status(200).json(listaDeUsuarios);
        } catch (error) {
            console.error(`[UsuarioController] Erro ao listar usuários: ${error}`);
            res.status(500).json({ mensagem: "Erro interno ao recuperar a lista de usuários." });
        }
    }

    static async cadastrar(req: Request, res: Response) {
        try {
            const dadosRecebidos: UsuarioDTO = req.body;

            if (!dadosRecebidos.nome || !dadosRecebidos.email || !dadosRecebidos.senha) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: nome, email e senha." });
                return;
            }

            const usuarioExistente = await Usuario.buscarPorEmail(dadosRecebidos.email);
            if (usuarioExistente) {
                res.status(409).json({ mensagem: "E-mail já cadastrado no sistema." });
                return;
            }

            const result = await Usuario.cadastrarUsuario(dadosRecebidos);

            if (result) {
                res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
            } else {
                res.status(400).json({ mensagem: "Não foi possível cadastrar o usuário" });
            }
        } catch (error) {
            console.error(`[UsuarioController] Erro ao cadastrar usuário: ${error}`);
            res.status(500).json({ mensagem: "Erro interno ao cadastrar usuário." });
        }
    }

    /**
     * Endpoint POST /auth/login - Autentica credenciais e retorna Token JWT
     */
    static async login(req: Request, res: Response) {
        try {
            const { email, senha }: LoginDTO = req.body;

            if (!email || !senha) {
                res.status(400).json({ mensagem: "Informe e-mail e senha para realizar o login." });
                return;
            }

            const usuario = await Usuario.buscarPorEmail(email);
            if (!usuario) {
                res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
                return;
            }

            const senhaValida = await bcrypt.compare(senha, usuario.getSenha());
            if (!senhaValida) {
                res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
                return;
            }

            const token = jwt.sign(
                {
                    id_usuario: usuario.getIdUsuario(),
                    nome: usuario.getNome(),
                    email: usuario.getEmail(),
                    role: usuario.getRole()
                },
                JWT_SECRET,
                { expiresIn: "8h" }
            );

            res.status(200).json({
                mensagem: "Login efetuado com sucesso!",
                token,
                usuario: {
                    id_usuario: usuario.getIdUsuario(),
                    nome: usuario.getNome(),
                    email: usuario.getEmail(),
                    role: usuario.getRole()
                }
            });
        } catch (error) {
            console.error(`[UsuarioController] Erro no login: ${error}`);
            res.status(500).json({ mensagem: "Erro interno ao realizar login." });
        }
    }
}

export default UsuarioController;