const bcrypt = require('bcrypt');
const passwordService = require('../password-service');

describe('Password service', () => {
	describe('verifyPassword', () => {
		it('verifies correctly', async () => {
			const password = 'Password01';
			const hash = await bcrypt.hash(password, 10);

			const verified = await passwordService.verifyPassword(password, hash);

			expect(verified).toBe(true);
		});
	});
});
