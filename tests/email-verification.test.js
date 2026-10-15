import test from 'node:test';
import assert from 'node:assert/strict';
import {emailVerification} from '../src/email-verification.js';
const project = 'https://example-project.supabase.co';
const hash = 'a'.repeat(64);
const link = type => `${project}/auth/v1/verify?token=${hash}&type=${type}&redirect_to=http%3A%2F%2Flocalhost%3A3000`;
test('confirmação aceita OTP e links originais sem seguir redirecionamentos', () => {
  assert.deepEqual(emailVerification(' 123456 ', 'test@example.com', 'signup', project), {email:'test@example.com',token:'123456',type:'email'});
  for (const type of ['signup', 'email']) assert.deepEqual(emailVerification(link(type),'test@example.com','signup',project), {token_hash:hash,type:'email'});
  assert.deepEqual(emailVerification(link('recovery'),'test@example.com','recovery',project), {token_hash:hash,type:'recovery'});
});
test('confirmação rejeita outros projetos, links adulterados e etapas incorretas', () => {
  for (const input of [link('signup').replace('example-project','other-project'), link('signup').replace('https:','http:'), link('signup')+'&type=recovery',link('signup')+'&token=another',link('signup')+'#fragment',link('signup').replace('/verify','/wrong'),link('recovery'),'javascript:alert(1)','123','']) {
    assert.throws(() => emailVerification(input,'test@example.com','signup',project));
  }
  assert.throws(() => emailVerification(link('signup'),'test@example.com','recovery',project));
});
