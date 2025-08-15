# 1. 使用一个官方的、轻量的Node.js镜像作为基础
FROM node:18-slim

# 2. 设置工作目录
WORKDIR /app

# 3. 复制 package.json 和 package-lock.json (如果存在)
COPY package*.json ./

# 4. 安装所有生产环境的依赖
RUN npm install --production

# 5. 复制您应用的所有源代码
COPY . .

# 6. 暴露您的应用运行的端口 (与您代码中的PORT一致)
EXPOSE 3000

# 7. 定义当容器启动时运行的命令
CMD [ "npm", "start" ]
