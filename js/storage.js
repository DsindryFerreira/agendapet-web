const PREFIXO = 'agendapet:';

export function lerJSON(chave, padrao) {
    try {
        const bruto = localStorage.getItem(PREFIXO + chave);
        return bruto === null ? padrao : JSON.parse(bruto);
    } catch {
        return padrao;
    }
}

export function salvarJSON(chave, valor) {
    try {
        localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
        return true;
    } catch {
        return false;
    }
}

export function limparDados() {
    try {
        const chaves = Object.keys(localStorage).filter((chave) => chave.startsWith(PREFIXO));
        for (const chave of chaves) {
            localStorage.removeItem(chave);
        }
        return chaves.length;
    } catch {
        return 0;
    }
}