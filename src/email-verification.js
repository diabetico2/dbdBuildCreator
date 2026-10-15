// Parse only the project's own verification URL. Never navigate to pasted links.
export function emailVerification(value, email, purpose, projectUrl) {
  if (!['signup', 'recovery'].includes(purpose)) throw Error('Tipo de confirmação inválido.');
  const type = purpose === 'signup' ? 'email' : 'recovery';
  const input = String(value).trim();
  if (/^[0-9]{6,10}$/.test(input)) return {email, token: input, type};
  let link;
  try { link = new URL(input); } catch { throw Error('Cole o link de confirmação do e-mail ou digite o código recebido.'); }
  const expected = new URL(projectUrl);
  if (link.origin !== expected.origin || link.protocol !== 'https:' ||
      link.pathname !== '/auth/v1/verify' || link.username || link.password || link.hash) {
    throw Error('Use o link original enviado por este aplicativo. Copie o endereço do botão no e-mail.');
  }
  const linkType = link.searchParams.get('type');
  const allowed = purpose === 'signup' ? ['signup', 'email'] : ['recovery'];
  if (!allowed.includes(linkType) || link.searchParams.getAll('type').length !== 1) {
    throw Error('Esse link não corresponde a esta etapa. Solicite um novo e-mail.');
  }
  const tokenHash = link.searchParams.get('token');
  if (!tokenHash || !/^[a-zA-Z0-9_-]{16,512}$/.test(tokenHash) || link.searchParams.getAll('token').length !== 1) {
    throw Error('Link incompleto. Copie o endereço inteiro do botão no e-mail.');
  }
  return {token_hash: tokenHash, type};
}
