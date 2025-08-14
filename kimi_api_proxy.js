const express = require('express');
const axios = require('axios');
const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 环境变量配置 - 在Render平台设置这些变量
const API_KEY = process.env.KIMI_API_KEY; // Kimi API密钥
const CUSTOM_TOKEN = process.env.CUSTOM_TOKEN || 'X9fT2vPq8LmZ4rN1'; // 自定义验证token
const KIMI_API_BASE_URL = 'https://api.moonshot.cn/v1'; // Kimi API基础URL

// 验证自定义token的中间件
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token !== CUSTOM_TOKEN) {
    return res.status(401).json({ error: '未授权访问 - 无效的token' });
  }
  next();
};

// 代理所有API请求到Kimi服务
app.use('/api', verifyToken, async (req, res) => {
  try {
    // 构建目标URL
    const targetUrl = `${KIMI_API_BASE_URL}${req.originalUrl.replace('/api', '')}`;
    
    // 构建请求头 - 传递必要的头信息并添加API密钥
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...(req.headers['user-agent'] && { 'User-Agent': req.headers['user-agent'] }),
      ...(req.headers['accept'] && { 'Accept': req.headers['accept'] })
    };

    // 转发请求
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: req.body,
      params: req.query,
      timeout: 30000 // 30秒超时
    });

    // 返回响应
    res.status(response.status).json(response.data);
  } catch (error) {
    // 错误处理
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { 
      error: '代理请求失败', 
      details: error.message 
    };
    res.status(status).json(errorData);
  }
});

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Kimi API代理服务运行正常' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`Kimi API代理地址: http://localhost:${PORT}/api`);
});