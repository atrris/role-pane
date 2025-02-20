import type { BuiltInNode, Node } from "@xyflow/react";

export type PositionLoggerNode = Node<{ label: string }, "position-logger">;

// カスタムノードを作る場合は、このようにノードの方をNode typeを用いて定義する。
// export type MyCustomNode = Node<{...}, "...">;
// Nodeの第一引数にはJavaScript Objectとしての型定義が入り、第二引数には文字列としてノードの名前を定義する。
//
// ここで定義されたObjectのkeyは、Nodeを定義する際に、dataオブジェクト下のプロパティとしてアクセスできるようになる。
// たとえば、handleResize: (width: number, height: number) => void;
// と言う型のcallback関数をGroup Nodeに渡したい時は、
//
// export type GroupNode = Node<{handleResize: (width: number, height: number) => void}, "group">;
//
// と定義する。その後、実際にGroupNodeを関数コンポーネントとして定義するときに
//
// function GroupNode({data}: NodeProps<GroupNode>) {
//   const callBack = data.handleResize;
// }
//
// と言う形でアクセスできるようになる。他のプロパティを定義した場合も同様に行うことで、
// ReactFlowで定義されるすべてのノードに対して定義されている、このdataオブジェクトの下のプロパティとして、
// Nodeの定義時にアクセスできるようになる。

// GroupNodeの型を定義する。現状はCallback関数を渡してはいない。
// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type GroupNode = Node<{}, "group">;

// カスタムノード型を定義した後は、BuiltInNodeという元々ReactFlowが用意したNodeの型と合わせて、
// 定義したすべてのノード型のUnion型(c.f. https://typescriptbook.jp/reference/values-types-variables/union )を取る。
// こうしておくと、取り扱うすべてのノードを格納する配列をAppNode[]と表現できて、便利になる。
export type AppNode = BuiltInNode | PositionLoggerNode;
