const bcrypt = require('bcrypt');
const passwordService = require('../password-service');

describe('Password service', () => {
	describe('verifyPassword', () => {
		it('verifies correctly', async () => {
			const password = 'Password01';
			const saltRounds = 10;
			const hash = await bcrypt.hash(password, saltRounds);

			const verified = await passwordService.verifyPassword(password, hash);

			expect(verified).toBe(true);
		});
	});
});
