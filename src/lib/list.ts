/**
 * Represents a list with rotation operations.
 */
export default class List {
	/**
	 * Rotates the list by moving the first element to the end.
	 * @param {Array<T>} list - The list to rotate. Default is an empty array.
	 * @returns {Array<T>} The rotated list.
	 */
	static rotate = <T>(list: Array<T> = []): Array<T> => list.slice(1).concat(list.slice(0, 1));

	/**
	 * Rotates the list, while keeping a specific item locked in a given position.
	 * @param {Array<T>} list - The list to rotate. Default is an empty array.
	 * @param {number} lockedPosition - The index of the item to lock. Default is 0.
	 * @returns {Array<T>} The rotated list with the locked item in the specified position.
	 */
	static lockedRotate<T>(list: Array<T> = [], lockedPosition: number = 0): Array<T> {
		const listCopy = [...list];
		const [lockedItem] = listCopy.splice(lockedPosition, 1);
		const rotatedList = this.rotate(listCopy);
		rotatedList.splice(lockedPosition, 0, lockedItem);
		return rotatedList;
	}
}
