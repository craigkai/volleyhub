/**
 * Represents a list with rotation operations.
 */
export default class List {
	/**
	 * Rotates the list by moving the first element to the end.
	 * @param {Array<any>} list - The list to rotate. Default is an empty array.
	 * @returns {Array<any>} The rotated list.
	 */
	static rotate = (list: Array<any> = []): Array<any> => list.slice(1).concat(list.slice(0, 1));

	/**
	 * Rotates the list, while keeping a specific item locked in a given position.
	 * @param {Array<any>} list - The list to rotate. Default is an empty array.
	 * @param {number} lockedPosition - The index of the item to lock. Default is 0.
	 * @returns {Array<any>} The rotated list with the locked item in the specified position.
	 */
	static lockedRotate(list: Array<any> = [], lockedPosition: number = 0): Array<any> {
		const listCopy = [...list];
		const [lockedItem] = listCopy.splice(lockedPosition, 1);
		const rotatedList = this.rotate(listCopy);
		rotatedList.splice(lockedPosition, 0, lockedItem);
		return rotatedList;
	}
}
