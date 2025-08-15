const express = require('express');
const axios = require('axios');
const cors = require('cors'); // 1. 引入 cors 模块
const app = express();

// --- CORS 配置 ---
// 允许所有来源的请求。在生产环境中，为了安全，您应该指定允许的前端域名。
// 例如: const corsOptions = { origin: 'https://your-frontend-domain.onrender.com' };
app.use(cors( )); // 2. 使用 cors 中间件

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 环境变量配置 - 在Render平台设置这些变量
const API_KEY = process.env.KIMI_API_KEY;
const CUSTOM_TOKEN = process.env.CUSTOM_TOKEN || 'X9fT2vPq8LmZ4rN1';
const KIMI_API_BASE_URL = 'https://api.moonshot.cn/v1';

// 验证自定义token的中间件
const verifyToken = (req, res, next ) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!API_KEY) {
    // 增加一个检查，确保服务器环境变量已加载
    return res.status(500).json({ error: '服务器内部错误 - KIMI_API_KEY 未配置' });
  }
  if (token !== CUSTOM_TOKEN) {
    return res.status(401).json({ error: '未授权访问 - 无效的token' });
  }
  next();
};

// 代理所有API请求到Kimi服务
app.use('/api', verifyToken, async (req, res) => {
  try {
    const targetUrl = `${KIMI_API_BASE_URL}${req.originalUrl.replace('/api', '')}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...(req.headers['user-agent'] && { 'User-Agent': req.headers['user-agent'] }),
      ...(req.headers['accept'] && { 'Accept': req.headers['accept'] })
    };

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: req.body,
      params: req.query,
      timeout: 30000
    });

    res.status(response.status).json(response.data);
  } catch (error) {
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
});
