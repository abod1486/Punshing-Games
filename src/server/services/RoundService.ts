import { Teams, Players, RunService, ServerStorage, Workspace } from "@rbxts/services";
import { Service, OnStart } from "@flamework/core";
import { Trove } from "@rbxts/trove";
import Signal from "@rbxts/signal";
import { GAME_SETTINGS } from "shared/constants/GameSetting";
import { Events } from "server/network";

const MapFolders = ServerStorage.WaitForChild("Maps")?.GetChildren();

@Service({})
export class RoundService implements OnStart {
	private _trove = new Trove();
	private GameState = {
		State: "Waiting for Players",
		Message: "",
	};

	onStart() {
		function resetPlayers() {
			for (const team of Teams.GetTeams()) {
				if (team.Name === "Lobby") {
					continue;
				}
				for (const player of team.GetPlayers()) {
					const humanoid = player.Character?.FindFirstChild("Humanoid");
					if (humanoid?.IsA("Humanoid")) {
						humanoid.Health = 0;
					}
				}
			}
		}

		task.defer(() => {
			task.wait(3);
			// eslint-disable-next-line no-constant-condition
			while (true) {
				this._trove.add(resetPlayers);
				this._waitForPlayers();
				this._intermission();
				this._begin();
				this._yieldUntilFinished();
				this._end();
			}
		});
	}

	private _waitForPlayers() {
		for (const player of Players.GetPlayers()) {
			Events.updateStats.fire(
				player,
				(this.GameState = {
					State: "Waiting",
					Message: "Waiting for Players",
				}),
			);
		}

		const enoughPlayers = new Signal();

		let count = 0;
		function updateCount() {
			count = Players.GetPlayers().size();
			if (count > 1 || RunService.IsStudio()) {
				enoughPlayers.Fire();
			}
		}

		Players.PlayerAdded.Connect(updateCount);
		Players.PlayerRemoving.Connect(updateCount);

		task.delay(1, updateCount);
		enoughPlayers.Wait();
	}

	private _intermission() {
		for (let timer = GAME_SETTINGS.INTERMISSION_TIME - 1; timer >= 0; timer--) {
			for (const player of Players.GetPlayers()) {
				Events.updateStats.fire(
					player,
					(this.GameState = {
						State: "Intermission",
						Message: `Intermission: ${timer}`,
					}),
				);
			}

			task.wait(1);
		}
	}

	private _begin() {
		function random(): [Model, CFrame] {
			const randomMap = MapFolders[math.random(0, MapFolders.size())];
			print(randomMap);
			if (!randomMap) {
				return random();
			}
			if (randomMap.IsA("Model")) {
				const teleportpoints = randomMap?.WaitForChild("TeleportPoints")?.GetChildren();
				const randomTeleportPoint = teleportpoints[math.random(0, teleportpoints.size())];
				if (!randomTeleportPoint.IsA("BasePart")) {
					return random();
				}
				const cframe = randomTeleportPoint.CFrame;
				return [randomMap, cframe];
			} else {
				return random();
			}
		}

		const resule = random();
		const randomMap = resule[0];
		const Map = randomMap.Clone();
		Map.Parent = Workspace;
		this._trove.add(Map);

		const cframe = resule[1];

		this._generateTeams(cframe);
	}

	private _generateTeams(cframe: CFrame) {
		const players = Players.GetPlayers();

		for (const player of players) {
			if (!player.Character) {
				continue;
			}

			const inGameTeam = Teams?.FindFirstChild("Game");
			if (inGameTeam?.IsA("Team")) {
				player.Team = inGameTeam;
				this._telrportPlayer(player, cframe);
				this._watchPlayer(player);
			}
		}
	}

	private _telrportPlayer(player: Player, cframe: CFrame) {
		const humanoidRootPart = player.Character?.FindFirstChild("HumanoidRootPart");
		if (humanoidRootPart?.IsA("BasePart")) {
			humanoidRootPart.CFrame = cframe;
		}
	}

	private _watchPlayer(player: Player) {
		const humanoid = player.Character?.FindFirstChild("Humanoid");
		const lobbyTeam = Teams?.FindFirstChild("Lobby");

		if (!humanoid?.IsA("Humanoid")) {
			return;
		}

		humanoid.Died.Connect(() => {
			if (lobbyTeam?.IsA("Team")) {
				player.Team = lobbyTeam;
			}
		});
	}

	private _yieldUntilFinished() {
		for (let timer = GAME_SETTINGS.ROUND_TIME - 1; timer >= 0; timer--) {
			for (const player of Players.GetPlayers()) {
				Events.updateStats.fire(
					player,
					(this.GameState = {
						State: "Fight",
						Message: `Fight, Round Time: ${timer}`,
					}),
				);
			}

			task.wait(1);

			const inGAmeTeam = Teams?.FindFirstChild("Lobby");
			if (inGAmeTeam?.IsA("Team")) {
				const numTeam = inGAmeTeam.GetPlayers().size();
				if (numTeam < 1 && !RunService.IsStudio()) {
					break;
				}
			}
		}
	}

	private _end() {
		const inGAmeTeam = Teams?.FindFirstChild("Lobby");
		if (inGAmeTeam?.IsA("Team")) {
			const winner = inGAmeTeam.GetPlayers()[0];
			for (let index = 0; index < GAME_SETTINGS.END_TIME; index++) {
				for (const player of Players.GetPlayers()) {
					Events.updateStats.fire(
						player,
						(this.GameState = {
							State: `Winner`,
							Message: `Winner is ${winner}`,
						}),
					);
				}

				task.wait(1);
			}
			this._trove.clean();
		}
	}
}
