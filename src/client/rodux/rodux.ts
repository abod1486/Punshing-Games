import { combineReducers, Store } from "@rbxts/rodux";
import { HttpService, Stats } from "@rbxts/services";
import { Events, Functions } from "client/network";
import { PlayerData } from "shared/types/PlayerData";
import { DataActions, dataReducer, DataState } from "./reducers";

export interface CombinedState {
	data: DataState;
}

const combinedReducer = combineReducers<CombinedState, DataActions>({
	data: dataReducer,
});

export const clientStore = new Store(combinedReducer);

Events.updateData.connect((data) => {
	const playerData = <PlayerData>HttpService.JSONDecode(data);
	clientStore.dispatch({ type: "updatePlayerData", data: playerData });
});

Events.updateMoney.connect((amount) => {
	clientStore.dispatch({ type: "updateCurrency", currency: "money", amount });
});

Events.updateStats.connect((stats) => {});
