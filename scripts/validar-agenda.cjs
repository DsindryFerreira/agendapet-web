'use strict';

const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..');
const STATUS_VALIDOS = ['Agendado', 'Concluído', 'Cancelado'];
const CAMPOS_OBRIGATORIOS = [
  'protocolo', 'tutor', 'telefone', 'pet', 'especie', 'servicoId', 'data', 'hora', 'status',
];
const CAMPOS_ENDERECO = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf'];

function lerJSON(relativo) {
  return JSON.parse(fs.readFileSync(path.resolve(raiz, relativo), 'utf8'));
}

function validarItem(item, rotulo, catalogo, regras) {
  const erros = [];

  if (typeof item !== 'object' || item === null) {
    return [`${rotulo}: não é um objeto.`];
  }

  for (const campo of CAMPOS_OBRIGATORIOS) {
    if (typeof item[campo] !== 'string' || item[campo].trim() === '') {
      erros.push(`${rotulo}: campo obrigatório ausente ou vazio (${campo}).`);
    }
  }
  if (!STATUS_VALIDOS.includes(item.status)) {
    erros.push(`${rotulo}: status inválido (${item.status}).`);
  }
  if (!regras.dataValida(item.data)) {
    erros.push(`${rotulo}: data inválida (${item.data}).`);
  }
  if (!regras.horaValida(item.hora)) {
    erros.push(`${rotulo}: hora inválida (${item.hora}).`);
  }

  const servico = catalogo.find((s) => s.id === item.servicoId);
  if (!servico) {
    erros.push(`${rotulo}: serviço inexistente (${item.servicoId}).`);
  } else if (
    regras.horaValida(item.hora) &&
    !regras.horarioDentroDoFuncionamento(item.hora, servico.duracaoMin)
  ) {
    erros.push(`${rotulo}: horário fora do funcionamento (${item.hora}).`);
  }

  if (item.domiciliar) {
    const endereco = item.endereco;
    if (typeof endereco !== 'object' || endereco === null) {
      erros.push(`${rotulo}: atendimento domiciliar sem endereço.`);
    } else {
      for (const campo of CAMPOS_ENDERECO) {
        if (typeof endereco[campo] !== 'string' || endereco[campo].trim() === '') {
          erros.push(`${rotulo}: endereço sem ${campo}.`);
        }
      }
    }
  }

  return erros;
}

async function main() {
  const arquivo = process.argv[2] || 'data/agenda-exemplo.json';
  const regras = await import('../js/dominio/regras.js');

  const agenda = lerJSON(arquivo);
  const catalogo = lerJSON('data/servicos.json');

  if (!Array.isArray(agenda)) {
    throw new Error('O arquivo deve conter uma lista de agendamentos.');
  }

  const erros = [];
  agenda.forEach((item, posicao) => {
    const protocolo = item && item.protocolo ? item.protocolo : 'sem protocolo';
    erros.push(...validarItem(item, `Item ${posicao + 1} (${protocolo})`, catalogo, regras));
  });

  for (let i = 0; i < agenda.length; i++) {
    for (let j = i + 1; j < agenda.length; j++) {
      const a = agenda[i];
      const b = agenda[j];
      if (!a || !b) continue;
      const ativos = a.status !== 'Cancelado' && b.status !== 'Cancelado';
      if (ativos && a.data === b.data && a.hora === b.hora) {
        erros.push(`Conflito: ${a.protocolo} e ${b.protocolo} no mesmo horário (${a.data} ${a.hora}).`);
      }
    }
  }

  if (erros.length > 0) {
    console.error(`[ERRO] ${arquivo}: ${erros.length} problema(s) encontrado(s):`);
    erros.forEach((erro) => console.error(' - ' + erro));
    process.exit(1);
  }

  console.log(`[OK] ${arquivo}: ${agenda.length} agendamentos válidos.`);
}

main().catch((erro) => {
  console.error(`[ERRO] ${erro.message}`);
  process.exit(1);
});