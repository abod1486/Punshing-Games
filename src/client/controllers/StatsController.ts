import { Controller, OnStart, OnInit } from "@flamework/core";
import Roact from "@rbxts/roact";
import { State } from "../Modules/Stats";
import { Events } from "client/network";
import { Players } from "@rbxts/services";

const playerGui = Players.LocalPlayer.FindFirstChild("PlayerGui") as PlayerGui;
const stats = Roact.createElement(State, { Message: "Waiting for Players" });

@Controller({})
export class StatsController implements OnInit {
	onInit(): void | Promise<void> {
		const handle = Roact.mount(stats, playerGui);
		Events.updateStats.connect((message) => {
			Roact.update(handle, Roact.createElement(State, { Message: message }));
		});
	}
}
