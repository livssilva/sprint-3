import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "techforge_secret_key_2026";

export interface UsuarioPayload {
    id_usuario: number;
    nome: string;
    email: string;
    role: string;
}

// Adicionamos explicitamente ' | undefined' no tipo da propriedade
export interface RequisicaoAutenticada extends Request {
    usuarioLogado?: UsuarioPayload | undefined;
}

export function autenticarToken(
    req: RequisicaoAutenticada, 
    res: Response, 
    next: NextFunction
): void {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({ mensagem: "Acesso negado. Token de autenticação não fornecido." });
        return;
    }

    try {
        const dadosDecodificados = jwt.verify(token, JWT_SECRET) as UsuarioPayload;
        
        req.usuarioLogado = dadosDecodificados;
        
        next();
    } catch (error) {
        console.error(`[AuthMiddleware] Token inválido ou expirado: ${error}`);
        res.status(403).json({ mensagem: "Token inválido ou expirado. Faça login novamente." });
    }
}