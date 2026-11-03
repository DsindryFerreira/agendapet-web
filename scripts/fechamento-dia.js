import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Servico, criarAgendamento } from '../js/dominio/agendamento.js';
import { calcularFechamento, montarLinhasRelatorio } from '../js/dominio/fechamento.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function lerJSON(relativo) {
    try {
        return JSON.parse(await readFile(path.join(raiz, relativo), 'utf8'));
    } catch (erro) {
        throw new Error(`Não foi possível ler ${relativo}: ${erro.message}`);
    }
}

function lerArgumento(nome) {
    const argumento = process.argv.find((a) => a.startsWith(`--${nome}=`));
    return argumento ? argumento.split('=')[1] : undefined;
}

function dataValida(texto) {
    return /^\d{4}-\d{2}-\d{2}$/.test(texto) && !Number.isNaN(new Date(`${texto}T00:00:00`).getTime());
}

async function main() {
    const data = lerArgumento('data');
    const arquivo = lerArgumento('arquivo') ?? 'data/agenda-exemplo.json';

    if (!data || !dataValida(data)) {
        throw new Error('Informe a data no formato AAAA-MM-DD. Exemplo: --data=2026-10-20');
    }

    const catalogo = (await lerJSON('data/servicos.json')).map((dado) => new Servico(dado));
    const dados = await lerJSON(arquivo);
    const agenda = dados.map((item) => criarAgendamento(item, catalogo));

    for (const linha of montarLinhasRelatorio(calcularFechamento(agenda, data))) {
        console.log(linha);
    }
}

main().catch((erro) => {
    console.error(`[ERRO] ${erro.message}`);
    process.exitCode = 1;
});