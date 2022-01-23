const db = require('../db/index');

/**
 * Get an address object from the database by its ID
 * @param {number} id The address's ID
 * @returns The address object requested, or null if the object doesn't match
 */
async function getAddressById(id) {
	// TODO: Take calling user's ID as a parameter and check the address belongs to that user, throw status 403 otherwise

	const query = `
		SELECT id, house_name_number, street_name, town_city_name, post_code
		FROM address
		WHERE id = $1;
	`;

	const values = [id];

	const result = await db.query(query, values);

	if (result.rowCount == 0) {
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
	getAddressById,
};
