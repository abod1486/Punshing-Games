import Roact from "@rbxts/roact";

export interface props {
	Message: string;
}

export class State extends Roact.Component<props> {
	render() {
		return (
			<screengui ResetOnSpawn={false} IgnoreGuiInset={true}>
				<textlabel
					Text={this.props.Message}
					TextScaled={true}
					TextSize={14}
					TextStrokeTransparency={0}
					TextWrapped={true}
					BackgroundTransparency={1}
					Size={UDim2.fromScale(1, 0.1)}
					FontFace={new Font("rbxasset://fonts/families/Oswald.json")}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				/>
			</screengui>
		);
	}
}
