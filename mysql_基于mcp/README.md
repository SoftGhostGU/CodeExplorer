# 数据库实践期末项目

> 基于大模型与 MCP 服务的自然语言数据库查询系统

## 快速开始

1. 在根目录下创建一个`.env`文件，参考`.env.example`文件，修改其中的`xxx`内容，解释如下：
    1. `QWEN_API_KEY`：Qwen API 密钥，用于获取语义解析结果
    2. `QWEN_API_URL`：Qwen API 地址，用于获取语义解析结果
    4. `DB_HOST`：数据库地址
    5. `DB_PORT`：数据库端口
    6. `DB_USER`：数据库用户名
    7. `DB_PASSWORD`：数据库密码
    8. `DB_NAME`：数据库名称
2. 运行`pnpm i`安装依赖
3. 运行`pnpm start`启动应用
4. 打开浏览器访问返回的url，点击快速开始 or 输入查询语句，点击`查询`按钮，即可查询数据库相关内容
