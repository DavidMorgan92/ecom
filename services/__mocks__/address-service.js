const addressService = jest.requireActual('../address-service');

async function getAllAddresses(requesterId) {
	return [{
		id: '1',
		houseNameNumber: 'Pendennis',
		streetName: 'Tredegar Road',
		townCityName: 'Ebbw Vale',
		postCode: 'NP23 6LP',
	}];
}

async function getAddressById(requesterId, id) {
	if (id != 1) {
		return null;
	}

	return {
		id: '1',
		houseNameNumber: 'Pendennis',
		streetName: 'Tredegar Road',
		townCityName: 'Ebbw Vale',
		postCode: 'NP23 6LP',
	};
}

async function createAddress(requesterId, houseNameNumber, streetName, townCityName, postCode) {
	if (!addressService.createAddressValidateInput(requesterId, houseNameNumber, streetName, townCityName, postCode)) {
		throw { status: 400 };
	}

	return {
		id: '1',
		houseNameNumber,
		streetName,
		townCityName,
		postCode,
	};
}

async function updateAddress(requesterId, addressId, houseNameNumber, streetName, townCityName, postCode) {
	if (!addressService.updateAddressValidateInput(requesterId, addressId, houseNameNumber, streetName, townCityName, postCode)) {
		throw { status: 400 };
	}

	return {
		id: addressId.toString(),
		houseNameNumber,
		streetName,
		townCityName,
		postCode,
	};
}

async function deleteAddress(requesterId, addressId) {
	if (addressId != 1) {
		return false;
	}

	return true;
}

module.exports = {
	getAllAddresses,
	getAddressById,
	createAddress,
	updateAddress,
	deleteAddress,
};
