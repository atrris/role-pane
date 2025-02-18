import {
	Background,
	type Connection,
	type Edge,
	MarkerType,
	type Node,
	ReactFlow,
	ReactFlowProvider,
	addEdge,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import { type DragEvent, type MouseEvent, useCallback, useEffect } from "react";

import GroupNode from "./nodes/GroupNode";
import Sidebar from "./nodes/Sidebar";
import SimpleNode from "./nodes/SimpleNode";

import SelectedNodesToolbar from "./nodes/SelectedNodesToolbar";
import { getId, getNodePositionInsideParent, sortNodes } from "./nodes/utils";

import "@xyflow/react/dist/style.css";

import styles from "./nodes/style.module.css";

const proOptions = {
	hideAttribution: true,
};

const onDragOver = (event: DragEvent) => {
	event.preventDefault();
	event.dataTransfer.dropEffect = "move";
};

const nodeTypes = {
	node: SimpleNode,
	group: GroupNode,
};

const defaultEdgeOptions = {
	style: {
		strokeWidth: 2,
	},
	markerEnd: {
		type: MarkerType.ArrowClosed,
	},
};

function DynamicGrouping() {
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const onConnect = useCallback(
		(edge: Edge | Connection) => setEdges((eds) => addEdge(edge, eds)),
		[setEdges],
	);
	const { screenToFlowPosition, getIntersectingNodes, getNodes } =
		useReactFlow();

	useEffect(() => {
		const groupNodes = getNodes().filter((node) => node.type === "group");
		if (groupNodes) {
			// biome-ignore lint/complexity/noForEach: <explanation>
			groupNodes.forEach((gnode) => {
				setNodes((nds) =>
					nds.map((node) => {
						// 移動されたノードの位置を更新
						if (gnode.id === node.id && gnode.position.x !== node.position.x) {
							return {
								...node,
								position: {
									x: gnode.position.x,
									y: node.position.y,
								}, // 新しい位置
							};
						}
						return node;
					}),
				);
			});
		}
	});

	const onDrop = (event: DragEvent) => {
		event.preventDefault();

		const type = event.dataTransfer.getData("application/reactflow");
		const position = screenToFlowPosition({
			x: event.clientX,
			y: event.clientY,
		});

		// 既存のグループノードを取得
		const intersections = getIntersectingNodes({
			x: position.x,
			y: position.y,
			width: 40,
			height: 40,
		}).filter((n) => n.type === "group");

		// グループノードが交差している場合、右に配置
		if (type === "group") {
			if (intersections.length > 0) {
				const groupNode = intersections[0];

				const groupPosition = groupNode.position;
				const groupWidth = groupNode.width; // グループノードの幅
				if (groupWidth === undefined) return;
				const groupRight = groupPosition.x + groupWidth;
				const nodeDimensions =
					type === "group"
						? { width: groupWidth, height: groupNode.height }
						: {};
				const newNode: Node = {
					id: getId(),
					type,
					position,
					draggable: false,
					data: { label: `${type}` },
					...nodeDimensions,
				};

				// 右側に配置
				newNode.position = {
					x: groupNode.position.x + groupWidth,
					y: groupNode.position.y,
				};

				// ノードの状態を更新
				setNodes((nds) =>
					nds.map((node) => {
						// 移動されたノードの位置を更新
						if (node.position.x >= groupRight && node.type === "group") {
							return {
								...node,
								position: {
									x: node.position.x + groupWidth,
									y: node.position.y,
								}, // 新しい位置
							};
						}
						return node;
					}),
				);
				// ノードを追加して並べ替え
				setNodes((nds) => {
					const sortedNodes = [...nds, newNode].sort(sortNodes);
					return sortedNodes;
				});
			} else {
				const groupNodes = getNodes().filter((node) => node.type === "group");
				// 一番左側のgroupノードを取得
				const groupNode = groupNodes.reduce((maxNode, node) => {
					const nodeLeftEdge = node.position.x;
					const minNodeRightEdge = maxNode.position.x;
					// 左端が小さいノードを選ぶ
					return nodeLeftEdge < minNodeRightEdge ? node : maxNode;
				}, groupNodes[0]);
				const groupWidth = groupNode?.width ?? 100; // グループノードの幅
				const groupheight = groupNode?.height ?? 100;
				const nodeDimensions =
					type === "group" ? { width: groupWidth, height: groupheight } : {};
				const newNode: Node = {
					id: getId(),
					type,
					position,
					draggable: false,
					data: { label: `${type}` },
					...nodeDimensions,
				};
				// 左側に配置
				if (groupNode?.position) {
					newNode.position = {
						x: groupNode.position.x - groupWidth,
						y: groupNode.position.y,
					};
				} else {
					newNode.position = {
						x: 0,
						y: 0,
					};
				}
				// ノードを追加して並べ替え
				setNodes((nds) => {
					const sortedNodes = [...nds, newNode].sort(sortNodes);
					return sortedNodes;
				});
			}
		}
	};

	const onNodeDragStop = useCallback(
		(_: MouseEvent, node: Node) => {
			if (node.type !== "node" && !node.parentId) {
				return;
			}

			const intersections = getIntersectingNodes(node).filter(
				(n) => n.type === "group",
			);
			const groupNode = intersections[0];

			if (intersections.length && node.parentId !== groupNode?.id) {
				const nextNodes: Node[] = getNodes()
					.map((n) => {
						if (n.id === groupNode.id) {
							return {
								...n,
								className: "",
							};
						} else if (n.id === node.id) {
							const position = getNodePositionInsideParent(n, groupNode) ?? {
								x: 0,
								y: 0,
							};

							return {
								...n,
								position,
								parentId: groupNode.id,
								extent: "parent",
							} as Node;
						}

						return n;
					})
					.sort(sortNodes);

				setNodes(nextNodes);
			}
		},
		[getIntersectingNodes, getNodes, setNodes],
	);

	const onNodeDrag = useCallback(
		(_: MouseEvent, node: Node) => {
			if (node.type !== "node" && !node.parentId) {
				return;
			}

			const intersections = getIntersectingNodes(node).filter(
				(n) => n.type === "group",
			);
			const groupClassName =
				intersections.length && node.parentId !== intersections[0]?.id
					? "active"
					: "";

			setNodes((nds) => {
				return nds.map((n) => {
					if (n.type === "group") {
						return {
							...n,
							className: groupClassName,
						};
					} else if (n.id === node.id) {
						return {
							...n,
							position: node.position,
						};
					}

					return { ...n };
				});
			});
		},
		[getIntersectingNodes, setNodes],
	);

	nodes.forEach((node) => {
		// type が "group" のノードを対象にする
		if (node.type === "group") {
			// group ノードの position.x と position.y をコンソールに出力
			console.log(
				`APP の方 Node ID: ${node.id} - Position: x = ${node.position.x}, y = ${node.position.y}`,
			);
		}
	});
	return (
		<div className={styles.wrapper}>
			<Sidebar />
			<div className={styles.rfWrapper}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onEdgesChange={onEdgesChange}
					onNodesChange={onNodesChange}
					onConnect={onConnect}
					onNodeDrag={onNodeDrag}
					onNodeDragStop={onNodeDragStop}
					onDrop={onDrop}
					onDragOver={onDragOver}
					proOptions={proOptions}
					fitView
					selectNodesOnDrag={false}
					nodeTypes={nodeTypes}
					defaultEdgeOptions={defaultEdgeOptions}
					style={{ backgroundColor: "#FFFFFF" }}
				>
					<Background />
					<SelectedNodesToolbar />
				</ReactFlow>
			</div>
		</div>
	);
}

export default function Flow() {
	return (
		<ReactFlowProvider>
			<DynamicGrouping />
		</ReactFlowProvider>
	);
}
