import React, { useState, useRef, useEffect } from "react";
import { Bubble, Sender, ThoughtChain, Welcome } from "@ant-design/x";
import { Button, Typography } from "antd";
import { CommentOutlined, MoreOutlined } from "@ant-design/icons";
import { Prompts } from "@ant-design/x";
import type {
  BubbleProps,
  PromptsProps,
  ThoughtChainProps,
} from "@ant-design/x";
import markdownit from "markdown-it";
import { v4 } from "uuid";


// 流式数据块类型定义
interface StreamChunk {
  type: "text_chunk" | "tool_call" | "error" | "end";
  content?: string;
  toolCallId?: string;
  functionName?: string;
  arguments?: any;
  result?: {
    content: Array<{ type: string; text: string }>;
    isError: boolean;
  };
  error?: string;
  timestamp: string;
}

// 创建与API的流式连接
async function createStreamFromAPI(message: string, tid: string) {
  // 构造API请求URL，包含消息内容和会话ID
  const apiUrl = `http://localhost:3001/api/stream?message=${encodeURIComponent(message)}&tid=${encodeURIComponent(tid)}`;

  // 发送GET请求获取流式响应
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/x-ndjson", // 指定接收NDJSON格式
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.body; // 返回可读流
}


// 初始化Markdown解析器
const md = markdownit({ html: true, breaks: true });

// Markdown渲染函数
const renderMarkdown: BubbleProps["messageRender"] = (content) => {
  console.log("content", content);
  return (
    <Typography>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
      <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
    </Typography>
  );
};

// 初始提示项配置
const initial_prompt_items: PromptsProps["items"] = [
  {
    key: "1",
    icon: <CommentOutlined style={{
      color: "#a692ef",
      fontSize: "32px",
    }} />,
    label: "数据库结构",
    description: "数据库里面有哪些表格？",
  },
  {
    key: "2",
    icon: <CommentOutlined style={{
      color: "#e2b2d0",
      fontSize: "32px",
    }} />,
    label: "查询课程数据",
    description: "有多少课程可供选择？",
  },
  {
    key: "3",
    icon: <CommentOutlined style={{
      color: "#a1c6f3",
      fontSize: "32px",
    }} />,
    label: "专业统计",
    description: "有哪些院系和专业？",
  },
];

