const db = require('../db/index');

function mapDboAddressToApiAddress(address) {
	return {
		id: address.id,
		houseNameNumber: address.house_name_number,
		streetName: address.street_name,
		townCityName: address.town_city_name,
		postCode: address.post_code,
	};
}

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

	return result.rows.map(mapDboAddressToApiAddress);
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

	return mapDboAddressToApiAddress(result.rows[0]);
}

/**
 * Check if the given inputs for the createAddress function are valid
 * @param {number} requesterId The account ID of the user requesting
 * @param {string} houseNameNumber House name/number
 * @param {string} streetName Street name
 * @param {string} townCityName Town/City name
 * @param {string} postCode Post code
 * @returns True if all inputs are valid
 */
function createAddressValidateInput(requesterId, houseNameNumber, streetName, townCityName, postCode) {
	if (!requesterId || !houseNameNumber || !streetName || !townCityName || !postCode) {
		return false;
	}

	return true;
}

/**
 * Create an address belonging to the requesting user
 * @param {number} requesterId The account ID of the user requesting
 * @param {string} houseNameNumber House name/number
 * @param {string} streetName Street name
 * @param {string} townCityName Town/City name
 * @param {string} postCode Post code
 * @returns The newly created address object
 */
async function createAddress(requesterId, houseNameNumber, streetName, townCityName, postCode) {
	if (!createAddressValidateInput(requesterId, houseNameNumber, streetName, townCityName, postCode)) {
		throw { status: 400 };
	}

	const query = `
		INSERT INTO address (account_id, house_name_number, street_name, town_city_name, post_code)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, house_name_number, street_name, town_city_name, post_code;
	`;

	const values = [requesterId, houseNameNumber, streetName, townCityName, postCode];

	const result = await db.query(query, values);

	return mapDboAddressToApiAddress(result.rows[0]);
}

module.exports = {
	getAllAddresses,
	getAddressById,
	createAddressValidateInput,
	createAddress,
};
