const db = require('../db/index');

/**
 * Get all the requesting user's address objects
 * @param {number} requesterId The account ID of the user requesting
 * @returns Array of addresses belonging to the requesting user
 */
async function getAllAddresses(requesterId) {
	const query = `
		SELECT id, house_name_number, street_name, town_city_name, post_code
		FROM address
		WHERE account_id = $1;
	`;

	const values = [requesterId];

	const result = await db.query(query, values);

	return result.rows.map(row => {
		return {
			id: row.id,
			houseNameNumber: row.house_name_number,
			streetName: row.street_name,
			townCityName: row.town_city_name,
			postCode: row.post_code,
		};
	});
}

/**
 * Get an address object from the database by its ID
 * @param {number} requesterId The account ID of the user requesting
 * @param {number} id The address's ID
 * @returns The address object requested, or null if the object doesn't match
 */
async function getAddressById(requesterId, id) {
	const query = `
		SELECT id, house_name_number, street_name, town_city_name, post_code
		FROM address
		WHERE account_id = $1 AND id = $2;
	`;

	const values = [requesterId, id];

	const result = await db.query(query, values);

	if (result.rowCount === 0) {
		return null;
	}

	return {
		id: result.rows[0].id,
		houseNameNumber: result.rows[0].house_name_number,
		streetName: result.rows[0].street_name,
		townCityName: result.rows[0].town_city_name,
		postCode: result.rows[0].post_code,
	};
}

module.exports = {
	getAllAddresses,
	getAddressById,
};