const App: React.FC = () => {
  const chatBoxRef = useRef<HTMLDivElement>(null); // 聊天框DOM引用
  const [conversation, setConversation] = useState<
    {
      role: "user" | "assistant";
      type: "text" | "function_call";
      content: string;
      toolCalls?: any[];
    }[]
  >([]);

  // 当前状态：空闲、请求中、响应中
  const [status, setStatus] = useState<"idle" | "requesting" | "responsing">(
    "idle",
  );
  const [streamingContent, setStreamingContent] = useState<string>(""); // 流式内容
  const [currentToolCalls, setCurrentToolCalls] = useState<any[]>([]); // 当前工具调用


  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  // 读取流式响应
  async function readStream(message: string) {
    try {
      // 获取可读流
      const readableStream = await createStreamFromAPI(message, tid.current);
      if (!readableStream) {
        throw new Error("无法获取流式响应");
      }
      let accumulatedContent = ""; // 累积的文本内容
      let toolCalls: any[] = []; // 工具调用记录

      // 手动处理NDJSON流
      const reader = readableStream.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; // 缓冲区用于处理不完整的行
      setStatus("responsing");

      while (true) {
        const { done, value } = await reader.read();

        if (done) break; // 流结束

        // 将字节转换为文本并添加到缓冲区
        buffer += decoder.decode(value, { stream: true });

        // 按行分割处理
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // 保留最后一个不完整的行

        // 处理每一行数据
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: StreamChunk = JSON.parse(line.trim());
              console.log("收到流式数据:", data);

              // 根据数据类型处理
              switch (data.type) {
                case "text_chunk": // 文本片段
                  if (data.content) {
                    accumulatedContent += data.content;
                    setStreamingContent(accumulatedContent);
                  }
                  break;

                case "tool_call": // 工具调用
                  const toolCallInfo = {
                    id: data.toolCallId,
                    functionName: data.functionName,
                    arguments: data.arguments,
                    result: data.result,
                    timestamp: data.timestamp,
                  };
                  toolCalls.push(toolCallInfo);
                  setCurrentToolCalls([...toolCalls]);
                  break;

                case "error": // 错误
                  console.error("流式响应错误:", data.error);
                  break;

                case "end": // 结束
                  console.log("流式响应结束");
                  break;
              }
            } catch (parseError) {
              console.error("解析流式数据失败:", parseError, "Raw line:", line);
            }
          }
        }
      }

      // 流结束后，将最终内容添加到对话中
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          type: toolCalls.length > 0 ? "function_call" : "text",
          content: accumulatedContent,
          toolCalls: toolCalls,
        },
      ]);

      // 清理临时状态
      setStreamingContent("");
      setCurrentToolCalls([]);
    } catch (error) {
      console.error("流式请求失败:", error);
      // 清理临时状态
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "text",
          content: `请求失败: ${error instanceof Error ? error.message : String(error)}`,
        },
      ]);
      setStreamingContent("");
      setCurrentToolCalls([]);
    } finally {
      setStatus("idle"); // 重置状态为空闲
    }
  }

  const sendMessage = (message: string) => {
    if (status !== "idle") {
      return; // 如果当前不在空闲状态，则不处理新消息
    }

    // 重置状态
    setStreamingContent("");
    setCurrentToolCalls([]);
    setStatus("requesting");

    // 开始读取流式响应
    readStream(message);
  };
  const tid = useRef(v4()); // 生成唯一会话ID

  // 生成工具调用显示项目
  const generateToolItems = (toolCalls: any[]): ThoughtChainProps["items"] => {
    return toolCalls.map((toolCall, _) => ({
      title: `✨ 你的 Mysql-AI 小助手 `,
      description: (
        <div>
          <div>
            <strong>参数:</strong> {JSON.stringify(toolCall.arguments, null, 2)}
          </div>
          {toolCall.result && (
            <div style={{ marginTop: "8px" }}>
              <strong>结果:</strong>
              {toolCall.result.content?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    marginTop: "4px",
                    padding: "4px 8px",
                    color: "black",
                    backgroundColor: toolCall.result.isError
                      ? "#fff2f0"
                      : "#f6ffed",
                    border: `1px solid ${toolCall.result.isError ? "#ffccc7" : "#b7eb8f"}`,
                    borderRadius: "4px",
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      extra: <Button type="text" icon={<MoreOutlined />} />,
    }));
  };

  // 当conversation或streamingContent变化时自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [conversation, streamingContent]);

  return (
    <div className="app">
      <div className="logo"></div>


      <div className="chat-box" ref={chatBoxRef}>
        
          {conversation.length === 0 ? (
            <div className="start-box">
              <Welcome
              icon="https://s21.ax1x.com/2025/06/11/pVkQIyD.png"
              title="我是你的 Mysql AI 助手"
              description="可以点击下方快速开始，或者输入消息开始聊天。"
              style={{
                backgroundColor: "#fff",
                height: 'auto',
              }}
            />
            <Prompts
              // title="✨ 快速开始？"
              items={initial_prompt_items}
              className="mb-4"
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "30px",
                position: "relative",
                zIndex: 1,
              }}
              onItemClick={(info) => {
                const prompts = {
                  "1": "数据库里面有什么表和字段？",
                  "2": "帮我查询课程数据",
                  "3": "一共有什么专业和院系？",
                };
                const message =
                  prompts[info.data.key as keyof typeof prompts] ||
                  String(info.data.description) ||
                  "";
                if (message) {
                  setConversation((prev) => [
                    ...prev,
                    {
                      content: message,
                      role: "user",
                      type: "text",
                    },
                  ]);
                  sendMessage(message);
                }
              }}
            />
            </div>
          ) : null}
          
        {conversation.map((item, index) => (
          <div key={index}>
            <Bubble
              className="mt-5"
              content={item.content}
              placement={item.role === "user" ? "end" : "start"}
              messageRender={
                item.role === "assistant" ? renderMarkdown : undefined
              }
            />
            {item.role === "assistant" &&
              item.toolCalls &&
              item.toolCalls.length > 0 && (
                <ThoughtChain
                  className="mt-3"
                  items={generateToolItems(item.toolCalls)}
                />
              )}
          </div>
        ))}

        {/* 显示当前流式内容 */}
        {streamingContent && (
          <Bubble
            className="mt-5"
            content={streamingContent}
            placement="start"
            messageRender={renderMarkdown}
          />
        )}

        {
          /** loading占位 */
          status === "requesting" && (
            <Bubble className="mt-5" placement="start" loading />
          )
        }

        {/* 显示当前工具调用 */}
        {currentToolCalls.length > 0 && (
          <ThoughtChain
            className="mt-3"
            items={generateToolItems(currentToolCalls)}
          />
        )}


      </div>


      <div
        className="input-container"
        style={{
          padding: "20px",
          borderBottom: "1px solid #f0f0f0"
        }}
      >

        <Sender
          submitType="shiftEnter"
          style={{
            width: "100%",
            marginBottom: "20px",
          }}
          placeholder="按 Shift + Enter 发送消息"
          loading={status !== "idle"}
          onSubmit={(message: string) => {
            setConversation((prev) => [
              ...prev,
              {
                content: message,
                role: "user",
                type: "text",
              },
            ]);
            sendMessage(message);
          }}
        />

      </div>
    </div>
  );
};

export default App;
