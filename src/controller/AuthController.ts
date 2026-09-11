import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../model/Usuario.js";
import type { LoginDTO } from "../interface/UsuarioDTO.js";
import type { RequisicaoAutenticada } from "../middleware/Auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "techforge_secret_key_2026";

class AuthController {

    /**
     * Endpoint POST /login ou POST /auth/login
     * Autentica as credenciais do usuário e retorna o Token JWT
     */
    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, senha }: LoginDTO = req.body;

            // Validação de entrada
            if (!email || !senha) {
                res.status(400).json({ 
                    mensagem: "Campos obrigatórios ausentes. Informe e-mail e senha." 
                });
                return;
            }

            const emailFormatado = String(email).trim().toLowerCase();
            const usuario = await Usuario.buscarPorEmail(emailFormatado);

            if (!usuario) {
                res.status(401).json({ 
                    mensagem: "E-mail ou senha incorretos." 
                });
                return;
            }

            const senhaValida = await bcrypt.compare(String(senha), usuario.getSenha());
            if (!senhaValida) {
                res.status(401).json({ 
                    mensagem: "E-mail ou senha incorretos." 
                });
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
            console.error(`[AuthController] Erro no login:`, error);
            res.status(500).json({ 
                mensagem: "Erro interno ao processar a autenticação." 
            });
        }
    }

    /**
     * Endpoint GET /auth/me ou GET /auth/verificar
     * Retorna os dados do usuário autenticado a partir do token verificado
     */
    static async verificar(req: RequisicaoAutenticada, res: Response): Promise<void> {
        if (!req.usuarioLogado) {
            res.status(401).json({ mensagem: "Usuário não autenticado." });
            return;
        }

        res.status(200).json({
            autenticado: true,
            usuario: req.usuarioLogado
        });
    }
}

export default AuthController;
