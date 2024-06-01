import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { AddOptions, InventoryExtension, Item } from '../shared/types.js';
import { useItemArrayManager } from './itemArrayManager.js';
import { ItemIDs } from '../shared/ignoreItemIds.js';
import { useVehicleItemManagerEventInvoker } from './vehicleItemManagerEvents.js';

const Rebar = useRebar();
const invoker = useVehicleItemManagerEventInvoker();

export function useVehicleItemManager(vehicle: alt.Vehicle) {
    const itemArrayManager = useItemArrayManager();
    const document = Rebar.document.vehicle.useVehicle(vehicle);

    /**
     * Finds a similar item based on `id` or creates a new item and adds it to the player's inventory
     *
     * Saves to database
     *
     * @param {Item} item
     * @return
     */
    async function add(id: ItemIDs, quantity: number, addOptions: AddOptions = {}) {
        const data = document.get<InventoryExtension>();
        if (!data.items) {
            data.items = [];
        }

        const items = itemArrayManager.add(id, quantity, data.items, addOptions);
        if (!items) {
            return false;
        }

        await document.set<InventoryExtension>('items', items);

        invoker.invokeOnItemAdded(vehicle, id, quantity);
        invoker.invokeOnItemsUpdated(vehicle, items);

        return true;
    }

    /**
     * Remove an item by `id` and quantity
     *
     * Saves to database
     *
     * @param {ItemIDs} id
     * @param {number} quantity
     * @return {Promise<boolean>}
     */
    async function remove(id: ItemIDs, quantity: number): Promise<boolean> {
        const data = document.get<InventoryExtension>();
        if (!data.items) {
            return false;
        }

        const initialQuantity = quantity;
        const items = itemArrayManager.remove(id, quantity, data.items);
        if (!items) {
            return false;
        }

        await document.set<InventoryExtension>('items', items);

        invoker.invokeOnItemRemoved(vehicle, id, initialQuantity);
        invoker.invokeOnItemsUpdated(vehicle, items);

        return true;
    }

    /**
     * Get all items the player currently has available
     *
     * @return {Item[]}
     */
    function get(): Item[] {
        return document.get<InventoryExtension>().items ?? [];
    }

    /**
     * Check if they have enough of an item
     *
     * Returns `true / false`
     *
     * @param {ItemIDs} id
     * @param {number} quantity
     * @return
     */
    function has(id: ItemIDs, quantity: number) {
        const data = document.get<InventoryExtension>();
        if (!data.items) {
            return false;
        }

        return itemArrayManager.has(id, quantity, data.items);
    }

    /**
     * Stack two items together and leave remaining if stack is too large
     *
     * Saves to database
     *
     * @param {string} uidToStackOn
     * @param {string} uidToStack
     * @return
     */
    async function stack(uidToStackOn: string, uidToStack: string) {
        const data = document.get<InventoryExtension>();
        if (!data.items) {
            return false;
        }

        const items = itemArrayManager.stack(uidToStackOn, uidToStack, data.items);
        if (!items) {
            return false;
        }

        await document.set<InventoryExtension>('items', items);

        invoker.invokeOnItemsUpdated(vehicle, items);

        return true;
    }

    /**
     * Split an item into two items
     *
     * Saves to database
     *
     * @param {string} uid
     * @param {number} amountToSplit
     * @param {AddOptions} [options={}]
     * @return
     */
    async function split(uid: string, amountToSplit: number, options: AddOptions = {}) {
        const data = document.get<InventoryExtension>();
        if (!data.items) {
            return false;
        }

        const items = itemArrayManager.split(uid, amountToSplit, data.items, options);
        if (!items) {
            return false;
        }

        await document.set<InventoryExtension>('items', items);

        invoker.invokeOnItemsUpdated(vehicle, items);

        return true;
    }

    return {
        add,
        get,
        getErrorMessage() {
            return itemArrayManager.getErrorMessage();
        },
        has,
        remove,
        split,
        stack,
    };
}