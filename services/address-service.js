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

/**
 * Check if the given inputs for the createAddress function are valid
 * @param {number} requesterId The account ID of the user requesting
 * @param {number} addressId Address ID
 * @param {string} houseNameNumber House name/number
 * @param {string} streetName Street name
 * @param {string} townCityName Town/City name
 * @param {string} postCode Post code
 * @returns True if all inputs are valid
 */
function updateAddressValidateInput(requesterId, addressId, houseNameNumber, streetName, townCityName, postCode) {
	if (!requesterId || !addressId || !houseNameNumber || !streetName || !townCityName || !postCode) {
		return false;
	}

	return true;
}

/**
 * Update an address belonging to the requesting user
 * @param {number} requesterId The account ID of the user requesting
 * @param {number} addressId Address ID
 * @param {string} houseNameNumber House name/number
 * @param {string} streetName Street name
 * @param {string} townCityName Town/City name
 * @param {string} postCode Post code
 * @returns The updated address object
 */
async function updateAddress(requesterId, addressId, houseNameNumber, streetName, townCityName, postCode) {
	if (!updateAddressValidateInput(requesterId, addressId, houseNameNumber, streetName, townCityName, postCode)) {
		throw { status: 400 };
	}

	const query = `
		UPDATE address
		SET house_name_number = $3, street_name = $4, town_city_name = $5, post_code = $6
		WHERE account_id = $1 AND id = $2
		RETURNING id, house_name_number, street_name, town_city_name, post_code;
	`;

	const values = [requesterId, addressId, houseNameNumber, streetName, townCityName, postCode];

	const result = await db.query(query, values);

	return mapDboAddressToApiAddress(result.rows[0]);
}

/**
 * Delete an address belonging to the requesting user
 * @param {number} requesterId The account ID of the user requesting
 * @param {number} addressId Address ID
 * @returns True if the operation succeeded
 */
async function deleteAddress(requesterId, addressId) {
	const query = `
		DELETE FROM address
		WHERE account_id = $1 AND id = $2;
	`;

	const values = [requesterId, addressId];

	const result = await db.query(query, values);

	// Return true if at least one row was changed
	return result.rowCount > 0;
}

module.exports = {
	getAllAddresses,
	getAddressById,
	createAddressValidateInput,
	createAddress,
	updateAddressValidateInput,
	updateAddress,
	deleteAddress,
};
