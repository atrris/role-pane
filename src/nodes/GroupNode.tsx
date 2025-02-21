import {
	type NodeProps,
	NodeResizeControl,
	NodeToolbar,
	type ResizeDragEvent,
	type ResizeParamsWithDirection,
	useReactFlow,
	useStoreApi,
} from "@xyflow/react";
import { memo, useCallback } from "react";

// Resizing control style
const controlStyle = {
	background: "transparent",
	border: "none",
};

function GroupNode({ id }: NodeProps) {
	const store = useStoreApi(); // Store API

	const { setNodes, deleteElements } = useReactFlow();

	// Handle deletion of this group node
	const onDelete = () => {
		deleteElements({ nodes: [{ id }] });
	};

	// Handle resize of the group
	const onResize = useCallback(
		(event: ResizeDragEvent, params: ResizeParamsWithDirection) => {
			const { width } = params;
			const groupNode = store.getState().nodeLookup.get(id);

			if (!groupNode) return;

			const groupPosition = groupNode.position;
			// nodeLookup から全てのノードを取得
			// biome-ignore lint/complexity/noForEach: <explanation>
			Array.from(store.getState().nodeLookup.entries()).forEach(
				([nodeId, node]) => {
					// type が "group" のノードを対象にする
					if (node.type === "group") {
						// group ノードの position.x と position.y をコンソールに出力
						console.log(
							`前Node ID: ${nodeId} - Position: x = ${node.position.x}, y = ${node.position.y}`,
						);
					}
				},
			);

			// If resizing to the right, move all nodes that are to the right of this group node
			//
			// const store = useStoreApi()から取得した、ReactFlowがグローバルに管理するstoreと呼ばれる状態に対して更新をかけているので、
			// この更新された状態を維持するには、すべての描画を一任しているReactFlowコンポーネントが存在しているApp.tsxにおいても、
			// storeに対して状態更新をかける必要があると思われる. すなわち、現状ではApp.tsxで
			//
			//	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
			//
			// と定義したonNodesChangeをReactFlowコンポーネントのonNodesChange propに渡すことで、
			// onNodesChange関数と同時に得たnodes配列のみを見て、ReactFlowコンポーネントの再描画をトリガーするように設計されているが、
			// GroupNode上で加えられた変更のみを忠実に再現したい場合、storeに対しての状態更新のみを見るように,
			// onNodesChange関数を私たちが自作する必要があるはず。
			//

			store.setState((state) => ({
				...state,
				nodeLookup: new Map(
					Array.from(state.nodeLookup.entries()).map(([nodeId, node]) => {
						if (nodeId === id) {
							return [nodeId, { ...node, width }];
						}
						if (node.type === "group" && node.position.x > groupPosition.x) {
							const widthDifference = width - (groupNode.width ?? 0); // 幅の差分を計算
							return [
								nodeId,
								{
									...node,
									position: {
										x: node.position.x + widthDifference, // 差分だけ移動
										y: node.position.y,
									},
								},
							];
						}
						return [nodeId, node];
					}),
				),
			}));
			setNodes((nodes) => {
				return nodes.map((node) => {
					if (node.id === id) {
						return { ...node, width };
					}
					if (node.type === "group" && node.position.x > groupPosition.x) {
						const widthDifference = width - (groupNode.width ?? 0); // 幅の差分を計算
						return {
							...node,
							position: {
								x: node.position.x + widthDifference,
								y: node.position.y,
							},
						};
					}
					return node;
				});
			});
		},
		[id, setNodes, store],
	);

	return (
		<div>
			<NodeResizeControl
				style={controlStyle}
				minWidth={100}
				minHeight={50}
				onResize={onResize} // Attach the resize handler
			>
				<ResizeIcon />
			</NodeResizeControl>
			<NodeToolbar className="nodrag">
				<button type="button" onClick={onDelete}>
					Delete
				</button>
			</NodeToolbar>
		</div>
	);
}

// Resize icon for the resize control
function ResizeIcon() {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			strokeWidth="2"
			stroke="#ff0071"
			fill="none"
			strokeLinecap="round"
			strokeLinejoin="round"
			style={{ position: "absolute", right: 5, bottom: 5 }}
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<polyline points="16 20 20 20 20 16" />
			<line x1="14" y1="14" x2="20" y2="20" />
			<polyline points="8 4 4 4 4 8" />
			<line x1="4" y1="4" x2="10" y2="10" />
		</svg>
	);
}

export default memo(GroupNode);
