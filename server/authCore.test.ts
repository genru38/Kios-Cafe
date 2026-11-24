import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialCredentials,
  hashPassword,
  sanitizeImageUrl,
  validateCredentialChange,
  verifyPassword,
} from './authCore';
import {
  buildViewUrl,
  getBasePath,
  parseAppView,
  resolveAssetUrl,
} from '../src/logic/routing';

test('hashPassword and verifyPassword validate default credentials with timing-safe scrypt', () => {
  const creds = createInitialCredentials('genru', '1234', 1700000000000);
  assert.equal(creds.username, 'genru');
  assert.notEqual(creds.passwordHash, '1234');
  assert.equal(
    verifyPassword('1234', creds.passwordSalt, creds.passwordHash),
    true
  );
  assert.equal(
    verifyPassword('wrong', creds.passwordSalt, creds.passwordHash),
    false
  );

  // Two hashes of the same password use different salts
  const h1 = hashPassword('1234');
  const h2 = hashPassword('1234');
  assert.notEqual(h1.salt, h2.salt);
  assert.notEqual(h1.hash, h2.hash);
});

test('validateCredentialChange enforces username rules, current password, and confirmation match', () => {
  const bad = validateCredentialChange({
    currentPassword: '',
    newUsername: 'ab',
    newPassword: '12',
    confirmPassword: '34',
  });
  assert.ok(bad.currentPassword);
  assert.ok(bad.newUsername);
  assert.ok(bad.newPassword);
  assert.ok(bad.confirmPassword);

  const usernameOnlyOk = validateCredentialChange({
    currentPassword: '1234',
    newUsername: 'genru_owner',
    newPassword: '',
    confirmPassword: '',
  });
  assert.deepEqual(usernameOnlyOk, {});

  const bothOk = validateCredentialChange({
    currentPassword: '1234',
    newUsername: 'genru_owner',
    newPassword: 'newpassword123',
    confirmPassword: 'newpassword123',
  });
  assert.deepEqual(bothOk, {});
});

test('sanitizeImageUrl allows safe local assets and base64 photos while blocking javascript schemes', () => {
  assert.equal(
    sanitizeImageUrl('./src/assets/images/menu_es_kopi_aren_1795504404858.jpg'),
    './src/assets/images/menu_es_kopi_aren_1795504404858.jpg'
  );
  assert.equal(sanitizeImageUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeImageUrl('data:text/html;base64,PHNjcmlwdD4='), '');
  assert.equal(
    sanitizeImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg=='),
    'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
  );
});

test('parseAppView, getBasePath, buildViewUrl, and resolveAssetUrl support /project/admin/ and /project/edit-menu/', () => {
  assert.equal(parseAppView('/', ''), 'customer');
  assert.equal(parseAppView('/project/', ''), 'customer');
  assert.equal(parseAppView('/project/', '#/edit-menu'), 'edit-menu');
  assert.equal(parseAppView('/project/edit-menu/', ''), 'edit-menu');
  assert.equal(parseAppView('/edit-menu/', ''), 'edit-menu');
  assert.equal(parseAppView('/project/', '#/admin'), 'admin');
  assert.equal(parseAppView('/project/admin/', ''), 'admin');
  assert.equal(parseAppView('/project/admin/index.html', ''), 'admin');

  assert.equal(getBasePath('/project/'), '/project/');
  assert.equal(getBasePath('/project/edit-menu/'), '/project/');
  assert.equal(getBasePath('/project/admin/'), '/project/');
  assert.equal(getBasePath('/project/admin/index.html'), '/project/');
  assert.equal(getBasePath('/'), '/');

  assert.equal(buildViewUrl('/project/', 'admin'), '/project/admin/');
  assert.equal(buildViewUrl('/project/admin/', 'customer'), '/project/');
  assert.equal(buildViewUrl('/project/admin/', 'edit-menu'), '/project/edit-menu/');
  assert.equal(buildViewUrl('/', 'admin'), '/admin/');

  assert.equal(
    resolveAssetUrl('./src/assets/images/menu_a.jpg', '/project/admin/'),
    '/project/src/assets/images/menu_a.jpg'
  );
  assert.equal(
    resolveAssetUrl('./src/assets/images/menu_a.jpg', '/admin/'),
    '/src/assets/images/menu_a.jpg'
  );
  assert.equal(
    resolveAssetUrl('data:image/jpeg;base64,abc', '/project/admin/'),
    'data:image/jpeg;base64,abc'
  );
});
