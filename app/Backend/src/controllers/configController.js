// Configuração de planos/preços/promoções/dados de pagamento — editável
// pelo admin, guardada como um único documento na colecção "configuracao"
// (procurado por { tipo: "planos" } em vez de um id fixo, para funcionar
// tanto no Firestore real como no mock local de testes, que só suporta
// where()+add()+doc().update(), sem doc(id).set()).
const { db } = require("../config/firebase");

const DEFAULT_CONFIG = {
    plans: [
        {
            id: "basic", name: "Basic", priceKz: 0, attempts: 2, active: true, popular: false,
            features: ["2 tentativas por maratona", "Resultados por email + dashboard", "Chat de suporte"],
            missing: ["Chat de dúvidas com professor", "Tentativas ilimitadas"],
        },
        {
            id: "plus", name: "Plus", priceKz: 5000, attempts: 5, active: true, popular: true,
            features: ["5 tentativas por maratona", "Feedback detalhado", "Chat de dúvidas com professor", "Suporte prioritário"],
            missing: ["Tentativas ilimitadas"],
        },
        {
            id: "premium", name: "Premium", priceKz: 15000, attempts: null, active: true, popular: false,
            features: ["Tentativas ilimitadas", "Feedback detalhado", "Chat de dúvidas com professor", "Suporte prioritário", "Acesso antecipado"],
            missing: [],
        },
    ],
    promos: [],
    payment: { banco: "", iban: "", titular: "", mobileMoneyOperadora: "", mobileMoneyNumero: "", instrucoes: "", whatsapp: "" },
};

const obterDocConfig = async () => {
    const r = await db.collection("configuracao").where("tipo", "==", "planos").get();
    if (r.empty) return null;
    return { id: r.docs[0].id, ...r.docs[0].data() };
};

const obterConfig = async () => {
    const doc = await obterDocConfig();
    if (!doc) return DEFAULT_CONFIG;
    return {
        plans: Array.isArray(doc.plans) && doc.plans.length ? doc.plans : DEFAULT_CONFIG.plans,
        promos: Array.isArray(doc.promos) ? doc.promos : [],
        payment: doc.payment || DEFAULT_CONFIG.payment,
    };
};

// Pagamento único (não recorrente) — sem cobrança mensal.
const labelPreco = (p) => (p.priceKz === 0 ? "Grátis" : `${Number(p.priceKz).toLocaleString("pt-PT")} Kz (pagamento único)`);
const labelTentativas = (p) => (p.attempts == null ? "∞" : String(p.attempts));
const comLabels = (p) => ({ ...p, price: labelPreco(p), attemptsLabel: labelTentativas(p) });

// GET /api/plans — qualquer utilizador autenticado (usado pelo PlanModal)
exports.obterPlanos = async (req, res) => {
    try {
        const config = await obterConfig();
        res.json({
            plans: config.plans.filter((p) => p.active).map(comLabels),
            promos: config.promos.filter((pr) => pr.active),
            payment: config.payment,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// GET /api/admin/plans — admin vê tudo, incluindo planos/promoções inactivos
exports.obterPlanosAdmin = async (req, res) => {
    try {
        const config = await obterConfig();
        res.json({
            plans: config.plans.map(comLabels),
            promos: config.promos,
            payment: config.payment,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// PUT /api/admin/plans  { plans, promos, payment }
exports.actualizarPlanos = async (req, res) => {
    try {
        const { plans, promos, payment } = req.body;
        if (!Array.isArray(plans) || !plans.length) {
            return res.status(400).json({ mensagem: "Lista de planos inválida." });
        }

        const planosLimpos = plans.map((p) => ({
            id: String(p.id || "").toLowerCase(),
            name: String(p.name || p.id || "").trim(),
            priceKz: Math.max(0, Math.round(Number(p.priceKz) || 0)),
            attempts: p.attempts === null || p.attempts === "" || p.attempts === "∞" ? null : Math.max(1, Math.round(Number(p.attempts)) || 1),
            active: !!p.active,
            popular: !!p.popular,
            features: Array.isArray(p.features) ? p.features.filter(Boolean) : [],
            missing: Array.isArray(p.missing) ? p.missing.filter(Boolean) : [],
        }));

        const promosLimpos = (Array.isArray(promos) ? promos : [])
            .map((pr) => ({
                code: String(pr.code || "").trim().toUpperCase(),
                desc: String(pr.desc || "").trim(),
                expires: String(pr.expires || "").trim(),
                active: !!pr.active,
            }))
            .filter((pr) => pr.code);

        const paymentLimpo = payment && typeof payment === "object"
            ? {
                banco: String(payment.banco || "").trim(),
                iban: String(payment.iban || "").trim(),
                titular: String(payment.titular || "").trim(),
                mobileMoneyOperadora: String(payment.mobileMoneyOperadora || "").trim(),
                mobileMoneyNumero: String(payment.mobileMoneyNumero || "").trim(),
                instrucoes: String(payment.instrucoes || "").trim(),
                // Número de WhatsApp para onde o aluno envia o comprovativo.
                whatsapp: String(payment.whatsapp || "").trim(),
            }
            : DEFAULT_CONFIG.payment;

        const dados = {
            tipo: "planos",
            plans: planosLimpos, promos: promosLimpos, payment: paymentLimpo,
            actualizadoEm: new Date().toISOString(), actualizadoPor: req.usuario.id,
        };

        const existente = await obterDocConfig();
        if (existente) {
            await db.collection("configuracao").doc(existente.id).update(dados);
        } else {
            await db.collection("configuracao").add(dados);
        }

        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ mensagem: "Erro no servidor." });
    }
};

// Exportado para o purchaseController validar códigos promocionais e
// nomes de planos sem duplicar a leitura da configuração.
exports._obterConfig = obterConfig;
