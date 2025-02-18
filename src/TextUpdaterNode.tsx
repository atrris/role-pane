import React, { useCallback } from "react";
import { Handle, Position } from "@xyflow/react";

// Handleのスタイルを定義
const handleStyle = { left: 10 };

interface TextUpdaterNodeProps {
  data: { text: string }; // dataの型を定義
  isConnectable: boolean; // isConnectableの型を定義
}

const TextUpdaterNode: React.FC<TextUpdaterNodeProps> = ({
  data,
  isConnectable,
}) => {
  // テキストの変更を処理するコールバック関数
  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    console.log(evt.target.value); // 入力されたテキストを表示
  }, []);

  return (
    <div className="text-updater-node">
      {/* 入力用のターゲットハンドル */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div>
        <label htmlFor="text">Text:</label>
        <input
          id="text"
          name="text"
          value={data.text}
          onChange={onChange}
          className="nodrag"
        />
      </div>
      {/* 出力用のソースハンドル */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={handleStyle}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default TextUpdaterNode;
